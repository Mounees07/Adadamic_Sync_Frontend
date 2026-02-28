import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    BookOpen,
    Award,
    ArrowUp,
    ArrowDown,
    Calendar,
    Activity
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './HODAnalytics.css';

const HODAnalytics = () => {
    const { userData } = useAuth();
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('Sem');
    const [data, setData] = useState(null);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']; // Indigo, Emerald, Amber, Red

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (userData?.department) {
                try {
                    const res = await api.get(`/department/analytics/${userData.department}`);
                    console.log("Analytics Data:", res.data);
                    setData(res.data);
                } catch (error) {
                    console.error("Failed to fetch analytics", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchAnalytics();
    }, [userData]);

    if (loading) return (
        <div className="analytics-container flex justify-center items-center h-screen">
            <div className="text-indigo-500 animate-spin"><Activity size={48} /></div>
        </div>
    );

    if (!data) return (
        <div className="analytics-container flex justify-center items-center h-screen">
            <div className="text-gray-500">No data available.</div>
        </div>
    );

    return (
        <div className="analytics-container">
            <header className="analytics-header">
                <div className="header-content">
                    <h1>Department Analytics</h1>
                    <p>Real-time insights for {userData?.department || 'Engineering'} Department</p>
                </div>
                <div className="time-filter">
                    {['Month', 'Sem', 'Year'].map(t => (
                        <button
                            key={t}
                            className={`filter-btn ${timeRange === t ? 'active' : ''}`}
                            onClick={() => setTimeRange(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </header>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                        <Users size={24} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-value">{data.activeStudents}</span>
                        <span className="kpi-label">Active Students</span>
                        {/* Static delta for now as we don't have historical comparison yet */}
                        <div className="kpi-delta delta-up"><ArrowUp size={12} /> --</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <Activity size={24} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-value">{data.currentAvgAttendance}%</span>
                        <span className="kpi-label">Avg Attendance</span>
                        <div className="kpi-delta delta-up"><ArrowUp size={12} /> --</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <Award size={24} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-value">{data.deptCGPA}</span>
                        <span className="kpi-label">Dept CGPA</span>
                        <div className="kpi-delta delta-up"><ArrowUp size={12} /> --</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                        <BookOpen size={24} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-value">{data.activeCourses}</span>
                        <span className="kpi-label">Active Courses</span>
                        <div className="kpi-delta delta-up"><ArrowUp size={12} /> --</div>
                    </div>
                </div>
            </div>

            <div className="charts-split">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">
                            <TrendingUp className="text-indigo-500" size={20} />
                            Student Enrollment Trends
                        </h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={data.enrollmentTrends}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="#94a3b8" />
                                <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="students"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorStudents)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">
                            <Activity className="text-emerald-500" size={20} />
                            Attendance by Year
                        </h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.attendanceByYear}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="yearClass" axisLine={false} tickLine={false} stroke="#94a3b8" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                                />
                                <Bar dataKey="attendance" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="charts-split" style={{ gridTemplateColumns: '1fr 2fr' }}>
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">
                            <Award className="text-amber-500" size={20} />
                            Grade Distribution
                        </h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.performanceDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.performanceDistribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Top Performing Students</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="performance-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>Rank</th>
                                    <th>Student Name</th>
                                    <th>Roll Number</th>
                                    <th>Attendance</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.topStudents?.map((student, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <div className={`rank-badge rank-${idx + 1}`}>{idx + 1}</div>
                                        </td>
                                        <td>{student.name}</td>
                                        <td className="text-gray-500 font-mono text-xs">{student.roll}</td>
                                        <td>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${student.attendance >= 90 ? 'text-green-500 bg-green-500/10' : 'text-yellow-500 bg-yellow-500/10'}`}>
                                                {student.attendance}%
                                            </span>
                                        </td>
                                        <td style={{ width: '150px' }}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-indigo-400">{student.score}</span>
                                                <div className="progress-bar-bg">
                                                    <div className="progress-bar-fill" style={{ width: `${(student.score / 10) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HODAnalytics;
