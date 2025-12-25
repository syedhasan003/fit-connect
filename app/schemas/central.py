from pydantic import BaseModel

class CentralQuestion(BaseModel):
    question: str


class CentralAnswer(BaseModel):
    question: str
    answer: str
