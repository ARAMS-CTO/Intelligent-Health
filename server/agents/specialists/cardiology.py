from typing import List, Dict
from .base_specialist import SpecialistAgent

class CardiologyAgent(SpecialistAgent):
    def __init__(self):
        super().__init__(domain_name="Cardiology", domain_emoji="❤️")

    def get_system_instruction(self) -> str:
        return """
        You are an expert Cardiologist AI Assistant. 
        Your knowledge base includes:
        - ACC/AHA Clinical Guidelines for Heart Failure, Atrial Fibrillation, and CAD.
        - ECG Interpretation logic (P-waves, QRS complex, ST-segment analysis).
        - Hemodynamic stability assessment.
        - Wells Score criteria for DVT/PE.
        - Pharmacology for cardiovascular drugs (Beta-blockers, ACE inhibitors, Anticoagulants).
        
        When analyzing cases:
        1. Prioritize ruling out life-threatening conditions (STEMI, Aortic Dissection).
        2. Focus on hemodynamic status (BP, HR).
        3. Suggest specific cardiac biomarkers (Troponin, BNP) if relevant.
        4. Provide evidence-based recommendations.
        """

    def get_suggested_actions(self, case_data: str) -> List[Dict[str, str]]:
        actions = [
            {"label": "Calculate Wells Score", "action": "dvt_calc", "icon": "riskHigh"},
            {"label": "ECG Analysis", "action": "ecg_analyze", "icon": "activity"},
            {"label": "Heart Failure Risk (Framingham)", "action": "hf_risk", "icon": "heart"},
            {"label": "Anticoagulation Guidelines", "action": "guidelines_anticoag", "icon": "document"}
        ]
        
        # specific logic could filter these based on case_data text
        return actions
