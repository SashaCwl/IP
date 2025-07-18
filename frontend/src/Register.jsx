//imports
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css'; 

const Register = () => {
  //extracted data passed via navigation
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    //validates the forms inputs
    if (!email || !name || !password) {
      setError('Please fill out all fields.');
      return;
    }
    //sends registration data to the backend
    try {
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await response.json();

      if (response.ok) {
        //stores user ID
        localStorage.setItem("user_id", data.id); 
        setSuccess('Registration successful!');
        alert("Registration successful!");
        //redirects back to login page
        navigate('/');
      } else {
        //error if registration fails
        setError(data.detail || 'Registration failed.'); 
      }

    } catch (err) {
      //error for network/server errors
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleRegister} className="register-form">
        <h4>Register</h4>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <label className="form-label">
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="Full Name"
          />
        </label>

        <label className="form-label">
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="your.email@example.com"
          />
        </label>

        <label className="form-label">
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="Create a password"
          />
        </label>

        <button type="submit" className="register-button">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
