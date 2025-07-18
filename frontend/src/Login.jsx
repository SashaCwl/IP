//imports 
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import './Layout.css';
import './Login.css';

const Login = ({ onLogin }) => {
  //extracted data passed via navigation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  //handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted"); 
    setError('');

    //validation for empty fields
    if (!email.trim() || !password.trim()) {
      console.log("Missing email or password"); 
      setError('Please enter both email and password.');
      return;
    }

    try {
      //sends login request to backend
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      //handles unsuccessful logins
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || 'Login failed');
        return;
      }

      //stores ID locally
      const data = await response.json();
      localStorage.setItem('user_id', data.id);
      onLogin && onLogin(data);
      //redirects to interview form page
      navigate('/InterviewForm');
    } catch (err) {
      setError('Server error');
    }

    setEmail('');
    setPassword(''); 
  };

  return (
    <div className="login-box"> 
      <h4>Welcome Back</h4>
      {/* Login form */}
      <form onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
        <button type="submit" style={{ marginTop: "12px" }}>Log In</button>
        <div className="register-link"></div>
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          Don't have an account? <a href="/register" className="expand-btn">Register here</a>
        </p>
      </form>
    </div>
  );
};

export default Login;

