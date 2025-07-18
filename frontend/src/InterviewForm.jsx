//imports
import React, { useState } from 'react';
import './InterviewForm.css';
import './Layout.css'
import { useNavigate } from 'react-router-dom';


const InterviewForm = () => {
  //extracted data passed via navigation
  const [jobRole, setJobRole] = useState('');
  const [interviewType, setInterviewType] = useState('technical');
  const [experienceLevel, setExperienceLevel] = useState('Entry-Level');
  const [subtopics, setSubtopics] = useState([]);
  const [validationFeedback, setValidationFeedback] = useState('');
  const [explanation, setRefinementExplanation] = useState('');
  const [refined_subtopics, setRefinedSubtopics] = useState([]);
  const [categorizedSubtopics, setCategorizedSubtopics] = useState({});

  //navigation bar 
  const Navbar = () => {
  const navigate = useNavigate();
  return (
      <div className="navbar">
        <button onClick={() => navigate('/Profile')}>Profile</button>
        <button onClick={() => navigate('/InterviewForm')}>Practice Questions</button>
      </div>
    );
  };

  //handler for clicking to generate initial subtopics
  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:8000/generate-subtopics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_role: jobRole,
        experience_level: experienceLevel 
      })
    });
    const data = await response.json();
    console.log("Generated subtopics:", data);
    setSubtopics(data.subtopics);
    setValidationFeedback('');
  };

  //handler for clicking tovalidate initial subtopics
  const handleValidate = async () => {
    const response = await fetch('http://localhost:8000/validate-subtopics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subtopics,
        job_role: jobRole
      })
    });
    const data = await response.json();
    setValidationFeedback(data.validation_feedback);
  };

  //handler for clicking to generate refined subtopics
  const handleRefine = async () => {
    try {
      const response = await fetch('http://localhost:8000/refine-subtopics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtopics,
          job_role: jobRole,
          validation_feedback: validationFeedback
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (Array.isArray(data.refined_subtopics)) {
        setRefinedSubtopics(data.refined_subtopics);
        setRefinementExplanation(data.explanation);
      }

    } catch (error) {
      console.error("Refine error:", error.message);
    }
  };

  //handler for clicking to categorize refined subtopics
  const handleCategorize = async () => {
    const response = await fetch('http://localhost:8000/categorize-subtopics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtopics: refined_subtopics })
    });
    const data = await response.json();
    setCategorizedSubtopics(data);
  };

  const navigate = useNavigate();


  return (
    <div>
      <Navbar />
    <div className="form-container">
      <h2>Interview Setup</h2>
      {/*form to submit job role and preferences*/}
      <form onSubmit={handleSubmit}>
        <label1>
          Job Role:
          <input
            type="text"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            required
          />
        </label1>
        <br />

        <label>
          Interview Type:
          <select
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value)}
          >
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="case study">Case Study</option>
          </select>
        </label>
        <br />

        <label>
          Experience Level:
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
          >
            <option value="Entry-Level">Entry-Level</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
          </select>
        </label>
        <br />

        <button type="submit">Generate Subtopics</button>
      </form>

      {/*displays generated subtopics (for debugging purposes)*/}
      {subtopics.length > 0 && (
        <div className="generated-subtopics">
          <h3>Generated Subtopics</h3>
          <ul>
            {subtopics.map((topic, index) => (
              <li key={index}>{topic}</li>
            ))}
          </ul>
          <button onClick={handleValidate}>Validate Subtopics</button>
        </div>
      )}

      {/*displays validation feedback (for debugging purposes)*/}
      {validationFeedback && (
        <div className="validation-feedback">
          <h3>Validation Feedback</h3>
          <p>{validationFeedback}</p>
          <button onClick={handleRefine}>Refine Subtopics</button>
        </div>
      )}

      {/*displays generated refined subtopics (for debugging purposes)*/}
      {refined_subtopics.length > 0 && (
        <div className="generated-subtopics">
          <h3>Refined Subtopics</h3>
          <ul>
            {refined_subtopics.map((topic, index) => (
              <li key={index}>{topic}</li>
            ))}
          </ul>
          <h3>What Changed</h3>
          <p>{explanation}</p>
        </div>
      )}

      {refined_subtopics.length > 0 && (
        <div className="categorized-subtopics">
          <button onClick={handleCategorize}>Categorize Subtopics</button>
        </div>
      )}

      {/*displays categorized subtopics (for debugging purposes)*/}
      {Object.keys(categorizedSubtopics).length > 0 && (
        <div className="categorized-subtopics">
          <h3>Categorized Subtopics</h3>
          {Object.entries(categorizedSubtopics).map(([category, topics]) => (
            <div key={category}>
              <b>{category}</b>
            <ul>
              {Array.isArray(topics) && topics.map((topic, index) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>
            </div>
          ))}
          {/*navigates to final subtopic page*/}
          <button style={{ marginTop: '20px' }} onClick={() => navigate('/final-subtopics', { state: { 
            categorizedSubtopics, jobRole, experienceLevel, questionType: interviewType } })}>View Final Subtopics</button>
        </div>
      )}
    </div>
    </div>
  );
};

export default InterviewForm;

