import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    ClipboardList,
    Award,
    FileText,
    Users
} from 'lucide-react';
import '../DashboardOverview.css'; // Reusing styles

const StudentAcademic = () => {
    const navigate = useNavigate();

    return (
        <div className="dashboard-layout-new">
            <div className="dashboard-main-col">
                <div style={{ marginTop: '30px', marginBottom: '30px' }}>
                    <div className="quick-access-grid">
                        <button className="quick-btn" onClick={() => navigate('/student/courses')}>
                            <div className="qb-icon color-1"><BookOpen size={30} /></div>
                            <span>My Courses</span>
                        </button>
                        <button className="quick-btn" onClick={() => navigate('/student/course-registration')}>
                            <div className="qb-icon color-2"><Users size={24} /></div>
                            <span>Choose Faculty</span>
                        </button>
                        <button className="quick-btn" onClick={() => navigate('/student/assignments')}>
                            <div className="qb-icon color-3"><ClipboardList size={30} /></div>
                            <span>Assignments</span>
                        </button>
                        <button className="quick-btn" onClick={() => navigate('/student/results')}>
                            <div className="qb-icon color-4"><Award size={30} /></div>
                            <span>Result</span>
                        </button>
                        <button className="quick-btn" onClick={() => navigate('/student/exam-seating')}>
                            <div className="qb-icon color-5"><FileText size={30} /></div>
                            <span>Exam Seating</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAcademic;
