import os
import uuid
from app.models.user_file import UserFile

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_user_file(db, user_id, uploaded_file, category="medical"):
    ext = uploaded_file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(uploaded_file.file.read())

    record = UserFile(
        user_id=user_id,
        file_url=file_path,
        file_type="image",
        category=category,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record
