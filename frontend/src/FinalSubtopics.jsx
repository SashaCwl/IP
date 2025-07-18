//imports 
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './FinalSubtopics.css';

const FinalSubtopics = () => {
  //accessing nav and location states
  const location = useLocation();
  const navigate = useNavigate();
  //extracted data passed via navigation
  const categorizedSubtopics = location.state?.categorizedSubtopics || {};
  const jobRole = location.state?.jobRole;
  const experienceLevel = location.state?.experienceLevel;
  const questionType = location.state?.questionType;

  //navigation bar 
  const Navbar = () => {
    return (
        <div className="navbar">
          <button onClick={() => navigate('/Profile')}>Profile</button>
          <button onClick={() => navigate('/InterviewForm')}>Practice Questions</button>
        </div>
      );
    };

  //handler for clicking on a subtopic
  const handleSubtopicClick = (subtopic) => {
    navigate('/questions', {state: {subtopic, jobRole, experienceLevel, questionType}
    });
    };

  return (
    <div>
      <Navbar />
    <div className="final-subtopics-container">
      <h4>Final Categorized Subtopics</h4>
      {Object.entries(categorizedSubtopics).map(([category, topics]) => (
        <details key={category}>
          <summary><strong>{category}</strong></summary>
          <ul>
            {topics.map((topic, index) => (
              <li key={index}>
                {topic}
                <button
                  onClick={() => handleSubtopicClick(topic)}
                >
                  Practice questions
                </button>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
    </div>
  );
};

export default FinalSubtopics;

