"""
Configuration for AI Adapters
Load settings from environment variables.
"""
import os
from typing import Optional
from pathlib import Path

# Load .env file if it exists
try:
    from dotenv import load_dotenv
    env_file = Path(__file__).parent.parent / '.env'
    if env_file.exists():
        load_dotenv(env_file)
except ImportError:
    pass  # dotenv not installed, use system env vars


class Config:
    """Application configuration from environment variables"""
    
    # AI Provider: "ollama", "openai", "anthropic"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "ollama")
    
    # Ollama settings
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:14b")
    
    # OpenAI settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Anthropic settings (future)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
    
    # Timeout
    AI_TIMEOUT: int = int(os.getenv("AI_TIMEOUT", "300"))


def get_config() -> Config:
    """Get configuration instance"""
    return Config()
