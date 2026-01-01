from typing import Dict, Any, List
import random

class NurseAgent:
    def triage_patient(self, symptoms: str, vitals: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Assigns a priority level (1-5) based on symptoms (ESI Triage).
        1 = Resuscitation (Immediate)
        5 = Non-urgent
        """
        symptoms_lower = symptoms.lower()
        score = 5
        rationale = "Non-urgent symptoms."

        if any(x in symptoms_lower for x in ['cardiac arrest', 'unresponsive', 'not breathing', 'severe bleeding']):
            score = 1
            rationale = "Immediate life-saving intervention required."
        elif any(x in symptoms_lower for x in ['chest pain', 'stroke', 'difficulty breathing', 'confusion']):
            score = 2
            rationale = "High risk situation, rapid care needed."
        elif any(x in symptoms_lower for x in ['abdominal pain', 'fracture', 'fever > 40']):
            score = 3
            rationale = "Urgent, requires multiple resources."
        elif any(x in symptoms_lower for x in ['sore throat', 'minor cut', 'sprain']):
            score = 4
            rationale = "Less urgent, requires one resource."
        
        return {
            "priority": score,
            "rationale": rationale,
            "recommended_action": "Admit to Trauma" if score <= 2 else "Wait Room"
        }

nurse_agent = NurseAgent()
