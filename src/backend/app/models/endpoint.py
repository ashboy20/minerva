from typing import Optional
from sqlmodel import Field, SQLModel

class EndpointData(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str
    method: str
    url: str
    description: Optional[str] = None
