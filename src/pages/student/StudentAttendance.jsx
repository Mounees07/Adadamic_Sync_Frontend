import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import { SEMESTER_START_DATE, calculateAttendance } from '../../utils/attendanceUtils';
import { useSettings } from '../../context/SettingsContext';
import './StudentAttendance.css';

const StudentAttendance = () => {
    const { currentUser } = useAuth();
    const { settings: liveSettings } = useSettings();

    // Read admin-configured threshold (fallback 75 if not yet loaded)
    const threshold = Number(liveSettings?.['policy.attendance.threshold'] ?? 75);
    const detainThreshold = Number(liveSettings?.['policy.attendance.detain'] ?? 65);

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alreadyMarked, setAlreadyMarked] = useState(false);
    const [todayStatus, setTodayStatus] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchData();
        checkToday();
    }, [currentUser]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/attendance/student/${currentUser.uid}`);
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const checkToday = async () => {
        try {
            const res = await api.get(`/attendance/check-today/${currentUser.uid}`);
            setAlreadyMarked(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAttendance = async () => {
        try {
            const res = await api.post(`/attendance/mark?studentUid=${currentUser.uid}`);
            setAlreadyMarked(true);
            setTodayStatus(res.data);
            fetchData();
            alert(`Attendance Marked: ${res.data.status}`);
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.error || err.message));
        }
    };

    // ─── Attendance Calculation (shared utility) ────────────────────────────────
    const { percentage, presentDays, absentDays, totalWorkingDays } = calculateAttendance(history);

    const semesterStartLabel = SEMESTER_START_DATE.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
    });

    // Status colour — uses live threshold from admin settings
    const getStatusColor = (pct) => {
        if (pct >= threshold + 10) return { color: '#10b981', label: 'Excellent' };
        if (pct >= threshold) return { color: '#f59e0b', label: 'Satisfactory' };
        if (pct >= detainThreshold) return { color: '#ef4444', label: 'Low – Action Required' };
        return { color: '#dc2626', label: 'Risk of Detainment' };
    };
    const statusInfo = getStatusColor(percentage);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentHistory = history.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(history.length / itemsPerPage);

    const handlePageChange = (page) => setCurrentPage(page);

    if (loading) return <div className="loading-screen"><Loader className="animate-spin" /></div>;

    return (
        <div className="attendance-page">
            {/* ── Header ── */}
            <div className="attendance-header">
                <div>
                    <h1>My Attendance</h1>
                    <p className="att-subtext">
                        Tracking from {semesterStartLabel} · Sundays excluded
                    </p>
                </div>
                <div className="mark-section">
                    <button
                        className="btn-mark"
                        onClick={handleMarkAttendance}
                        disabled={alreadyMarked}
                        style={{ opacity: alreadyMarked ? 0.8 : 1 }}
                    >
                        <CheckCircle size={16} /> {alreadyMarked ? 'Marked' : 'Mark for today'}
                    </button>
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="attendance-stats">
                {/* Attendance Status Card */}
                <div className="stat-card stat-card-left-align">
                    <h3>ATTENDANCE</h3>
                    <p className="stat-value-text">
                        {percentage >= threshold
                            ? `${percentage}%`
                            : `Below ${threshold}% threshold`}
                    </p>
                    <span className="att-status-pill" style={{
                        background: percentage >= threshold ? '#dcfce7' : percentage >= detainThreshold ? '#fef08a' : '#fee2e2',
                        color: percentage >= threshold ? '#166534' : percentage >= detainThreshold ? '#a16207' : '#991b1b'
                    }}>
                        {statusInfo.label}
                    </span>
                </div>

                <div className="stat-card stat-card-left-align">
                    <h3>PRESENT DAYS</h3>
                    <p className="stat-value">{presentDays}</p>
                    <span className="stat-sub">out of {totalWorkingDays} working days</span>
                </div>

                <div className="stat-card stat-card-left-align">
                    <h3>ABSENT DAYS</h3>
                    <p className="stat-value">{absentDays}</p>
                    <span className="stat-sub">Sundays not counted</span>
                </div>

                <div className="stat-card stat-card-left-align">
                    <h3>WORKING DAYS</h3>
                    <p className="stat-value">{totalWorkingDays}</p>
                    <span className="stat-sub">since {semesterStartLabel}</span>
                </div>
            </div>

            {/* ── History Table ── */}
            <div className="history-section">
                <div className="history-header">
                    <h2>Attendance History</h2>
                    <span className="history-subtext">Recent entries • Latest on top</span>
                </div>

                {history.length === 0 ? (
                    <p className="empty-text">No attendance records found.</p>
                ) : (
                    <div className="table-container">
                        <table className="attendance-table">
                            <thead>
                                <tr>
                                    <th className="col-id">#</th>
                                    <th className="col-date">Date</th>
                                    <th className="col-time">Time</th>
                                    <th className="col-status">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentHistory.map((record, idx) => (
                                    <tr key={record.id}>
                                        <td className="col-id">{indexOfFirstItem + idx + 1}</td>
                                        <td className="col-date">{record.date}</td>
                                        <td className="col-time">{record.checkInTime}</td>
                                        <td className="col-status">
                                            <span className={`status-badge ${record.status === 'LATE' ? 'status-late' : 'status-present'}`}>
                                                {record.status === 'LATE' ? 'LATE' : 'PRESENT'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="pagination-controls">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                Previous
                            </button>
                            <div className="pagination-numbers">
                                {/* Page Buttons could go here, but for now we'll match simple style */}
                                <span>Page <strong>{currentPage}</strong> of {totalPages > 0 ? totalPages : 1}</span>
                            </div>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAttendance;
