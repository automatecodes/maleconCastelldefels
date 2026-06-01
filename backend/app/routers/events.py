"""CRUD de eventos (admin) con estado calculado automáticamente por fecha."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.event import Event
from app.schemas.catalog import EventCreate, EventOut

router = APIRouter(prefix="/api/admin/events", tags=["admin:events"],
                   dependencies=[Depends(require_admin)])


def _with_computed_status(event: Event) -> dict:
    """Añade computed_status (próximo/histórico) basado en la fecha."""
    d = EventOut.model_validate(event).model_dump()
    if event.date:
        d["computed_status"] = "histórico" if event.date < date.today() else "próximo"
    else:
        d["computed_status"] = event.status
    return d


@router.get("")
def list_events(db: Session = Depends(get_db)):
    events = db.query(Event).order_by(Event.date.desc()).all()
    return [_with_computed_status(e) for e in events]


@router.post("", status_code=201)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    event = Event(**payload.model_dump())
    # Auto-calcular status si no se indica explícitamente
    if event.date and payload.status in ("proximo", "próximo", ""):
        event.status = "histórico" if event.date < date.today() else "próximo"
    db.add(event)
    db.commit()
    db.refresh(event)
    return _with_computed_status(event)


@router.put("/{event_id}")
def update_event(event_id: int, payload: EventCreate, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(404, "Evento no encontrado")
    for k, v in payload.model_dump().items():
        setattr(event, k, v)
    # Recalcular si fecha cambia
    if event.date:
        event.status = "histórico" if event.date < date.today() else "próximo"
    db.commit()
    db.refresh(event)
    return _with_computed_status(event)


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if event:
        db.delete(event)
        db.commit()
