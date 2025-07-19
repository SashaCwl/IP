#imports
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json
import re
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from sqlalchemy.orm import Session
from fastapi import Depends
from database import SessionLocal, engine
from models import User, QuestionResponse, UserJobInterest
from schemas import UserCreate, UserLogin
from passlib.hash import bcrypt
from database import Base
from langchain_ollama import OllamaLLM
from collections import defaultdict
from collections import Counter
from sqlalchemy import func
from database import get_db  
from pydantic import BaseModel, Field, constr
from enum import Enum



#app initialisation
app = FastAPI()
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = OllamaLLM(model="llama3", base_url="http://localhost:11434")

#request models define the structure for incoming JSON payloads
class SubtopicRequest(BaseModel):
    job_role: str
    experience_level: str

class ValidationRequest(BaseModel):
    subtopics: List[str]
    job_role: str

class RefineRequest(BaseModel):
    subtopics: List[str]
    job_role: str
    validation_feedback: str

class CategorizeRequest(BaseModel):
    subtopics: List[str]

class QuestionRequest(BaseModel):
    subtopic: str
    question_type: str
    job_role: str
    experience_level: str

class SubtopicRequest(BaseModel):
    job_role: constr(min_length=1)
    experience_level: constr(min_length=1)

class QuestionType(str, Enum):
    technical = "technical"
    behavioral = "behavioral"

class QuestionRequest(BaseModel):
    subtopic: constr(min_length=1)
    question_type: QuestionType
    job_role: constr(min_length=1)
    experience_level: constr(min_length=1)



#endpoints
#breaks down a job role into 6-8 interview subtopics using LLM
@app.post("/generate-subtopics")
def generate_subtopics(request: SubtopicRequest):
    #prompts the LLM for subtopics based on a selected job role and experience level
    prompt = PromptTemplate.from_template(
        "Break down the role of a {job_role} into 6-8 key interview subtopics "
        "for a {experience_level} candidate. Return the result as a JSON object "
        "with a 'subtopics' key containing a list of strings. Example: "
        "{{\"subtopics\": [\"Data Structures\", \"System Design\", \"Databases\"]}}"
    )
    #chains the prompt with the LLM and string output parser. 
    chain = prompt | llm | StrOutputParser()
    response = chain.invoke({"job_role": request.job_role, 
                             "experience_level": request.experience_level})
    #extracts the necessary data
    match = re.search(r"\{[\s\S]*?\}", response)
    if not match:
        #gives an error message if no JSON object is found
        raise HTTPException(status_code=500, detail="No JSON object found in response.")
    try:
        #parses the JSON string into a python dictionary, validates it exists and then returns the list of subtopics as a JSON response
        parsed = json.loads(match.group())
        if "subtopics" not in parsed or not isinstance(parsed["subtopics"], list):
            raise ValueError("Missing or invalid 'subtopics' key in response.")
        return {"subtopics": parsed["subtopics"]}
    except Exception as e:
        #catches any errors in parsing or validation
        raise HTTPException(status_code=500, detail=f"Invalid response format: {str(e)}")

#validates the relevance and grouping of the subtopics
@app.post("/validate-subtopics")
def validate_subtopics(request: ValidationRequest):
    subtopics_str = ", ".join(request.subtopics)
    #prompts the LLM to validate the subtopics, asking for feedback
    prompt = PromptTemplate.from_template(
        "Validate the following subtopics for a {job_role} interview: {subtopics}. "
        "Are they relevant and logically grouped? Provide feedback or corrections."
    )
    #chains the prompt with the LLM and string output parser. 
    chain = prompt | llm | StrOutputParser()
    response = chain.invoke({"job_role": request.job_role, 
                             "subtopics": subtopics_str})
    #returns the LLM's feedback as JSON response
    return {"validation_feedback": response}

#refines the subtopics based on feedback
@app.post("/refine-subtopics")
def refine_subtopics(request: RefineRequest):
    subtopics_str = ", ".join(request.subtopics)
    #prompts the LLM to refine the subtopics based on the feedback given 
    prompt = PromptTemplate.from_template(
        "Based on the following feedback: \"{feedback}\", "
        "refine the subtopics for a {job_role} interview. "
        "The original subtopics were: {subtopics}. "
        "Return only a JSON object with a 'refined_subtopics' key containing a list of strings. "
        "Example: {{\"refined_subtopics\": [\"Classroom Management\", \"Lesson Planning\", \"Student Engagement\"]}}"
    )
    #chains the prompt with the LLM and string output parser
    chain = prompt | llm | StrOutputParser()
    response = chain.invoke({
        "feedback": request.validation_feedback,
        "job_role": request.job_role,
        "subtopics": subtopics_str
    })
    #extracts the necessary data
    match = re.search(r"\{.*\"refined_subtopics\"\s*:\s*\[.*?\]\s*\}", response, re.DOTALL)
    if not match:
        #gives an error message if no JSON object is found
        raise HTTPException(status_code=500, detail="No JSON object found in response.")
    try:
        #parses the JSON string into a python dictionary, validates it exists and then returns the list of refined subtopics as a JSON response
        parsed = json.loads(match.group())
        if "refined_subtopics" not in parsed or not isinstance(parsed["refined_subtopics"], list):
            raise ValueError("Missing or invalid 'refined_subtopics' key in response.")
        return {"refined_subtopics": parsed["refined_subtopics"], "explanation": response}
    except Exception as e:
        #catches any errors in parsing or validation
        raise HTTPException(status_code=500, detail=f"Invalid response format: {str(e)}")

#generates 7 interview questions for a chosen subtopic 
@app.post("/generate-questions")
def generate_questions(request: QuestionRequest):
    #debugging log because of double click for some reason
    print("Generating questions for:", request.subtopic)
    #prompts the LLM to generate 7 interview questions based on the selected subtopic
    prompt = PromptTemplate.from_template(
        "Generate 7 {question_type} interview questions for a {experience_level} "
        "{job_role} under the topic '{subtopic}'. Each question should:\n"
        "- Be answerable in 5-10 minutes\n"
        "- Be open-ended but focused\n"
        "Avoid take-home project-style prompts. Format the output as a numbered list."
        "**Return ONLY the 7 questions in a numbered list with no introduction, explanation.**"
    )
    #chains the prompt with the LLM and string output parser    
    chain = prompt | llm | StrOutputParser()
    response = chain.invoke({
        "question_type": request.question_type,
        "experience_level": request.experience_level,
        "job_role": request.job_role,
        "subtopic": request.subtopic
    })
    #returns the generated questions as a JSON response
    return {"questions": response}

#categorises subtopics into predefined categories
@app.post("/categorize-subtopics")
def categorize_subtopics(request: CategorizeRequest):
    subtopics_str = ", ".join(request.subtopics)
    #prompts the LLM to cetegorise the refined subtopic list into given categories
    prompt = PromptTemplate.from_template(
        "Categorize the following interview subtopics into one of these categories:\n"
        "- Technical Skills\n"
        "- Soft Skills\n"
        "- Advanced Topics\n"
        "- General Skills\n\n"
        "Subtopics: {subtopics}\n\n"
        "Return the result as a JSON object with each category as a key and a list of subtopics as values."
    )
    #chains the prompt with the LLM and string output parser  
    chain = prompt | llm | StrOutputParser()
    response = chain.invoke({"subtopics": subtopics_str})
    #extracts the necessary data
    match = re.search(r"\{.*\}", response, re.DOTALL)
    if not match:
        #gives an error message if no JSON object is found
        raise HTTPException(status_code=500, detail="No JSON object found in response.")
    try:
        #parses the JSON string into a python dictionary, ensures each value is in a list and returns the categorised subtopics
        parsed = json.loads(match.group())
        if not isinstance(parsed, dict):
            raise ValueError("Expected a dictionary of categories.")
        for key, value in parsed.items():
            if not isinstance(value, list):
                parsed[key] = [value] if value else []
        return parsed
    except Exception as e:
        #catches any errors in parsing or validation
        raise HTTPException(status_code=500, detail=f"Invalid response format: {str(e)}")

#evaluates the users response and gives feedback and a score before storing it 
@app.post("/check-response")
async def check_response(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    #extracts the question and answer from the request
    question = data["question"]
    answer = data["answer"]
    #extracts the user metadata
    user_id = data.get("user_id")  
    job_role = data.get("job_role")
    subtopic = data.get("subtopic")
    #prompts the LLM for constructive feedback and a score out of 10 based on the users answer
    prompt_text = f"""Here's the interview question:\n\n{question}\n\nCandidate's answer:\n\n{answer}\n\n
    Please provide constructive feedback and a score out of 10.
    **Don't include phrases like 'I'm happy to help' in your response**"""
    #chains the prompt with the LLM and string output parser  
    chain = llm | StrOutputParser()
    result = chain.invoke(prompt_text)
    #extracts the necessary data
    score_match = re.search(r"Score:\s*(\d+)", result)
    score = int(score_match.group(1)) if score_match else None
    if user_id:
        #saves the response data into the database
        response_entry = QuestionResponse(
            user_id=user_id,
            job_role=job_role,
            question_text=question,
            user_answer=answer,
            score=score,
            feedback=result,
            subtopic = subtopic
        )
        db.add(response_entry)
        db.commit()
        #saves the job the user is interested in into the database for analytics
        interest_entry = UserJobInterest(
            user_id=user_id,
            job_role=job_role,
            subtopic = subtopic    
        )
        db.add(interest_entry)
        db.commit()
    return {"feedback": result}

#registers a new user with a hashed password
@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        #catches any errors with duplicate emails
        raise HTTPException(status_code=400, detail="Email already registered")
    #hashes the users password for encryption purposes
    hashed_pw = bcrypt.hash(user.password)
    #stores user data in database
    new_user = User(email=user.email, 
                    name=user.name, 
                    hashed_password=hashed_pw
                    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email, "name": new_user.name}

#authenticates a user
@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not bcrypt.verify(user.password, db_user.hashed_password):
        #catches any errors if no user is found or if the password doesnt match
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"message": "Login successful", "id": db_user.id, "email": db_user.email, "name": db_user.name}

#returns user profile with stats like average score, most interested job role, ect.
@app.get("/user-profile/{user_id}")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    #fetches user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        #catches any errors with the user not existing
        raise HTTPException(status_code=404, detail="User not found")
    #retrieves data, counts the number of questions and calculates the average score
    responses = db.query(QuestionResponse).filter(QuestionResponse.user_id == user_id).all()
    total_questions = len(responses)
    average_score = sum(r.score for r in responses if r.score is not None) / total_questions if total_questions else 0
    #groups scores by subtopics
    subtopic_scores = defaultdict(list)
    for r in responses:
        if r.subtopic and r.score is not None:
            subtopic_scores[r.subtopic].append(r.score)
    #calculates average score per subtopic
    average_scores_by_subtopic = {
        subtopic: round(sum(scores) / len(scores), 2)
        for subtopic, scores in subtopic_scores.items()
    }
    #collects and counts all job roles the user is interested in
    job_roles = [r.job_role for r in responses if r.job_role]
    most_common_role = max(set(job_roles), key=job_roles.count) if job_roles else None
    job_role_distribution = dict(Counter(job_roles))
    return {"name": user.name, "email": user.email, "total_questions": total_questions, "average_score": round(average_score, 2), "most_interested_career": most_common_role, "average_scores_by_subtopic": average_scores_by_subtopic, "job_role_distribution": job_role_distribution }

#returns job interests with average scores per subtopic.
@app.get("/user-job-interests-with-scores")
def get_user_job_interests_with_scores(db: Session = Depends(get_db)):
    #fetches the average scores for each user's job role and subtopics
    results = (
        db.query(
            UserJobInterest.user_id,
            UserJobInterest.job_role,
            UserJobInterest.subtopic,
            #calculates average score
            func.avg(QuestionResponse.score).label("average_score")
        )
        #join on both user_id and subtopic to match responses with interests
        .join(
            QuestionResponse,
            (UserJobInterest.user_id == QuestionResponse.user_id) &
            (UserJobInterest.subtopic == QuestionResponse.subtopic)
        )
        #groups results by user, job role and subtopic to compute averages
        .group_by(UserJobInterest.user_id, UserJobInterest.job_role, UserJobInterest.subtopic)
        .all()
    )
    return [{"user_id": user_id, "job_role": job_role, "subtopic": subtopic, "average_score": round(avg_score, 2) if avg_score is not None else None}
        for user_id, job_role, subtopic, avg_score in results
    ]
