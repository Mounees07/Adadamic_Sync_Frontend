import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, AlertCircle, Users, Eye, EyeOff, Home, ChevronDown } from 'lucide-react';
import './Login.css';

const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("STUDENT");
    const [formError, setFormError] = useState("");
    const { signupWithEmail, error } = useAuth();
    const navigate = useNavigate();

    const roles = [
        { value: 'STUDENT', label: 'Student' },
        { value: 'TEACHER', label: 'Teacher' },
        { value: 'MENTOR', label: 'Mentor' },
        { value: 'HOD', label: 'HOD' },
        { value: 'PRINCIPAL', label: 'Principal' },
        { value: 'ADMIN', label: 'Administrator' },
        { value: 'COE', label: 'Controller of Examination' }
    ];

    const handleSignup = async (e) => {
        e.preventDefault();
        setFormError("");
        try {
            await signupWithEmail(email, password, fullName, role);
            navigate('/dashboard');
        } catch (err) {
            setFormError(err.message);
        }
    };

    return (
        <div className="login-container">
            {/* Top Navigation Overlay */}
            <nav className="page-nav">
                <a href="#">Help</a>
                <a href="#">Contact us</a>
                <a href="#">English <ChevronDown size={14} /></a>
                <Link to="/login" className="signup-btn">Sign In</Link>
                <Link to="/" className="home-icon"><Home size={20} /></Link>
            </nav>

            {/* Left Side: Form */}
            <div className="login-form-side">
                <div className="login-header">
                    <h2>CREATE ACCOUNT</h2>
                    <p>Already have an account? <Link to="/login" className="signup-link">Log in</Link></p>
                </div>

                {(formError || error) && (
                    <div className="error-message">
                        <AlertCircle size={18} />
                        <span>{formError || error}</span>
                    </div>
                )}

                <form onSubmit={handleSignup} className="auth-form">
                    <div className="input-label-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-label-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-label-group">
                        <label>Role</label>
                        <div className="input-wrapper">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="role-select"
                                required
                            >
                                {roles.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="input-label-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <input
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block">
                        Sign Up
                    </button>
                </form>

                <div className="social-login-section">
                    <div className="social-divider">
                        <span>or register with</span>
                    </div>
                    <div className="social-buttons">
                        <button type="button" className="social-btn google">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="google" width="24" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side: Visual */}
            <div className="login-visual">
                <div className="illustration-container">
                    <div className="blob-bg"></div>
                    <img
                        src="https://img.freepik.com/free-vector/creative-team-concept-illustration_114360-3942.jpg?t=st=1738096000~exp=1738099600~hmac=98a3b839352636136d3969"
                        alt="Join Us"
                        className="hero-image"
                    />
                </div>
            </div>
        </div>
    );
};

export default Signup;
