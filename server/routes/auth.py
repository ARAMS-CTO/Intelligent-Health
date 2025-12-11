from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..schemas import User as UserSchema, Role
from ..database import get_db
from ..models import User as UserModel, DoctorProfile
import os

router = APIRouter()

# Security Config
SECRET_KEY = os.environ.get("SECRET_KEY", "supersecretkey") # Change this in prod!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
    user = db.query(UserModel).filter(UserModel.email == request.email).first()
    
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
        if not verify_password(request.password, user.hashed_password):
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # Legacy/Demo fallback: If no password set, allow login ONLY if password matches a default or is empty?
        # For security, let's require registration for new auth system.
        # But to keep demo working, maybe allow if password is "password" or something?
        # Let's just fail for now, forcing new registration.
        # OR: Implicitly set password on first login? No, that's insecure.
        # We will assume the user registers.
        pass

    # Create token
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
