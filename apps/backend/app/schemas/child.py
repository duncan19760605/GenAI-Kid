from pydantic import BaseModel, Field


class ChildCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    age: int = Field(ge=3, le=8)
    primary_language: str = "zh"
    learning_languages: list[str] = ["en"]
    character_id: str = "bear"


class ChildUpdate(BaseModel):
    name: str | None = None
    age: int | None = Field(default=None, ge=3, le=8)
    primary_language: str | None = None
    learning_languages: list[str] | None = None
    character_id: str | None = None


class ChildResponse(BaseModel):
    id: str
    name: str
    age: int
    primary_language: str
    learning_languages: list[str]
    character_id: str
    login_code: str | None

    model_config = {"from_attributes": True}
