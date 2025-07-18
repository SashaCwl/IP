//imports 
import React, { useEffect, useState } from 'react';
import './Layout.css'
import './Profile.css';
import { useNavigate } from 'react-router-dom';
//used to create a pie chart graph
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

const Profile = () => {
  //extracted data passed via navigation
  const [profile, setProfile] = useState(null);
  const [jobRoleData, setJobRoleData] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  //fetches user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:8000/user-profile/${userId}`);
        const data = await response.json();
        //sets data and job role distribution for the chart
        setProfile(data);
        setJobRoleData(data.job_role_distribution); 
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    //makes sure the user is logged in
    if (userId) {
      fetchProfile();
    } else {
      navigate("/login");
    }
  }, [userId, navigate]);

  //prepares data for the pie chart
  const pieData = jobRoleData ? {
    labels: Object.keys(jobRoleData),
    datasets: [{
      data: Object.values(jobRoleData),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      hoverOffset: 4
    }]
  } : null;

  //navigation bar 
  const Navbar = () => {
    return (
      <div className="navbar">
        <button onClick={() => navigate('/Profile')}>Profile</button>
        <button onClick={() => navigate('/InterviewForm')}>Practice Questions</button>
      </div>
    );
  };

  //handler to the personalised plan page
  const handlePlanClick = () => {
    navigate('/Plan');
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div>
      <Navbar />
      <div className="profile-container"> 
        <h4>User Profile</h4>
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Most Interested Career:</strong> {profile.most_interested_career || "N/A"}</p>
        {/*displays pie chart of user job interests*/}
        {pieData && (
          <div style={{ width: '300px', margin: 'auto' }}>
            <h4>Job Role Interests</h4>
            <Pie data={pieData} />
          </div>
        )}
        <p><strong>Questions Completed:</strong> {profile.total_questions}</p>
        <p><strong>Average Score:</strong> {profile.average_score}/10</p>
        <button onClick={() => handlePlanClick()}>Personalised Plan</button>
      </div>
    </div>
  );
};

export default Profile;
