"""
Adapter Factory
Creates the appropriate AI adapter based on configuration.
"""
from typing import Optional

from .adapters import AIAdapter, OllamaAdapter, OpenAIAdapter
from .config import Config, get_config


class AdapterFactory:
    """Factory for creating AI adapters"""
    
    _instance: Optional[AIAdapter] = None
    
    @classmethod
    def create(cls, provider: Optional[str] = None) -> AIAdapter:
        """
        Create an adapter based on provider name or config.
        
        Args:
            provider: Optional provider name override
            
        Returns:
            AIAdapter instance
        """
        config = get_config()
        provider = provider or config.AI_PROVIDER
        
        if provider == "ollama":
            return OllamaAdapter(
                base_url=config.OLLAMA_URL,
                model=config.OLLAMA_MODEL,
                timeout=config.AI_TIMEOUT,
                api_key=config.OLLAMA_API_KEY
            )
        elif provider == "openai":
            return OpenAIAdapter(
                api_key=config.OPENAI_API_KEY,
                model=config.OPENAI_MODEL,
                timeout=config.AI_TIMEOUT
            )
        else:
            raise ValueError(f"Unknown AI provider: {provider}")
    
    @classmethod
    def get_default(cls) -> AIAdapter:
        """Get the default adapter (singleton)"""
        if cls._instance is None:
            cls._instance = cls.create()
        return cls._instance
    
    @classmethod
    def reset(cls) -> None:
        """Reset the singleton instance"""
        cls._instance = None


def get_adapter(provider: Optional[str] = None) -> AIAdapter:
    """Convenience function to get an adapter"""
    if provider:
        return AdapterFactory.create(provider)
    return AdapterFactory.get_default()
