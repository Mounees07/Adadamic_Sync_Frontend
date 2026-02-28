import React from 'react';
import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import FloatingSidebar from './FloatingSidebar';
import Navbar from './Navbar';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
    return (
        <div className="dashboard-container">
            <div className="page-logo-container">
                <div className="logo-icon-wrapper">
                    <GraduationCap size={28} />
                </div>
                <span className="logo-text-main">AcaSync</span>
            </div>
            <FloatingSidebar />
            <main className="main-content">
                <Navbar />
                <div className="page-content animate-fade-in">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
