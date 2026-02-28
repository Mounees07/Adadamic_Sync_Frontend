import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Home } from 'lucide-react';
import './Login.css'; // Reusing Login styles

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setMessage("");
            setError("");
            setLoading(true);
            await resetPassword(email);
            setMessage("Check your inbox for password reset instructions.");
        } catch (err) {
            console.error("Reset Error:", err);
            setError("Failed to reset password. " + (err.message || "Please check the email provided."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Top Navigation */}
            <nav className="page-nav">
                <Link to="/" className="home-icon"><Home size={20} /></Link>
            </nav>

            <div className="login-form-side">
                <div className="login-header">
                    <h2>Reset Password</h2>
                    <p>Enter your email to receive reset instructions.</p>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <div style={{
                        padding: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '20px',
                        fontSize: '0.9rem'
                    }}>
                        <CheckCircle size={18} />
                        <span>{message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
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

                    <button disabled={loading} type="submit" className="btn btn-primary btn-block" style={{ marginTop: '10px' }}>
                        {loading ? "Sending..." : "Reset Password"}
                    </button>

                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <Link to="/login" style={{ color: '#8b5cf6', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </form>
            </div>

            {/* Right Side: Visual */}
            <div className="login-visual">
                <div className="illustration-container">
                    <div className="blob-bg"></div>
                    <img
                        src="https://img.freepik.com/free-vector/forgot-password-concept-illustration_114360-1123.jpg"
                        alt="Forgot Password"
                        className="hero-image"
                        style={{ borderRadius: '20px' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
