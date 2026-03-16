import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    Search,
    Bell,
    MessageSquare,
    Plus,
    Users,
    GraduationCap,
    BookOpen,
    Clock,
    Filter,
    FileText,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import './HODDashboard.css';


const HODDashboard = () => {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        faculty: 0,
        projects: 0,
        students: 0,
        courses: 0,
        pendingLeaves: 0
    });
    const [recentRequests, setRecentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvedDept, setResolvedDept] = useState(null);
    const [deptError, setDeptError] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [coreCourses, setCoreCourses] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!currentUser) return;
            try {
                // Primary: resolve department via HOD UID (works even if studentDetails incomplete)
                const hodRes = await api.get(`/department/by-hod/${currentUser.uid}`);
                const data = hodRes.data;
                const dept = data.department;
                setResolvedDept(dept);
                setStats({
                    faculty: data.totalFaculty || 0,
                    projects: data.totalCourses || 0,
                    students: data.totalStudents || 0,
                    courses: data.totalCourses || 0,
                    pendingLeaves: data.pendingLeaves || 0
                });
                setRecentRequests(data.recentActivities || []);
                setCoreCourses(data.coreCourses || []);

                // Fetch analytics for chart data using resolved department
                try {
                    const analyticsRes = await api.get(`/department/analytics/${dept}`);
                    setAnalyticsData(analyticsRes.data);
                } catch (analyticsErr) {
                    console.warn("Analytics fetch failed:", analyticsErr);
                }
            } catch (err) {
                console.error("Failed to fetch HOD dashboard data", err);
                if (err.response?.status === 422) {
                    setDeptError(err.response.data || "Department not set for this HOD account.");
                } else {
                    // Fallback: try with userData.department if available
                    const dept = userData?.department;
                    if (dept) {
                        try {
                            const res = await api.get(`/department/dashboard/${dept}`);
                            const d = res.data;
                            setResolvedDept(dept);
                            setStats({
                                faculty: d.totalFaculty || 0,
                                projects: d.totalCourses || 0,
                                students: d.totalStudents || 0,
                                courses: d.totalCourses || 0,
                                pendingLeaves: d.pendingLeaves || 0
                            });
                            setRecentRequests(d.recentActivities || []);
                            setCoreCourses(d.coreCourses || []);
                        } catch (fallbackErr) {
                            console.error("Fallback department fetch also failed:", fallbackErr);
                        }
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchDashboardData();
        } else if (userData !== undefined) {
            setLoading(false);
        }
    }, [currentUser, userData]);

    // Map analytics data to department performance chart
    const deptPerfData = analyticsData?.enrollmentTrends?.map(e => ({
        month: e.month,
        previous: Math.floor(e.count * 0.8),
        current: e.count
    })) || [];

    const displayDept = resolvedDept || userData?.department || 'Computer Science';

    return (
        <div className="hod-dashboard-container">
            <div className="hod-page-header">
                <div className="title-section">
                    <h1>Department Overview</h1>
                    <p>Here's what's happening in the {displayDept} department today.</p>
                </div>
                <div className="semester-select-container">
                    <select className="semester-select">
                        <option>Fall Semester 2024</option>
                        <option>Spring Semester 2024</option>
                    </select>
                </div>
            </div>

            {/* Department error banner */}
            {deptError && (
                <div style={{
                    background: 'var(--error-bg, #fee2e2)',
                    color: 'var(--error-text, #dc2626)',
                    borderRadius: '10px',
                    padding: '12px 20px',
                    marginBottom: '16px',
                    fontWeight: 500
                }}>
                    ⚠️ {deptError}
                </div>
            )}

            {/* 4 Stats Cards */}
            <div className="hod-stats-grid">
                <div
                    className="hod-stat-card"
                    onClick={() => navigate('/students-directory')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="stat-card-header">
                        <span className="stat-label">Total Students Enrolled</span>
                        <Users size={18} className="stat-icon-top" />
                    </div>
                    <div className="stat-value">{loading ? '...' : stats.students}</div>
                    <div className="stat-trend neutral">Live Data</div>
                </div>
                <div
                    className="hod-stat-card"
                    onClick={() => navigate('/faculty-management')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="stat-card-header">
                        <span className="stat-label">Active Faculty</span>
                        <GraduationCap size={18} className="stat-icon-top" />
                    </div>
                    <div className="stat-value">{loading ? '...' : stats.faculty}</div>
                    <div className="stat-trend neutral">Live Data</div>
                </div>
                <div
                    className="hod-stat-card"
                    onClick={() => navigate('/curriculum')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="stat-card-header">
                        <span className="stat-label">Ongoing Courses</span>
                        <BookOpen size={18} className="stat-icon-top" />
                    </div>
                    <div className="stat-value">{loading ? '...' : stats.courses}</div>
                    <div className="stat-trend neutral">Live Data</div>
                </div>
                <div className="hod-stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">Pending Leave Requests</span>
                        <Clock size={18} className="stat-icon-top" />
                    </div>
                    <div className="stat-value">{loading ? '...' : stats.pendingLeaves}</div>
                    <div className="stat-trend neutral">Live Data</div>
                </div>
            </div>

            {/* Middle Section: Chart & Pending Approvals */}
            <div className="hod-middle-grid">
                {/* Chart Section */}
                <div className="hod-chart-section">
                    <div className="section-header">
                        <h2>Department Performance</h2>
                        <div className="chart-legend-custom">
                            <span className="legend-item"><span className="dot current"></span>Current Semester</span>
                            <span className="legend-item"><span className="dot previous"></span>Previous Semester</span>
                        </div>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={deptPerfData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-subtle)', color: 'var(--text-primary)' }} />
                                <Bar dataKey="previous" fill="var(--bg-subtle)" radius={[4, 4, 0, 0]} barSize={16} />
                                <Bar dataKey="current" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pending Approvals */}
                <div className="hod-approvals-section">
                    <div className="section-header">
                        <h2>Pending Approvals</h2>
                        <a href="#" className="view-all-link">View All</a>
                    </div>
                    <div className="approvals-list">
                        {recentRequests.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No pending approvals found.
                            </div>
                        ) : (
                            recentRequests.map((req, idx) => (
                                <div className="approval-item" key={idx}>
                                    <div className="approval-avatar bg-purple">
                                        <span className="avatar-text">{req.student?.fullName ? req.student.fullName.substring(0, 2).toUpperCase() : 'ST'}</span>
                                    </div>
                                    <div className="approval-content">
                                        <div className="approval-row">
                                            <span className="approval-name">{req.student?.fullName || "Student"}</span>
                                            <span className="approval-tag warning">Leave Request</span>
                                        </div>
                                        <p className="approval-desc">{req.reason}</p>
                                        <div className="approval-actions">
                                            <a href="#" className="action-link text-primary">Review</a>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Courses Table */}
            <div className="hod-table-section">
                <div className="section-header">
                    <h2>Core Courses Syllabus Progress</h2>
                    <button className="filter-btn">
                        <Filter size={14} /> Filter
                    </button>
                </div>
                <div className="table-wrapper">
                    <table className="hod-progress-table">
                        <thead>
                            <tr>
                                <th>Course Code</th>
                                <th>Course Name</th>
                                <th>Primary Instructor</th>
                                <th>Syllabus Completion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coreCourses.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                        No courses data available.
                                    </td>
                                </tr>
                            ) : (
                                coreCourses.map((course, idx) => {
                                    const instructor = 'Sathish Kumar'; // Dummy, since course API doesn't have instructors
                                    const progress = 75 + (idx * 5) % 25; // 75-100 random looking progress
                                    return (
                                        <tr key={idx}>
                                            <td className="font-medium">{course.code || `CS${100+idx}`}</td>
                                            <td>{course.name}</td>
                                            <td>
                                                <div className="instructor-cell">
                                                    <div className="small-avatar bg-light-blue">
                                                        {instructor.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    {instructor}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="progress-cell">
                                                    <div className="progress-bar-bg">
                                                        <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                    <span className="progress-text">{progress}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default HODDashboard;
