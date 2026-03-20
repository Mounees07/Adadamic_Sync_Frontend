import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    ArrowLeft,
    Printer,
    Download,
    ChevronDown,
    ChevronRight,
    CheckCircle,
    Award,
    AlertTriangle,
    UserX,
    TrendingUp,
    TrendingDown,
    Search,
    Filter,
    Loader2,
    Fingerprint,
    BookOpen
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRows, setExpandedRows] = useState({});
    const [viewMode, setViewMode] = useState('course'); // 'course' | 'biometric'
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | Good | Warning | Critical
    const [showStatusFilter, setShowStatusFilter] = useState(false);

    useEffect(() => {
        const fetchAttendanceData = async () => {
            if (!currentUser) return;
            setLoading(true);
            setError(null);
            try {
                let dept = userData?.department;
                if (!dept) {
                    const hodRes = await api.get(`/department/by-hod/${currentUser.uid}`);
                    dept = hodRes.data.department;
                }
                if (!dept) {
                    setLoading(false);
                    return;
                }
                const res = await api.get(`/department/student-attendance/${dept}`);
                const data = res.data;
                setStats(data.stats || {
                    avgAttendance: 0, avgAttendanceDelta: 0,
                    perfectAttendance: 0, belowThreshold: 0, belowThresholdDelta: 0,
                    unexcusedAbsences: 0, unexcusedAbsencesDelta: 0
                });
                setTrendData(data.trendData || []);
                setAttendanceRecords(data.attendanceRecords || []);
            } catch (err) {
                console.error("Failed to fetch attendance data", err);
                const errorData = err?.response?.data;
                const errorMessage = typeof errorData === 'object'
                    ? (errorData.message || errorData.error || JSON.stringify(errorData))
                    : errorData;
                setError(errorMessage || err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchAttendanceData();
    }, [currentUser, userData]);

    const toggleRow = (idx) => {
        setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const filteredRecords = attendanceRecords.filter(r => {
        const matchesSearch = !searchQuery ||
            r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.id?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'Good') return viewMode === 'course' ? r.attendancePercent >= 85 : (r.bioPercent || 0) >= 85;
        if (statusFilter === 'Warning') return viewMode === 'course' ? (r.attendancePercent >= 75 && r.attendancePercent < 85) : ((r.bioPercent || 0) >= 75 && (r.bioPercent || 0) < 85);
        if (statusFilter === 'Critical') return viewMode === 'course' ? (r.attendancePercent > 0 && r.attendancePercent < 75) : ((r.bioPercent || 0) > 0 && (r.bioPercent || 0) < 75);
        return true;
    });

    const handleExportCSV = () => {
        const headers = viewMode === 'course'
            ? ['Name', 'ID', 'Program', 'Classes Attended', 'Total Classes', 'Attendance %', 'Status']
            : ['Name', 'ID', 'Program', 'Days Present', 'Working Days', 'Biometric %', 'Last Check-in', 'Status'];
        const rows = filteredRecords.map(r => viewMode === 'course'
            ? [r.name, r.id, r.program, r.classesAttended, r.totalClasses, `${r.attendancePercent}%`, r.status]
            : [r.name, r.id, r.program, r.bioPresentDays || 0, r.bioWorkingDays || 0, `${r.bioPercent || 0}%`, r.lastCheckin || '', r.status]
        );
        const csv = [headers, ...rows].map(row => row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `attendance_${viewMode}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="attendance-tracking-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
                <Loader2 size={24} className="spin" />
                <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Loading student attendance data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="attendance-tracking-container">
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '24px', color: '#EF4444', fontSize: '14px' }}>
                    <strong>Failed to load data:</strong> {error}
                </div>
            </div>
        );
    }

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
                        <p>Course-wise &amp; biometric daily attendance records across the department.</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => window.print()}>
                        <Printer size={16} /> Print Report
                    </button>
                    <button className="btn-primary" onClick={handleExportCSV}>
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
                        {attendanceRecords.length > 0 && (
                            <span style={{ marginLeft: '6px', color: '#2563EB', fontWeight: 600 }}>
                                ({((stats.perfectAttendance / attendanceRecords.length) * 100).toFixed(1)}%)
                            </span>
                        )}
                    </div>
                </div>

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
                    <div className="kpi-subtitle" style={{ marginTop: '4px' }}>
                        Across {attendanceRecords.length} enrolled students
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
                    <h2>
                        Student Attendance Records
                        <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>
                            {attendanceRecords.length} students
                        </span>
                    </h2>
                    <div className="table-actions">
                        {/* View Mode Toggle */}
                        <div className="view-mode-toggle">
                            <button
                                className={`toggle-btn ${viewMode === 'course' ? 'active' : ''}`}
                                onClick={() => setViewMode('course')}
                                title="Course-wise attendance"
                            >
                                <BookOpen size={14} /> Course
                            </button>
                            <button
                                className={`toggle-btn ${viewMode === 'biometric' ? 'active' : ''}`}
                                onClick={() => setViewMode('biometric')}
                                title="Biometric / daily check-in attendance"
                            >
                                <Fingerprint size={14} /> Biometric
                            </button>
                        </div>
                        <div className="search-box">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search student ID or name..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <button className="icon-filter-btn" onClick={() => setShowStatusFilter(v => !v)} title="Filter by status">
                                <Filter size={16} />{statusFilter !== 'ALL' && <span style={{ marginLeft: '4px', fontSize: '11px', fontWeight: 700 }}>{statusFilter}</span>}
                            </button>
                            {showStatusFilter && (
                                <div style={{
                                    position: 'absolute', top: '110%', right: 0, zIndex: 99,
                                    background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                                    borderRadius: '12px', padding: '8px', minWidth: '150px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                                }}>
                                    {['ALL', 'Good', 'Warning', 'Critical'].map(s => (
                                        <button key={s} onClick={() => { setStatusFilter(s); setShowStatusFilter(false); }}
                                            style={{
                                                display: 'block', width: '100%', textAlign: 'left',
                                                padding: '8px 12px', background: statusFilter === s ? 'var(--primary)' : 'transparent',
                                                color: statusFilter === s ? 'white' : 'var(--text-primary)',
                                                border: 'none', borderRadius: '8px', cursor: 'pointer',
                                                fontSize: '0.85rem', fontWeight: statusFilter === s ? 700 : 400
                                            }}>
                                            {s === 'ALL' ? '🔍 All Students' : s === 'Good' ? '✅ Good (≥85%)' : s === 'Warning' ? '⚠️ Warning (75-84%)' : '🚨 Critical (<75%)'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- COURSE-WISE TABLE --- */}
                {viewMode === 'course' && (
                    <div className="table-responsive">
                        <table className="attendance-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '28px' }}></th>
                                    <th>Student</th>
                                    <th>ID Number</th>
                                    <th>Program &amp; Year</th>
                                    <th>Classes Attended</th>
                                    <th>Attendance %</th>
                                    <th style={{ textAlign: 'right' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="empty-state-message">
                                            No attendance records available
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record, idx) => (
                                        <React.Fragment key={idx}>
                                            <tr
                                                className={expandedRows[idx] ? 'row-expanded' : ''}
                                                style={{ cursor: (record.courseBreakdown?.length > 0) ? 'pointer' : 'default' }}
                                                onClick={() => record.courseBreakdown?.length > 0 && toggleRow(idx)}
                                            >
                                                <td style={{ padding: '0 4px', textAlign: 'center' }}>
                                                    {record.courseBreakdown?.length > 0 && (
                                                        <span className={`expand-icon ${expandedRows[idx] ? 'rotated' : ''}`}>
                                                            <ChevronRight size={14} />
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="student-cell">
                                                        <div className="student-avatar">
                                                            {record.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="student-info">
                                                            <span className="student-name">{record.name}</span>
                                                            <span className="student-email">{record.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><span className="mono-text">{record.id}</span></td>
                                                <td><span className="program-text">{record.program}</span></td>
                                                <td>
                                                    <span className="classes-text">
                                                        {record.totalClasses > 0
                                                            ? `${record.classesAttended} / ${record.totalClasses}`
                                                            : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No data</span>
                                                        }
                                                        {record.totalClasses === 90 && (
                                                            <span title="Estimated from stored attendance %" style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '4px' }}>~est</span>
                                                        )}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`att-percent ${record.statusClass}`}>
                                                        {record.attendancePercent > 0 ? `${record.attendancePercent}%` : '—'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span className={`status-badge ${record.statusClass}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>

                                            {/* Expandable course breakdown */}
                                            {expandedRows[idx] && record.courseBreakdown?.length > 0 && (
                                                <tr className="course-breakdown-row">
                                                    <td colSpan="7" style={{ padding: '0 0 8px 52px', background: 'var(--bg-subtle)' }}>
                                                        <div className="course-breakdown-container">
                                                            <div className="course-breakdown-title">
                                                                <BookOpen size={13} /> Course-wise Breakdown
                                                            </div>
                                                            <div className="course-breakdown-grid">
                                                                {record.courseBreakdown.map((cb, ci) => (
                                                                    <div key={ci} className="course-breakdown-item">
                                                                        <div className="cb-course-name">{cb.course}</div>
                                                                        <div className="cb-stats">
                                                                            <span className="cb-count">{cb.attended}/{cb.total}</span>
                                                                            <span className={`cb-pct ${cb.statusClass}`}>{cb.percent}%</span>
                                                                        </div>
                                                                        <div className="cb-bar-track">
                                                                            <div className={`cb-bar-fill ${cb.statusClass}`} style={{ width: `${cb.percent}%` }}></div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- BIOMETRIC TABLE --- */}
                {viewMode === 'biometric' && (
                    <div className="table-responsive">
                        <div className="biometric-banner">
                            <Fingerprint size={16} />
                            <span>Dalium Biometric daily check-in attendance — tracks physical presence at college.</span>
                        </div>
                        <table className="attendance-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>ID Number</th>
                                    <th>Program &amp; Year</th>
                                    <th>Days Present</th>
                                    <th>Working Days</th>
                                    <th>Biometric %</th>
                                    <th>Last Check-in</th>
                                    <th style={{ textAlign: 'right' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="empty-state-message">
                                            No biometric records available
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record, idx) => {
                                        const bioPct = record.bioPercent || 0;
                                        let bioStatusClass = 'status-inactive';
                                        let bioStatus = 'No Data';
                                        if (bioPct >= 85) { bioStatusClass = 'status-ready'; bioStatus = 'Good'; }
                                        else if (bioPct >= 75) { bioStatusClass = 'status-processing'; bioStatus = 'Warning'; }
                                        else if (bioPct > 0) { bioStatusClass = 'status-maintenance'; bioStatus = 'Critical'; }

                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <div className="student-cell">
                                                        <div className="student-avatar bio-avatar">
                                                            <Fingerprint size={14} />
                                                        </div>
                                                        <div className="student-info">
                                                            <span className="student-name">{record.name}</span>
                                                            <span className="student-email">{record.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><span className="mono-text">{record.id}</span></td>
                                                <td><span className="program-text">{record.program}</span></td>
                                                <td>
                                                    <span className="classes-text">
                                                        {record.bioTotalDays > 0
                                                            ? `${record.bioPresentDays} / ${record.bioTotalDays}`
                                                            : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No records</span>
                                                        }
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="classes-text">
                                                        {record.bioWorkingDays > 0 ? record.bioWorkingDays : '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`att-percent ${bioStatusClass}`}>
                                                        {bioPct > 0 ? `${bioPct}%` : '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {record.lastCheckin ? (
                                                        <div>
                                                            <span style={{ fontSize: '13px' }}>{record.lastCheckin}</span>
                                                            <span className={`check-status-pill ${record.lastCheckinStatus === 'LATE' ? 'late' : 'present'}`}>
                                                                {record.lastCheckinStatus}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No check-in</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span className={`status-badge ${bioStatusClass}`}>
                                                        {bioStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Summary Legend */}
                {attendanceRecords.length > 0 && (
                    <div style={{ padding: '12px 0 0', display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', marginTop: '8px', flexWrap: 'wrap' }}>
                        {viewMode === 'course' ? (
                            <>
                                <span>✅ Good ≥85%: <strong style={{ color: '#10B981' }}>{attendanceRecords.filter(r => r.attendancePercent >= 85).length}</strong></span>
                                <span>⚠️ Warning 75–84%: <strong style={{ color: '#F59E0B' }}>{attendanceRecords.filter(r => r.attendancePercent >= 75 && r.attendancePercent < 85).length}</strong></span>
                                <span>🚨 Critical &lt;75%: <strong style={{ color: '#EF4444' }}>{attendanceRecords.filter(r => r.attendancePercent > 0 && r.attendancePercent < 75).length}</strong></span>
                                <span>❓ No Data: <strong>{attendanceRecords.filter(r => r.attendancePercent === 0).length}</strong></span>
                                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    💡 Click a row to expand course-wise breakdown
                                </span>
                            </>
                        ) : (
                            <>
                                <span>✅ Good ≥85%: <strong style={{ color: '#10B981' }}>{attendanceRecords.filter(r => (r.bioPercent || 0) >= 85).length}</strong></span>
                                <span>⚠️ Warning 75–84%: <strong style={{ color: '#F59E0B' }}>{attendanceRecords.filter(r => (r.bioPercent || 0) >= 75 && (r.bioPercent || 0) < 85).length}</strong></span>
                                <span>🚨 Critical &lt;75%: <strong style={{ color: '#EF4444' }}>{attendanceRecords.filter(r => (r.bioPercent || 0) > 0 && (r.bioPercent || 0) < 75).length}</strong></span>
                                <span>❓ No Biometric Data: <strong>{attendanceRecords.filter(r => !r.bioTotalDays || r.bioTotalDays === 0).length}</strong></span>
                            </>
                        )}
                    </div>
                )}
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
