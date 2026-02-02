from .manager import BaseIntegrationClient, IntegrationProvider
from datetime import datetime
import json
import os
import requests
import base64

class FitbitClient(BaseIntegrationClient):
    def __init__(self):
        super().__init__(IntegrationProvider.FITBIT)
        self.client_id = os.environ.get("FITBIT_CLIENT_ID", "mock_id")
        self.client_secret = os.environ.get("FITBIT_CLIENT_SECRET", "mock_secret")
        self.redirect_uri = os.environ.get("FITBIT_REDIRECT_URI", "https://api.intelligenthealth.ai/integrations/callback/fitbit")
        
    def get_auth_url(self, state: str) -> str:
        scope = "activity heartrate sleep weight profile"
        # Fitbit specific: response_type=code
        return (f"https://www.fitbit.com/oauth2/authorize"
                f"?response_type=code"
                f"&client_id={self.client_id}"
                f"&redirect_uri={self.redirect_uri}"
                f"&scope={scope}"
                f"&state={state}")
        
    def exchange_code(self, code: str) -> dict:
        url = "https://api.fitbit.com/oauth2/token"
        
        # Fitbit requires Basic Auth (ClientId:ClientSecret)
        auth_string = f"{self.client_id}:{self.client_secret}"
        auth_header = base64.b64encode(auth_string.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        data = {
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri,
            "code": code
        }
        
        resp = requests.post(url, headers=headers, data=data)
        if resp.status_code != 200:
             # Just raise error to be caught by router
             raise ValueError(f"Fitbit Token Error: {resp.text}")
             
        return resp.json()

    def refresh_token(self, refresh_token: str) -> dict:
        url = "https://api.fitbit.com/oauth2/token"
        
        auth_string = f"{self.client_id}:{self.client_secret}"
        auth_header = base64.b64encode(auth_string.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }
        
        resp = requests.post(url, headers=headers, data=data)
        if resp.status_code != 200:
             raise ValueError(f"Fitbit Refresh Error: {resp.text}")
             
        return resp.json()
        
    def fetch_data(self, access_token: str, date: str) -> dict:
        """
        Fetch heart rate and sleep data.
        date format expected 'today' or 'yyyy-MM-dd'
        Fitbit 'today' works directly in URL if date is 'today'.
        """
        # If mock mode (no real token), return mock data for dev happiness
        if access_token == "mock_fitbit_access_token":
             return self._get_mock_data(date)

        date_str = "today" if date == "today" else date 
        # But wait, Fitbit API needs YYYY-MM-DD or 'today'
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        out_data = {}
        
        # 1. Activities/Heart
        try:
            hr_url = f"https://api.fitbit.com/1/user/-/activities/heart/date/{date_str}/1d.json"
            resp = requests.get(hr_url, headers=headers)
            if resp.status_code == 401:
                raise ValueError("401 Unauthorized")
            if resp.status_code == 200:
                out_data.update(resp.json())
        except Exception as e:
            if "401" in str(e): raise e
            print(f"Fitbit HR Fetch Error: {e}")

        # 2. Sleep
        try:
            sleep_url = f"https://api.fitbit.com/1.2/user/-/sleep/date/{date_str}.json"
            resp = requests.get(sleep_url, headers=headers)
            if resp.status_code == 200:
                out_data.update(resp.json())
        except Exception:
            pass
            
        return out_data
        
    def _get_mock_data(self, date: str) -> dict:
         print(f"Fetching Mock Fitbit data for {date}")
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
                        "effectiveDateTime": f"{entry.get('dateTime', datetime.utcnow().date())}T08:00:00Z"
                    })
                    
        return observations
