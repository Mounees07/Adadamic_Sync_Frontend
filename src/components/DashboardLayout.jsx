import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import FloatingSidebar from './FloatingSidebar';
import Navbar from './Navbar';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    // Close sidebar on route change (clicking a nav link)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, []);

    return (
        <div className="dashboard-container">
            <div className="page-logo-container">
                <div className="logo-icon-wrapper">
                    <GraduationCap size={28} />
                </div>
                <span className="logo-text-main">AcaSync</span>
            </div>

            {/* Mobile overlay — closes sidebar when tapping outside */}
            {isSidebarOpen && (
                <div
                    className="mobile-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <FloatingSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main className="main-content">
                <Navbar toggleSidebar={toggleSidebar} />
                <div className="page-content animate-fade-in">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
