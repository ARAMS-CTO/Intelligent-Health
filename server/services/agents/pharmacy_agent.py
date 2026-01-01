from typing import Dict, Any, List

class PharmacyAgent:
    def check_drug_interaction(self, medications: List[str]) -> Dict[str, Any]:
        """
        Checks interactions between a list of meds.
        """
        interactions = []
        severity = "None"
        
        meds_lower = [m.lower() for m in medications]
        
        # Mock Interactions
        if "warfarin" in meds_lower and "aspirin" in meds_lower:
            interactions.append("Warfarin + Aspirin: Increased bleeding risk.")
            severity = "High"
        
        if "lisinopril" in meds_lower and "potassium" in meds_lower:
            interactions.append("Lisinopril + Potassium: Risk of hyperkalemia.")
            severity = "Moderate"

        if "sildenafil" in meds_lower and "nitroglycerin" in meds_lower:
            interactions.append("Sildenafil + Nitroglycerin: Severe hypotension risk.")
            severity = "Critical"

        return {
            "interactions_found": len(interactions) > 0,
            "interactions": interactions,
            "severity": severity
        }

pharmacy_agent = PharmacyAgent()
