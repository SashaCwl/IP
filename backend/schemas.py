#imports
from pydantic import BaseModel

#schema for user registration requests
class UserCreate(BaseModel):
    email: str
    name: str
    password: str

#schema for user login requests
class UserLogin(BaseModel):
    email: str
    password: str
