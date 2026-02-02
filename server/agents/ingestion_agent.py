
from typing import Dict, Any, List, Optional
import json
from datetime import datetime

class HealthDataIngestionAgent:
    """
    Agent responsible for normalizing diverse wearable payloads into 
    standard MedicalRecord structures.
    Uses dynamic schema mapping (Simulated 'Learning') to adapt to new keys.
    """
    
    def __init__(self):
        # Known mappings "Learned" by the system
        # In a real agent, this would be a dynamic database or updated via LLM
        self.schema_mappings = {
            "google_health": {
                "steps": {"code": "Steps", "unit": "count"},
                "heart_rate": {"code": "Heart Rate", "unit": "bpm"},
                # Add aliases
                "bpm": {"code": "Heart Rate", "unit": "bpm"},
                "step_count": {"code": "Steps", "unit": "count"},
                "calories": {"code": "Calories", "unit": "kcal"},
                "kcal": {"code": "Calories", "unit": "kcal"},
            },
            "apple_health": {
                "stepCount": {"code": "Steps", "unit": "count"},
                "heartRate": {"code": "Heart Rate", "unit": "bpm"},
                "activeEnergyBurned": {"code": "Calories", "unit": "kcal"},
                "sleepAnalysis": {"code": "Sleep", "unit": "minutes"}
            },
            "oura": {
                "score": {"code": "Sleep Score", "unit": "score"},
                "rmssd": {"code": "HRV", "unit": "ms"},
                "average_breath": {"code": "Respiratory Rate", "unit": "rpm"}
            }
        }

    def detect_schema(self, provider: str, payload: Dict[str, Any]) -> str:
        """
        Identify the likely SDK version or Schema type.
        """
        # Simple Logic for now
        return f"{provider}_default"

    def normalize_payload(self, provider: str, raw_item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Transform a single raw item (e.g. one step count entry) into 
        standard Metadata bundle + FHIR-like codes.
        """
        mapping = self.schema_mappings.get(provider, {})
        
        # Heuristic: Scan keys to find known metrics
        found_metric = None
        extracted_val = 0
        
        # 1. Direct Key Match (e.g. "steps": 500)
        for key, config in mapping.items():
            if key in raw_item:
                 found_metric = config
                 extracted_val = raw_item[key]
                 break
                 
        # 2. Value Match/Fallback (e.g. { "type": "steps", "value": 500 })
        if not found_metric:
            type_val = raw_item.get("type", "").lower()
            if type_val:
                for key, config in mapping.items():
                    if key in type_val:
                        found_metric = config
                        extracted_val = raw_item.get("value", 0)
                        break
        
        if not found_metric:
            # Special Handling for Google Health buckets (already partially normalized by client, but let's double check)
            # If the client already normalized it to FHIR Observation, pass it through optimized
            if raw_item.get("resourceType") == "Observation":
                 return {
                     "code": raw_item.get("code", {}).get("text"),
                     "value": raw_item.get("valueQuantity", {}).get("value"),
                     "unit": raw_item.get("valueQuantity", {}).get("unit"),
                     "timestamp": raw_item.get("effectiveDateTime"),
                     "raw": raw_item
                 }
            return None

        return {
            "code": found_metric["code"],
            "value": extracted_val,
            "unit": found_metric["unit"],
            "timestamp": raw_item.get("date") or raw_item.get("timestamp") or datetime.utcnow().isoformat(),
            "raw": raw_item
        }

    def verify_integrity(self, record: Dict[str, Any]) -> bool:
        """
        Sanity check data before ingestion to prevent garbage.
        """
        code = record.get("code", "")
        val = record.get("value", 0)
        
        if code == "Heart Rate" and (val < 30 or val > 220):
            return False # outlier
        if code == "Steps" and val > 100000:
             return False # outlier for single sync
             
        return True

ingestion_agent = HealthDataIngestionAgent()
