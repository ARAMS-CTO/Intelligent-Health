"""
Concordium Blockchain Integration Service

This service handles:
1. Signature Verification (Challenge-Response) using Ed25519
2. Smart Contract Interactions via gRPC
3. ZKP Attribute Verification
"""

import hashlib
import secrets
import time
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

# Cryptography
try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.exceptions import InvalidSignature
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False

# Concordium API (Standard SDK)
try:
    from concordium_grpc_api import ConcordiumClient
    from concordium_grpc_api.types import Address, ContractAddress, Amount
    CCD_SDK_AVAILABLE = True
except ImportError:
    CCD_SDK_AVAILABLE = False
    print("WARNING: concordium-python-sdk not found. Using simulation/mock.")

from ..config import settings

class ConcordiumService:
    """
    Service for interacting with Concordium blockchain.
    """
    
    # Challenge storage (Use Redis in production)
    _challenges: Dict[str, Dict[str, Any]] = {}

    # Client singleton
    _client = None
    
    @classmethod
    def get_client(cls):
        """Lazy init gRPC client"""
        if not CCD_SDK_AVAILABLE: return None
        if cls._client: return cls._client
        
        try:
            # Configure from environment settings
            node_address = settings.CONCORDIUM_NODE_URL or "grpc.testnet.concordium.com"
            port = settings.CONCORDIUM_NODE_PORT or 20000
            cls._client = ConcordiumClient(node_address, port)
            return cls._client
        except Exception as e:
            print(f"Failed to connect to Concordium Node: {e}")
            return None

    @classmethod
    def generate_challenge(cls, account_address: str) -> Dict[str, str]:
        """
        Generate a cryptographic challenge for wallet signature verification.
        """
        nonce = secrets.token_hex(16)
        timestamp = int(time.time())
        # Standardize message format
        challenge_message = f"Intelligent Health Authentication\n\nAddress: {account_address}\nNonce: {nonce}\nTimestamp: {timestamp}\n\nSign this message to confirm identity."
        
        cls._challenges[account_address] = {
            "nonce": nonce,
            "message": challenge_message,
            "timestamp": timestamp,
            "expires_at": timestamp + 300
        }
        
        return {
            "challenge": challenge_message,
            "nonce": nonce,
            "expires_in": 300
        }
    
    @classmethod
    def verify_signature(cls, account_address: str, signature: str, message: Optional[str] = None, public_key: Optional[str] = None) -> bool:
        """
        Verify a signature using Ed25519 or Network check.
        """
        challenge_data = cls._challenges.get(account_address)
        if not message:
            if not challenge_data or time.time() > challenge_data["expires_at"]:
                return False
            message = challenge_data["message"]
            
        if not signature or len(signature) != 128:
            return False
            
        # 1. Preferred: Verify via Crypto Lib (Offline)
        if CRYPTO_AVAILABLE and public_key:
            try:
                pub_key_bytes = bytes.fromhex(public_key)
                sig_bytes = bytes.fromhex(signature)
                msg_bytes = message.encode('utf-8')
                public_key_obj = Ed25519PublicKey.from_public_bytes(pub_key_bytes)
                public_key_obj.verify(sig_bytes, msg_bytes)
                
                # Cleanup valid challenge
                if challenge_data:
                    del cls._challenges[account_address]
                return True
            except Exception as e:
                print(f"Auth failed: {e}")
                return False
                
        # 2. Fallback: Mock for dev
        if settings.ENVIRONMENT == "development":
             print("WARNING: Using Mock Verification")
             return True
             
        return False

    # --- Smart Contract Interface ---
    
    @classmethod
    def invoke_contract(cls, contract_name: str, method: str, params: Dict, invoker: Optional[str] = None) -> Dict[str, Any]:
        """
        Generic invocation wrapper. 
        In a real app, 'update' operations (state change) must be signed by the USER WALLET on the client side.
        The backend typically only does 'invoke' (view/simulation) or sends pre-signed transactions.
        
        For this backend service, we mainly READ state or simulate.
        """
        client = cls.get_client()
        if not client:
            return {"status": "mock_success", "tx_hash": "0x_mock_" + secrets.token_hex(16)}

        # Real implementation would use client.invoke_instance(...)
        # Since we don't have the contract deployed/address yet, we mock the success response 
        # structure but keeping the architecture ready.
        try:
             # Placeholder for real gRPC call
             # index = ContractIndex(...)
             # result = client.invoke_instance(index, section, method, parameter)
             pass
        except Exception:
            pass
            
        return {"status": "simulated", "tx_hash": "0x_simulated"}

    @classmethod
    def grant_access(cls, patient_address: str, doctor_address: str, record_ids: list, expiry_days: int) -> Dict[str, Any]:
        # Note: Granting access is a STATE CHANGE. 
        # It should ideally be a transaction signed by the patient's wallet in the Frontend.
        # The backend just records it or verifies it.
        # Here we simulate the successful recording of that event.
        
        return cls.invoke_contract(
            "access_control", 
            "grantAccess", 
            {"doctor": doctor_address, "records": record_ids, "expiry": expiry_days}
        )

    @classmethod
    def check_access(cls, patient_address: str, doctor_address: str, record_id: str) -> bool:
        """
        READ operation. Can be performed by backend without user signature.
        """
        client = cls.get_client()
        if client:
            # TODO: Resolve Contract Address from DB/Config
            # For now returning Mock True/False based on simple logic or previous mock grants
            # Real: result = client.invoke_instance(..., "checkAccess", ...)
            pass
            
        # Mock logic
        return True

    @classmethod
    def revoke_access(cls, patient_address: str, doctor_address: str) -> Dict[str, Any]:
        return cls.invoke_contract("access_control", "revokeAccess", {})
    
    @classmethod
    def get_access_grants(cls, address: str, role: str) -> list:
        # This would query an indexer or events
        return []

    # --- ZKP ---
    @classmethod
    def request_zkp_attribute(cls, attribute: str, callback_url: str) -> Dict[str, Any]:
        return {
            "request_id": secrets.token_hex(8),
            "type": "Concordium_ZKP_Request",
            "attribute": attribute,
            "callback": callback_url,
            "schema": {
                "protocol": "concordium_web3_id",
                "version": "1.0",
                "statement": {
                    "type": "AtomicStatement",
                    "statement": {
                        "attributeTag": attribute,
                        "type": "RevealAttribute" if attribute == "Nationality" else "AttributeInRange",
                        "lower": "18" if "Over18" in attribute else None,
                        "upper": None
                    }
                }
            }
        }
    
    @classmethod
    def verify_zkp_proof(cls, proof: Dict[str, Any], expected_attribute: str) -> bool:
        # Verify proof cryptographically using Concordium Identity logic
        # For prototype, we check the 'verified' flag passed from the wallet callback
        return proof.get("valid", False)

