//imports
import React, { useEffect, useState } from 'react';
import './Layout.css';
import './Plan.css';
import { useNavigate } from 'react-router-dom';

const Plan = () => {
  //extracted data passed via navigation
  const [interests, setInterests] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  //navigation bar 
  const Navbar = () => {
    return (
      <div className="navbar">
        <button onClick={() => navigate('/Profile')}>Profile</button>
        <button onClick={() => navigate('/InterviewForm')}>Practice Questions</button>
      </div>
    );
  };

  //fetches user-specific interest data 
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await fetch("http://localhost:8000/user-job-interests-with-scores");
        const data = await response.json();
        //filters interests for the current user
        const filtered = data.filter(item => item.user_id === parseInt(userId));
        //sorts subtopics from weakest to strongest
        const sorted = filtered.sort((a, b) => a.average_score - b.average_score);
        setInterests(sorted);
      } catch (error) {
        console.error("Failed to fetch interests:", error);
      }
    };

    //only fetches if the user is logged in
    if (userId) {
      fetchInterests(); 
    } else {
      navigate("/login");
    }
  }, [userId, navigate]);

  //displays loading message
  if (!interests.length) return <div>Loading plan...</div>;

  return (
    <div>
      <Navbar />
    <h4>Your Personalised Learning Plan</h4>
    <div className="profile-container">
      <h2>Weakest to strongest subtopics:</h2>
      <ul>
        {interests.map((item, index) => (
          <li key={index}>
            <strong>{item.subtopic}</strong> — Score: {item.average_score ?? "N/A"}
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
};

export default Plan;
