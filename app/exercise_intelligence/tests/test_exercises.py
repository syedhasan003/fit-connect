def test_exercises_seeded(db_session):
    from app.exercise_intelligence.models.exercise import Exercise

    exercises = db_session.query(Exercise).all()
    assert len(exercises) > 0


def test_variations_linked(db_session):
    from app.exercise_intelligence.models.exercise import Exercise

    variations = db_session.query(Exercise).filter_by(is_variation=True).all()
    for v in variations:
        assert v.base_exercise_id is not None
