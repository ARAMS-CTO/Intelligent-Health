from .legacy import EmergencyAgent, LaboratoryAgent, RadiologyAgent
from .base_specialist import SpecialistAgent
from .cardiology import CardiologyAgent
from .orthopedics import OrthopedicsAgent
from .pulmonology import PulmonologyAgent
from .endocrinology import EndocrinologyAgent

__all__ = [
    "EmergencyAgent", "LaboratoryAgent", "RadiologyAgent",
    "SpecialistAgent", "CardiologyAgent", "OrthopedicsAgent",
    "PulmonologyAgent", "EndocrinologyAgent"
]
