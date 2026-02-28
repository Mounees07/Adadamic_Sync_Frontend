import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, AlertCircle, Eye, EyeOff, Home, ChevronDown, X, UserPlus } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState("");
    const [showContact, setShowContact] = useState(false);
    const { loginWithGoogle, loginWithEmail, error } = useAuth();
    const { getBool } = useSettings();
    const allowRegistration = getBool('allowRegistration', true);
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (err) {
            console.error("Google login failed:", err);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setFormError("");
        try {
            await loginWithEmail(email, password);
            navigate('/dashboard');
        } catch (err) {
            setFormError(err.message);
        }
    };

    return (
        <div className="login-container">
            {/* Top Navigation Overlay */}
            <nav className="page-nav">
                <a href="#" onClick={(e) => { e.preventDefault(); setShowContact(true); }}>Contact us</a>
                <a href="#">English <ChevronDown size={14} /></a>

                <Link to="/" className="home-icon"><Home size={20} /></Link>
            </nav>

            {/* Left Side: Form */}
            <div className="login-form-side">
                <div className="login-header">
                    <h2>WELCOME BACK!</h2>
                    <p>Enter your credentials to access your account.</p>
                </div>

                {(formError || error) && (
                    <div className="error-message">
                        <AlertCircle size={18} />
                        <span>{formError || error}</span>
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="auth-form">
                    <div className="input-label-group">
                        <label>Username</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                placeholder="deniel123@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-label-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="●●●●●●●●"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </div>
                        </div>
                    </div>

                    <div className="form-options">
                        <label className="remember-me">
                            <input type="checkbox" />
                            Remember me
                        </label>
                        <Link to="/forgot-password" className="forgot-password">Forget password?</Link>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block">
                        Sign In
                    </button>

                    {/* Registration banner controlled by admin setting */}
                    {allowRegistration ? (
                        <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
                            New user?{' '}
                            <Link to="/register" style={{ color: '#8b5cf6', fontWeight: 600, textDecoration: 'none' }}>
                                <UserPlus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                Request Access
                            </Link>
                        </div>
                    ) : (
                        <div style={{
                            marginTop: '12px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#ef4444',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <AlertCircle size={15} />
                            <span>Registration is currently <strong>disabled</strong> by the administrator.</span>
                        </div>
                    )}
                </form>

                <div className="social-login-section">
                    <div className="social-divider">
                        <span>or</span>
                    </div>
                    <div className="social-buttons">
                        <button type="button" onClick={handleGoogleLogin} className="social-btn google">
                            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQN1HgAOQZBf48TI55AvzbnfV0IFrCCrX6ldg&s" alt="google" width="24" />
                            <span>Continue with Google</span>
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
                        alt="Creative Learning"
                        className="hero-image"
                    />
                </div>
            </div>

            {/* Contact Modal */}
            {showContact && (
                <div className="modal-overlay" onClick={() => setShowContact(false)}>
                    <div className="contact-card" onClick={e => e.stopPropagation()}>
                        <div className="contact-header">
                            <h3>Contact Support</h3>
                            <button onClick={() => setShowContact(false)} className="close-btn"><X size={24} /></button>
                        </div>
                        <div className="contact-body">
                            <p style={{ marginBottom: '15px', color: '#6b7280' }}>For any queries or assistance, please contact:</p>
                            <div className="contact-detail">
                                <Mail size={20} className="text-primary" style={{ color: '#8b5cf6' }} />
                                <a href="mailto:sankavi881@gmail.com">sankavi8881@gmail.com</a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
