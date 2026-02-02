"""
Concordium Blockchain Integration Routes

Endpoints for:
- Wallet authentication (challenge-response)
- Wallet linking
- Access grant management
- ZKP verification
"""

from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import timedelta

from ..database import get_db
from ..models import User, MedicalRecord
from .auth import get_current_user, get_optional_user, create_access_token
from ..services.concordium_service import ConcordiumService

router = APIRouter()


# --- Request/Response Models ---

class ChallengeRequest(BaseModel):
    account_address: str

class ChallengeResponse(BaseModel):
    challenge: str
    nonce: str
    expires_in: int

class WalletConnectRequest(BaseModel):
    account_address: str
    message: str
    signature: str
    public_key: Optional[str] = None  # Required for robust backend verification

class WalletLinkRequest(BaseModel):
    account_address: str
    message: str
    signature: str
    public_key: Optional[str] = None  # Required for robust backend verification

class AccessGrantRequest(BaseModel):
    doctor_address: str
    record_ids: List[str]
    expiry_days: Optional[int] = 30

class AccessRevokeRequest(BaseModel):
    doctor_address: str

class ZKPVerifyRequest(BaseModel):
    proof: dict
    attribute: str


# --- Authentication Endpoints ---

@router.post("/challenge", response_model=ChallengeResponse)
async def get_challenge(req: ChallengeRequest):
    """
    Step 1 of wallet authentication: Get a challenge to sign.
    
    The wallet must sign this challenge to prove ownership.
    """
    if not req.account_address:
        raise HTTPException(status_code=400, detail="Account address required")
    
    # Validate address format (Concordium addresses start with 3 or 4)
    if not req.account_address.startswith(("3", "4")):
        raise HTTPException(status_code=400, detail="Invalid Concordium address format")
    
    challenge_data = ConcordiumService.generate_challenge(req.account_address)
    return challenge_data


@router.post("/connect")
async def connect_wallet(
    req: WalletConnectRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Step 2 of wallet authentication: Verify signature and connect/login.
    
    If user is logged in: Links wallet to current account.
    If user is NOT logged in: Attempts to login with wallet (if already linked).
    """
    # 1. Verify the signature
    is_valid = ConcordiumService.verify_signature(
        req.account_address,
        req.signature,
        req.message,
        req.public_key
    )
    
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid signature. Please try again.")
    
    # 2. Check if any user has this wallet
    existing_user = db.query(User).filter(
        User.concordium_address == req.account_address
    ).first()
    
    # CASE A: User is logged in - Link wallet
    if current_user:
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=400, 
                detail="Wallet already linked to another account"
            )
        
        current_user.concordium_address = req.account_address
        db.commit()
        
        return {
            "status": "linked",
            "address": req.account_address,
            "message": "Wallet successfully linked to your account"
        }
    
    # CASE B: Not logged in - Login with wallet
    if existing_user:
        access_token = create_access_token(
            data={"sub": existing_user.email, "role": existing_user.role},
            expires_delta=timedelta(minutes=60)
        )
        
        return {
            "status": "logged_in",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": existing_user.id,
                "name": existing_user.name,
                "email": existing_user.email,
                "role": existing_user.role
            }
        }
    
    # CASE C: Wallet not registered
    raise HTTPException(
        status_code=404,
        detail="Wallet not registered. Please register with email first, then link your wallet in Profile settings."
    )


@router.post("/link")
async def link_wallet(
    req: WalletLinkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Explicitly link a wallet to the current user's account.
    Requires the user to be logged in.
    """
    # Verify signature
    is_valid = ConcordiumService.verify_signature(
        req.account_address,
        req.signature,
        req.message,
        req.public_key
    )
    
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Check if wallet is already linked to another user
    existing = db.query(User).filter(
        User.concordium_address == req.account_address,
        User.id != current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Wallet already linked to another account")
    
    # Link wallet
    current_user.concordium_address = req.account_address
    db.commit()
    
    return {
        "status": "linked",
        "address": req.account_address
    }


@router.post("/unlink")
async def unlink_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove the Concordium wallet from the user's account.
    """
    if not current_user.concordium_address:
        raise HTTPException(status_code=400, detail="No wallet linked")
    
    old_address = current_user.concordium_address
    current_user.concordium_address = None
    db.commit()
    
    return {
        "status": "unlinked",
        "previous_address": old_address
    }


# --- Access Control Endpoints ---

@router.post("/grant-access")
async def grant_access(
    req: AccessGrantRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Grant a doctor access to specific medical records.
    
    This creates an on-chain access grant that the doctor can use
    to prove they have permission to view the records.
    """
    if not current_user.concordium_address:
        raise HTTPException(
            status_code=400,
            detail="Please link your Concordium wallet first"
        )
    
    # Verify doctor address format
    if not req.doctor_address.startswith(("3", "4")):
        raise HTTPException(status_code=400, detail="Invalid doctor wallet address")
    
    # Create access grant
    result = ConcordiumService.grant_access(
        patient_address=current_user.concordium_address,
        doctor_address=req.doctor_address,
        record_ids=req.record_ids,
        expiry_days=req.expiry_days
    )
    
    return {
        "status": "access_granted",
        "tx_hash": result["tx_hash"],
        "expires_at": result["expires_at"],
        "doctor_address": req.doctor_address,
        "records_count": len(req.record_ids)
    }


@router.post("/revoke-access")
async def revoke_access(
    req: AccessRevokeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Revoke a doctor's access to your medical records.
    """
    if not current_user.concordium_address:
        raise HTTPException(status_code=400, detail="No wallet linked")
    
    result = ConcordiumService.revoke_access(
        patient_address=current_user.concordium_address,
        doctor_address=req.doctor_address
    )
    
    return result


@router.get("/access-grants")
async def get_access_grants(
    role: str = Query("patient", regex="^(patient|doctor)$"),
    current_user: User = Depends(get_current_user)
):
    """
    Get all access grants for the current user.
    
    - As patient: See who has access to your records
    - As doctor: See which patients you have access to
    """
    if not current_user.concordium_address:
        return {"grants": [], "message": "No wallet linked"}
    
    grants = ConcordiumService.get_access_grants(
        address=current_user.concordium_address,
        role=role
    )
    
    return {"grants": grants, "count": len(grants)}


@router.get("/check-access/{patient_address}/{record_id}")
async def check_access(
    patient_address: str,
    record_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Check if the current user (as doctor) has access to a specific record.
    """
    if not current_user.concordium_address:
        raise HTTPException(status_code=400, detail="No wallet linked")
    
    has_access = ConcordiumService.check_access(
        patient_address=patient_address,
        doctor_address=current_user.concordium_address,
        record_id=record_id
    )
    
    return {"has_access": has_access}


# --- ZKP Endpoints ---

@router.get("/zkp/request/{attribute}")
async def request_zkp(
    attribute: str,
    current_user: User = Depends(get_current_user)
):
    """
    Request a Zero-Knowledge Proof for a specific attribute.
    
    Supported attributes:
    - Over18: Prove age >= 18 without revealing exact age
    - Over21: Prove age >= 21
    - Nationality: Country of citizenship
    - ResidenceCountry: Country of residence
    """
    valid_attributes = ["Over18", "Over21", "Nationality", "ResidenceCountry"]
    
    if attribute not in valid_attributes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid attribute. Supported: {', '.join(valid_attributes)}"
        )
    
    callback_url = f"/api/concordium/zkp/verify"
    
    request_data = ConcordiumService.request_zkp_attribute(
        attribute=attribute,
        callback_url=callback_url
    )
    
    return {
        "status": "proof_requested",
        "request": request_data,
        "instructions": "Sign this request with your Concordium wallet to generate the proof"
    }


@router.post("/zkp/verify")
async def verify_zkp(
    req: ZKPVerifyRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Verify a Zero-Knowledge Proof submitted by the user.
    """
    is_valid = ConcordiumService.verify_zkp_proof(
        proof=req.proof,
        expected_attribute=req.attribute
    )
    
    if is_valid:
        return {
            "status": "verified",
            "attribute": req.attribute,
            "message": f"Successfully verified {req.attribute}"
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid or expired proof")


# --- Utility Endpoints ---

@router.get("/status")
async def get_concordium_status(current_user: User = Depends(get_current_user)):
    """
    Get the current user's Concordium integration status.
    """
    return {
        "wallet_linked": current_user.concordium_address is not None,
        "wallet_address": current_user.concordium_address,
        "access_grants_given": len(ConcordiumService.get_access_grants(
            current_user.concordium_address or "", "patient"
        )) if current_user.concordium_address else 0,
        "access_grants_received": len(ConcordiumService.get_access_grants(
            current_user.concordium_address or "", "doctor"
        )) if current_user.concordium_address else 0
    }
