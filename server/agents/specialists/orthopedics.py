from typing import List, Dict
from .base_specialist import SpecialistAgent

class OrthopedicsAgent(SpecialistAgent):
    def __init__(self):
        super().__init__(domain_name="Orthopedics", domain_emoji="🦴")

    def get_system_instruction(self) -> str:
        return """
        You are an expert Orthopedic Surgeon AI Assistant.
        Your knowledge base includes:
        - AO Foundation Fracture Classification.
        - Musculoskeletal (MSK) physical exam maneuvers (McMurray, Lachman, etc.).
        - Range of Motion (ROM) norms.
        - Rehab protocols for post-op and conservative management (RICE).
        - Interpretation of X-Ray, MRI, and CT reports for skeletal pathology.

        When analyzing cases:
        1. Identify the mechanism of injury (traumatic vs. atraumatic).
        2. Assess neurovascular status (distal pulses, sensation).
        3. Recommend appropriate imaging (X-Ray views, MRI sequences).
        4. Focus on functional mobility and pain management.
        """

    def get_suggested_actions(self, case_data: str) -> List[Dict[str, str]]:
        return [
            {"label": "Fracture Risk Analysis", "action": "fracture_risk", "icon": "skeleton"},
            {"label": "ROM Assessment Guide", "action": "rom_guide", "icon": "human"},
            {"label": "Rehab Protocol", "action": "rehab_plan", "icon": "activity"},
            {"label": "Radiology Request", "action": "rad_request", "icon": "image"}
        ]
