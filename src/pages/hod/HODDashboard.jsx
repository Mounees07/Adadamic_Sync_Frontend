import React, { useState, useEffect } from 'react';
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
    const [stats, setStats] = useState({
        faculty: 0,
        projects: 0,
        students: 0,
        courses: 0,
        pendingLeaves: 0
    });
    const [recentRequests, setRecentRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!userData?.department) {
                if (userData) setLoading(false);
                return;
            }
            try {
                const res = await api.get(`/department/dashboard/${userData.department}`);
                const data = res.data;
                setStats({
                    faculty: data.totalFaculty,
                    projects: data.totalCourses,
                    students: data.totalStudents,
                    courses: data.totalCourses,
                    pendingLeaves: data.pendingLeaves
                });
                setRecentRequests(data.recentActivities || []);
            } catch (err) {
                console.error("Failed to fetch department stats", err);
            } finally {
                setLoading(false);
            }
        };
        if (userData) {
            fetchDashboardData();
        }
    }, [userData]);

    // Currently no backend endpoints exist for performance chart or core courses progress, so starting empty.
    const deptPerfData = [];
    const coreCourses = [];

    return (
        <div className="hod-dashboard-container">
            {/* Top Navigation Layout mimicking the image */}
            <header className="hod-top-nav">
                <div className="search-bar-container">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search students, faculty, or courses..." className="hod-search-input" />
                </div>
                <div className="nav-actions">
                    <button className="icon-btn"><Bell size={18} /></button>
                    <button className="icon-btn"><MessageSquare size={18} /></button>
                    <button className="primary-btn new-meeting-btn">
                        <Plus size={16} /> New Meeting
                    </button>
                </div>
            </header>

            {/* Page Title & Semester Dropdown */}
            <div className="hod-page-header">
                <div className="title-section">
                    <h1>Department Overview</h1>
                    <p>Here's what's happening in the {userData?.department || 'Computer Science'} department today.</p>
                </div>
                <div className="semester-select-container">
                    <select className="semester-select">
                        <option>Fall Semester 2024</option>
                        <option>Spring Semester 2024</option>
                    </select>
                </div>
            </div>

            {/* 4 Stats Cards */}
            <div className="hod-stats-grid">
                <div className="hod-stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">Total Students Enrolled</span>
                        <Users size={18} className="stat-icon-top" />
                    </div>
                    <div className="stat-value">{stats.students}</div>
                    <div className="stat-trend neutral">Live Data</div>
                </div>
                <div className="hod-stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">Active Faculty</span>
                        <GraduationCap size={18} className="stat-icon-top" />
                    </div>
                    <div className="stat-value">{stats.faculty}</div>
                    <div className="stat-trend neutral">Live Data</div>
                </div>
                <div className="hod-stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">Ongoing Courses</span>
                        <BookOpen size={18} className="stat-icon-top" />
                    </div>
                    <div className="stat-value">{stats.courses}</div>
                    <div className="stat-trend neutral">Live Data</div>
                </div>
                <div className="hod-stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">Pending Leave Requests</span>
                        <Clock size={18} className="stat-icon-top" />
                    </div>
                    <div className="stat-value">{stats.pendingLeaves}</div>
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
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="previous" fill="#EFF6FF" radius={[4, 4, 0, 0]} barSize={16} />
                                <Bar dataKey="current" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={16} />
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
                            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
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
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                                        No courses data available.
                                    </td>
                                </tr>
                            ) : (
                                coreCourses.map((course, idx) => (
                                    <tr key={idx}>
                                        <td className="font-medium">{course.code}</td>
                                        <td>{course.name}</td>
                                        <td>
                                            <div className="instructor-cell">
                                                <div className="small-avatar bg-light-blue">
                                                    {course.instructor.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                {course.instructor}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="progress-cell">
                                                <div className="progress-bar-bg">
                                                    <div className="progress-bar-fill" style={{ width: `${course.progress}%` }}></div>
                                                </div>
                                                <span className="progress-text">{course.progress}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default HODDashboard;
