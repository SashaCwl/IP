//imports
import React, { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Layout.css';
import './Questions.css';
import { useNavigate } from 'react-router-dom';

const Questions = () => {
  //extracted data passed via navigation
  const location = useLocation();
  const subtopic = location.state?.subtopic;
  const jobRole = location.state?.jobRole;
  const experienceLevel = location.state?.experienceLevel;
  const questionType = location.state?.questionType;

  //state variables
  const [questions, setQuestions] = useState('');
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const [feedback, setFeedback] = useState({});
  const [checking, setChecking] = useState({});
  const [expanded, setExpanded] = useState({});
  const hasFetched = useRef(false);

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

  //toggle for expanded feedback view (doesnt always work for some reason :c)
  const toggleExpand = (index) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };
  
  //fetches questions from backend
  useEffect(() => {
  if (hasFetched.current) return;
  hasFetched.current = true;
    const fetchQuestions = async () => {
      try {
        const response = await fetch('http://localhost:8000/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subtopic,
            job_role: jobRole,
            experience_level: experienceLevel,
            question_type: questionType,
          }),
        });
        const data = await response.json();
        setQuestions(data.questions);
      } catch (error) {
        console.error('Error fetching questions:', error);
        setQuestions('Failed to load questions.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [subtopic, jobRole, experienceLevel, questionType]);

  //handler for user input for a question
  const handleResponseChange = (index, value) => {
    setResponses(prev => ({
      ...prev,
      [index]: value,
    }));
  };

  //submits the users response for evaluation
  const handleCheckResponse = async (index) => {
    const answer = responses[index];
    const question = qList[index];
    if (!answer || !question) return;
    setChecking(prev => ({ ...prev, [index]: true }));
    try {
      const response = await fetch('http://localhost:8000/check-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question, 
          answer, 
          user_id: localStorage.getItem("user_id"), 
          job_role: jobRole, 
          subtopic: subtopic}),
      });
      const data = await response.json();
      setFeedback(prev => ({
        ...prev,
        [index]: data.feedback,
      }));
    } catch (error) {
      console.error('Error checking response:', error);
      setFeedback(prev => ({
        ...prev,
        [index]: 'Failed to get feedback.',
      }));
    } finally {
      setChecking(prev => ({ ...prev, [index]: false }));
    }
  };

  //parses raw questions into a list
  let qList = questions
    .split(/\n?\d+\.\s+/)
    .map(q => q.trim())
    .filter(q => q.length > 0);

  if (qList.length && !qList[0].endsWith('?')) {
    qList = qList.slice(1);
  }

  //cleans up any unnecessary phrases (the LLM loves to put 'I'm happy to help in' >:v)
  const cleanFeedback = (text) => {
    return text
      .replace(/I'm happy to help!?/gi, '')
      .replace(/Please try again, and I'll be happy to provide feedback!?/gi, '')
      .trim();
  };

  //parses feedback into structured parts
  const parseFeedback = (text) => {
    text = cleanFeedback(text);
    //extracts the first score line
    const scoreMatch = text.match(/Score:\s*(\d+\/\d+|\d+\s+out\s+of\s+\d+|N\/A)/i);
    const scoreText = scoreMatch ? scoreMatch[0] : 'Score: N/A';
    //removes all "score:" lines from the text to avoid duplicates
    text = text.replace(/Score:\s*(\d+\/\d+|\d+\s+out\s+of\s+\d+|N\/A)/gi, '').trim();
    const constructiveStart = text.indexOf('Constructive Feedback:');
    const reasoningStart = text.indexOf('Reasoning:');
    let constructiveFeedback = '';
    let reasoning = '';

    if (constructiveStart !== -1) {
      if (reasoningStart !== -1 && reasoningStart > constructiveStart) {
        constructiveFeedback = text
          .substring(constructiveStart, reasoningStart)
          .replace('Constructive Feedback:', '')
          .trim();
        reasoning = text.substring(reasoningStart).trim();
      } else {
        constructiveFeedback = text
          .substring(constructiveStart)
          .replace('Constructive Feedback:', '')
          .trim();
      }
    } else {
      constructiveFeedback = text.trim();
    }
    return { scoreText, constructiveFeedback, reasoning };
  };

  return (
    <div>
      <Navbar />
      <h4>
        Practice questions for: <span className="highlight">{subtopic}</span>
      </h4>
      {loading ? (
        <p>Loading questions...</p>
      ) : (
        qList.map((q, index) => (
          <div key={index} className="question-card">
            <strong>Question {index + 1}:</strong> {q}
            <textarea
              className="response-box"
              value={responses[index] || ''}
              onChange={(e) => handleResponseChange(index, e.target.value)}
              placeholder="Type your response here..."
            />
            <button
              className="check-button"
              onClick={() => handleCheckResponse(index)}
              disabled={checking[index]}
            >
              {checking[index] ? 'Checking...' : 'Check Response'}
            </button>
            {feedback[index] && (
              <div className="feedback-box">
                <h5>Feedback</h5>
                {(() => {
                  const { scoreText, constructiveFeedback, reasoning } = parseFeedback(feedback[index]);
                  return (
                    <>
                      <p><strong>{scoreText}</strong></p>
                      <div style={{ whiteSpace: 'pre-line', marginTop: '8px' }}>
                        {constructiveFeedback}
                      </div>
                      {reasoning && (
                        <>
                          {expanded[index] ? (
                            <>
                              <div style={{ whiteSpace: 'pre-line', marginTop: '12px' }}>
                                {reasoning}
                              </div>
                              <button onClick={() => toggleExpand(index)} className="expand-btn">
                                Show less
                              </button>
                            </>
                          ) : (
                            <button onClick={() => toggleExpand(index)} className="expand-btn">
                              Read more
                            </button>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Questions;
