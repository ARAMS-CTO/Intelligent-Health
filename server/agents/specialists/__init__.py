from .legacy import EmergencyAgent, LaboratoryAgent, RadiologyAgent
from .base_specialist import SpecialistAgent
from .cardiology import CardiologyAgent
from .orthopedics import OrthopedicsAgent
from .pulmonology import PulmonologyAgent
from .endocrinology import EndocrinologyAgent
from .dentistry import DentistryAgent
from .ophthalmology import OphthalmologyAgent

__all__ = [
    "EmergencyAgent", "LaboratoryAgent", "RadiologyAgent",
    "SpecialistAgent", "CardiologyAgent", "OrthopedicsAgent",
    "PulmonologyAgent", "EndocrinologyAgent", "DentistryAgent",
    "OphthalmologyAgent"
]
