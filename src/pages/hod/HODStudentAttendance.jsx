import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    ArrowLeft,
    Printer,
    Download,
    ChevronDown,
    CheckCircle,
    Award,
    AlertTriangle,
    UserX,
    TrendingUp,
    TrendingDown,
    Search,
    Filter
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import './HODStudentAttendance.css';

const HODStudentAttendance = () => {
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();

    // States for data (initialized empty/0 to avoid mock system data)
    const [stats, setStats] = useState({
        avgAttendance: 0,
        avgAttendanceDelta: 0,
        perfectAttendance: 0,
        belowThreshold: 0,
        belowThresholdDelta: 0,
        unexcusedAbsences: 0,
        unexcusedAbsencesDelta: 0
    });

    const [trendData, setTrendData] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);

    useEffect(() => {
        const fetchAttendanceData = async () => {
            if (!currentUser) return;
            try {
                let dept = userData?.department;
                if (!dept) {
                    const hodRes = await api.get(`/department/by-hod/${currentUser.uid}`);
                    dept = hodRes.data.department;
                }
                if (!dept) return;
                const res = await api.get(`/department/student-attendance/${dept}`);
                const data = res.data;
                setStats(data.stats);
                setTrendData(data.trendData);
                setAttendanceRecords(data.attendanceRecords);
            } catch (err) {
                console.error("Failed to fetch attendance data", err);
            }
        };
        fetchAttendanceData();
    }, [currentUser, userData]);

    return (
        <div className="attendance-tracking-container">
            {/* Header Section */}
            <header className="attendance-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/department-analytics')}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="header-titles">
                        <h1>Student Attendance Tracking</h1>
                        <p>Daily and monthly attendance records across the department.</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <Printer size={16} /> Print Report
                    </button>
                    <button className="btn-primary">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </header>

            {/* Filters Section */}
            <div className="attendance-filters">
                <div className="filter-group">
                    <button className="filter-dropdown">
                        Semester: Fall 2024 <ChevronDown size={14} />
                    </button>
                    <button className="filter-dropdown">
                        Course: All Courses <ChevronDown size={14} />
                    </button>
                    <button className="filter-dropdown">
                        Year: All Years <ChevronDown size={14} />
                    </button>
                </div>
                <div className="filter-group-right">
                    <button className="filter-dropdown">
                        <CalendarIcon /> Last 30 Days <ChevronDown size={14} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-cards-grid-att">
                {/* Avg Attendance */}
                <div className="kpi-card-att">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Avg. Attendance Rate</span>
                        <CheckCircle size={18} className="kpi-icon text-emerald" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.avgAttendance.toFixed(1)}%</span>
                    </div>
                    <div className={`kpi-trend ${stats.avgAttendanceDelta >= 0 ? 'positive' : 'negative'}`}>
                        {stats.avgAttendanceDelta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {stats.avgAttendanceDelta > 0 ? '+' : ''}{stats.avgAttendanceDelta}% from last month
                    </div>
                </div>

                {/* Perfect Attendance */}
                <div className="kpi-card-att">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Perfect Attendance</span>
                        <Award size={18} className="kpi-icon text-blue" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.perfectAttendance}</span>
                    </div>
                    <div className="kpi-subtitle">
                        Students with 100% attendance
                    </div>
                </div>

                {/* Below Threshold */}
                <div className="kpi-card-att">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Below 75% Threshold</span>
                        <AlertTriangle size={18} className="kpi-icon text-orange" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.belowThreshold}</span>
                    </div>
                    <div className={`kpi-trend ${stats.belowThresholdDelta <= 0 ? 'positive' : 'negative'}`}>
                        {stats.belowThresholdDelta <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                        {stats.belowThresholdDelta > 0 ? '+' : ''}{stats.belowThresholdDelta} students from last week
                    </div>
                </div>

                {/* Unexcused Absences */}
                <div className="kpi-card-att">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Unexcused Absences</span>
                        <UserX size={18} className="kpi-icon text-red" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.unexcusedAbsences}</span>
                    </div>
                    <div className={`kpi-trend ${stats.unexcusedAbsencesDelta <= 0 ? 'positive' : 'negative'}`}>
                        {stats.unexcusedAbsencesDelta <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                        {stats.unexcusedAbsencesDelta > 0 ? '+' : ''}{stats.unexcusedAbsencesDelta}% from last month
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="chart-section-card">
                <div className="section-header">
                    <h2>Weekly Department Attendance Trend (%)</h2>
                    <a href="#" className="view-details-link">View Details</a>
                </div>
                <div className="chart-wrapper">
                    {trendData.length === 0 ? (
                        <div className="empty-state-message">No trend data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }} />
                                <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={24}>
                                    {trendData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.highlightColor || 'var(--bg-subtle)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Table Section */}
            <div className="table-section-card">
                <div className="section-header table-header-flex">
                    <h2>Student Attendance Records</h2>
                    <div className="table-actions">
                        <div className="search-box">
                            <Search size={16} className="search-icon" />
                            <input type="text" placeholder="Search student ID or name..." />
                        </div>
                        <button className="icon-filter-btn">
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>ID Number</th>
                                <th>Program & Year</th>
                                <th>Classes Attended</th>
                                <th>Attendance %</th>
                                <th style={{ textAlign: 'right' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-state-message">
                                        No attendance records available
                                    </td>
                                </tr>
                            ) : (
                                attendanceRecords.map((record, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <div className="student-cell">
                                                <div className="student-avatar">
                                                    {record.name.charAt(0)}
                                                </div>
                                                <div className="student-info">
                                                    <span className="student-name">{record.name}</span>
                                                    <span className="student-email">{record.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="mono-text">{record.id}</span></td>
                                        <td><span className="program-text">{record.program}</span></td>
                                        <td><span className="classes-text">{record.classesAttended} / {record.totalClasses}</span></td>
                                        <td>
                                            <span className={`att-percent ${record.statusClass}`}>
                                                {record.attendancePercent}%
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className={`status-badge ${record.statusClass}`}>
                                                {record.status}
                                            </span>
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

// Helper component
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

export default HODStudentAttendance;
