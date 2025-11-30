# app/database/seed.py
from app.database.session import SessionLocal
from app.models.gym import Gym
import json

def seed_gyms():
    db = SessionLocal()
    try:
        existing = db.query(Gym).first()
        if existing:
            return

        gyms = [
            Gym(
                name="Muscle Factory",
                city="Dubai",
                locality="JLT",
                monthly_price=299.0,
                yearly_price=2999.0,
                daily_pass_price=35.0,
                description="Premium bodybuilding gym with elite trainers",
                amenities=["Sauna", "Steam", "Crossfit rig", "Free weights"],
                images=["muscle1.jpg", "muscle2.jpg"],
                gallery_images=["muscle_g1.jpg", "muscle_g2.jpg"],
                membership_options=["Monthly", "Quarterly", "Yearly"],
                equipment_list=["Bench press", "Squat rack", "Dumbbells"],
                classes_available=["Bodybuilding", "CrossFit"],
                personal_training_available=True,
                is_popular=True,
                rating=4.7,
                review_count=153,
                cover_image="muscle_cover.jpg",
                video_url="",
                latitude=25.0700,
                longitude=55.1420,
                opening_hours={
                    "monday": "06:00-23:00",
                    "tuesday": "06:00-23:00",
                    "wednesday": "06:00-23:00",
                    "thursday": "06:00-23:00",
                    "friday": "06:00-23:00",
                    "saturday": "06:00-23:00",
                    "sunday": "08:00-20:00"
                }
            ),
            Gym(
                name="Zen Yoga Studio",
                city="Dubai",
                locality="Marina",
                monthly_price=199.0,
                yearly_price=1999.0,
                daily_pass_price=25.0,
                description="Calm, premium yoga & recovery studio with sauna and classes.",
                amenities=["Yoga mats", "Steam", "Sauna"],
                images=["zen1.jpg", "zen2.jpg"],
                gallery_images=["zen_g1.jpg"],
                membership_options=["Monthly", "Yearly"],
                equipment_list=["Mats", "Blocks"],
                classes_available=["Vinyasa", "Yin", "Restorative"],
                personal_training_available=False,
                is_popular=False,
                rating=4.9,
                review_count=84,
                cover_image="zen_cover.jpg",
                video_url="",
                latitude=25.0770,
                longitude=55.1380,
                opening_hours={
                    "monday": "07:00-21:00",
                    "tuesday": "07:00-21:00",
                    "wednesday": "07:00-21:00",
                    "thursday": "07:00-21:00",
                    "friday": "08:00-20:00",
                    "saturday": "08:00-20:00",
                    "sunday": "09:00-18:00"
                }
            ),
        ]

        db.add_all(gyms)
        db.commit()
    finally:
        db.close()
