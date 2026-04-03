from pydantic import BaseModel
from pydantic import BaseModel, constr

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    phoneNum:str
    # phoneNum: constr(min_length=10, max_length=10)
