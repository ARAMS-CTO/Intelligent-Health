from enum import Enum
from typing import Dict, Any, Optional

class IntegrationProvider(Enum):
    FITBIT = "fitbit"
    GOOGLE_HEALTH = "google_health"
    APPLE_HEALTH = "apple_health"

class BaseIntegrationClient:
    """Abstract Base Class for Health Integations"""
    
    def __init__(self, provider: IntegrationProvider):
        self.provider = provider
        
    def get_auth_url(self, state: str) -> str:
        raise NotImplementedError
        
    def exchange_code(self, code: str) -> Dict[str, Any]:
        raise NotImplementedError
        
    def fetch_data(self, access_token: str, date_from: str) -> Any:
        raise NotImplementedError
        
    def normalize_to_fhir(self, raw_data: Any) -> Any:
        """Convert provider-specific JSON to FHIR Bundles"""
        raise NotImplementedError

class IntegrationManager:
    _clients = {}
    
    @classmethod
    def register_client(cls, provider: IntegrationProvider, client_class):
        cls._clients[provider] = client_class
        
    @classmethod
    def get_client(cls, provider_str: str) -> BaseIntegrationClient:
        try:
            provider = IntegrationProvider(provider_str)
        except ValueError:
            raise ValueError(f"Provider {provider_str} not supported")
            
        client_class = cls._clients.get(provider)
        if not client_class:
            raise ValueError(f"No client registered for {provider}")
            
        return client_class()

