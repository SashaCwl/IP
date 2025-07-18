//imports
import React from 'react';
import Login from './Login';
import InterviewForm from './InterviewForm';
import FinalSubtopics from './FinalSubtopics';
import Questions from './Questions';
import Register from './Register';
import Profile from './Profile';
import Plan from './Plan';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

//main app component
function App() {
  return (
    <Router>
      <Routes>
        {/*maps URL paths for each specific component*/}
        <Route path="/" element={<Login />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/InterviewForm" element={<InterviewForm />} />
        <Route path="/final-subtopics" element={<FinalSubtopics />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/Plan" element={<Plan />} />
      </Routes>
    </Router>
  );
}

export default App;
