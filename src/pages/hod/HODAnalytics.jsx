import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    Download,
    FileText,
    BookOpen,
    Calendar,
    Users,
    PieChart,
    MoreHorizontal,
    Search,
    RefreshCw
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import './HODAnalytics.css';

const HODAnalytics = () => {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();

    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!currentUser) return;
            try {
                // Resolve department via HOD UID first
                let dept = userData?.department;
                if (!dept) {
                    const hodRes = await api.get(`/department/by-hod/${currentUser.uid}`);
                    dept = hodRes.data.department;
                }
                if (!dept) return;
                const res = await api.get(`/department/analytics/${dept}`);
                setAnalyticsData(res.data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [currentUser, userData]);

    const gpaData = analyticsData?.performanceDistribution?.map(p => ({
        name: p.category,
        gpa: p.count
    })) || [
            { name: "Fall '21", gpa: 3.2 },
            { name: "Spr '22", gpa: 3.3 },
            { name: "Fall '22", gpa: 3.25 },
            { name: "Spr '23", gpa: 3.4 },
            { name: "Fall '23", gpa: 3.5 },
            { name: "Spr '24", gpa: 3.6 },
        ];

    const attendanceData = analyticsData?.attendanceByYear?.map(a => ({
        name: a.year,
        rate: a.avg
    })) || [
            { name: 'Sep', rate: 92 },
            { name: 'Oct', rate: 95 },
            { name: 'Nov', rate: 88 },
            { name: 'Dec', rate: 85 },
            { name: 'Jan', rate: 96 },
            { name: 'Feb', rate: 94 },
        ];

    const recentReports = analyticsData?.topStudents?.map(s => ({
        title: s.name,
        subtitle: `Roll: ${s.rollNumber}`,
        type: "Student",
        date: `GPA: ${s.gpa}`,
        status: "Good",
        statusColor: "status-ready"
    })) || [];

    return (
        <div className="analytics-container-new">
            <header className="reports-header">
                <div>
                    <h1>Reports & Analytics</h1>
                    <p>View, generate, and export departmental data and performance metrics.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-export">
                        <Download size={16} /> Export Data
                    </button>
                    <button className="btn-new-report">
                        <FileText size={16} /> New Report
                    </button>
                </div>
            </header>

            <div className="reports-cards-grid">
                <div
                    className="report-card"
                    onClick={() => navigate('/department-analytics/academic-performance')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="card-icon blue">
                        <BookOpen size={20} />
                    </div>
                    <h3>Academic Performance</h3>
                    <p>Grades, pass rates, and student progress metrics.</p>
                </div>
                <div
                    className="report-card"
                    onClick={() => navigate('/department-analytics/student-attendance')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="card-icon green">
                        <Calendar size={20} />
                    </div>
                    <h3>Student Attendance</h3>
                    <p>Daily and monthly attendance tracking records.</p>
                </div>
                <div
                    className="report-card"
                    onClick={() => navigate('/department-analytics/faculty-workload')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="card-icon purple">
                        <Users size={20} />
                    </div>
                    <h3>Faculty Workload</h3>
                    <p>Teaching hours, research output, and allocations.</p>
                </div>
                <div
                    className="report-card"
                    onClick={() => navigate('/department-analytics/resource-utilization')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="card-icon orange">
                        <PieChart size={20} />
                    </div>
                    <h3>Resource Utilization</h3>
                    <p>Lab usage, equipment allocation, and budgets.</p>
                </div>
            </div>

            <div className="reports-charts-grid">
                <div className="chart-box">
                    <div className="chart-header">
                        <h3>Average GPA Trend (CS Dept)</h3>
                        <button className="more-btn"><MoreHorizontal size={20} /></button>
                    </div>
                    <div className="chart-content">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={gpaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }} />
                                <Bar dataKey="gpa" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="chart-box">
                    <div className="chart-header">
                        <h3>Monthly Attendance Rate</h3>
                        <button className="more-btn"><MoreHorizontal size={20} /></button>
                    </div>
                    <div className="chart-content">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }} />
                                <Bar dataKey="rate" fill="var(--bg-subtle)" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="recent-reports-section">
                <div className="section-top">
                    <h3>Recent Reports</h3>
                    <div className="search-box">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Search reports..." />
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th>Report Name</th>
                                <th>Type</th>
                                <th>Generated Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentReports.map((report, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div className="report-name-cell">
                                            <span className="rep-title">{report.title}</span>
                                            <span className="rep-subtitle">{report.subtitle}</span>
                                        </div>
                                    </td>
                                    <td><span className="rep-type">{report.type}</span></td>
                                    <td><span className="rep-date">{report.date}</span></td>
                                    <td>
                                        <span className={`status-pill ${report.statusColor}`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="action-icon-btn">
                                            {report.status === 'Processing' ? <RefreshCw size={16} /> : <Download size={16} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HODAnalytics;
