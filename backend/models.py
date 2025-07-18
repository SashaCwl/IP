#imports
from sqlalchemy import Column, Integer, String
from database import Base
from sqlalchemy import ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship

#model representing registered users
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)

#model representing the users responses to interview questions
class QuestionResponse(Base):
    __tablename__ = "question_responses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_role = Column(String)
    question_text = Column(Text)
    user_answer = Column(Text)
    score = Column(Integer)
    feedback = Column(Text)
    user = relationship("User", back_populates="responses")
    User.responses = relationship("QuestionResponse", back_populates="user")
    subtopic = Column(String)

#model representing tracking of the users job interests 
class UserJobInterest(Base):
    __tablename__ = "user_job_interests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_role = Column(String)
    user = relationship("User", back_populates="job_interests")
    subtopic = Column(String)
    User.job_interests = relationship("UserJobInterest", back_populates="user")

