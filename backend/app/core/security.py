from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from passlib.context import CryptContext
from jose import jwt, JWTError
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "type": "access"
    }
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)

def create_refresh_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "type": "refresh"
    }
    return jwt.encode(to_encode, settings.JWT_REFRESH_SECRET, algorithm=settings.ALGORITHM)

def create_exam_access_token(student_id: int, exam_id: int) -> str:
    """Creates a bound, short-lived exam session token to prevent token sharing."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.EXAM_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "exp": expire,
        "sub": str(student_id),
        "exam_id": exam_id,
        "role": "STUDENT",
        "type": "exam_session"
    }
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)

def decode_token(token: str, is_refresh: bool = False) -> Optional[dict]:
    try:
        secret = settings.JWT_REFRESH_SECRET if is_refresh else settings.JWT_SECRET
        payload = jwt.decode(token, secret, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
