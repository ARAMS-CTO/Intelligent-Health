from typing import Dict
from .specialists import (
    SpecialistAgent,
    CardiologyAgent,
    OrthopedicsAgent,
    PulmonologyAgent,
    EndocrinologyAgent,
    DentistryAgent,
    OphthalmologyAgent
)

class AgentFactory:
    _agents: Dict[str, SpecialistAgent] = {}

    @classmethod
    def get_agent(cls, zone: str) -> SpecialistAgent:
        zone_key = zone.lower()
        
        if zone_key in cls._agents:
            return cls._agents[zone_key]

        agent = cls._create_agent(zone_key)
        cls._agents[zone_key] = agent
        return agent

    @staticmethod
    def _create_agent(zone: str) -> SpecialistAgent:
        # Core Specialists
        if zone == "dentistry":
            return DentistryAgent()
        elif zone == "ophthalmology":
            return OphthalmologyAgent()
        elif zone == "cardiology":
            return CardiologyAgent()
        elif zone == "orthopedics":
            return OrthopedicsAgent()
        elif zone == "pulmonology":
            return PulmonologyAgent()
        elif zone == "endocrinology":
            return EndocrinologyAgent()
        
        # New Knowledge-Enhanced Specialists
        elif zone == "urology":
            return SpecialistAgent(domain_name="Urology", domain_emoji="🩺",
                description="Kidney stones, nephrolithiasis, urinary health")
        elif zone == "gastroenterology":
            return SpecialistAgent(domain_name="Gastroenterology", domain_emoji="🫀",
                description="Gallstones, GI conditions, endoscopy")
        elif zone == "hematology":
            return SpecialistAgent(domain_name="Hematology", domain_emoji="🩸",
                description="Blood clots, DVT/PE, anticoagulation")
        elif zone == "oncology":
            return SpecialistAgent(domain_name="Oncology", domain_emoji="🎗️",
                description="Cancer diagnosis, staging, treatment")
        elif zone == "neuro-oncology":
            return SpecialistAgent(domain_name="Neuro-Oncology", domain_emoji="🧠",
                description="Brain tumors, CNS neoplasms")
        elif zone == "metabolic":
            return SpecialistAgent(domain_name="Metabolic Medicine", domain_emoji="⚗️",
                description="Hyperuricemia, hyperlipidemia, gout")
        elif zone == "genetics":
            return SpecialistAgent(domain_name="Genetics & Longevity", domain_emoji="🧬",
                description="Hereditary patterns, pharmacogenomics, longevity science")
        elif zone == "dermatology":
            return SpecialistAgent(domain_name="Dermatology", domain_emoji="🧴",
                description="Skin analysis, melanoma, dermatological conditions")
        elif zone == "radiology":
            return SpecialistAgent(domain_name="Radiology", domain_emoji="📷",
                description="Medical imaging interpretation, CT, MRI, X-ray")
        elif zone == "pediatrics":
            return SpecialistAgent(domain_name="Pediatrics", domain_emoji="👶",
                description="Child health, growth monitoring, vaccinations")
        else:
            # Fallback for generic or unmapped zones
            return SpecialistAgent(domain_name=zone.capitalize(), domain_emoji="🩺")

agent_factory = AgentFactory()

