from datetime import datetime

class TimeProvider:
    """
    Allows deterministic time during tests.
    Default = real UTC time.
    """

    def __init__(self, fixed_now: datetime | None = None):
        self._fixed_now = fixed_now

    def now(self) -> datetime:
        return self._fixed_now or datetime.utcnow()
