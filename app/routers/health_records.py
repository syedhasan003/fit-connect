"""
Health Records endpoints.

Supports upload of files (PDF, images) + structured metadata.
All files are saved to /static/health_records/{user_id}/
"""
import json, os, shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.health_record import HealthRecord

router = APIRouter(prefix="/health-records", tags=["Health Records"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "health_records")

VALID_TYPES = {
    "blood_report", "prescription", "xray", "scan",
    "vaccination", "surgery", "dental", "eye", "doctor_note", "other",
}


def _record_to_dict(r: HealthRecord) -> dict:
    return {
        "id":               r.id,
        "record_date":      r.record_date.isoformat() if r.record_date else None,
        "record_type":      r.record_type,
        "title":            r.title,
        "doctor_name":      r.doctor_name,
        "facility_name":    r.facility_name,
        "notes":            r.notes,
        "file_paths":       json.loads(r.file_paths or "[]"),
        "tags":             json.loads(r.tags or "[]"),
        "extracted_values": json.loads(r.extracted_values or "{}") if r.extracted_values else None,
        "linked_reminder_id": r.linked_reminder_id,
        "is_archived":      bool(r.is_archived),
        "created_at":       r.created_at.isoformat() if r.created_at else None,
    }


# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("/")
def list_records(
    record_type: Optional[str] = None,
    archived: bool = False,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    q = db.query(HealthRecord).filter(
        HealthRecord.user_id == user.id,
        HealthRecord.is_archived == archived,
    )
    if record_type:
        q = q.filter(HealthRecord.record_type == record_type)
    records = q.order_by(HealthRecord.record_date.desc()).all()
    return [_record_to_dict(r) for r in records]


# ── CREATE (with optional file upload) ───────────────────────────────────────

@router.post("/")
async def create_record(
    record_date:    str  = Form(...),
    record_type:    str  = Form(...),
    title:          str  = Form(...),
    doctor_name:    Optional[str] = Form(None),
    facility_name:  Optional[str] = Form(None),
    notes:          Optional[str] = Form(None),
    tags:           Optional[str] = Form("[]"),      # JSON string
    extracted_values: Optional[str] = Form(None),   # JSON string
    linked_reminder_id: Optional[int] = Form(None),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    if record_type not in VALID_TYPES:
        raise HTTPException(400, f"Invalid record_type. Valid: {sorted(VALID_TYPES)}")

    from datetime import date
    try:
        parsed_date = date.fromisoformat(record_date)
    except ValueError:
        raise HTTPException(400, "record_date must be YYYY-MM-DD")

    # Save uploaded files
    saved_paths = []
    if files:
        user_dir = os.path.join(UPLOAD_DIR, str(user.id))
        os.makedirs(user_dir, exist_ok=True)
        for f in files:
            if not f.filename:
                continue
            safe_name = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{f.filename}"
            dest = os.path.join(user_dir, safe_name)
            with open(dest, "wb") as out:
                shutil.copyfileobj(f.file, out)
            saved_paths.append(f"health_records/{user.id}/{safe_name}")

    record = HealthRecord(
        user_id            = user.id,
        record_date        = parsed_date,
        record_type        = record_type,
        title              = title,
        doctor_name        = doctor_name,
        facility_name      = facility_name,
        notes              = notes,
        file_paths         = json.dumps(saved_paths),
        tags               = tags or "[]",
        extracted_values   = extracted_values,
        linked_reminder_id = linked_reminder_id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _record_to_dict(record)


# ── GET ONE ───────────────────────────────────────────────────────────────────

@router.get("/{record_id}")
def get_record(record_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = db.query(HealthRecord).filter(
        HealthRecord.id == record_id, HealthRecord.user_id == user.id
    ).first()
    if not r:
        raise HTTPException(404, "Record not found")
    return _record_to_dict(r)


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.patch("/{record_id}")
def update_record(record_id: int, payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = db.query(HealthRecord).filter(
        HealthRecord.id == record_id, HealthRecord.user_id == user.id
    ).first()
    if not r:
        raise HTTPException(404, "Record not found")

    for field in ["title", "doctor_name", "facility_name", "notes", "extracted_values"]:
        if field in payload:
            setattr(r, field, payload[field])
    if "tags" in payload:
        r.tags = json.dumps(payload["tags"])
    if "is_archived" in payload:
        r.is_archived = payload["is_archived"]

    r.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(r)
    return _record_to_dict(r)


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = db.query(HealthRecord).filter(
        HealthRecord.id == record_id, HealthRecord.user_id == user.id
    ).first()
    if not r:
        raise HTTPException(404, "Record not found")
    db.delete(r)
    db.commit()
    return {"status": "deleted", "id": record_id}


# ── SERVE FILE ────────────────────────────────────────────────────────────────

@router.get("/file/{user_id}/{filename}")
def serve_file(user_id: int, filename: str, user=Depends(get_current_user)):
    if user.id != user_id:
        raise HTTPException(403, "Not allowed")
    path = os.path.join(UPLOAD_DIR, str(user_id), filename)
    if not os.path.exists(path):
        raise HTTPException(404, "File not found")
    return FileResponse(path)
