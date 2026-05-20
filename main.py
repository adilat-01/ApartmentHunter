import json
import os
import shutil
import uuid
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from google import genai
from google.genai import types
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy.orm import Session

from auth import (
    CurrentUser,
    create_access_token,
    hash_password,
    verify_password,
)
from database import (
    Apartment,
    ApartmentImage,
    User,
    get_db,
    image_response_url,
    init_db,
    parse_extracted_data,
)
from seed_demo import create_isolated_demo_session, repair_legacy_demo_images

load_dotenv()

app = FastAPI(title="ApartmentHunter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_ROOT = Path("uploads")
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_IMAGES_PER_APARTMENT = 5

_gemini_httpx = httpx.Client(verify=False)


def _get_gemini_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured. Set it in your .env file.",
        )
    return genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(httpx_client=_gemini_httpx),
    )


@app.on_event("startup")
def on_startup():
    init_db()
    from database import SessionLocal

    db = SessionLocal()
    try:
        repair_legacy_demo_images(db)
    finally:
        db.close()


# --- Pydantic schemas ---


def _default_criteria_values() -> dict[str, str]:
    return {
        "protected_space": "ללא",
        "pet_friendly": "לא",
        "outdoor_space": "לא",
        "furnished_status": "לא",
    }


def _coerce_optional_int(value: Any) -> int | None:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, str):
        stripped = value.strip().replace(",", "")
        if not stripped:
            return None
        try:
            return int(float(stripped))
        except ValueError:
            return None
    if isinstance(value, float):
        if value != value:  # NaN
            return None
        return int(value)
    if isinstance(value, int):
        return value
    return None


def _coerce_optional_float(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, str):
        stripped = value.strip().replace(",", "")
        if not stripped:
            return None
        try:
            return float(stripped)
        except ValueError:
            return None
    if isinstance(value, (int, float)):
        if value != value:
            return None
        return float(value)
    return None


def _coerce_str(value: Any, default: str = "") -> str:
    if value is None:
        return default
    return str(value).strip()


def _normalize_request_keys(data: Any, key_map: dict[str, str]) -> Any:
    if not isinstance(data, dict):
        return data
    out = dict(data)
    for old_key, new_key in key_map.items():
        if old_key in out and new_key not in out:
            out[new_key] = out.pop(old_key)
    return out


def _normalize_extracted_data_dict(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        return {}
    raw = _normalize_request_keys(
        data,
        {
            "contact_name": "contactName",
            "contact_phone": "contactPhone",
            "move_in_date": "moveInDate",
            "criteria_values": "criteriaValues",
        },
    )
    return {
        "price": raw.get("price", 0),
        "rooms": raw.get("rooms", 2.0),
        "area": raw.get("area", ""),
        "contactName": raw.get("contactName", ""),
        "contactPhone": raw.get("contactPhone", ""),
        "moveInDate": raw.get("moveInDate", ""),
        "criteriaValues": raw.get("criteriaValues", {}),
    }


def _normalize_manual_dict(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        return {}
    raw = _normalize_request_keys(
        data,
        {
            "move_in_date": "moveInDate",
            "contact_name": "contactName",
            "contact_phone": "contactPhone",
        },
    )
    return {k: v for k, v in raw.items() if v is not None and v != ""}


def _normalize_criteria_values(raw: Any) -> dict[str, str]:
    out = _default_criteria_values()
    if not isinstance(raw, dict):
        return out
    for key, val in raw.items():
        if val is not None and str(val).strip():
            out[str(key)] = str(val).strip()
    return out


class CriteriaValuesSchema(BaseModel):
    protected_space: str = Field(
        description="Must be exactly: 'ממ\"ד', 'מקלט', or 'ללא'"
    )
    pet_friendly: str = Field(description="Must be exactly: 'כן' or 'לא'")
    outdoor_space: str = Field(description="Must be exactly: 'כן' or 'לא'")
    furnished_status: str = Field(
        description="Must be exactly: 'כן', 'חלקי', or 'לא'"
    )


class ExtractedDataSchema(BaseModel):
    price: int = Field(description="Monthly rent as an integer")
    rooms: float = Field(description="Number of rooms, e.g. 2.5 or 3")
    area: str = Field(description="City, town, or neighborhood")
    contactName: str = Field(default="", description="Contact person if mentioned")
    contactPhone: str = Field(default="", description="Phone number if mentioned")
    moveInDate: str = Field(description="Move-in date as YYYY-MM")
    criteriaValues: CriteriaValuesSchema


class AnalysisResponse(BaseModel):
    status: str
    extractedData: ExtractedDataSchema | dict
    userNotes: str


class PostPayload(BaseModel):
    text: str


class RegisterPayload(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)


class LoginPayload(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    user_id: int
    is_demo_session: bool = False


class UserResponse(BaseModel):
    id: int
    username: str


class ExtractedDataPayload(BaseModel):
    """Normalized apartment fields stored in extracted_data_json."""

    model_config = ConfigDict(extra="ignore")

    price: int = 0
    rooms: float = 2.0
    area: str = ""
    contactName: str = ""
    contactPhone: str = ""
    moveInDate: str = "2026-07"
    criteriaValues: dict[str, str] = Field(default_factory=_default_criteria_values)

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data: Any) -> Any:
        if isinstance(data, ExtractedDataPayload):
            return data
        return _normalize_extracted_data_dict(data)

    @field_validator("price", mode="before")
    @classmethod
    def validate_price(cls, value: Any) -> int:
        return _coerce_optional_int(value) or 0

    @field_validator("rooms", mode="before")
    @classmethod
    def validate_rooms(cls, value: Any) -> float:
        return _coerce_optional_float(value) or 2.0

    @field_validator("area", "contactName", "contactPhone", mode="before")
    @classmethod
    def validate_text_fields(cls, value: Any) -> str:
        return _coerce_str(value)

    @field_validator("moveInDate", mode="before")
    @classmethod
    def validate_move_in(cls, value: Any) -> str:
        cleaned = _coerce_str(value)
        return cleaned or "2026-07"

    @field_validator("criteriaValues", mode="before")
    @classmethod
    def validate_criteria(cls, value: Any) -> dict[str, str]:
        return _normalize_criteria_values(value)


class ApartmentCreatePayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    originalText: str = ""
    extractedData: ExtractedDataPayload | dict[str, Any] = Field(
        default_factory=ExtractedDataPayload
    )
    userNotes: str = ""
    status: str = "חדש"
    createdAt: str | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        out = _normalize_request_keys(
            data,
            {
                "original_text": "originalText",
                "extracted_data": "extractedData",
                "user_notes": "userNotes",
                "created_at": "createdAt",
            },
        )
        if "extractedData" in out:
            out["extractedData"] = _normalize_extracted_data_dict(out["extractedData"])
        return out

    @field_validator("originalText", "userNotes", "status", mode="before")
    @classmethod
    def validate_trimmed_strings(cls, value: Any) -> str:
        return _coerce_str(value)

    @field_validator("extractedData", mode="before")
    @classmethod
    def validate_extracted_data(cls, value: Any) -> ExtractedDataPayload:
        if isinstance(value, ExtractedDataPayload):
            return value
        return ExtractedDataPayload.model_validate(value or {})

    @field_validator("createdAt", mode="before")
    @classmethod
    def validate_created_at(cls, value: Any) -> str | None:
        if value is None:
            return None
        cleaned = _coerce_str(value)
        return cleaned or None


class ManualApartmentFields(BaseModel):
    model_config = ConfigDict(extra="ignore")

    city: str = ""
    price: int | None = None
    rooms: float | None = None
    moveInDate: str = ""
    contactName: str = ""
    contactPhone: str = ""
    protected_space: str = ""
    pet_friendly: str = ""
    outdoor_space: str = ""
    furnished_status: str = ""

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data: Any) -> Any:
        if isinstance(data, ManualApartmentFields):
            return data
        return _normalize_manual_dict(data)

    @field_validator("price", mode="before")
    @classmethod
    def validate_price(cls, value: Any) -> int | None:
        return _coerce_optional_int(value)

    @field_validator("rooms", mode="before")
    @classmethod
    def validate_rooms(cls, value: Any) -> float | None:
        return _coerce_optional_float(value)

    @field_validator(
        "city",
        "moveInDate",
        "contactName",
        "contactPhone",
        "protected_space",
        "pet_friendly",
        "outdoor_space",
        "furnished_status",
        mode="before",
    )
    @classmethod
    def validate_optional_strings(cls, value: Any) -> str:
        return _coerce_str(value)


class ApartmentFromSourcesPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    postText: str = ""
    manual: ManualApartmentFields | dict[str, Any] | None = None
    userNotes: str = ""
    status: str = "חדש"
    createdAt: str | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        out = _normalize_request_keys(
            data,
            {
                "post_text": "postText",
                "user_notes": "userNotes",
                "created_at": "createdAt",
            },
        )
        if "manual" in out and out["manual"] is not None:
            out["manual"] = _normalize_manual_dict(out["manual"])
        return out

    @field_validator("postText", "userNotes", "status", mode="before")
    @classmethod
    def validate_trimmed_strings(cls, value: Any) -> str:
        return _coerce_str(value)

    @field_validator("manual", mode="before")
    @classmethod
    def validate_manual(cls, value: Any) -> ManualApartmentFields | None:
        if value is None:
            return None
        if isinstance(value, ManualApartmentFields):
            return value
        if isinstance(value, dict):
            return ManualApartmentFields.model_validate(value)
        return ManualApartmentFields()

    @field_validator("createdAt", mode="before")
    @classmethod
    def validate_created_at(cls, value: Any) -> str | None:
        if value is None:
            return None
        cleaned = _coerce_str(value)
        return cleaned or None


class ApartmentUpdatePayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: str | None = None
    userNotes: str | None = None
    extractedData: ExtractedDataPayload | dict[str, Any] | None = None

    @field_validator("status", "userNotes", mode="before")
    @classmethod
    def validate_optional_strings(cls, value: Any) -> str | None:
        if value is None:
            return None
        cleaned = _coerce_str(value)
        return cleaned or None

    @field_validator("extractedData", mode="before")
    @classmethod
    def validate_extracted_data(
        cls, value: Any
    ) -> ExtractedDataPayload | None:
        if value is None:
            return None
        if isinstance(value, ExtractedDataPayload):
            return value
        return ExtractedDataPayload.model_validate(value or {})


class ImageResponse(BaseModel):
    id: int
    apartmentId: int
    originalFilename: str
    url: str


class ApartmentResponse(BaseModel):
    id: str
    createdAt: str
    status: str
    originalText: str
    extractedData: dict
    userNotes: str
    images: list[ImageResponse] = Field(default_factory=list)


def apartment_to_response(apt: Apartment, base_url: str = "") -> dict:
    images = [
        {
            "id": img.id,
            "apartmentId": img.apartment_id,
            "originalFilename": img.original_filename,
            "url": image_response_url(img, base_url),
        }
        for img in apt.images
    ]
    return {
        "id": str(apt.id),
        "createdAt": apt.created_at,
        "status": apt.status,
        "originalText": apt.original_text,
        "extractedData": parse_extracted_data(apt),
        "userNotes": apt.user_notes,
        "images": images,
    }


def get_user_apartment(
    db: Session, user_id: int, apartment_id: int
) -> Apartment:
    apt = (
        db.query(Apartment)
        .filter(Apartment.id == apartment_id, Apartment.user_id == user_id)
        .first()
    )
    if apt is None:
        raise HTTPException(status_code=404, detail="Apartment not found")
    return apt


def user_upload_dir(user_id: int, apartment_id: int) -> Path:
    path = UPLOAD_ROOT / f"user_{user_id}" / f"apt_{apartment_id}"
    path.mkdir(parents=True, exist_ok=True)
    return path


# --- Public routes ---


@app.get("/")
def read_root():
    return {
        "status": "running",
        "service": "ApartmentHunter API with Gemini Active",
    }


@app.post("/api/auth/register", response_model=AuthResponse)
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    username = payload.username.strip()
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(username=username, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.username)
    return AuthResponse(
        access_token=token, username=user.username, user_id=user.id
    )


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username.strip()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(user.id, user.username)
    return AuthResponse(
        access_token=token, username=user.username, user_id=user.id
    )


@app.post("/api/auth/demo", response_model=AuthResponse)
def login_demo(db: Session = Depends(get_db)):
    """Instant access — provisions a private temp demo user + seed data."""
    user = create_isolated_demo_session(db)
    token = create_access_token(user.id, user.username)
    return AuthResponse(
        access_token=token,
        username=user.username,
        user_id=user.id,
        is_demo_session=True,
    )


@app.get("/api/auth/me", response_model=UserResponse)
def me(current_user: CurrentUser):
    return UserResponse(id=current_user.id, username=current_user.username)


# --- Protected: analyze & apartments ---


@app.post("/api/analyze", response_model=AnalysisResponse)
def analyze_post(payload: PostPayload, current_user: CurrentUser):
    _ = current_user
    try:
        parsed_data = _run_gemini_extract(payload.text)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "status": "success",
        "extractedData": parsed_data,
        "userNotes": "פוענח אוטומטית ובזמן אמת על ידי מודל Gemini 2.5 Flash!",
    }


@app.get("/api/apartments")
def list_apartments(current_user: CurrentUser, db: Session = Depends(get_db)):
    apartments = (
        db.query(Apartment)
        .filter(Apartment.user_id == current_user.id)
        .order_by(Apartment.id.desc())
        .all()
    )
    return [apartment_to_response(apt) for apt in apartments]


def _run_gemini_extract(post_text: str) -> dict:
    prompt = f"""
You are an expert real estate data extraction assistant.
Analyze the following Hebrew Facebook post about an apartment and extract all structured data.

Guidelines:
- Current year is 2026.
- If moveInDate mentions June (1.6), output '2026-06'. If July, output '2026-07', etc.
- If criteria values are unclear, use context to map them to the allowed strict choices.

Post text:
"{post_text}"
"""
    response = _get_gemini_client().models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ExtractedDataSchema,
            temperature=0.1,
        ),
    )
    return json.loads(response.text)


def _merge_manual_with_extracted(
    manual: ManualApartmentFields | None, ai: dict | None
) -> dict:
    base = ai or {
        "price": 0,
        "rooms": 2,
        "area": "",
        "moveInDate": "2026-07",
        "contactName": "",
        "contactPhone": "",
        "criteriaValues": {
            "protected_space": "ללא",
            "pet_friendly": "לא",
            "outdoor_space": "לא",
            "furnished_status": "לא",
        },
    }
    criteria = dict(base.get("criteriaValues") or {})
    m = manual or ManualApartmentFields()

    if m.protected_space:
        criteria["protected_space"] = m.protected_space
    if m.pet_friendly:
        criteria["pet_friendly"] = m.pet_friendly
    if m.outdoor_space:
        criteria["outdoor_space"] = m.outdoor_space
    if m.furnished_status:
        criteria["furnished_status"] = m.furnished_status

    base_price = _coerce_optional_int(base.get("price")) or 0
    base_rooms = _coerce_optional_float(base.get("rooms")) or 2.0

    return {
        "price": m.price if m.price is not None else base_price,
        "rooms": m.rooms if m.rooms is not None else base_rooms,
        "area": m.city.strip() or _coerce_str(base.get("area")),
        "contactName": m.contactName.strip() or _coerce_str(base.get("contactName")),
        "contactPhone": m.contactPhone.strip() or _coerce_str(base.get("contactPhone")),
        "moveInDate": m.moveInDate.strip()
        or _coerce_str(base.get("moveInDate"), "2026-07"),
        "criteriaValues": criteria,
    }


@app.post("/api/apartments")
def create_apartment(
    payload: ApartmentCreatePayload,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    from datetime import date

    extracted = (
        payload.extractedData.model_dump()
        if isinstance(payload.extractedData, ExtractedDataPayload)
        else ExtractedDataPayload.model_validate(payload.extractedData).model_dump()
    )

    apt = Apartment(
        user_id=current_user.id,
        created_at=payload.createdAt or date.today().isoformat(),
        status=payload.status or "חדש",
        original_text=payload.originalText or "",
        extracted_data_json=json.dumps(extracted, ensure_ascii=False),
        user_notes=payload.userNotes or "",
    )
    db.add(apt)
    db.commit()
    db.refresh(apt)
    return apartment_to_response(apt)


@app.post("/api/apartments/from-sources")
def create_apartment_from_sources(
    payload: ApartmentFromSourcesPayload,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Analyze optional Facebook post and merge with manual fields (manual wins)."""
    from datetime import date

    post = payload.postText.strip()
    manual = payload.manual

    if not post and not (manual and manual.city.strip()):
        raise HTTPException(
            status_code=400,
            detail="Provide a Facebook post and/or manual city/area",
        )

    ai_data = None
    ai_notes = ""
    if post:
        try:
            ai_data = _run_gemini_extract(post)
            ai_notes = "פוענח אוטומטית ובזמן אמת על ידי מודל Gemini 2.5 Flash!"
        except Exception as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    extracted = _merge_manual_with_extracted(manual, ai_data)
    if not extracted.get("area"):
        raise HTTPException(status_code=400, detail="City/area is required")

    user_notes = (payload.userNotes or "").strip() or ai_notes
    original_text = post or f"הוזן ידנית: {extracted['area']}"

    apt = Apartment(
        user_id=current_user.id,
        created_at=payload.createdAt or date.today().isoformat(),
        status=payload.status,
        original_text=original_text,
        extracted_data_json=json.dumps(extracted, ensure_ascii=False),
        user_notes=user_notes,
    )
    db.add(apt)
    db.commit()
    db.refresh(apt)
    return apartment_to_response(apt)


@app.put("/api/apartments/{apartment_id}")
def update_apartment(
    apartment_id: int,
    payload: ApartmentUpdatePayload,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    apt = get_user_apartment(db, current_user.id, apartment_id)

    if payload.status is not None:
        apt.status = payload.status
    if payload.userNotes is not None:
        apt.user_notes = payload.userNotes
    if payload.extractedData is not None:
        extracted = (
            payload.extractedData.model_dump()
            if isinstance(payload.extractedData, ExtractedDataPayload)
            else ExtractedDataPayload.model_validate(payload.extractedData).model_dump()
        )
        apt.extracted_data_json = json.dumps(extracted, ensure_ascii=False)

    db.commit()
    db.refresh(apt)
    return apartment_to_response(apt)


@app.delete("/api/apartments/{apartment_id}")
def delete_apartment(
    apartment_id: int,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    apt = get_user_apartment(db, current_user.id, apartment_id)

    upload_dir = user_upload_dir(current_user.id, apartment_id)
    if upload_dir.exists():
        shutil.rmtree(upload_dir)

    db.delete(apt)
    db.commit()
    return {"status": "deleted"}


# --- Protected: images ---


@app.post("/api/apartments/{apartment_id}/images", response_model=ImageResponse)
async def upload_apartment_image(
    apartment_id: int,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
):
    apt = get_user_apartment(db, current_user.id, apartment_id)

    if len(apt.images) >= MAX_IMAGES_PER_APARTMENT:
        raise HTTPException(
            status_code=400,
            detail="Apartment can have at most 5 images",
        )

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, WebP, and GIF images are allowed",
        )

    contents = await file.read()
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image must be under 10 MB")

    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        ext = ".jpg"

    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest_dir = user_upload_dir(current_user.id, apartment_id)
    dest_path = dest_dir / stored_name
    dest_path.write_bytes(contents)

    image = ApartmentImage(
        apartment_id=apt.id,
        user_id=current_user.id,
        stored_filename=stored_name,
        original_filename=file.filename or stored_name,
    )
    db.add(image)
    db.commit()
    db.refresh(image)

    return {
        "id": image.id,
        "apartmentId": image.apartment_id,
        "originalFilename": image.original_filename,
        "url": f"/api/images/{image.id}",
    }


@app.get("/api/images/{image_id}")
def serve_image(
    image_id: int,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    image = (
        db.query(ApartmentImage)
        .filter(
            ApartmentImage.id == image_id,
            ApartmentImage.user_id == current_user.id,
        )
        .first()
    )
    if image is None:
        raise HTTPException(status_code=404, detail="Image not found")

    if image.external_url:
        raise HTTPException(
            status_code=400,
            detail="External demo images are served directly by URL",
        )

    file_path = (
        user_upload_dir(current_user.id, image.apartment_id)
        / image.stored_filename
    )
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Image file missing on disk")

    return FileResponse(file_path)


@app.delete("/api/apartments/{apartment_id}/images/{image_id}")
def delete_apartment_image(
    apartment_id: int,
    image_id: int,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    get_user_apartment(db, current_user.id, apartment_id)

    image = (
        db.query(ApartmentImage)
        .filter(
            ApartmentImage.id == image_id,
            ApartmentImage.apartment_id == apartment_id,
            ApartmentImage.user_id == current_user.id,
        )
        .first()
    )
    if image is None:
        raise HTTPException(status_code=404, detail="Image not found")

    if not image.external_url:
        file_path = (
            user_upload_dir(current_user.id, apartment_id) / image.stored_filename
        )
        if file_path.is_file():
            file_path.unlink()

    db.delete(image)
    db.commit()
    return {"status": "deleted"}
