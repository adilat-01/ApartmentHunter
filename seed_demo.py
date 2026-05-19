"""
Seed fictional benchmark apartments for the public demo account.

Run standalone:  python seed_demo.py
Also invoked on API startup via ensure_demo_user().
"""

from __future__ import annotations

import json
import os

from sqlalchemy.orm import Session

from auth import hash_password
from database import Apartment, ApartmentImage, SessionLocal, User, init_db

DEMO_USERNAME = "demo@apartmenthunter.com"
DEMO_PASSWORD = os.environ.get("DEMO_ACCOUNT_PASSWORD", "demo-hunter-2026")

# Unsplash — copyright-free placeholders (interiors / architecture)
_UNSPLASH = "https://images.unsplash.com"
_IMG = lambda photo_id: (
    f"{_UNSPLASH}/{photo_id}?auto=format&fit=crop&w=1200&q=80"
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
                "url": _IMG("photo-1522708323590-d24dbb6b0267"),
                "label": "rothschild-living-room.jpg",
            },
            {
                "url": _IMG("photo-1502672260266-1c1ef14d934b"),
                "label": "rothschild-sofa.jpg",
            },
            {
                "url": _IMG("photo-1484154218962-a197022b5858"),
                "label": "rothschild-kitchen.jpg",
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
                "url": _IMG("photo-1560448204-e02f11c3d0e2"),
                "label": "givatayim-bedroom.jpg",
            },
            {
                "url": _IMG("photo-1493809842364-78817add7ffb"),
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
                "url": _IMG("photo-1600596542815-ffad4c1539a9"),
                "label": "neve-tzedek-exterior.jpg",
            },
            {
                "url": _IMG("photo-1600607687939-ce8a6c25118c"),
                "label": "neve-tzedek-bedroom.jpg",
            },
            {
                "url": _IMG("photo-1600566753190-17f0baa2a6c3"),
                "label": "neve-tzedek-balcony.jpg",
            },
        ],
    },
]


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


def run_seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        user = ensure_demo_user(db)
        apt_count = db.query(Apartment).filter(Apartment.user_id == user.id).count()
        img_count = (
            db.query(ApartmentImage).filter(ApartmentImage.user_id == user.id).count()
        )
        print(f"Demo account ready: {DEMO_USERNAME}")
        print(f"  Apartments: {apt_count}")
        print(f"  Images: {img_count}")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
