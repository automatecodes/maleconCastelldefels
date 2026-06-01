"""CRUD de eventos (admin)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.event import Event
from app.schemas.catalog import EventCreate, EventOut

router = APIRouter(prefix="/api/admin/events", tags=["admin:events"],
                   dependencies=[Depends(require_admin)])


@router.get("", response_model=list[EventOut])
def list_events(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.date.desc()).all()


@router.post("", response_model=EventOut, status_code=201)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    event = Event(**payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.put("/{event_id}", response_model=EventOut)
def update_event(event_id: int, payload: EventCreate, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(404, "Evento no encontrado")
    for k, v in payload.model_dump().items():
        setattr(event, k, v)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if event:
        db.delete(event)
        db.commit()
