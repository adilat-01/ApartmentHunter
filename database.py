import json
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
    text,
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

DATABASE_URL = "sqlite:///./apartment_hunter.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    apartments = relationship(
        "Apartment", back_populates="owner", cascade="all, delete-orphan"
    )


class Apartment(Base):
    __tablename__ = "apartments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(String(10), nullable=False)
    status = Column(String(64), nullable=False, default="חדש")
    original_text = Column(Text, nullable=False, default="")
    extracted_data_json = Column(Text, nullable=False, default="{}")
    user_notes = Column(Text, nullable=False, default="")

    owner = relationship("User", back_populates="apartments")
    images = relationship(
        "ApartmentImage",
        back_populates="apartment",
        cascade="all, delete-orphan",
    )


class ApartmentImage(Base):
    __tablename__ = "apartment_images"

    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(
        Integer, ForeignKey("apartments.id"), nullable=False, index=True
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    stored_filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    external_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    apartment = relationship("Apartment", back_populates="images")


def _migrate_apartment_images_external_url() -> None:
    with engine.connect() as conn:
        columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(apartment_images)"))
        }
        if "external_url" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE apartment_images "
                    "ADD COLUMN external_url VARCHAR(512)"
                )
            )
            conn.commit()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _migrate_apartment_images_external_url()


def image_response_url(img: "ApartmentImage", base_url: str = "") -> str:
    if img.external_url:
        return img.external_url
    return f"{base_url}/api/images/{img.id}"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def parse_extracted_data(apartment: Apartment) -> dict:
    return json.loads(apartment.extracted_data_json or "{}")
