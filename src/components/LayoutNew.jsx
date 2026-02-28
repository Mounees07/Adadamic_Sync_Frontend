import React from 'react';
import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import FloatingSidebar from './FloatingSidebar';
import Navbar from './Navbar';
import './DashboardLayout.css';

const LayoutNew = ({ children }) => {
    // Force a fresh render
    return (
        <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-deep)' }}>
            <div className="page-logo-container" style={{
                position: 'fixed',
                top: '24px',
                left: '39px', // Centered relative to new sidebar width (80px)
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                zIndex: 1200
            }}>
                <div className="logo-icon-wrapper" style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #4338ca) 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)',
                    transition: 'transform 0.3s ease'
                }}>
                    <GraduationCap size={28} />
                </div>
                <span className="logo-text-main" style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.5px'
                }}>AcaSync</span>
            </div>

            <FloatingSidebar />

            <main className="main-content" style={{
                flex: 1,
                marginLeft: '130px', /* Match Navbar left alignment */
                paddingTop: '100px', /* Push content below fixed Navbar (80px + gap) */
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                position: 'relative'
            }}>
                <Navbar />
                <div className="page-content animate-fade-in" style={{ padding: '24px', flex: 1 }}>
                    {children ? children : <Outlet />}
                </div>
            </main>
        </div >
    );
};

export default LayoutNew;
