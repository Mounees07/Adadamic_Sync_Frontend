import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ClipboardList } from 'lucide-react';
import './GateDashboard.css';

const GateDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="gate-dashboard">
            <h1 className="dashboard-title">Gate Security Controll</h1>
            <div className="dashboard-grid">
                <div className="action-card" onClick={() => navigate('/gate/student-entry')}>
                    <div className="icon-container">
                        <UserCheck size={40} />
                    </div>
                    <div className="card-content">
                        <h2>Student Entry/Exit</h2>
                        <p>Verify leaves and track student movement in and out of campus.</p>
                    </div>
                </div>

                <div className="action-card" onClick={() => navigate('/gate/visitor-log')}>
                    <div className="icon-container">
                        <ClipboardList size={40} />
                    </div>
                    <div className="card-content">
                        <h2>Visitor Log</h2>
                        <p>Record and monitor visitor details and purpose of visit.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GateDashboard;
