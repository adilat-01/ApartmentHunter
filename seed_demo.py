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

# Static demo photos in frontend/public/mock_images/ (see frontend/src/mock_front.ts)
def _mock_img(filename: str) -> str:
    return f"/mock_images/{filename}"


_MOCK = {
    "image1": _mock_img("image1.jpg"),
    "image2": _mock_img("image2.jpg"),
    "image3": _mock_img("image3.jpg"),
    "image4": _mock_img("image4.jpg"),
    "image5": _mock_img("image5.jpg"),
}

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
                "url": _MOCK["image2"],
                "label": "rothschild-tel-aviv.jpg",
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
                "url": _MOCK["image3"],
                "label": "givatayim.jpg",
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
                "url": _MOCK["image4"],
                "label": "neve-tzedek-1.jpg",
            },
            {
                "url": _MOCK["image5"],
                "label": "neve-tzedek-2.jpg",
            },
            {
                "url": _MOCK["image1"],
                "label": "neve-tzedek-3.jpg",
            },
        ],
    },
]


def repair_legacy_demo_images(db: Session) -> int:
    """Normalize demo listing photos to unique /mock_images/ assets."""
    updated = 0

    for area_fragment, url in (
        ("רוטשילד", _MOCK["image2"]),
        ("גבעתיים", _MOCK["image3"]),
    ):
        apartments = (
            db.query(Apartment)
            .filter(Apartment.extracted_data_json.contains(area_fragment))
            .all()
        )
        for apt in apartments:
            images = (
                db.query(ApartmentImage)
                .filter(ApartmentImage.apartment_id == apt.id)
                .order_by(ApartmentImage.id)
                .all()
            )
            if not images:
                continue
            if images[0].external_url != url:
                images[0].external_url = url
                images[0].stored_filename = "external"
                updated += 1
            for extra in images[1:]:
                db.delete(extra)
                updated += 1

    neve_urls = [_MOCK["image4"], _MOCK["image5"], _MOCK["image1"]]
    neve_apartments = (
        db.query(Apartment)
        .filter(Apartment.extracted_data_json.contains("נווה צדק"))
        .all()
    )
    for apt in neve_apartments:
        images = (
            db.query(ApartmentImage)
            .filter(ApartmentImage.apartment_id == apt.id)
            .order_by(ApartmentImage.id)
            .all()
        )
        for idx, img in enumerate(images[: len(neve_urls)]):
            if img.external_url != neve_urls[idx]:
                img.external_url = neve_urls[idx]
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
