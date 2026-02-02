
from .manager import BaseIntegrationClient, IntegrationProvider
from typing import Any, Dict
import os
import requests
import urllib.parse
import json
import time
from datetime import datetime, timedelta

class GoogleHealthClient(BaseIntegrationClient):
    def __init__(self):
        super().__init__(IntegrationProvider.GOOGLE_HEALTH)
        self.client_id = os.environ.get("GOOGLE_CLIENT_ID")
        self.client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        
        # Determine Redirect URI
        # In production, this should be the deployed backend URL + /api/integrations/callback/google_health
        # In local, http://localhost:8000/api/integrations/callback/google_health
        
        # We try to infer from FRONTEND_URL if possible, assuming backend is same host or standard proxy
        base_url = os.environ.get("FRONTEND_URL", "http://localhost:8000")
        if "localhost" in base_url and "5173" in base_url:
             # If FRONTEND is set to vite dev port, assume backend is 8000
             base_url = "http://localhost:8000"
             
        self.redirect_uri = f"{base_url}/api/integrations/callback/google_health"
        
        self.auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
        self.token_url = "https://oauth2.googleapis.com/token"
        
        # Scopes for Fitness API (Read Only)
        self.scopes = [
            "https://www.googleapis.com/auth/fitness.activity.read",
            "https://www.googleapis.com/auth/fitness.body.read",
            "https://www.googleapis.com/auth/fitness.blood_pressure.read",
            "https://www.googleapis.com/auth/fitness.heart_rate.read",
            "https://www.googleapis.com/auth/fitness.sleep.read"
        ]
        
    def get_auth_url(self, state: str) -> str:
        if not self.client_id:
            return "#error_missing_google_client_id"
            
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "access_type": "offline", 
            "state": state,
            "include_granted_scopes": "true",
            "prompt": "consent"
        }
        return f"{self.auth_url}?{urllib.parse.urlencode(params)}"
        
    def exchange_code(self, code: str) -> Dict[str, Any]:
        if not self.client_id or not self.client_secret:
             raise ValueError("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing via .env")
             
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri
        }
        
        resp = requests.post(self.token_url, data=data)
        if not resp.ok:
            error_detail = resp.text
            try:
                error_detail = resp.json()
            except:
                pass
            raise ValueError(f"Token exchange failed: {error_detail}")
            
        return resp.json()
        
    def fetch_data(self, access_token: str, date_from: str) -> Any:
        # Fetch Aggregated Stats for 'Today'
        url = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Calculate dynamic time range for "Today" (UTC)
        now = datetime.utcnow()
        start_of_day = datetime(now.year, now.month, now.day)
        
        # Convert to milliseconds
        startTimeMillis = int(start_of_day.timestamp() * 1000)
        endTimeMillis = int(now.timestamp() * 1000)
        
        # If very early in day, fallback to yesterday to show SOME data
        if (endTimeMillis - startTimeMillis) < 60000:
             start_of_day = start_of_day - timedelta(days=1)
             startTimeMillis = int(start_of_day.timestamp() * 1000)

        # Request body for aggregation
        body = {
          "aggregateBy": [
            {"dataTypeName": "com.google.step_count.delta"},
            {"dataTypeName": "com.google.calories.expended"},
            {"dataTypeName": "com.google.heart_rate.bpm"}
          ],
          "bucketByTime": { "durationMillis": 86400000 }, # 1 day buckets
          "startTimeMillis": startTimeMillis,
          "endTimeMillis": endTimeMillis
        }
        
        resp = requests.post(url, headers=headers, json=body)
        
        if not resp.ok:
            if resp.status_code == 401:
                raise ValueError("401 Unauthorized")
                
            # Fallback to simple list if aggregation fails (e.g. permission issues with aggregate)
            print(f"Aggregation failed: {resp.text}, falling back to source list")
            list_url = "https://www.googleapis.com/fitness/v1/users/me/dataSources"
            return {"fallback": True, "data": requests.get(list_url, headers=headers).json()}
            
        return {"fallback": False, "data": resp.json()}

    def normalize_to_fhir(self, raw_data: Dict[str, Any]) -> Any:
        observations = []
        is_fallback = raw_data.get("fallback", False)
        data = raw_data.get("data", {})
        
        if is_fallback:
             # Handle dataSources list as fallback
             if "dataSource" in data:
                for ds in data["dataSource"]:
                    stream_name = ds.get("dataStreamName", "")
                    data_type = ds.get("dataType", {}).get("name", "Unknown")
                    device = ds.get("device", {}).get("model", "Unknown Device")
                    obs = {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {"text": f"Device Found: {data_type}"},
                        "effectiveDateTime": datetime.utcnow().isoformat(),
                        "valueQuantity": {"value": 1, "unit": "source"},
                        "note": f"Source: {device}"
                    }
                    observations.append(obs)
             return observations

        # Handle Aggregated Buckets
        if "bucket" in data:
            for bucket in data["bucket"]:
                for dataset in bucket.get("dataset", []):
                    source_id = dataset.get("dataSourceId", "unknown")
                    for point in dataset.get("point", []):
                        # Extract value
                        val_list = point.get("value", [])
                        if not val_list: continue
                        
                        # Use first value (int or float)
                        numeric_val = 0
                        if "intVal" in val_list[0]: numeric_val = val_list[0]["intVal"]
                        elif "fpVal" in val_list[0]: numeric_val = val_list[0]["fpVal"]
                        
                        # Determine type from source_id or known order
                        code_text = "Health Metric"
                        unit = "units"
                        
                        if "step_count" in source_id:
                            code_text = "Steps"
                            unit = "steps"
                        elif "calories" in source_id:
                            code_text = "Calories"
                            unit = "kcal"
                        elif "heart_rate" in source_id:
                            code_text = "Heart Rate"
                            unit = "bpm"
                            
                        obs = {
                            "resourceType": "Observation",
                            "status": "final",
                            "code": {"text": code_text},
                            "effectiveDateTime": datetime.utcnow().isoformat(),
                            "valueQuantity": {
                                "value": numeric_val,
                                "unit": unit
                            },
                            "note": "Source: Google Fit Store (Includes Samsung Health/Health Connect)"
                        }
                        observations.append(obs)
                        
        return observations

    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        if not self.client_id or not self.client_secret:
             raise ValueError("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing")
             
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        resp = requests.post(self.token_url, data=data)
        if not resp.ok:
            # Check if revoked
            raise ValueError(f"Refresh failed: {resp.text}")
            
        return resp.json()
