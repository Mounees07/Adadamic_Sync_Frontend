import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
    Users,
    Calendar,
    FileText,
    AlertCircle,
    Clock,
    CheckCircle,
    TrendingUp,
    BookOpen
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import '../../pages/DashboardOverview.css';


const TeacherDashboard = () => {
    const { currentUser } = useAuth();
    const [mySections, setMySections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSections = async () => {
            if (currentUser) {
                try {
                    const res = await api.get(`/courses/sections/faculty/${currentUser.uid}`);
                    console.log("TeacherDashboard fetched sections:", res.data);
                    setMySections(Array.isArray(res.data) ? res.data : []);
                } catch (error) {
                    console.error("Failed to fetch sections", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchSections();
    }, [currentUser]);
    const classData = [
        { name: 'CS101', attendance: 85, performance: 78 },
        { name: 'CS202', attendance: 92, performance: 88 },
        { name: 'CS303', attendance: 78, performance: 82 },
        { name: 'CS404', attendance: 95, performance: 91 },
    ];

    const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981'];

    return (
        <div className="dashboard-overview">
            <header className="page-header">
                <h1>Faculty Dashboard</h1>
                <p>Manage your classes, track student progress, and evaluate submissions.</p>
            </header>

            <div className="stats-grid">

                <div className="stat-card glass-card">
                    <div className="stat-icon attendance"><Users /></div>
                    <div className="stat-info">
                        <span className="label">Total Students</span>
                        <span className="value">184</span>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon tasks"><FileText /></div>
                    <div className="stat-info">
                        <span className="label">Pending Grades</span>
                        <span className="value">12 Items</span>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon gpa"><TrendingUp /></div>
                    <div className="stat-info">
                        <span className="label">Class Avg.</span>
                        <span className="value">84.5%</span>
                    </div>
                </div>
            </div>



            <div className="dashboard-grid">
                <div className="chart-section glass-card">
                    <div className="card-header">
                        <h3>Class Attendance vs Performance</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={classData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                />
                                <Bar dataKey="performance" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="attendance" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="upcoming-section glass-card">
                    <div className="card-header">
                        <h3>Today's Schedule</h3>
                    </div>
                    <div className="deadline-list">
                        <div className="deadline-item">
                            <div className="deadline-icon cs"><Clock /></div>
                            <div className="deadline-info">
                                <h4>Data Structures (CS202)</h4>
                                <p>Room 302 • 10:00 AM</p>
                            </div>
                        </div>
                        <div className="deadline-item">
                            <div className="deadline-icon physics"><Clock /></div>
                            <div className="deadline-info">
                                <h4>Network Security (CS404)</h4>
                                <p>LAB 01 • 01:00 PM</p>
                            </div>
                        </div>
                        <div className="deadline-item">
                            <div className="deadline-icon math"><Clock /></div>
                            <div className="deadline-info">
                                <h4>Faculty Meeting</h4>
                                <p>Conference Room • 04:00 PM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default TeacherDashboard;
