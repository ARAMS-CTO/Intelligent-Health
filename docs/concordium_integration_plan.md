# Concordium Integration Plan
**Status**: Backend Robust Verification & Smart Contract Code Ready

## Objective
Enable Concordium ID and Wallet support for user authentication and identity verification.

## Strategy
1. **Frontend Integration**:
   - [x] Add "Connect Concordium Wallet" button to Login/Register pages.
   - [x] Use `@concordium/browser-wallet-api-helpers` SDK.
   - Flow:
     1. User clicks "Connect".
     2. App requests account address.
     3. App requests signature of challenge.
     4. **UPDATE**: App MUST send `publicKey` in request.

2. **Backend Integration**:
   - [x] Create `server/routes/concordium.py`.
   - [x] Map Concordium Address to `User` model.
   - [x] **Robust Verification**: Implemented using `cryptography` (Ed25519).
   - [x] **Smart Contract**: Rust code written (`contracts/access_control`).

3. **Smart Contract (Access Control)**:
   - [x] Code written (`lib.rs`).
   - [x] Build instructions (`README.md`).
   - [ ] Deployment (Requires Rust env).

## Next Steps
- [ ] **Frontend Update**: Ensure `publicKey` is sent during the wallet connect flow (using `wallet.connect()` returns public key or explicit export).
- [ ] **Deployment**: User to follow `contracts/README.md` to deploy contract.
- [ ] **Integration**: Update variable `ACCESS_CONTROL_CONTRACT` in `concordium_service.py` after deployment.
