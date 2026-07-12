from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator


class CreateNotaRequest(BaseModel):
    cliente_id: UUID
    contenido: Optional[str] = None
    contenido_sensible: Optional[str] = None

    @model_validator(mode="after")
    def check_at_least_one_content(self) -> "CreateNotaRequest":
        if not self.contenido and not self.contenido_sensible:
            raise ValueError("Debe proporcionar contenido general o contenido sensible")
        return self


class NotaResponse(BaseModel):
    id: UUID
    cliente_id: UUID
    contenido: Optional[str] = None
    contenido_sensible: Optional[str] = None
    autor_id: UUID
    autor_nombre: Optional[str] = None
    autor_email: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
