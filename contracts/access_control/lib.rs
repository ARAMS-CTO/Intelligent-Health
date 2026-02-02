use concordium_std::*;
use core::fmt::Debug;

/// Data structures for state
#[derive(Serialize, SchemaType, Clone)]
pub struct AccessGrant {
    pub expiry: Timestamp,
    pub record_hash: String, // verification hash of the shared records
}

#[derive(Serialize, SchemaType)]
pub struct InitParameter {
    pub admin: Option<Address>,
}

#[derive(Serialize, SchemaType)]
pub struct GrantParams {
    pub doctor: Address,
    pub record_hash: String,
    pub expiry_time: Timestamp,
}

#[derive(Serialize, SchemaType)]
pub struct RevokeParams {
    pub doctor: Address,
}

#[derive(Serialize, SchemaType)]
pub struct CheckParams {
    pub patient: Address,
    pub doctor: Address,
}

/// The state of the smart contract
#[derive(Serial, DeserialWithState)]
#[concordium(state_parameter = "S")]
struct State<S> {
    admin: Address,
    // (Patient, Doctor) -> AccessGrant
    grants: StateMap<(Address, Address), AccessGrant, S>,
}

#[derive(Serialize, Debug, PartialEq, Eq, Reject)]
enum ContractError {
    Unauthorized,
    GrantNotFound,
    ParseError,
}

impl<S: HasStateApi> State<S> {
    fn new(state_builder: &mut StateBuilder<S>, admin: Address) -> Self {
        State {
            admin,
            grants: state_builder.new_map(),
        }
    }

    fn has_access(&self, patient: &Address, doctor: &Address) -> bool {
        match self.grants.get(&(*patient, *doctor)) {
            Some(grant) => grant.expiry > Timestamp::from_timestamp_millis(0), // Check expiry logic in caller
            None => false,
        }
    }
}

// Contract entrypoints

#[init(contract = "access_control", parameter = "InitParameter")]
fn contract_init<S: HasStateApi>(
    ctx: &impl HasInitContext,
    state_builder: &mut StateBuilder<S>,
) -> InitResult<State<S>> {
    let params: InitParameter = ctx.parameter_cursor().get()?;
    let admin = params.admin.unwrap_or(Address::Account(ctx.init_origin()));
    Ok(State::new(state_builder, admin))
}

/// Grant access: Called by the Patient
#[receive(
    contract = "access_control",
    name = "grantAccess",
    parameter = "GrantParams",
    mutable
)]
fn grant_access<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> Result<(), ContractError> {
    let sender = Address::Account(ctx.invoker());
    let params: GrantParams = ctx.parameter_cursor().get().map_err(|_| ContractError::ParseError)?;

    // Ensure sender is granting access to themselves (sender == patient)
    // The key is (sender, doctor)
    
    let grant = AccessGrant {
        expiry: params.expiry_time,
        record_hash: params.record_hash,
    };

    host.state_mut().grants.insert((sender, params.doctor), grant);
    
    Ok(())
}

/// Revoke access: Called by the Patient
#[receive(
    contract = "access_control",
    name = "revokeAccess",
    parameter = "RevokeParams",
    mutable
)]
fn revoke_access<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> Result<(), ContractError> {
    let sender = Address::Account(ctx.invoker());
    let params: RevokeParams = ctx.parameter_cursor().get().map_err(|_| ContractError::ParseError)?;

    match host.state_mut().grants.remove(&(sender, params.doctor)) {
        Some(_) => Ok(()),
        None => Err(ContractError::GrantNotFound),
    }
}

/// View function to check access
#[receive(
    contract = "access_control",
    name = "checkAccess",
    parameter = "CheckParams",
    return_value = "bool"
)]
fn check_access<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ReceiveResult<bool> {
    let params: CheckParams = ctx.parameter_cursor().get().map_err(|_| Reject::from(ContractError::ParseError))?;
    
    match host.state().grants.get(&(params.patient, params.doctor)) {
        Some(grant) => {
             // We return true if grant exists, expiry check should arguably be done here or by caller.
             // Let's check expiry against block time
             let now = ctx.metadata().slot_time();
             Ok(grant.expiry > now)
        },
        None => Ok(false),
    }
}
