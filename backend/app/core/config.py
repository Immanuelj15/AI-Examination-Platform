import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Evalora Enterprise Assessment Cloud"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./evalora.db")
    
    # JWT & Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "evalora-super-secure-production-jwt-key-32chars-minimum-hash")
    JWT_REFRESH_SECRET: str = os.getenv("JWT_REFRESH_SECRET", "evalora-super-secure-refresh-jwt-key-32chars-minimum-hash")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 2  # 2 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    EXAM_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 4  # 4 hours
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ]
    
    # AI Subjective Evaluation & Question Generation (Groq & OpenAI)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GROQ_FALLBACK_MODEL: str = os.getenv("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    
    # Proctoring Configuration Defaults
    PROCTORING_HEARTBEAT_SECONDS: int = 10
    FACE_ABSENCE_PENALTY: int = 10
    MULTIPLE_FACES_PENALTY: int = 25
    GAZE_AWAY_PENALTY: int = 10
    TAB_SWITCH_PENALTY: int = 15
    WINDOW_BLUR_PENALTY: int = 10
    FULLSCREEN_EXIT_PENALTY: int = 15
    
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="allow")

settings = Settings()
