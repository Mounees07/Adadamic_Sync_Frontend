import React, { useState, useEffect } from 'react';
import {
    Calendar,
    FileText,
    Users,
    UserCheck,
    AlertTriangle,
    CheckCircle,
    Clock,
    Search,
    BarChart2,
    Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import '../../pages/DashboardOverview.css';
import './COEDashboard.css';

const COEDashboard = () => {
    const { currentUser, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // Instantiated useNavigate hook

    const [recentActivities, setRecentActivities] = useState([]);
    const [statsData, setStatsData] = useState({
        students: 0,
        faculty: 0,
        departments: 0,
        exams: 0
    });

    const [upcomingExams, setUpcomingExams] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Parallel fetching for performance
                const [studentsRes, facultyRes, hodRes, schedulesRes] = await Promise.all([
                    api.get('/users/role/STUDENT').catch(e => { console.error('Students fetch failed', e); return { data: [] }; }),
                    api.get('/users/faculty').catch(e => { console.error('Faculty fetch failed', e); return { data: [] }; }),
                    api.get('/users/role/HOD').catch(e => { console.error('HOD fetch failed', e); return { data: [] }; }),
                    api.get('/schedules').catch(e => { console.error('Schedules fetch failed', e); return { data: [] }; })
                ]);

                // Filter exams from schedules
                const allSchedules = schedulesRes.data || [];
                const exams = allSchedules.filter(s =>
                    s.type === 'INTERNAL_EXAM' || s.type === 'SEMESTER_EXAM'
                );

                // Sort exams by date (nearest first)
                // Sort exams by date (nearest first), handling missing dates
                exams.sort((a, b) => {
                    if (!a.date) return 1;
                    if (!b.date) return -1;
                    return new Date(a.date) - new Date(b.date);
                });

                setStatsData({
                    students: studentsRes.data.length,
                    faculty: facultyRes.data.length,
                    departments: hodRes.data.length,
                    exams: exams.length
                });

                // Map to UI format
                setUpcomingExams(exams.slice(0, 5).map(exam => ({
                    id: exam.id,
                    subject: exam.subjectName || exam.title,
                    code: (exam.title && exam.title.includes('-')) ? exam.title.split('-')[0] : 'N/A', // Heuristic if code is in title
                    date: exam.date,
                    time: `${exam.startTime || ''} - ${exam.endTime || ''}`,
                    venue: exam.location || 'TBD',
                    type: exam.type
                })));

            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            }
        };

        const fetchActivity = async () => {
            try {
                const [resultsRes, schedulesRes] = await Promise.all([
                    api.get('/results/recent-publications').catch(() => ({ data: [] })),
                    api.get('/schedules/recent-uploads').catch(() => ({ data: [] }))
                ]);

                // Process Results (Group by Subject + Sem + Date)
                const rawResults = resultsRes.data;
                const resultGroups = {};
                rawResults.forEach(r => {
                    const key = `${r.subjectName}-${r.semester}-${r.publishedDate}`;
                    if (!resultGroups[key]) {
                        resultGroups[key] = {
                            id: 'RES-' + r.id,
                            action: 'Published Results',
                            detail: `${r.subjectName} (Sem ${r.semester})`,
                            time: r.publishedDate, // Ideally replace with relative time if current date
                            timestamp: new Date(r.publishedDate).getTime(),
                            type: 'result'
                        };
                    }
                });

                // Process Schedules (Use ID as proxy for recency, but display event date)
                // We assume higher ID = newer upload.
                const rawSchedules = schedulesRes.data;
                // We might want to group schedules by Title if uploaded in bulk? 
                // Usually schedules are distinct.
                const scheduleActivities = rawSchedules.slice(0, 10).map(s => ({
                    id: 'SCH-' + s.id,
                    action: 'Updated Schedule',
                    detail: s.title,
                    time: s.date, // Displaying event date
                    timestamp: s.id * 10000000, // Hack: Make schedule IDs weighty to show at top if we lack created_at, OR use ID sort combined with Result Date. 
                    // Better: Use Date.now() for "Just now" if we knew when it was uploaded. 
                    // Since we don't, let's just use the event date as the "Activity Time" context, 
                    // OR acknowledge we can't perfectly sort interleaved legacy data.
                    // Let's rely on the fact we fetched "Recent Uploads" (presumably new) and "Recent Results".
                    // A simple heuristic: mix them and sort by their primary date field.
                    type: 'schedule'
                }));

                const allActivities = [...Object.values(resultGroups), ...scheduleActivities];

                // Sort by "time" (date string) descending might be okay, but results have publishedDate (creation) 
                // while schedules have eventDate (future).
                // Mixing them is tricky. Let's just create a list of "Latest System Actions".
                // Since I added `findTop20ByOrderByIdDesc` for schedules, those ARE the latest actions.
                // results are also sorted by published date.
                // We can't perfectly interleave without a common 'createdAt'.
                // Strategy: Prioritize Items with today's date, then descend.

                // Converting 'time' string to sortable
                allActivities.sort((a, b) => {
                    return new Date(b.time) - new Date(a.time);
                });

                // Format time to relative string (simple)
                const formattedActivities = allActivities.slice(0, 5).map(act => {
                    const d = new Date(act.time);
                    const now = new Date();
                    const diffDays = Math.ceil((now - d) / (1000 * 60 * 60 * 24));
                    let timeStr = act.time;
                    if (diffDays === 0) timeStr = "Today";
                    else if (diffDays === 1) timeStr = "Yesterday";
                    else if (diffDays > 0) timeStr = `${diffDays} days ago`;
                    else timeStr = "Upcoming"; // Negative diff (future schedule)

                    return { ...act, time: timeStr };
                });

                setRecentActivities(formattedActivities);

            } catch (err) {
                console.error("Failed to fetch activity", err);
            }
        };

        fetchStats();
        fetchActivity();
    }, []);

    const stats = [
        { label: 'Upcoming Exams', value: statsData.exams.toString(), icon: Calendar, color: '#4f46e5' },
        { label: 'Total Faculty', value: statsData.faculty.toString(), icon: Users, color: '#f59e0b' },
        { label: 'Active Students', value: statsData.students.toString(), icon: UserCheck, color: '#10b981' },
        { label: 'Departments', value: statsData.departments.toString(), icon: Building, color: '#ef4444' }
    ];

    // removed static recentActivities array provided by backend logic now


    const quickActions = [
        { label: 'Schedule Exam', icon: Calendar },
        { label: 'Publish Results', icon: BarChart2 },
        { label: 'Manage Question Papers', icon: FileText },
        { label: 'Student Verifications', icon: CheckCircle },
    ];

    if (loading) return <div className="loading-screen">Loading...</div>;

    return (
        <div className="dashboard-layout-new">
            {/* LEFT COLUMN - Main Content */}
            <div className="dashboard-main-col">
                <header className="page-header mb-6">
                    <div className="header-greeting">
                        <h1 style={{ fontWeight: 800 }}>Controller of Examinations</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Welcome back, {userData?.fullName || 'COE'}. Here is the exam overview.</p>
                    </div>
                </header>

                {/* 1. Stats Grid */}
                <div className="coe-stats-grid">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="coe-stat-card" style={{ borderTopColor: stat.color }}>
                            <div className="coe-stat-header">
                                <stat.icon size={16} color={stat.color} />
                                <span>{stat.label}</span>
                            </div>
                            <div className="coe-stat-value">{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* 2. Upcoming Exams Section */}
                <div className="coe-dash-card">
                    <div className="coe-card-header">
                        <h3>Upcoming Examinations</h3>
                        <button className="coe-view-all">View All</button>
                    </div>
                    <div className="table-responsive">
                        <table className="coe-table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Code</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Venue</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcomingExams.map(exam => (
                                    <tr key={exam.id}>
                                        <td style={{ fontWeight: 600 }}>{exam.subject}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{exam.code}</td>
                                        <td>{exam.date}</td>
                                        <td>{exam.time}</td>
                                        <td>{exam.venue}</td>
                                        <td><span className="coe-status-pill">SCHEDULED</span></td>
                                    </tr>
                                ))}
                                {upcomingExams.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No upcoming exams found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN - Sidebar */}
            <div className="dashboard-sidebar-col">
                {/* 1. Profile Summary Card */}
                <div className="coe-profile-card">
                    <div className="coe-avatar">
                        {userData?.fullName?.charAt(0) || 'C'}
                    </div>
                    <div className="coe-profile-name">
                        {userData?.fullName || 'COE'}
                    </div>
                    <div className="coe-role-line">
                        <span className="coe-status-circle"></span>
                        <span style={{ color: '#10b981', fontWeight: 600, marginRight: '4px' }}>Active</span> Role: COE
                    </div>
                </div>

                {/* 2. Recent Activity */}
                <div className="coe-dash-card">
                    <div className="coe-card-header" style={{ marginBottom: '1.25rem' }}>
                        <h3>Recent Activity</h3>
                    </div>
                    <div className="coe-timeline">
                        {recentActivities.map((act) => (
                            <div key={act.id} className="coe-timeline-item">
                                <div className="coe-dot"></div>
                                <div>
                                    <div className="coe-act-title">{act.action}</div>
                                    <div className="coe-act-detail">{act.detail}</div>
                                    <div className="coe-act-time">{act.time}</div>
                                </div>
                            </div>
                        ))}
                        {recentActivities.length === 0 && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activity.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default COEDashboard;
