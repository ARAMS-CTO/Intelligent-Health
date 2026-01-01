from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..schemas import User as UserSchema, Role
from ..database import get_db
from ..models import User as UserModel, DoctorProfile, Patient, SystemLog


import os
import httpx

from fastapi.security import OAuth2PasswordBearer

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(UserModel).options(
        joinedload(UserModel.patient_profile),
        joinedload(UserModel.doctor_profile)
    ).filter(UserModel.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Security Config
SECRET_KEY = os.environ.get("SECRET_KEY", "supersecretkey") # Change this in prod!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str # Added password
    role: str # Optional? Usually login is just email/pass, but keeping for now if frontend sends it

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str # Added password
    role: str
    specialty: Optional[str] = None

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
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(UserModel).options(
        joinedload(UserModel.patient_profile), 
        joinedload(UserModel.doctor_profile)
    ).filter(UserModel.email == request.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    # For migration/demo purposes: if user has no hashed_password, allow login (or set it now?)
    # Better: if no hashed_password, fail and require reset or re-register.
    # For this transition, we'll assume new users have passwords. 
    # Existing mock users won't work unless we manually update them or handle legacy.
    # Let's enforce password check if hashed_password exists.
    
    if user.hashed_password:
        try:
            if not verify_password(request.password, user.hashed_password):
                 raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except ValueError:
            # Handle case where DB has invalid hash format (e.g. plain text or corrupted)
            # For robustness, we could check if plain text matches (Legacy support), 
            # but for now, let's just fail safely instead of 500ing
            print(f"Warning: Invalid password hash for user {user.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login failed (Invalid stored credentials). Please contact support or reset password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # If no password set (e.g. Google Auth user trying to use password login), fail.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account does not have a password set. Try logging in with Google.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id},
        expires_delta=access_token_expires
    )

    # Log login event
    try:
        log = SystemLog(event_type="login", user_id=user.id, details={"email": user.email, "role": user.role})
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Log Error: {e}")
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

@router.post("/register", response_model=Token)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user exists
    if db.query(UserModel).filter(UserModel.email == request.email).first():
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = get_password_hash(request.password)
    
    new_user = UserModel(
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
         new_profile = DoctorProfile(
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
        new_profile = Patient(
            id=f"profile-{new_user.id}",
            user_id=new_user.id,
            identifier=f"PAT-{new_user.id}",
            name=request.name
        )
        db.add(new_profile)

    db.commit()
    db.refresh(new_user)
    
    # Return token immediately
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email, "role": new_user.role, "user_id": new_user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/google", response_model=Token)
async def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    # 1. Verify token with Google
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={request.access_token}"
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        
        google_user = resp.json()
        email = google_user.get("email")
        name = google_user.get("name", email)
        
    # 2. Find or create user
    user = db.query(UserModel).options(
        joinedload(UserModel.patient_profile),
        joinedload(UserModel.doctor_profile)
    ).filter(UserModel.email == email).first()
    if not user:
        # Check if role is valid
        user_role = request.role
        if user_role not in [Role.Doctor, Role.Patient, Role.Admin, "Doctor", "Patient", "Admin"]:
             user_role = Role.Patient # Default
             
        user = UserModel(
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
            new_profile = DoctorProfile(
                id=f"profile-{user.id}",
                user_id=user.id,
                specialty="General Practice",
                years_of_experience=0,
                bio="",
                certifications=[],
                profile_picture_url=""
            )
            db.add(new_profile)
        db.commit()
    
    # 3. Create JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/config")
async def get_config():
    """
    Expose public configuration to frontend runtime.
    """
    return {
        "googleClientId": os.environ.get("VITE_GOOGLE_CLIENT_ID")
    }

@router.post("/seed_debug")
async def seed_debug():
    """
    Debugging endpoint to seed default users.
    WARNING: Disable in production.
    """
    try:
        from ..seed_data import seed_users
        seed_users()
        return {"status": "success", "message": "Users seeded successfully."}
    except Exception as e:
        print(f"Seed Error: {e}")
        return {"status": "error", "message": str(e)}
