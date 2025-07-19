#imports
import pytest
from fastapi.testclient import TestClient
from main import app
import uuid

#creates a test client for the FastAPI app
client = TestClient(app)

#tests user registration with a unique email to avoid duplication
def test_register_user():
    unique_email = f"testuser_{uuid.uuid4().hex[:6]}@example.com"
    response = client.post("/register", json={
        "email": unique_email,
        "name": "Test User",
        "password": "secure123"
    })
    assert response.status_code == 200
    assert "id" in response.json()

#tests for how duplicate emails are handled
def test_register_duplicate_email():
    email = "duplicate@example.com"
    client.post("/register", json={"email": email, "name": "User", "password": "pass123"})
    response = client.post("/register", json={"email": email, "name": "User", "password": "pass123"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

#tests for missing fields in registration form
def test_register_missing_fields():
    response = client.post("/register", json={"email": "missing@example.com"})
    assert response.status_code == 422  # Unprocessable Entity

#tests user login with known credentials
def test_login_user():
    response = client.post("/login", json={
        "email": "testuser@example.com",
        "password": "secure123"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Login successful"

#tests if the wrong password is used when login
def test_login_wrong_password():
    response = client.post("/login", json={"email": "testuser@example.com", "password": "wrongpass"})
    assert response.status_code == 401

#tests if the user doesnt exist
def test_login_nonexistent_user():
    response = client.post("/login", json={"email": "nonexistent@example.com", "password": "pass123"})
    assert response.status_code == 401


#tests if subtopics can be generated based on the users preferences
def test_generate_subtopics():
    response = client.post("/generate-subtopics", json={
        "job_role": "Software Engineer",
        "experience_level": "Entry-level"
    })
    assert response.status_code == 200
    assert "subtopics" in response.json()

#tests how the code handles missing fields like 'job role'
def test_generate_subtopics_empty_fields():
    response = client.post("/generate-subtopics", json={"job_role": "", "experience_level": ""})
    assert response.status_code == 500 or response.status_code == 422


#tests if questions can be generated based on the subtopic
def test_generate_questions():
    response = client.post("/generate-questions", json={
        "subtopic": "Data Structures",
        "question_type": "technical",
        "job_role": "Software Engineer",
        "experience_level": "Entry-level"
    })
    assert response.status_code == 200
    assert "questions" in response.json()

#tests how the code handles invalid fields like 'question type'
def test_generate_questions_invalid_type():
    response = client.post("/generate-questions", json={
        "subtopic": "Data Structures",
        "question_type": "invalid_type",
        "job_role": "Software Engineer",
        "experience_level": "Entry-level"
    })
    assert response.status_code in [422, 500]

#tests how the code handles missing fields like 'subtopic'
def test_generate_questions_empty_subtopic():
    response = client.post("/generate-questions", json={
        "subtopic": "",
        "question_type": "technical",
        "job_role": "Software Engineer",
        "experience_level": "Entry-level"
    })
    assert response.status_code in [422, 500]

#tests if the validate LLM prompt works okay
def test_validate_subtopics():
    response = client.post("/validate-subtopics", json={
        "subtopics": ["Data Structures", "System Design"],
        "job_role": "Software Engineer"
    })
    assert response.status_code == 200
    assert "validation_feedback" in response.json()

#tests if the refining LLM prompt works okay
def test_refine_subtopics():
    response = client.post("/refine-subtopics", json={
        "subtopics": ["Data Structures", "System Design"],
        "job_role": "Software Engineer",
        "validation_feedback": "Group them more logically"
    })
    assert response.status_code == 200
    assert "refined_subtopics" in response.json()

#tests if the categorize LLM prompt works okay
def test_categorize_subtopics():
    response = client.post("/categorize-subtopics", json={
        "subtopics": ["Data Structures", "Communication", "Leadership"]
    })
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

#tests if the users response to a question is recieved okay
def test_check_response():
    response = client.post("/check-response", json={
        "question": "What is polymorphism in OOP?",
        "answer": "It allows objects to be treated as instances of their parent class.",
        "user_id": 1,
        "job_role": "Software Engineer",
        "subtopic": "OOP"
    })
    assert response.status_code == 200
    assert "feedback" in response.json()


#tests how the code handles an invalid user id '999'
def test_check_response():
    response = client.post("/check-response", json={
        "question": "What is polymorphism in OOP?",
        "answer": "It allows objects to be treated as instances of their parent class.",
        "user_id": 999,
        "job_role": "Software Engineer",
        "subtopic": "OOP"
    })
    assert response.status_code == 200
    assert "feedback" in response.json()

#tests if the users data is able to be successfully retrieved from the database
def test_user_profile():
    response = client.get("/user-profile/1")
    assert response.status_code in [200, 404]  
    if response.status_code == 200:
        assert "average_score" in response.json()

#tests if the users average scores per subtopic is able to be successfully retrieved from the database
def test_user_job_interests_with_scores():
    response = client.get("/user-job-interests-with-scores")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
