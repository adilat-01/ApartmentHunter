"""
Seed fictional benchmark apartments for the public demo account.

Run standalone:  python seed_demo.py
Also invoked on API startup via ensure_demo_user().
"""

from __future__ import annotations

import json
import os
import secrets

from sqlalchemy.orm import Session

from auth import hash_password
from database import Apartment, ApartmentImage, SessionLocal, User, init_db

DEMO_USERNAME = "demo@apartmenthunter.com"
DEMO_PASSWORD = os.environ.get("DEMO_ACCOUNT_PASSWORD", "demo-hunter-2026")
TEMP_DEMO_PREFIX = "demo_temp_"
TEMP_DEMO_DOMAIN = "@apartmenthunter.com"


def is_temp_demo_username(username: str) -> bool:
    return username.startswith(TEMP_DEMO_PREFIX) and username.endswith(
        TEMP_DEMO_DOMAIN
    )

# Unsplash — stable copyright-free interior placeholders
def _img(photo_id: str) -> str:
    return (
        f"https://images.unsplash.com/{photo_id}"
        "?auto=format&fit=crop&w=800&q=80"
    )


# Verified long-lived photo IDs (interiors / architecture)
_PHOTO_LIVING = "photo-1522771739844-6a9f6d5f14af"
_PHOTO_SOFA = "photo-1502672260266-1c1ef14d934b"
_PHOTO_KITCHEN = "photo-1556912173-46c336c3f1e6"
_PHOTO_BEDROOM = "photo-1522708323590-d24dbb6b0267"
_PHOTO_BALCONY = "photo-1600607687939-ce8a6c25118c"
_PHOTO_EXTERIOR = "photo-1600596542815-ffad4c1539a9"

# Rothschild listing — never use local .jpg filenames; stable Unsplash only
_ROTHSCHILD_UNSPLASH = (
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af"
    "?auto=format&fit=crop&w=600&q=80"
)

DEMO_APARTMENTS: list[dict] = [
    {
        "created_at": "2026-05-08",
        "status": "נקבע סיור",
        "original_text": (
            "Beautiful 3-room in Rothschild — sun-filled living room, renovated kitchen, "
            "2.5 baths, elevator building. 7,400 NIS/month, available July 2026. "
            "Contact: Maya • 050-0000001"
        ),
        "user_notes": "דירת ייחוס לסיור — לבדוק רעש מלכי ישראל בערב.",
        "extracted": {
            "price": 7400,
            "rooms": 3,
            "area": "שדרות רוטשילד, תל אביב",
            "contactName": "מאיה (דמו)",
            "contactPhone": "050-0000001",
            "moveInDate": "2026-07",
            "criteriaValues": {
                "protected_space": "ממ\"ד",
                "pet_friendly": "לא",
                "outdoor_space": "כן",
                "furnished_status": "חלקי",
            },
        },
        "images": [
            {
                "url": _ROTHSCHILD_UNSPLASH,
                "label": "rothschild-living-room",
            },
            {
                "url": _ROTHSCHILD_UNSPLASH,
                "label": "rothschild-sofa",
            },
            {
                "url": _ROTHSCHILD_UNSPLASH,
                "label": "rothschild-kitchen",
            },
        ],
    },
    {
        "created_at": "2026-05-11",
        "status": "יצרנו קשר",
        "original_text": (
            "Charming 2-room in Givatayim — quiet street, open-plan layout, "
            "storage room, pets welcome. 5,900 NIS/month, move-in August 2026. "
            "Contact: Tom • 050-0000002"
        ),
        "user_notes": "מחיר הוגן לגבעתיים — לשאול על חניה בבניין.",
        "extracted": {
            "price": 5900,
            "rooms": 2,
            "area": "גבעתיים",
            "contactName": "תום (דמו)",
            "contactPhone": "050-0000002",
            "moveInDate": "2026-08",
            "criteriaValues": {
                "protected_space": "מקלט",
                "pet_friendly": "כן",
                "outdoor_space": "לא",
                "furnished_status": "לא",
            },
        },
        "images": [
            {
                "url": _img(_PHOTO_BEDROOM),
                "label": "givatayim-bedroom.jpg",
            },
            {
                "url": _img(_PHOTO_LIVING),
                "label": "givatayim-living.jpg",
            },
        ],
    },
    {
        "created_at": "2026-05-14",
        "status": "חדש",
        "original_text": (
            "Designer 4-room in Neve Tzedek — high ceilings, large balcony, "
            "fully furnished, Mamad. 11,200 NIS/month, June 2026 entry. "
            "Contact: Noa • 050-0000003"
        ),
        "user_notes": "חשבון הדגמה — נתונים פיקטיביים לצורך הדגמה בלבד.",
        "extracted": {
            "price": 11200,
            "rooms": 4,
            "area": "נווה צדק, תל אביב",
            "contactName": "נועה (דמו)",
            "contactPhone": "050-0000003",
            "moveInDate": "2026-06",
            "criteriaValues": {
                "protected_space": "ממ\"ד",
                "pet_friendly": "לא",
                "outdoor_space": "כן",
                "furnished_status": "כן",
            },
        },
        "images": [
            {
                "url": _img(_PHOTO_EXTERIOR),
                "label": "neve-tzedek-exterior.jpg",
            },
            {
                "url": _img(_PHOTO_BALCONY),
                "label": "neve-tzedek-bedroom.jpg",
            },
            {
                "url": _img(_PHOTO_SOFA),
                "label": "neve-tzedek-balcony.jpg",
            },
        ],
    },
]


def repair_legacy_rothschild_images(db: Session) -> int:
    """Fix DB rows that still point at broken/local rothschild-*.jpg placeholders."""
    images = (
        db.query(ApartmentImage)
        .filter(ApartmentImage.original_filename.like("%rothschild%"))
        .all()
    )
    updated = 0
    for img in images:
        if img.external_url != _ROTHSCHILD_UNSPLASH:
            img.external_url = _ROTHSCHILD_UNSPLASH
            img.stored_filename = "external"
            updated += 1
    if updated:
        db.commit()
    return updated


def demo_needs_seed(db: Session, user_id: int) -> bool:
    apartment_count = (
        db.query(Apartment).filter(Apartment.user_id == user_id).count()
    )
    if apartment_count == 0:
        return True
    image_count = (
        db.query(ApartmentImage).filter(ApartmentImage.user_id == user_id).count()
    )
    return image_count == 0


def clear_demo_listings(db: Session, user_id: int) -> None:
    """Remove stale demo apartments (e.g. pre-gallery seed) before re-inserting."""
    db.query(Apartment).filter(Apartment.user_id == user_id).delete(
        synchronize_session=False
    )
    db.commit()


def seed_demo_apartments(db: Session, user: User) -> int:
    """Insert benchmark apartments with Unsplash placeholders. Returns count created."""
    created = 0
    for sample in DEMO_APARTMENTS:
        apt = Apartment(
            user_id=user.id,
            created_at=sample["created_at"],
            status=sample["status"],
            original_text=sample["original_text"],
            extracted_data_json=json.dumps(sample["extracted"], ensure_ascii=False),
            user_notes=sample["user_notes"],
        )
        db.add(apt)
        db.flush()

        for image in sample.get("images", []):
            db.add(
                ApartmentImage(
                    apartment_id=apt.id,
                    user_id=user.id,
                    stored_filename="external",
                    original_filename=image["label"],
                    external_url=image["url"],
                )
            )

        created += 1

    db.commit()
    return created


def ensure_demo_user(db: Session) -> User:
    """Legacy shared demo account — kept for manual scripts only."""
    user = db.query(User).filter(User.username == DEMO_USERNAME).first()
    if user is None:
        user = User(
            username=DEMO_USERNAME,
            password_hash=hash_password(DEMO_PASSWORD),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if demo_needs_seed(db, user.id):
        if (
            db.query(Apartment).filter(Apartment.user_id == user.id).count() > 0
        ):
            clear_demo_listings(db, user.id)
        seed_demo_apartments(db, user)

    return user


def create_isolated_demo_session(db: Session) -> User:
    """
    Create a one-off demo user with a fresh copy of benchmark apartments.
    Each beta tester gets an isolated sandbox (no shared state).
    """
    for _ in range(5):
        suffix = secrets.token_hex(8)
        username = f"{TEMP_DEMO_PREFIX}{suffix}{TEMP_DEMO_DOMAIN}"
        if db.query(User).filter(User.username == username).first() is None:
            break
    else:
        raise RuntimeError("Could not allocate unique demo username")

    user = User(
        username=username,
        password_hash=hash_password(secrets.token_urlsafe(32)),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    seed_demo_apartments(db, user)
    return user


def run_seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        user = create_isolated_demo_session(db)
        apt_count = db.query(Apartment).filter(Apartment.user_id == user.id).count()
        img_count = (
            db.query(ApartmentImage).filter(ApartmentImage.user_id == user.id).count()
        )
        print(f"Isolated demo session: {user.username}")
        print(f"  Apartments: {apt_count}")
        print(f"  Images: {img_count}")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
