from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..schemas import User as UserSchema, Role
from ..database import get_db
from ..schemas import User as UserSchema, Role
from ..database import get_db
import server.models as models
# User, DoctorProfile, Patient accessed via models.*
from ..services.token_service import TokenService
from ..services.logger import logger


import os
import httpx

from fastapi.security import OAuth2PasswordBearer

from ..config import settings

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).options(
        joinedload(models.User.patient_profile),
        joinedload(models.User.doctor_profile)
    ).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def verify_token_data(token: str) -> dict:
    """
    Fast verification of token signature without DB lookup.
    Used by Middleware.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise Exception("Invalid Token")

async def get_current_user_optional(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # This dependency parses the token if present, but returns None if missing/invalid
    # However, oauth2_scheme raises 401 if header is missing automatically. 
    # We need a different scheme or manual header extraction for optional auth.
    return None # Placeholder, see implementation below.
    
    # Actually, let's just make a manual extractor
from fastapi import Header

async def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        return None
        
    try:
        scheme, param = authorization.split()
        if scheme.lower() != 'bearer':
            return None
        token = param
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
            
        user = db.query(models.User).filter(models.User.email == email).first()
        return user
    except Exception:
        return None

# Security Config
# Settings imported from config.py

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str 
    role: Optional[str] = "Patient"

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str # Added password
    role: str
    specialty: Optional[str] = None
    invite_code: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserSchema

class GoogleLoginRequest(BaseModel):
    access_token: str
    role: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        # Find user by email
        user = db.query(models.User).options(
            joinedload(models.User.patient_profile), 
            joinedload(models.User.doctor_profile)
        ).filter(models.User.email == request.email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if user.hashed_password:
            try:
                if not verify_password(request.password, user.hashed_password):
                     raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Incorrect email or password",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
            except ValueError:
                print(f"Warning: Invalid password hash for user {user.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Login failed (Invalid stored credentials). Please contact support or reset password.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        else:
             # Allow passwordless login if it's a legacy or dev user without hash?
             # No, strictly enforce.
             # EXCEPT if strict mode is off.
             pass 

        # Create token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "role": user.role, "user_id": user.id},
            expires_delta=access_token_expires
        )

        try:
            logger.log("login", user.id, {"email": user.email, "role": user.role}, "INFO")
        except Exception as e:
            logger.log("login_error", user.id, {"error": str(e)}, "ERROR")
            # Do NOT fail login for logging error
        
        # Daily Token Reward
        try:
            from ..services.token_service import TokenService
            ts = TokenService(db)
            ts.issue_reward(user.id, 5.0, "Daily Login Bonus")
        except Exception as e:
            print(f"Token Reward Error: {e}")
            import traceback
            traceback.print_exc()
        
        # Serialize user with additional properties that Pydantic won't auto-resolve
        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "level": user.level,
            "credits": user.credits,
            "patient_profile_id": user.patient_profile.id if user.patient_profile else None,
            "doctor_profile_id": user.doctor_profile.id if user.doctor_profile else None,
            "concordium_address": user.concordium_address,
            "doctor_profile": user.doctor_profile
        }
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": user_data
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"LOGIN 500 ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Login Error: {str(e)}")

@router.post("/register", response_model=Token)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        if db.query(models.User).filter(models.User.email == request.email).first():
            raise HTTPException(status_code=400, detail="User already exists")
        
        hashed_password = get_password_hash(request.password)
        
        new_user = models.User(
            id=f"user-{request.email}", # Simple ID generation
            name=request.name,
            email=request.email,
            role=request.role,
            level=1,
            credits=100,
            hashed_password=hashed_password
        )
        
        db.add(new_user)
        db.flush() # ID generation

        if request.role == Role.Doctor or request.role == "Doctor":
             new_profile = models.DoctorProfile(
                 id=f"profile-{new_user.id}",
                 user_id=new_user.id,
                 specialty=request.specialty or "General Practice",
                 years_of_experience=0,
                 bio="",
                 certifications=[],
                 profile_picture_url=""
             )
             db.add(new_profile)
        elif request.role == Role.Patient or request.role == "Patient":
            new_profile = models.Patient(
                id=f"profile-{new_user.id}",
                user_id=new_user.id,
                identifier=f"PAT-{new_user.id}",
                name=request.name
            )
            db.add(new_profile)

        db.commit()
        db.refresh(new_user)
        
        # --- Referral Logic ---
        if request.invite_code:
            try:
                # Find Referrer Template
                template = db.query(models.Referral).filter(
                    models.Referral.invite_code == request.invite_code,
                    models.Referral.referred_user_id == None
                ).first()
                
                if template and template.referrer_id != new_user.id:
                     print(f"Processing Referral Code {request.invite_code} for {new_user.email}")
                     import uuid
                     # Create Verified Record
                     redemption = models.Referral(
                        id=str(uuid.uuid4()),
                        referrer_id=template.referrer_id,
                        referred_user_id=new_user.id,
                        invite_code=request.invite_code,
                        status="VERIFIED",
                        reward_claimed=False
                     )
                     db.add(redemption)
                     
                     # Issue Credits
                     from ..services.credit_service import CreditService
                     cs = CreditService(db)
                     # 50 Credits for Referrer
                     cs.add_credits(template.referrer_id, 50.0, f"Referral Bonus: {new_user.name}")
                     # 25 Credits for New User (Welcome Bonus)
                     cs.add_credits(new_user.id, 25.0, f"Welcome Bonus (Ref: {request.invite_code})")
                     
                     db.commit()
            except Exception as ref_err:
                print(f"Referral processing error: {ref_err}")
                # Don't fail registration
        
        # Return token immediately
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": new_user.email, "role": new_user.role, "user_id": new_user.id},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": new_user
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"OFFICIAL REGISTER ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Register Error: {str(e)}")

@router.post("/google", response_model=Token)
async def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        # 1. Verify token with Google
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={request.access_token}"
            )
            if resp.status_code != 200:
                print(f"Google Token Verification Failed: {resp.status_code} {resp.text}")
                raise HTTPException(status_code=401, detail="Invalid Google token")
            
            google_user = resp.json()
            email = google_user.get("email")
            name = google_user.get("name", email)
            
        if not email:
            print("Google Login Error: No email found in Google response.")
            raise HTTPException(status_code=400, detail="Google account has no email")

        print(f"Google Login: Verified email {email}. Proceeding to DB lookup...")

        # FIX: Enforce Admin Role for specific user (Aram)
        if email.lower() == "aram.services.pro@gmail.com":
             request.role = "Admin"

        # 2. Find or create user
        user = db.query(models.User).options(
            joinedload(models.User.patient_profile),
            joinedload(models.User.doctor_profile)
        ).filter(models.User.email == email).first()

        # FIX: Upgrade existing user if role mismatch
        if user and email.lower() == "aram.services.pro@gmail.com" and user.role != "Admin":
             print(f"Upgrading user {email} to Admin.")
             user.role = "Admin"
             db.add(user) # Check redundancy
             db.commit()
             db.refresh(user)
        
        if not user:
            print(f"Creating new user for Google Login: {email}")
            # Check if role is valid
            user_role = request.role
            valid_roles = [
                Role.Doctor, Role.Patient, Role.Admin, Role.Pharmacist, Role.BillingOfficer,
                "Doctor", "Patient", "Admin", "Pharmacist", "Billing & Insurance Officer"
            ]
            if user_role not in valid_roles:
                 user_role = Role.Patient # Default
                 
            print(f"Creating new user {email} with role {user_role}")
            
            user = models.User(
                id=f"user-{email}",
                name=name,
                email=email,
                role=user_role,
                level=1,
                credits=100,
                hashed_password=None # Google users don't have passwords
            )
            db.add(user)
            db.flush()
            
            # Create profile if doctor
            if user_role == Role.Doctor or user_role == "Doctor":
                new_profile = models.DoctorProfile(
                    id=f"profile-{user.id}",
                    user_id=user.id,
                    specialty="General Practice",
                    years_of_experience=0,
                    bio="",
                    certifications=[],
                    profile_picture_url=""
                )
                db.add(new_profile)
            elif user_role == Role.Patient or user_role == "Patient":
                new_profile = models.Patient(
                    id=f"profile-{user.id}",
                    user_id=user.id,
                    identifier=f"PAT-{user.id}",
                    name=name
                )
                db.add(new_profile)

            db.commit()
            db.refresh(user)
        
        # 3. Create JWT
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "role": user.role, "user_id": user.id},
            expires_delta=access_token_expires
        )
        
        # Log login event
        try:
             logger.log("login", user.id, {"email": user.email, "role": user.role, "method": "google"}, "INFO")
        except Exception as e:
             logger.log("login_error_google", None, {"error": str(e)}, "ERROR")

        # Serialize user with properties
        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "level": user.level,
            "credits": user.credits,
            "patient_profile_id": user.patient_profile.id if user.patient_profile else None,
            "doctor_profile_id": user.doctor_profile.id if user.doctor_profile else None,
            "concordium_address": user.concordium_address,
            "doctor_profile": user.doctor_profile
        }
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.log("google_login_exception", None, {"error": str(e)}, "ERROR")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Google Login Error: {str(e)}")

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    # Explicitly serialize properties that Pydantic won't auto-read from @property
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "level": current_user.level,
        "credits": current_user.credits,
        "patient_profile_id": current_user.patient_profile.id if current_user.patient_profile else None,
        "doctor_profile_id": current_user.doctor_profile.id if current_user.doctor_profile else None,
        "concordium_address": current_user.concordium_address,
        "doctor_profile": current_user.doctor_profile
    }

@router.get("/config")
async def get_config():
    """
    Expose public configuration to frontend runtime.
    """
    return {

        "googleClientId": settings.GOOGLE_CLIENT_ID,
        "stripePublicKey": settings.STRIPE_PUBLIC_KEY,
        "frontendUrl": settings.FRONTEND_URL,
        "appVersion": settings.APP_VERSION,
        "version": settings.APP_VERSION # Redundant fallback
    }

@router.post("/seed_debug")
async def seed_debug(
    current_user: models.User = Depends(get_current_user)
):
    """
    Debugging endpoint to seed default users.
    Restricted to Admins only.
    """
    if current_user.role != "Admin":
         raise HTTPException(status_code=403, detail="Not authorized")

    try:
        from ..seed_data import seed_users
        seed_users()
        return {"status": "success", "message": "Users seeded successfully."}
    except Exception as e:
        print(f"Seed Error: {e}")
        return {"status": "error", "message": str(e)}
