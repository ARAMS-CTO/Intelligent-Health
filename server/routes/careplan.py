"""
Care Plan API Routes
Patient care plan management with goals and tasks
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from ..database import get_db
from ..models import CarePlan, CarePlanGoal, CarePlanTask, Patient, User
from ..routes.auth import get_current_user

router = APIRouter(prefix="/api/careplan", tags=["careplan"])

# --- Schemas ---

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    frequency: str = "Daily"
    due_date: Optional[datetime] = None

class TaskResponse(BaseModel):
    id: str
    goal_id: str
    title: str
    description: Optional[str]
    frequency: str
    is_completed: bool
    last_completed_at: Optional[datetime]
    due_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class GoalCreate(BaseModel):
    category: str  # 'medication', 'lifestyle', 'monitoring', 'followup', 'therapy'
    title: str
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    priority: int = 1
    tasks: Optional[List[TaskCreate]] = []

class GoalResponse(BaseModel):
    id: str
    care_plan_id: str
    category: str
    title: str
    description: Optional[str]
    target_date: Optional[datetime]
    progress: int
    status: str
    priority: int
    tasks: List[TaskResponse]
    created_at: datetime

    class Config:
        from_attributes = True

class CarePlanCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_end_date: Optional[datetime] = None
    goals: Optional[List[GoalCreate]] = []

class CarePlanResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str]
    title: str
    description: Optional[str]
    status: str
    start_date: datetime
    target_end_date: Optional[datetime]
    progress: int
    goals: List[GoalResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CarePlanSummary(BaseModel):
    id: str
    title: str
    status: str
    progress: int
    goals_count: int
    goals_completed: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Helper Functions ---

def calculate_goal_progress(goal: CarePlanGoal) -> int:
    """Calculate goal progress based on task completion"""
    if not goal.tasks:
        return goal.progress
    
    completed = sum(1 for t in goal.tasks if t.is_completed)
    total = len(goal.tasks)
    
    return int((completed / total) * 100) if total > 0 else 0

def calculate_plan_progress(care_plan: CarePlan) -> int:
    """Calculate overall care plan progress"""
    if not care_plan.goals:
        return care_plan.progress
    
    total_progress = sum(calculate_goal_progress(g) for g in care_plan.goals)
    return int(total_progress / len(care_plan.goals)) if care_plan.goals else 0

def update_goal_status(goal: CarePlanGoal) -> str:
    """Update goal status based on progress and due date"""
    progress = calculate_goal_progress(goal)
    
    if progress >= 100:
        return "completed"
    
    if goal.target_date and datetime.utcnow() > goal.target_date:
        return "overdue"
    
    if progress < 25 and goal.target_date:
        days_remaining = (goal.target_date - datetime.utcnow()).days
        if days_remaining < 7:
            return "at-risk"
    
    return "on-track"

# --- Endpoints ---

@router.post("/", response_model=CarePlanResponse)
async def create_care_plan(
    plan: CarePlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new care plan for a patient"""
    if not current_user.patient_profile and current_user.role not in ["Doctor", "Admin"]:
        raise HTTPException(status_code=400, detail="No patient profile found")
    
    # Determine patient_id
    if current_user.patient_profile:
        patient_id = current_user.patient_profile.id
        doctor_id = None
    else:
        # Doctor creating for patient - would need patient_id parameter
        raise HTTPException(status_code=400, detail="Patient ID required when doctor creates care plan")
    
    new_plan = CarePlan(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        doctor_id=doctor_id,
        title=plan.title,
        description=plan.description,
        target_end_date=plan.target_end_date
    )
    
    db.add(new_plan)
    
    # Add goals
    for goal_data in plan.goals or []:
        goal = CarePlanGoal(
            id=str(uuid.uuid4()),
            care_plan_id=new_plan.id,
            category=goal_data.category,
            title=goal_data.title,
            description=goal_data.description,
            target_date=goal_data.target_date,
            priority=goal_data.priority
        )
        db.add(goal)
        
        # Add tasks
        for task_data in goal_data.tasks or []:
            task = CarePlanTask(
                id=str(uuid.uuid4()),
                goal_id=goal.id,
                title=task_data.title,
                description=task_data.description,
                frequency=task_data.frequency,
                due_date=task_data.due_date
            )
            db.add(task)
    
    db.commit()
    db.refresh(new_plan)
    
    # Load with relationships
    result = db.query(CarePlan).options(
        joinedload(CarePlan.goals).joinedload(CarePlanGoal.tasks)
    ).filter(CarePlan.id == new_plan.id).first()
    
    return result

@router.get("/", response_model=List[CarePlanSummary])
async def get_care_plans(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all care plans for the current patient"""
    if not current_user.patient_profile:
        raise HTTPException(status_code=400, detail="No patient profile found")
    
    patient_id = current_user.patient_profile.id
    
    query = db.query(CarePlan).options(
        joinedload(CarePlan.goals)
    ).filter(CarePlan.patient_id == patient_id)
    
    if status:
        query = query.filter(CarePlan.status == status)
    
    plans = query.order_by(CarePlan.created_at.desc()).all()
    
    return [
        CarePlanSummary(
            id=p.id,
            title=p.title,
            status=p.status,
            progress=calculate_plan_progress(p),
            goals_count=len(p.goals),
            goals_completed=sum(1 for g in p.goals if calculate_goal_progress(g) >= 100),
            created_at=p.created_at
        )
        for p in plans
    ]

@router.get("/{plan_id}", response_model=CarePlanResponse)
async def get_care_plan(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific care plan with all goals and tasks"""
    plan = db.query(CarePlan).options(
        joinedload(CarePlan.goals).joinedload(CarePlanGoal.tasks)
    ).filter(CarePlan.id == plan_id).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Care plan not found")
    
    # Verify access
    if current_user.patient_profile and plan.patient_id != current_user.patient_profile.id:
        if current_user.role not in ["Doctor", "Admin", "Nurse"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update progress and status
    for goal in plan.goals:
        goal.progress = calculate_goal_progress(goal)
        goal.status = update_goal_status(goal)
    
    plan.progress = calculate_plan_progress(plan)
    db.commit()
    
    return plan

@router.post("/{plan_id}/goals", response_model=GoalResponse)
async def add_goal(
    plan_id: str,
    goal: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a goal to a care plan"""
    plan = db.query(CarePlan).filter(CarePlan.id == plan_id).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Care plan not found")
    
    new_goal = CarePlanGoal(
        id=str(uuid.uuid4()),
        care_plan_id=plan_id,
        category=goal.category,
        title=goal.title,
        description=goal.description,
        target_date=goal.target_date,
        priority=goal.priority
    )
    
    db.add(new_goal)
    
    # Add tasks
    for task_data in goal.tasks or []:
        task = CarePlanTask(
            id=str(uuid.uuid4()),
            goal_id=new_goal.id,
            title=task_data.title,
            description=task_data.description,
            frequency=task_data.frequency,
            due_date=task_data.due_date
        )
        db.add(task)
    
    db.commit()
    db.refresh(new_goal)
    
    return db.query(CarePlanGoal).options(
        joinedload(CarePlanGoal.tasks)
    ).filter(CarePlanGoal.id == new_goal.id).first()

@router.post("/goals/{goal_id}/tasks", response_model=TaskResponse)
async def add_task(
    goal_id: str,
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a task to a goal"""
    goal = db.query(CarePlanGoal).filter(CarePlanGoal.id == goal_id).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    new_task = CarePlanTask(
        id=str(uuid.uuid4()),
        goal_id=goal_id,
        title=task.title,
        description=task.description,
        frequency=task.frequency,
        due_date=task.due_date
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return new_task

@router.post("/tasks/{task_id}/complete")
async def complete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a task as completed"""
    task = db.query(CarePlanTask).filter(CarePlanTask.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.is_completed = True
    task.last_completed_at = datetime.utcnow()
    
    # Update goal progress
    goal = task.goal
    goal.progress = calculate_goal_progress(goal)
    goal.status = update_goal_status(goal)
    
    # Update plan progress
    plan = goal.care_plan
    plan.progress = calculate_plan_progress(plan)
    plan.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Task completed", "goal_progress": goal.progress, "plan_progress": plan.progress}

@router.post("/tasks/{task_id}/uncomplete")
async def uncomplete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a task as not completed"""
    task = db.query(CarePlanTask).filter(CarePlanTask.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.is_completed = False
    task.last_completed_at = None
    
    # Update goal progress
    goal = task.goal
    goal.progress = calculate_goal_progress(goal)
    goal.status = update_goal_status(goal)
    
    # Update plan progress
    plan = goal.care_plan
    plan.progress = calculate_plan_progress(plan)
    plan.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Task marked incomplete", "goal_progress": goal.progress, "plan_progress": plan.progress}

@router.delete("/{plan_id}")
async def delete_care_plan(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a care plan and all its goals/tasks"""
    plan = db.query(CarePlan).filter(CarePlan.id == plan_id).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Care plan not found")
    
    # Verify ownership
    if current_user.patient_profile and plan.patient_id != current_user.patient_profile.id:
        if current_user.role not in ["Doctor", "Admin"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(plan)
    db.commit()
    
    return {"message": "Care plan deleted"}

# --- Doctor/Admin Endpoints ---

@router.post("/patient/{patient_id}", response_model=CarePlanResponse)
async def create_care_plan_for_patient(
    patient_id: str,
    plan: CarePlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a care plan for a specific patient (doctor only)"""
    if current_user.role not in ["Doctor", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    new_plan = CarePlan(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        doctor_id=current_user.id,
        title=plan.title,
        description=plan.description,
        target_end_date=plan.target_end_date
    )
    
    db.add(new_plan)
    
    # Add goals and tasks
    for goal_data in plan.goals or []:
        goal = CarePlanGoal(
            id=str(uuid.uuid4()),
            care_plan_id=new_plan.id,
            category=goal_data.category,
            title=goal_data.title,
            description=goal_data.description,
            target_date=goal_data.target_date,
            priority=goal_data.priority
        )
        db.add(goal)
        
        for task_data in goal_data.tasks or []:
            task = CarePlanTask(
                id=str(uuid.uuid4()),
                goal_id=goal.id,
                title=task_data.title,
                description=task_data.description,
                frequency=task_data.frequency,
                due_date=task_data.due_date
            )
            db.add(task)
    
    db.commit()
    
    return db.query(CarePlan).options(
        joinedload(CarePlan.goals).joinedload(CarePlanGoal.tasks)
    ).filter(CarePlan.id == new_plan.id).first()

@router.get("/patient/{patient_id}/all", response_model=List[CarePlanSummary])
async def get_patient_care_plans(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all care plans for a patient (doctor/admin only)"""
    if current_user.role not in ["Doctor", "Admin", "Nurse"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    plans = db.query(CarePlan).options(
        joinedload(CarePlan.goals)
    ).filter(CarePlan.patient_id == patient_id).order_by(CarePlan.created_at.desc()).all()
    
    return [
        CarePlanSummary(
            id=p.id,
            title=p.title,
            status=p.status,
            progress=calculate_plan_progress(p),
            goals_count=len(p.goals),
            goals_completed=sum(1 for g in p.goals if calculate_goal_progress(g) >= 100),
            created_at=p.created_at
        )
        for p in plans
    ]
