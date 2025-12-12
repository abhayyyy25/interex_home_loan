"""Authentication endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
import uuid

from ...database import get_db
from ...models import User
from ...schemas import UserCreate, UserLogin, UserResponse, Token
from ...security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    get_current_user,
)
from ...config import settings

import traceback

async def authenticate_user(db: AsyncSession, email: str, password: str):
    """Authenticate user by email and password"""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user


router = APIRouter()


@router.post("/register/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user with comprehensive error handling"""
    import time
    start_time = time.time()
    
    print("\n" + "="*60)
    print(f"[AUTH] REGISTER REQUEST for email: {user_data.email}")
    print("="*60)
    
    try:
        # Step 1: Check if user already exists
        print(f"[AUTH] Step 1: Checking if user exists...")
        try:
            result = await db.execute(select(User).where(User.email == user_data.email))
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"[AUTH] [X] User already exists: {user_data.email}")
                print("="*60 + "\n")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            print(f"[AUTH] [OK] Email available")
            
        except HTTPException:
            raise
        except Exception as db_error:
            print(f"[AUTH] [X] DATABASE ERROR checking user:")
            print(f"[AUTH]   Type: {type(db_error).__name__}")
            print(f"[AUTH]   Message: {str(db_error)}")
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Database error: {str(db_error)}"
            )
        
        # Step 2: Hash password
        print(f"[AUTH] Step 2: Hashing password...")
        try:
            hashed_password = get_password_hash(user_data.password)
            print(f"[AUTH] [OK] Password hashed")
        except Exception as hash_error:
            print(f"[AUTH] [X] PASSWORD HASH ERROR: {hash_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Password hashing failed: {str(hash_error)}"
            )
        
        # Step 3: Create user object
        print(f"[AUTH] Step 3: Creating user...")
        new_user = User(
            id=str(uuid.uuid4()),
            email=user_data.email,
            password_hash=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role="customer",
            subscription_tier="free",
        )
        print(f"[AUTH] [OK] User object created (ID: {new_user.id})")
        
        # Step 4: Save to database
        print(f"[AUTH] Step 4: Saving to database...")
        try:
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            print(f"[AUTH] [OK] User saved to database")
        except Exception as db_error:
            print(f"[AUTH] [X] DATABASE SAVE ERROR:")
            print(f"[AUTH]   Type: {type(db_error).__name__}")
            print(f"[AUTH]   Message: {str(db_error)}")
            traceback.print_exc()
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to save user: {str(db_error)}"
            )
        
        # Success!
        total_duration = time.time() - start_time
        print(f"[AUTH] [OK] REGISTRATION SUCCESSFUL for {new_user.email}")
        print(f"[AUTH] Total time: {total_duration:.2f}s")
        print("="*60 + "\n")
        
        return new_user

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
        
    except Exception as e:
        # Catch-all for unexpected errors
        total_duration = time.time() - start_time
        print(f"[AUTH] [X] UNEXPECTED ERROR after {total_duration:.2f}s:")
        print(f"[AUTH]   Type: {type(e).__name__}")
        print(f"[AUTH]   Message: {str(e)}")
        traceback.print_exc()
        print("="*60 + "\n")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {type(e).__name__}: {str(e)}"
        )

from fastapi.responses import JSONResponse

@router.post("/login/", response_model=UserResponse)
async def login(
    login_data: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    print("\n" + "="*60)
    print(f"[AUTH] LOGIN REQUEST for email: {login_data.email}")
    print("="*60)

    # Step 1: Authenticate user
    user = await authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Step 2: Create token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=access_token_expires
    )

    # Step 3: Set cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,        # because localhost
        samesite="lax",
        max_age=480 * 60,
        path="/",
    )

    print("[AUTH] LOGIN SUCCESSFUL")
    print("="*60)

    # Step 4: RETURN ONLY Pydantic response model
    return UserResponse.model_validate(user)





@router.get("/me/", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.post("/logout/")
async def logout(response: Response):
    """Clear authentication cookie"""
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}
