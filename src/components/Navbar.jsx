import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, Sun, Moon, Monitor, Settings, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';


const toRoman = (num) => {
    const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let roman = '', i;
    for (i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
};

const Navbar = () => {
    const { userData, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const themeMenuRef = useRef(null);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);


    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
                setIsThemeMenuOpen(false);
            }
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getThemeIcon = () => {
        switch (theme) {
            case 'light': return <Sun size={20} />;
            case 'dark': return <Moon size={20} />;
            case 'system': return <Monitor size={20} />;
            default: return <Moon size={20} />;
        }
    };

    const getPageTitle = (pathname) => {
        const path = pathname.split('/')[pathname.split('/').length - 1];
        // Clean up path string
        if (pathname.includes('/dashboard')) return 'Dashboard';
        if (pathname.includes('/courses')) return 'My Courses';
        if (pathname.includes('/schedule')) return 'Schedule';
        if (pathname.includes('/assignments')) return 'Assignments';
        if (pathname.includes('/results')) return 'Results';
        if (pathname.includes('/attendance')) return 'Attendance';
        if (pathname.includes('/leaves')) return 'Leave Management';
        if (pathname.includes('/settings')) return 'Settings';

        // Fallback: capitalize first letter of last segment
        if (!path) return 'Dashboard';
        return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    };

    const currentTitle = getPageTitle(location.pathname);

    // Determine home route based on role — direct navigation avoids browser history reload
    const getRoleHome = () => {
        switch (userData?.role) {
            case 'ADMIN': return '/admin/dashboard';
            default: return '/dashboard';
        }
    };

    const isHomePage = location.pathname === getRoleHome() ||
        (userData?.role !== 'ADMIN' && location.pathname === '/dashboard') ||
        (userData?.role === 'ADMIN' && location.pathname === '/admin/dashboard');

    return (
        <>
            {/* Floating Back Button — visible on all non-home pages, anchored above sidebar */}
            {!isHomePage && (
                <button
                    className="nav-back-floating"
                    onClick={() => navigate(getRoleHome())}
                    title="Return to Dashboard"
                >
                    <ArrowLeft size={18} />
                </button>
            )}

            <nav className="navbar">
                <div className="navbar-title">
                </div>

                <div className="nav-actions">

                    <div className="theme-wrapper" ref={themeMenuRef}>
                        <button
                            className="icon-btn theme-toggle-btn"
                            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                            title="Change Theme"
                        >
                            {getThemeIcon()}
                        </button>

                        {isThemeMenuOpen && (
                            <div className="theme-menu animate-fade-in">
                                <button
                                    className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                                    onClick={() => { setTheme('light'); setIsThemeMenuOpen(false); }}
                                >
                                    <Sun size={16} />
                                    <span>Light</span>
                                </button>
                                <button
                                    className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => { setTheme('dark'); setIsThemeMenuOpen(false); }}
                                >
                                    <Moon size={16} />
                                    <span>Dark</span>
                                </button>
                                <button
                                    className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                                    onClick={() => { setTheme('system'); setIsThemeMenuOpen(false); }}
                                >
                                    <Monitor size={16} />
                                    <span>System</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <button className="icon-btn">
                        <MessageCircle size={20} />
                    </button>

                    <button className="icon-btn">
                        <Bell size={20} />
                        <span className="notification-dot"></span>
                    </button>

                    <button className="icon-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                    </button>

                    <div className="user-profile-wrapper" ref={profileMenuRef}>
                        <div
                            className="user-profile"
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="user-info">
                                <span className="user-name">{userData?.fullName || 'User'}</span>
                                <span className="user-role">{userData?.role || 'STUDENT'}</span>
                            </div>
                            <div className="avatar">
                                {userData?.profilePictureUrl ? (
                                    <img src={userData.profilePictureUrl} alt="avatar" />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                        </div>

                        {isProfileMenuOpen && (
                            <div className="profile-dropdown animate-fade-in">
                                <div className="dropdown-header">
                                    <div className="dropdown-user-details">
                                        <span className="dd-name">{userData?.fullName || 'User Name'}</span>
                                        <span className="dd-email">{userData?.email || 'user@example.com'}</span>
                                        <span className="dd-role">
                                            {userData?.department && `  ${userData.department}`}
                                            {userData?.rollNumber && ` • ${userData.rollNumber}`}
                                        </span>
                                    </div>
                                </div>

                                {userData?.role === 'STUDENT' && (
                                    <div className="dropdown-journey-section" style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                                        <div style={{ marginBottom: '8px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Current Semester
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            color: 'var(--text-primary)'
                                        }}>
                                            <span style={{
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                color: '#3b82f6',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem'
                                            }}>
                                                Semester {toRoman(userData?.semester || 1)}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                                In Progress
                                            </span>
                                        </div>
                                    </div>
                                )}


                                {userData?.role === 'STUDENT' && (
                                    <button className="dropdown-item" onClick={() => navigate('/my-profile')}>
                                        <User size={16} />
                                        <span>My Profile</span>
                                    </button>
                                )}

                                <button className="dropdown-item danger" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
