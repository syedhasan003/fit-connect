from datetime import date
from app.tasks.models.task import Task
from app.tasks.models.enums import TaskType, TaskStatus


def test_task_creation(db_session, test_user):
    task = Task(
        user_id=test_user.id,
        task_type=TaskType.workout,
        scheduled_for=date.today(),
        planned_payload={"exercise_ids": []},
    )

    db_session.add(task)
    db_session.commit()

    assert task.status == TaskStatus.pending


def test_task_completion(db_session, test_user):
    task = Task(
        user_id=test_user.id,
        task_type=TaskType.diet,
        scheduled_for=date.today(),
        planned_payload={"calories": 2200},
        actual_payload={"calories": 1800},
        status=TaskStatus.completed,
    )

    db_session.add(task)
    db_session.commit()

    assert task.actual_payload["calories"] == 1800
