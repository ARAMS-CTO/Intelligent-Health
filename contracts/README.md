# Intelligent Health Smart Contracts

This directory contains the Concordium smart contracts for the Intelligent Health platform.

## 1. Access Control Contract (`contracts/access_control`)

This contract manages the permissions for doctors to view patient records.

### Logic
- **Grant Access**: Patient signs a transaction to allow a doctor address to view specific record hashes.
- **Check Access**: View function to verify if a doctor has valid access.
- **Revoke**: Patient removes the grant.

### Prerequisites to Build
You need Rust and the Concordium software development kit installed.
1. Install Rust: https://rustup.rs/
2. Install Concordium internal tools:
   ```bash
   cargo install --locked cargo-concordium
   ```

### Building
Navigate to `contracts/access_control` and run:

```bash
cd contracts/access_control
cargo concordium build --out dist/access_control.wasm.v1 --schema-out dist/schema.bin
```

### Deploying (Testnet)
Using the `concordium-client` (assumed installed):

1. **Deploy Module**:
   ```bash
   concordium-client module deploy dist/access_control.wasm.v1 --sender <YOUR_ACCOUNT_NAME> --name access_control
   ```
   *Note the Module Reference ID (Hash) returned.*

2. **Initialize Contract**:
   ```bash
   concordium-client contract init <MODULE_HASH> --sender <YOUR_ACCOUNT_NAME> --contract access_control --name access_control_instance
   ```
   *Note the Contract Address (e.g., `<8123, 0>`).*

### Integration
Once deployed, update the `ACCESS_CONTROL_CONTRACT` constant in `server/services/concordium_service.py` with the new address.
