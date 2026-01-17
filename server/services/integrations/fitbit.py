from .manager import BaseIntegrationClient, IntegrationProvider
from datetime import datetime
import json

class FitbitClient(BaseIntegrationClient):
    def __init__(self):
        super().__init__(IntegrationProvider.FITBIT)
        # TODO: Load from Config
        self.client_id = "YOUR_FITBIT_CLIENT_ID"
        self.client_secret = "YOUR_FITBIT_CLIENT_SECRET"
        self.redirect_uri = "https://api.intelligenthealth.ai/integrations/fitbit/callback"
        
    def get_auth_url(self, state: str) -> str:
        # Mocking the generation of Auth URL
        scope = "activity heartrate sleep weight"
        return f"https://www.fitbit.com/oauth2/authorize?response_type=code&client_id={self.client_id}&redirect_uri={self.redirect_uri}&scope={scope}&state={state}"
        
    def exchange_code(self, code: str) -> dict:
        # Mock exchange
        return {
            "access_token": "mock_fitbit_access_token",
            "refresh_token": "mock_fitbit_refresh_token",
            "expires_in": 3600,
            "user_id": "mock_fitbit_user_id"
        }
        
    def fetch_data(self, access_token: str, date: str) -> dict:
        # Mock fetching data
        print(f"Fetching Fitbit data for {date} with token {access_token[:5]}...")
        return {
            "activities-heart": [
                {
                    "dateTime": date,
                    "value": {
                        "restingHeartRate": 65,
                        "heartRateZones": []
                    }
                }
            ],
            "sleep": [
                {
                    "dateOfSleep": date,
                    "duration": 28800000,
                    "efficiency": 95
                }
            ]
        }
        
    def normalize_to_fhir(self, raw_data: dict) -> list:
        # Normalize Fitbit JSON to FHIR Observations
        observations = []
        
        # 1. Heart Rate
        if "activities-heart" in raw_data:
            for entry in raw_data["activities-heart"]:
                if "value" in entry and "restingHeartRate" in entry["value"]:
                    observations.append({
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {
                            "coding": [{"system": "http://loinc.org", "code": "8867-4", "display": "Heart rate"}]
                        },
                        "valueQuantity": {
                            "value": entry["value"]["restingHeartRate"],
                            "unit": "bpm",
                            "system": "http://unitsofmeasure.org",
                            "code": "/min"
                        },
                        "effectiveDateTime": f"{entry['dateTime']}T08:00:00Z"
                    })
                    
        return observations
