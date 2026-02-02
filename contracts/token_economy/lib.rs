use concordium_std::*;

/// Token economy for rewards
#[derive(Serialize, SchemaType, Clone)]
pub struct TokenBalance {
    pub balance: Amount,
}

#[derive(Serialize, SchemaType)]
pub struct InitParameter {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
}

#[derive(Serialize, SchemaType)]
pub struct TransferParams {
    pub to: Address,
    pub amount: Amount,
}

#[derive(Serial, DeserialWithState)]
#[concordium(state_parameter = "S")]
struct State<S> {
    name: String,
    symbol: String,
    decimals: u8,
    balances: StateMap<Address, Amount, S>,
}

#[derive(Serialize, Debug, PartialEq, Eq, Reject)]
enum TokenError {
    InsufficientFunds,
    ParseError,
}

impl<S: HasStateApi> State<S> {
    fn new(state_builder: &mut StateBuilder<S>, name: String, symbol: String, decimals: u8) -> Self {
        State {
            name,
            symbol,
            decimals,
            balances: state_builder.new_map(),
        }
    }
}

#[init(contract = "token_economy", parameter = "InitParameter")]
fn contract_init<S: HasStateApi>(
    ctx: &impl HasInitContext,
    state_builder: &mut StateBuilder<S>,
) -> InitResult<State<S>> {
    let params: InitParameter = ctx.parameter_cursor().get()?;
    Ok(State::new(state_builder, params.name, params.symbol, params.decimals))
}

#[receive(
    contract = "token_economy",
    name = "mint",
    parameter = "TransferParams",
    mutable
)]
fn mint<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> Result<(), TokenError> {
    // Only owner can mint (impl check later)
    let params: TransferParams = ctx.parameter_cursor().get().map_err(|_| TokenError::ParseError)?;
    
    let current_balance = host.state().balances.get(&params.to).map(|a| *a).unwrap_or(Amount::from_micro_ccd(0));
    let new_balance = current_balance.checked_add(params.amount).ok_or(TokenError::ParseError)?; // Overflow handle
    
    host.state_mut().balances.insert(params.to, new_balance);
    Ok(())
}

#[receive(
    contract = "token_economy",
    name = "transfer",
    parameter = "TransferParams",
    mutable
)]
fn transfer<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> Result<(), TokenError> {
    let sender = Address::Account(ctx.invoker());
    let params: TransferParams = ctx.parameter_cursor().get().map_err(|_| TokenError::ParseError)?;
    
    let sender_balance = host.state().balances.get(&sender).map(|a| *a).unwrap_or(Amount::from_micro_ccd(0));
    
    if sender_balance < params.amount {
        return Err(TokenError::InsufficientFunds);
    }
    
    let new_sender_balance = sender_balance.checked_sub(params.amount).ok_or(TokenError::ParseError)?;
    host.state_mut().balances.insert(sender, new_sender_balance);
    
    let receiver_balance = host.state().balances.get(&params.to).map(|a| *a).unwrap_or(Amount::from_micro_ccd(0));
    let new_receiver_balance = receiver_balance.checked_add(params.amount).ok_or(TokenError::ParseError)?;
    host.state_mut().balances.insert(params.to, new_receiver_balance);
    
    Ok(())
}

#[receive(
    contract = "token_economy",
    name = "balanceOf",
    parameter = "Address",
    return_value = "Amount"
)]
fn balance_of<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ReceiveResult<Amount> {
    let address: Address = ctx.parameter_cursor().get().map_err(|_| Reject::from(TokenError::ParseError))?;
    let balance = host.state().balances.get(&address).map(|a| *a).unwrap_or(Amount::from_micro_ccd(0));
    Ok(balance)
}
