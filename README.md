# IP

This is a full-stack web application that uses FastAPI, React, and LangChain with Ollama to help users prepare for job interviews. It generates subtopics, validates them, refines them, and produces interview questions. Users can log in, answer questions, and receive AI-generated feedback and scoring.


Prerequisites:

To run this app, you'll need the following installed:

> General Tools:
- Python 3.10+
- Node.js (v16 or later) and npm
- Ollama (for running local LLaMA models): https://ollama.com

> Python Dependencies (Backend)
```bash
pip install fastapi uvicorn sqlalchemy pydantic langchain langchain_community passlib[bcrypt] python-multipart langchain_ollama
```

> Node Dependencies (Frontend)
- Navigate to the frontend folder 'cd frontend'
```bash
npm install react react-dom react-router-dom chart.js react-chartjs-2
```

SetUp:

> Start Ollama with a Model
- Download and run a model such as `llama3`:
```bash
ollama run llama3
```
- Make sure it's running at `http://localhost:11434`, as required by `main.py`.


> Make sure you have two terminals open for this. Run these commands on them individually
> Start the FastAPI Backend (cd backend)
```bash
uvicorn main:app --reload
```
- This launches the API server at `http://localhost:8000`

> Start the React Frontend (cd frontend)
```bash
npm start
```
- This starts the frontend at `http://localhost:3000`

> Database
- The backend uses a local SQLite database called `users.db`
- It's automatically created when FastAPI starts (`Base.metadata.create_all()`)
