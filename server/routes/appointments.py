from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from ..database import get_db
from ..models import User, Patient, Appointment, Notification
from ..schemas import AppointmentCreate, AppointmentUpdate, AppointmentSchema
from .auth import get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])

def create_notification(db: Session, user_id: str, type: str, title: str, message: str, link: str = None):
    """Helper to create notifications"""
    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link
    )
    db.add(notif)
    return notif

@router.get("/", response_model=List[AppointmentSchema])
async def get_appointments(
    status: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get appointments filtered by user role"""
    query = db.query(Appointment)
    
    # Filter by role
    if current_user.role == "Patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(Appointment.patient_id == patient.id)
        else:
            return []
    elif current_user.role in ["Doctor", "Specialist"]:
        query = query.filter(Appointment.doctor_id == current_user.id)
    # Admin sees all
    
    # Apply filters
    if status:
        query = query.filter(Appointment.status == status)
    if from_date:
        query = query.filter(Appointment.scheduled_at >= datetime.fromisoformat(from_date))
    if to_date:
        query = query.filter(Appointment.scheduled_at <= datetime.fromisoformat(to_date))
    
    appointments = query.order_by(Appointment.scheduled_at.desc()).all()
    
    # Enrich with names
    result = []
    for apt in appointments:
        apt_dict = apt.__dict__.copy()
        apt_dict['doctor_name'] = apt.doctor.name if apt.doctor else None
        apt_dict['patient_name'] = apt.patient.name if apt.patient else None
        result.append(apt_dict)
    
    return result

@router.post("/", response_model=AppointmentSchema)
async def create_appointment(
    appointment: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new appointment"""
    # Verify doctor exists
    doctor = db.query(User).filter(User.id == appointment.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == appointment.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check for conflicts (simple check)
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == appointment.doctor_id,
        Appointment.scheduled_at == appointment.scheduled_at,
        Appointment.status.in_(["Scheduled", "Confirmed"])
    ).first()
    
    if conflict:
        raise HTTPException(status_code=409, detail="Time slot already booked")
    
    db_appointment = Appointment(
        id=str(uuid.uuid4()),
        doctor_id=appointment.doctor_id,
        patient_id=appointment.patient_id,
        scheduled_at=appointment.scheduled_at,
        duration_minutes=appointment.duration_minutes,
        type=appointment.type,
        reason=appointment.reason,
        notes=appointment.notes,
        service_id=appointment.service_id,
        cost=appointment.cost,
        payment_status=appointment.payment_status
    )
    
    db.add(db_appointment)
    
    # Notify doctor
    create_notification(
        db, 
        doctor.id, 
        "appointment",
        "New Appointment Booked",
        f"Appointment with {patient.name} on {appointment.scheduled_at.strftime('%Y-%m-%d %H:%M')}",
        f"/appointments/{db_appointment.id}"
    )
    
    # Notify patient (if they have a user account)
    if patient.user_id:
        create_notification(
            db,
            patient.user_id,
            "appointment",
            "Appointment Confirmed",
            f"Your appointment with Dr. {doctor.name} is scheduled for {appointment.scheduled_at.strftime('%Y-%m-%d %H:%M')}",
            f"/appointments/{db_appointment.id}"
        )
    
    db.commit()
    db.refresh(db_appointment)
    
    result = db_appointment.__dict__.copy()
    result['doctor_name'] = doctor.name
    result['patient_name'] = patient.name
    
    return result

@router.get("/{appointment_id}", response_model=AppointmentSchema)
async def get_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific appointment"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    result = appointment.__dict__.copy()
    result['doctor_name'] = appointment.doctor.name if appointment.doctor else None
    result['patient_name'] = appointment.patient.name if appointment.patient else None
    
    return result

@router.put("/{appointment_id}", response_model=AppointmentSchema)
async def update_appointment(
    appointment_id: str,
    updates: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an appointment (reschedule, cancel, etc.)"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(appointment, key, value)
    
    # Notify on status change
    if 'status' in update_data:
        if appointment.patient.user_id:
            create_notification(
                db,
                appointment.patient.user_id,
                "appointment",
                f"Appointment {update_data['status']}",
                f"Your appointment status has been updated to: {update_data['status']}",
                f"/appointments/{appointment_id}"
            )
    
    db.commit()
    db.refresh(appointment)
    
    result = appointment.__dict__.copy()
    result['doctor_name'] = appointment.doctor.name if appointment.doctor else None
    result['patient_name'] = appointment.patient.name if appointment.patient else None
    
    return result

@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an appointment (admin only or soft delete via status)"""
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can hard delete")
    
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    db.delete(appointment)
    db.commit()
    
    return {"status": "deleted", "id": appointment_id}

@router.get("/available-slots/{doctor_id}")
async def get_available_slots(
    doctor_id: str,
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get available time slots for a doctor on a specific date"""
    # Parse date
    target_date = datetime.strptime(date, "%Y-%m-%d").date()
    
    # Define working hours (9 AM to 5 PM, 30-minute slots)
    slots = []
    start_hour = 9
    end_hour = 17
    slot_duration = 30
    
    current_time = datetime.combine(target_date, datetime.min.time().replace(hour=start_hour))
    end_time = datetime.combine(target_date, datetime.min.time().replace(hour=end_hour))
    
    # Get existing appointments for this doctor on this date
    existing = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.scheduled_at >= current_time,
        Appointment.scheduled_at < end_time,
        Appointment.status.in_(["Scheduled", "Confirmed"])
    ).all()
    
    booked_times = {apt.scheduled_at for apt in existing}
    
    while current_time < end_time:
        slots.append({
            "time": current_time.isoformat(),
            "available": current_time not in booked_times
        })
        current_time += timedelta(minutes=slot_duration)
    
    return {"date": date, "doctor_id": doctor_id, "slots": slots}
