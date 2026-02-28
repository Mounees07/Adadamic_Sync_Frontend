import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
    BookOpen, Search, ChevronDown, UserCheck, ClipboardList,
    Smartphone, Edit3, RefreshCw, Download, Filter
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './TeacherAttendanceLog.css';

const TeacherAttendanceLog = () => {
    const { currentUser } = useAuth();

    // Sections (courses the teacher teaches)
    const [sections, setSections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedSection, setSelectedSection] = useState(null);

    // Date
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    // Sessions for the selected section+date
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);

    // Present students
    const [presentStudents, setPresentStudents] = useState([]);

    // Enrollment count
    const [enrollments, setEnrollments] = useState([]);

    // Loading states
    const [loadingSections, setLoadingSections] = useState(true);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState('otp');

    // OTP state
    const [activeOtpSession, setActiveOtpSession] = useState(null);
    const [generatingOtp, setGeneratingOtp] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [otpProgress, setOtpProgress] = useState(100);

    // Manual entry state
    const [manualAttendance, setManualAttendance] = useState({});
    const [savingManual, setSavingManual] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // ─── Fetch teacher's sections on mount ─────────────────────────────────────
    useEffect(() => {
        if (!currentUser?.uid) return;
        const fetchSections = async () => {
            try {
                const res = await api.get(`/courses/sections/faculty/${currentUser.uid}`);
                setSections(res.data || []);
                if (res.data?.length > 0) {
                    setSelectedSectionId(String(res.data[0].id));
                }
            } catch (e) {
                console.error('Failed to fetch sections', e);
            } finally {
                setLoadingSections(false);
            }
        };
        fetchSections();
    }, [currentUser]);

    // ─── Keep selectedSection in sync ──────────────────────────────────────────
    useEffect(() => {
        if (selectedSectionId && sections.length > 0) {
            const sec = sections.find(s => String(s.id) === selectedSectionId);
            setSelectedSection(sec || null);
        }
    }, [selectedSectionId, sections]);

    // ─── Fetch enrollments when section changes ─────────────────────────────────
    useEffect(() => {
        if (!selectedSectionId) return;
        const fetchEnrollments = async () => {
            try {
                const res = await api.get(`/courses/sections/${selectedSectionId}/enrollments`);
                const filtered = (res.data || []).filter(e => e.student?.role === 'STUDENT');
                setEnrollments(filtered);
                // Initialize manual attendance map
                const map = {};
                filtered.forEach(e => { map[e.student.id] = 'P'; });
                setManualAttendance(map);
            } catch (e) {
                console.error('Failed to fetch enrollments', e);
            }
        };
        fetchEnrollments();
    }, [selectedSectionId]);

    // ─── Fetch active OTP session when section changes ─────────────────────────
    useEffect(() => {
        if (!selectedSectionId) return;
        fetchActiveOtpSession();
    }, [selectedSectionId]);

    const fetchActiveOtpSession = async () => {
        try {
            const res = await api.get(`/course-attendance/sessions/section/${selectedSectionId}/active`);
            setActiveOtpSession(res.data || null);
        } catch (e) {
            setActiveOtpSession(null);
        }
    };

    // ─── Fetch sessions & present list when section or date changes ────────────
    useEffect(() => {
        if (!selectedSectionId || !selectedDate) return;
        fetchSessionsForDate();
    }, [selectedSectionId, selectedDate]);

    const fetchSessionsForDate = async () => {
        setLoadingSessions(true);
        setSessions([]);
        setSelectedSessionId('');
        setSelectedSession(null);
        setPresentStudents([]);
        try {
            const res = await api.get(`/course-attendance/sessions/section/${selectedSectionId}/by-date`, {
                params: { date: selectedDate }
            });
            const sessionList = res.data || [];
            setSessions(sessionList);
            if (sessionList.length > 0) {
                setSelectedSessionId(String(sessionList[0].id));
            }
        } catch (e) {
            console.error('Failed to fetch sessions', e);
        } finally {
            setLoadingSessions(false);
        }
    };

    // ─── Fetch present students when session changes ───────────────────────────
    useEffect(() => {
        if (!selectedSessionId) {
            setPresentStudents([]);
            return;
        }
        const session = sessions.find(s => String(s.id) === selectedSessionId);
        setSelectedSession(session || null);
        fetchPresentStudents(selectedSessionId);
    }, [selectedSessionId, sessions]);

    const fetchPresentStudents = async (sessionId) => {
        setLoadingStudents(true);
        try {
            const res = await api.get(`/course-attendance/sessions/${sessionId}/attendances`);
            setPresentStudents(res.data || []);
        } catch (e) {
            console.error('Failed to fetch present students', e);
        } finally {
            setLoadingStudents(false);
        }
    };

    // ─── OTP Timer ─────────────────────────────────────────────────────────────
    useEffect(() => {
        let interval;
        if (activeOtpSession?.expiresAt && activeOtpSession?.createdAt) {
            interval = setInterval(() => {
                const now = Date.now();
                const expires = new Date(activeOtpSession.expiresAt).getTime();
                const created = new Date(activeOtpSession.createdAt).getTime();
                const remaining = expires - now;
                const totalDur = (expires - created) || (2 * 60 * 1000);
                if (remaining <= 0) {
                    setTimeLeft(0);
                    setOtpProgress(0);
                    setActiveOtpSession(prev => prev ? { ...prev, active: false } : null);
                } else {
                    setTimeLeft(Math.floor(remaining / 1000));
                    setOtpProgress((remaining / totalDur) * 100);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeOtpSession]);

    // ─── Auto-refresh present list while OTP session is active ────────────────
    useEffect(() => {
        if (!activeOtpSession?.active || !selectedSectionId) return;
        // Reload the sessions for today too
        const interval = setInterval(() => {
            if (selectedDate === today) {
                fetchSessionsForDate();
            }
            if (activeOtpSession?.id) {
                fetchPresentStudents(activeOtpSession.id);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [activeOtpSession, selectedSectionId, selectedDate]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // ─── OTP Handlers ──────────────────────────────────────────────────────────
    const handleGenerateOtp = async () => {
        if (!selectedSectionId) return;
        setGeneratingOtp(true);
        try {
            const res = await api.post(`/course-attendance/sessions/generate/${selectedSectionId}?facultyUid=${currentUser.uid}`);
            setActiveOtpSession(res.data);
            alert(`OTP Generated: ${res.data.otp}`);
            // Reload sessions for today
            if (selectedDate === today) {
                setTimeout(fetchSessionsForDate, 500);
            }
        } catch (e) {
            alert('Failed to generate OTP: ' + (e.response?.data || e.message));
        } finally {
            setGeneratingOtp(false);
        }
    };

    const handleDeactivateOtp = async () => {
        if (!activeOtpSession) return;
        try {
            await api.post(`/course-attendance/sessions/${activeOtpSession.id}/deactivate?facultyUid=${currentUser.uid}`);
            setActiveOtpSession(null);
            if (selectedDate === today) fetchSessionsForDate();
        } catch (e) {
            alert('Failed to deactivate session');
        }
    };

    // ─── Manual Entry Handler ──────────────────────────────────────────────────
    const handleSaveManual = async () => {
        if (!selectedSectionId) return;
        setSavingManual(true);
        try {
            const data = Object.entries(manualAttendance).map(([studentId, status]) => ({
                studentId: String(studentId),
                status
            }));
            await api.post(`/course-attendance/sessions/bulk/${selectedSectionId}?facultyUid=${currentUser.uid}`, data);
            alert('Attendance saved successfully!');
            if (selectedDate === today) fetchSessionsForDate();
        } catch (e) {
            alert('Failed to save attendance: ' + (e.response?.data || e.message));
        } finally {
            setSavingManual(false);
        }
    };

    // ─── Stats ─────────────────────────────────────────────────────────────────
    const totalEnrolled = enrollments.length;
    const presentCount = presentStudents.filter(s => s.status === 'P' || s.status === 'PRESENT').length;
    const absentCount = totalEnrolled - presentCount;

    // ─── Filtered present list ─────────────────────────────────────────────────
    const filteredPresent = presentStudents.filter(att => {
        if (!searchQuery) return true;
        const name = att.student?.fullName?.toLowerCase() || '';
        const roll = att.studentRollNumber?.toLowerCase() || '';
        return name.includes(searchQuery.toLowerCase()) || roll.includes(searchQuery.toLowerCase());
    });

    const formatSessionLabel = (session) => {
        if (!session) return 'No Schedule Found';
        const time = new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const type = session.otp === 'MANUAL' ? 'Manual' : 'OTP';
        return `${time} — ${type}${session.active ? ' (Active)' : ''}`;
    };

    // ─── Export CSV ────────────────────────────────────────────────────────────
    const handleExport = () => {
        if (!presentStudents.length) return;
        const headers = ['Name', 'Roll Number', 'Status', 'Time'];
        const rows = presentStudents.map(a => [
            a.student?.fullName || 'Unknown',
            a.studentRollNumber || '-',
            a.status || 'P',
            new Date(a.markedAt).toLocaleTimeString()
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_${selectedDate}_${selectedSectionId}.csv`;
        link.click();
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="att-log-page">
            {/* ── Page Header ── */}
            <div className="att-log-header">
                <div className="att-log-header-left">
                    <div className="att-log-icon-wrap">
                        <UserCheck size={26} />
                    </div>
                    <div>
                        <h1 className="att-log-title">Attendance Log</h1>
                        <p className="att-log-subtitle">Track and manage course attendance records</p>
                    </div>
                </div>
                <button className="att-export-btn" onClick={handleExport} disabled={!presentStudents.length}>
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* ── Filters Row ── */}
            <div className="att-filters-row">
                {/* Class & Section */}
                <div className="att-filter-group">
                    <label className="att-filter-label">
                        <BookOpen size={14} /> Class &amp; Section
                    </label>
                    <div className="att-select-wrap">
                        <select
                            className="att-select"
                            value={selectedSectionId}
                            onChange={e => setSelectedSectionId(e.target.value)}
                            disabled={loadingSections}
                        >
                            {loadingSections && <option>Loading...</option>}
                            {!loadingSections && sections.length === 0 && <option>No Sections Found</option>}
                            {sections.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.id} — {s.course?.name} ({s.semester} {s.year})
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="att-select-icon" />
                    </div>
                </div>

                {/* Date Picker */}
                <div className="att-filter-group">
                    <label className="att-filter-label">
                        <Calendar size={14} /> Date
                    </label>
                    <input
                        type="date"
                        className="att-date-input"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                    />
                </div>

                {/* Session Type */}
                <div className="att-filter-group">
                    <label className="att-filter-label">
                        <Clock size={14} /> Session Type
                    </label>
                    <div className="att-select-wrap">
                        <select
                            className="att-select"
                            value={selectedSessionId}
                            onChange={e => setSelectedSessionId(e.target.value)}
                            disabled={loadingSessions}
                        >
                            {loadingSessions && <option>Loading...</option>}
                            {!loadingSessions && sessions.length === 0 && (
                                <option value="">No Schedule Found</option>
                            )}
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>
                                    {formatSessionLabel(s)}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="att-select-icon" />
                    </div>
                </div>

                {/* Refresh */}
                <button className="att-refresh-btn" onClick={fetchSessionsForDate} title="Refresh">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* ── Stats Bar ── */}
            <div className="att-stats-bar">
                <div className="att-stat-item">
                    <span className="att-stat-dot dot-blue" />
                    Total Enrolled: <b>{totalEnrolled}</b>
                </div>
                <div className="att-stat-item">
                    <span className="att-stat-dot dot-green" />
                    Present: <b>{presentCount}</b>
                </div>
                <div className="att-stat-item">
                    <span className="att-stat-dot dot-red" />
                    Absent: <b>{absentCount > 0 ? absentCount : 0}</b>
                </div>
                {selectedSession && (
                    <div className="att-stat-item att-stat-session-info">
                        <Clock size={13} />
                        Session: <b>{new Date(selectedSession.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>
                    </div>
                )}
            </div>

            {/* ── Tabs ── */}
            <div className="att-tabs">
                <button
                    className={`att-tab ${activeTab === 'otp' ? 'active' : ''}`}
                    onClick={() => setActiveTab('otp')}
                >
                    <Smartphone size={16} /> OTP Verification
                </button>
                <button
                    className={`att-tab ${activeTab === 'manual' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                >
                    <Edit3 size={16} /> Manual Entry
                </button>
            </div>

            {/* ── Main Content Grid ── */}
            <div className="att-content-grid">

                {/* ── LEFT: OTP / Manual Panel ── */}
                <div className="att-left-panel">
                    {activeTab === 'otp' && (
                        <div className="att-panel-card">
                            {!activeOtpSession || !activeOtpSession.active || timeLeft <= 0 ? (
                                /* Generate OTP State */
                                <div className="att-otp-empty">
                                    <div className="att-otp-icon-circle">
                                        <Smartphone size={40} />
                                    </div>
                                    <h3>Generate Session OTP</h3>
                                    <p>Students will enter this one-time password in their application to mark themselves present.</p>
                                    <button
                                        className="att-otp-generate-btn"
                                        onClick={handleGenerateOtp}
                                        disabled={generatingOtp || !selectedSectionId}
                                    >
                                        <Clock size={18} />
                                        {generatingOtp ? 'Generating...' : 'Enable OTP Sign-in'}
                                    </button>
                                </div>
                            ) : (
                                /* Active OTP State */
                                <div className="att-otp-active">
                                    <div className="att-otp-badge">
                                        <span className="att-otp-badge-dot" />
                                        Accepting Responses
                                    </div>
                                    <p className="att-otp-instruction">
                                        Project this screen. Students must enter this 6-digit code to mark themselves present.
                                    </p>
                                    <div className="att-otp-digits">
                                        {activeOtpSession.otp.split('').map((d, i) => (
                                            <div key={i} className="att-otp-digit">{d}</div>
                                        ))}
                                    </div>
                                    <div className="att-otp-timer">
                                        <div className="att-otp-timer-header">
                                            <span>Time Remaining</span>
                                            <span className="att-otp-time-mono">{formatTime(timeLeft)}</span>
                                        </div>
                                        <div className="att-otp-bar-bg">
                                            <div
                                                className="att-otp-bar-fill"
                                                style={{ width: `${otpProgress}%`, background: otpProgress > 50 ? '#6366f1' : otpProgress > 20 ? '#f59e0b' : '#ef4444' }}
                                            />
                                        </div>
                                    </div>
                                    <button className="att-end-session-btn" onClick={handleDeactivateOtp}>
                                        <XCircle size={18} /> End Session Early
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'manual' && (
                        <div className="att-panel-card">
                            <div className="att-manual-header">
                                <h3><ClipboardList size={18} /> Manual Attendance Entry</h3>
                                <p>Mark attendance for each student below and save.</p>
                            </div>
                            {enrollments.length === 0 ? (
                                <div className="att-empty-state">
                                    <Users size={40} />
                                    <p>No enrolled students found for this section.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="att-manual-list">
                                        {enrollments.map(e => (
                                            <div key={e.student.id} className="att-manual-row">
                                                <div className="att-manual-student-info">
                                                    <div className="att-manual-avatar">
                                                        {e.student.fullName?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="att-manual-name">{e.student.fullName}</div>
                                                        <div className="att-manual-roll">{e.student.rollNumber || e.student.id}</div>
                                                    </div>
                                                </div>
                                                <div className="att-manual-status-group">
                                                    {['P', 'A', 'L'].map(status => (
                                                        <button
                                                            key={status}
                                                            className={`att-status-btn att-status-${status} ${manualAttendance[e.student.id] === status ? 'selected' : ''}`}
                                                            onClick={() => setManualAttendance(prev => ({ ...prev, [e.student.id]: status }))}
                                                        >
                                                            {status === 'P' ? 'Present' : status === 'A' ? 'Absent' : 'Late'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        className="att-save-manual-btn"
                                        onClick={handleSaveManual}
                                        disabled={savingManual}
                                    >
                                        {savingManual ? 'Saving...' : 'Save Attendance'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Present Students Panel ── */}
                <div className="att-right-panel">
                    <div className="att-present-card">
                        <div className="att-present-header">
                            <div className="att-present-title">
                                <Users size={18} />
                                {selectedDate === today ? "Today's" : `${new Date(selectedDate + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}`} Verified Students
                                <span className="att-present-count">{filteredPresent.length}</span>
                            </div>
                            {selectedSessionId && (
                                <button
                                    className="att-refresh-small"
                                    onClick={() => fetchPresentStudents(selectedSessionId)}
                                    title="Refresh student list"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            )}
                        </div>

                        {/* Search */}
                        {presentStudents.length > 0 && (
                            <div className="att-search-wrap">
                                <Search size={14} className="att-search-icon" />
                                <input
                                    type="text"
                                    className="att-search-input"
                                    placeholder="Search by name or roll number..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Student List */}
                        <div className="att-present-list-wrap">
                            {loadingStudents ? (
                                <div className="att-loading-state">
                                    <div className="att-spinner" />
                                    <p>Loading attendance data...</p>
                                </div>
                            ) : !selectedSessionId ? (
                                <div className="att-empty-state">
                                    <div className="att-empty-icon">
                                        <Filter size={36} />
                                    </div>
                                    <p className="att-empty-title">No Session Selected</p>
                                    <p className="att-empty-sub">Select a date and session to view present students.</p>
                                </div>
                            ) : filteredPresent.length === 0 ? (
                                <div className="att-empty-state">
                                    <div className="att-empty-icon">
                                        <ClipboardList size={36} />
                                    </div>
                                    <p className="att-empty-title">No attendances yet</p>
                                    <p className="att-empty-sub">
                                        {presentStudents.length > 0
                                            ? 'No results match your search.'
                                            : 'Generate an OTP to start tracking presences.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="att-student-list">
                                    {filteredPresent.map((att, index) => (
                                        <div key={att.id} className={`att-student-row ${index % 2 === 0 ? '' : 'zebra'}`}>
                                            <div className="att-student-left">
                                                <div className="att-student-avatar">
                                                    {att.student?.profilePictureUrl ? (
                                                        <img src={att.student.profilePictureUrl} alt="avatar" />
                                                    ) : (
                                                        att.student?.fullName?.charAt(0) || 'U'
                                                    )}
                                                </div>
                                                <div className="att-student-details">
                                                    <div className="att-student-name">{att.student?.fullName || att.studentName || 'Unknown'}</div>
                                                    <div className="att-student-roll">
                                                        {att.studentRollNumber || att.student?.id || '—'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="att-student-right">
                                                <div className="att-student-time">
                                                    {new Date(att.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className={`att-student-badge ${att.status === 'P' || att.status === 'PRESENT' ? 'badge-present' : att.status === 'L' ? 'badge-late' : 'badge-absent'}`}>
                                                    {att.status === 'P' || att.status === 'PRESENT' ? (
                                                        <><CheckCircle size={13} /> Present</>
                                                    ) : att.status === 'L' ? (
                                                        <><AlertCircle size={13} /> Late</>
                                                    ) : (
                                                        <><XCircle size={13} /> Absent</>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer summary */}
                        {filteredPresent.length > 0 && (
                            <div className="att-present-footer">
                                <span>Showing <b>{filteredPresent.length}</b> of <b>{totalEnrolled}</b> students</span>
                                <span className="att-footer-pct">
                                    {totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0}% attendance
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherAttendanceLog;
