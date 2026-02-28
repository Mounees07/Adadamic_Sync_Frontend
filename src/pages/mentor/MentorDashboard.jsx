import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Plus, Users, ClipboardCheck, Bell, Loader, BookOpen, FileEdit, ArrowLeft, CheckCircle, List, LayoutGrid, Filter, MoreHorizontal, X, Clock, Trash2, Edit2, Smartphone } from 'lucide-react';
import './Mentor.css';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const MentorDashboard = () => {
    const { currentUser, userData } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('Faculty');
    const [activeMenteeFilter, setActiveMenteeFilter] = useState('All');

    // Log Attendance States
    const [isLoggingAttendance, setIsLoggingAttendance] = useState(false);
    const [attendanceMode, setAttendanceMode] = useState('otp');
    const [generatedOtp, setGeneratedOtp] = useState(null);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [otpVerifiedStudents, setOtpVerifiedStudents] = useState([]);

    const [isViewingBoard, setIsViewingBoard] = useState(false);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [isNewCheckInModalOpen, setIsNewCheckInModalOpen] = useState(false);
    const [checkInData, setCheckInData] = useState({
        mentee: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:30',
        topic: 'Academic progress',
        notes: '',
        actionItem: '',
        requiresFollowUp: true
    });
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [newTaskLabels, setNewTaskLabels] = useState(['PRIORITY']);

    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('mentor_tasks');
        return saved ? JSON.parse(saved) : [];
    });

    const [newTaskData, setNewTaskData] = useState({
        title: '',
        assignee: 'Self',
        column: 'Upcoming',
        dueDate: '',
        time: '',
        description: ''
    });

    const [recentInteractions, setRecentInteractions] = useState(() => {
        const saved = localStorage.getItem('mentor_interactions');
        return saved ? JSON.parse(saved) : [];
    });
    const [isViewingMenteeDetails, setIsViewingMenteeDetails] = useState(false);
    const [selectedMentee, setSelectedMentee] = useState(null);
    const [activeMenteeHistoryTab, setActiveMenteeHistoryTab] = useState('All Notes');
    const [isEditMenteeModalOpen, setIsEditMenteeModalOpen] = useState(false);
    const [editMenteeData, setEditMenteeData] = useState({ rollNumber: '', department: '', semester: '', studentStatus: '' });

    useEffect(() => {
        localStorage.setItem('mentor_tasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem('mentor_interactions', JSON.stringify(recentInteractions));
    }, [recentInteractions]);

    useEffect(() => {
        if (location.state && location.state.isViewingMenteeDetails && location.state.selectedMentee) {
            setSelectedMentee(location.state.selectedMentee);
            setIsViewingMenteeDetails(true);
            setActiveTab('Mentor'); // Ensure we switch to mentor tab
            // Optional: clear the state so a refresh doesn't pop it open unexpectedly
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    useEffect(() => {
        if (isNewCheckInModalOpen || isNewTaskModalOpen || isEditMenteeModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isNewCheckInModalOpen, isNewTaskModalOpen, isEditMenteeModalOpen]);

    const handleSaveTask = () => {
        if (!newTaskData.title.trim()) return;

        const isFacultyTask = activeTab === 'Faculty';

        if (editingTaskId) {
            setTasks(prev => prev.map(t => t.id === editingTaskId ? {
                ...t,
                ...newTaskData,
                labels: newTaskLabels,
                isFacultyTask: isFacultyTask,
                updatedAt: new Date().toISOString()
            } : t));
        } else {
            const newTask = {
                id: Date.now().toString(),
                ...newTaskData,
                labels: newTaskLabels,
                isFacultyTask: isFacultyTask,
                createdAt: new Date().toISOString()
            };
            setTasks(prev => [...prev, newTask]);
        }

        closeTaskModal();
    };

    const handleEditTask = (task) => {
        setEditingTaskId(task.id);
        setNewTaskData({
            title: task.title || '',
            assignee: task.assignee || 'Self',
            column: task.column || 'Upcoming',
            dueDate: task.dueDate || '',
            time: task.time || '',
            description: task.description || ''
        });
        setNewTaskLabels(task.labels || []);
        setIsNewTaskModalOpen(true);
    };

    const handleDeleteTask = (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setTasks(prev => prev.filter(t => t.id !== taskId));
        }
    };

    const closeTaskModal = () => {
        setIsNewTaskModalOpen(false);
        setEditingTaskId(null);
        setNewTaskData({
            title: '',
            assignee: 'Self',
            column: 'Upcoming',
            dueDate: '',
            time: '',
            description: ''
        });
        setNewTaskLabels(['PRIORITY']);
    };

    const openCreateTaskModal = (colName = 'Upcoming') => {
        setEditingTaskId(null);
        setNewTaskData({
            title: '',
            assignee: 'Self',
            column: colName,
            dueDate: '',
            time: '',
            description: ''
        });
        setNewTaskLabels(['PRIORITY']);
        setIsNewTaskModalOpen(true);
    };

    const handleInputChange = (field, value) => {
        setNewTaskData(prev => ({ ...prev, [field]: value }));
    };

    const getColTasks = (colName) => {
        const isFacultyTask = activeTab === 'Faculty';
        return tasks.filter(t =>
            t.column.toLowerCase() === colName.toLowerCase() &&
            (t.isFacultyTask === isFacultyTask || t.isFacultyTask === undefined)
        );
    };

    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [availableSchedules, setAvailableSchedules] = useState([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState('');
    const [roster, setRoster] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});

    const [loading, setLoading] = useState(true);
    const [mentees, setMentees] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [facultySections, setFacultySections] = useState([]);
    const [stats, setStats] = useState({
        activeMentees: 0,
        openConcerns: 0,
        pendingCheckIns: 0,
        alertsHigh: 0,
        alertsLow: 0,
        sessionsThisMonth: 0,
        lowGpaCount: 0,
        activeCourses: 0,
        totalStudentsTaught: 0
    });

    useEffect(() => {
        if (userData && userData.role === 'TEACHER') {
            setActiveTab('Faculty');
        }
    }, [userData]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!currentUser) return;
            try {
                // Fetch mentees
                const menteesRes = await api.get(`/users/mentees/${currentUser.uid}`);
                const menteesData = menteesRes.data || [];

                // Fetch meetings
                const meetingsRes = await api.get(`/meetings/mentor/${currentUser.uid}`);
                const meetingsData = meetingsRes.data || [];

                // Fetch faculty sections
                const sectionsRes = await api.get(`/courses/sections/faculty/${currentUser.uid}`);
                const sectionsData = sectionsRes.data || [];

                setMentees(menteesData);
                setMeetings(meetingsData);
                setFacultySections(sectionsData);

                // Calculate stats
                const today = new Date().toDateString();
                const currentMonth = new Date().getMonth();

                const pendingCount = meetingsData.filter(m =>
                    m.status === 'SCHEDULED' && new Date(m.startTime).toDateString() >= today
                ).length;

                const sessionsThisMonth = meetingsData.filter(m =>
                    new Date(m.startTime).getMonth() === currentMonth
                ).length;

                const lowGpaCount = menteesData.filter(m => {
                    const gpa = m.studentDetails?.gpa || m.gpa;
                    return gpa && gpa < 7.0;
                }).length;

                const openConcernsCount = menteesData.filter(m => {
                    const attendance = m.studentDetails?.attendance || m.attendance;
                    return attendance && attendance < 75;
                }).length;

                const totalStudentsTaught = sectionsData.reduce((sum, sec) => sum + (sec.enrollmentCount || 0), 0);
                // Simple mock logic for pending grading (just count sections)
                const pendingGradingCount = sectionsData.length * 2;

                setStats({
                    activeMentees: menteesData.length,
                    openConcerns: openConcernsCount,
                    pendingCheckIns: pendingCount,
                    alertsHigh: openConcernsCount > 0 ? 1 : 0,
                    alertsLow: lowGpaCount > 0 ? 1 : 0,
                    sessionsThisMonth: sessionsThisMonth,
                    lowGpaCount: lowGpaCount,
                    activeCourses: sectionsData.length,
                    totalStudentsTaught: totalStudentsTaught,
                    pendingGrading: pendingGradingCount
                });

            } catch (err) {
                console.error("Error fetching mentor dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [currentUser]);

    useEffect(() => {
        const fetchSchedules = async () => {
            if (!selectedSectionId || !selectedDate) {
                setAvailableSchedules([]);
                return;
            }
            const sec = facultySections.find(s => s.id === parseInt(selectedSectionId) || s.id === selectedSectionId);
            if (!sec) return;

            try {
                const res = await api.get(`/schedules/search?date=${selectedDate}&subjectName=${encodeURIComponent(sec.course?.name || '')}`);
                setAvailableSchedules(res.data || []);
                if (res.data && res.data.length > 0) {
                    setSelectedScheduleId(res.data[0].id);
                } else {
                    setSelectedScheduleId('');
                }
            } catch (e) {
                console.error("Failed to fetch schedules for date", e);
                setAvailableSchedules([]);
            }
        };
        fetchSchedules();
    }, [selectedSectionId, selectedDate, facultySections]);

    // Fetch roster when section OR date changes in Log Attendance
    useEffect(() => {
        const fetchRoster = async () => {
            if (!selectedSectionId) {
                setRoster([]);
                setOtpVerifiedStudents([]);
                return;
            }
            try {
                const res = await api.get(`/courses/sections/${selectedSectionId}/enrollments`);
                setRoster(res.data || []);

                const initialData = {};
                (res.data || []).forEach(enrollment => {
                    initialData[enrollment.student.id] = { status: null, remark: '' };
                });
                setAttendanceData(initialData);

                let fetchId = null;
                let isActive = false;

                // Only check for an active OTP session when viewing today
                const todayStr = new Date().toISOString().split('T')[0];
                const isViewingToday = selectedDate === todayStr;

                if (isViewingToday) {
                    try {
                        const activeRes = await api.get(`/course-attendance/sessions/section/${selectedSectionId}/active`);
                        if (activeRes.data && activeRes.data.id) {
                            fetchId = activeRes.data.id;
                            isActive = true;
                            setGeneratedOtp(activeRes.data.otp);
                            setActiveSessionId(fetchId);
                        }
                    } catch (e) {
                        setActiveSessionId(null);
                        setGeneratedOtp(null);
                    }
                } else {
                    // Viewing a past date — clear any live OTP state
                    setActiveSessionId(null);
                    setGeneratedOtp(null);
                }

                // If no active session found, find any session matching the selected date
                if (!fetchId) {
                    try {
                        const sessionsRes = await api.get(`/course-attendance/sessions/section/${selectedSectionId}`);
                        const sessions = sessionsRes.data || [];
                        // Compare against the selectedDate the user chose (not always today)
                        const selectedDateStr = new Date(selectedDate + 'T00:00:00').toDateString();
                        const matchedSession = sessions.find(s => new Date(s.createdAt).toDateString() === selectedDateStr);
                        if (matchedSession) fetchId = matchedSession.id;
                    } catch (e) { }
                }

                if (fetchId) {
                    try {
                        const attRes = await api.get(`/course-attendance/sessions/${fetchId}/attendances`);
                        const attendances = attRes.data || [];
                        setOtpVerifiedStudents(attendances);

                        const ongoingData = { ...initialData };
                        if (isActive) {
                            Object.keys(ongoingData).forEach(k => ongoingData[k].status = 'A');
                        }
                        attendances.forEach(att => {
                            if (att.student && ongoingData[att.student.id]) {
                                ongoingData[att.student.id].status = att.status;
                                ongoingData[att.student.id].markedAt = att.markedAt;
                            }
                        });
                        setAttendanceData(ongoingData);
                    } catch (e) {
                        setOtpVerifiedStudents([]);
                    }
                } else {
                    setOtpVerifiedStudents([]);
                }

            } catch (e) {
                console.error("Failed to fetch roster", e);
            }
        };
        fetchRoster();
    }, [selectedSectionId, selectedDate]);

    const getInitials = (name) => {
        if (!name) return 'S';
        return name.charAt(0).toUpperCase();
    };

    const getBgClass = (index) => {
        const classes = ['bg-indigo', 'bg-purple', 'bg-blue', 'bg-dark'];
        return classes[index % classes.length];
    };

    const formatDate = () => {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date().toLocaleDateString('en-GB', options);
    };

    // Filter Mentees
    const filteredMentees = mentees.filter(mentee => {
        if (activeMenteeFilter === 'All') return true;

        const gpa = mentee.studentDetails?.gpa || mentee.gpa;
        const attendance = mentee.studentDetails?.attendance || mentee.attendance;

        if (activeMenteeFilter === 'Action required') {
            return (gpa && gpa < 7.0) || (attendance && attendance < 75);
        }

        if (activeMenteeFilter === 'Recent meetings') {
            return recentInteractions.some(interaction => String(interaction.menteeId) === String(mentee.id));
        }

        if (activeMenteeFilter === 'No recent ClipboardList') {
            return !recentInteractions.some(interaction => String(interaction.menteeId) === String(mentee.id));
        }

        return true;
    });

    useEffect(() => {
        let interval;
        const fetchLiveAttendances = async () => {
            if (activeSessionId) {
                try {
                    const res = await api.get(`/course-attendance/sessions/${activeSessionId}/attendances`);
                    const attendances = res.data || [];

                    setOtpVerifiedStudents(attendances);

                    setAttendanceData(prev => {
                        const next = { ...prev };
                        attendances.forEach(att => {
                            if (att.student && next[att.student.id]) {
                                next[att.student.id].status = att.status;
                                next[att.student.id].markedAt = att.markedAt;
                            }
                        });
                        return next;
                    });
                } catch (e) {
                    console.error("Failed to fetch live attendances", e);
                }
            }
        };

        if (generatedOtp && activeSessionId) {
            interval = setInterval(fetchLiveAttendances, 3000);
        }

        return () => clearInterval(interval);
    }, [generatedOtp, activeSessionId]);

    if (loading) {
        return (
            <div className="mw-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Loader className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }

    const isFaculty = activeTab === 'Faculty';

    const handleLogAttendanceClick = () => {
        setIsLoggingAttendance(true);
        setAttendanceMode('otp');
        setGeneratedOtp(null);
        setActiveSessionId(null);
        if (facultySections.length > 0 && !selectedSectionId) {
            setSelectedSectionId(facultySections[0].id);
        }
    };

    const generateOtp = async () => {
        if (!selectedSectionId) {
            alert("Please select a section first.");
            return;
        }
        try {
            const res = await api.post(`/course-attendance/sessions/generate/${selectedSectionId}?facultyUid=${currentUser.uid}`);
            setGeneratedOtp(res.data.otp);
            setActiveSessionId(res.data.id);
            setOtpVerifiedStudents([]);

            // Set all to Absent initially for OTP tracking
            setAttendanceData(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(k => {
                    next[k].status = 'A';
                });
                return next;
            });
        } catch (e) {
            console.error("Failed to generate OTP:", e);
            alert("Could not generate OTP session. " + (e.response?.data?.message || e.message));
        }
    };

    const stopOtpSession = async () => {
        if (!activeSessionId) return;
        try {
            await api.post(`/course-attendance/sessions/${activeSessionId}/deactivate?facultyUid=${currentUser.uid}`);
            setGeneratedOtp(null);
            setActiveSessionId(null);
        } catch (e) {
            console.error("Failed to deactivate session:", e);
            alert("Failed to close session properly.");
        }
    };

    const formatTime = (timeData) => {
        if (!timeData) return '';
        if (typeof timeData === 'string') return timeData.substring(0, 5);
        if (Array.isArray(timeData) && timeData.length >= 2) {
            const h = timeData[0].toString().padStart(2, '0');
            const m = timeData[1].toString().padStart(2, '0');
            return `${h}:${m}`;
        }
        return '';
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status }
        }));
    };

    const handleRemarkChange = (studentId, remark) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], remark }
        }));
    };

    const markAllPresent = () => {
        setAttendanceData(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => {
                next[k].status = 'P';
            });
            return next;
        });
    };

    const handleSaveAttendance = async () => {
        if (!selectedSectionId) return;

        const payload = Object.entries(attendanceData)
            .filter(([_, data]) => data.status) // Only include students that have a status explicitly set
            .map(([studentId, data]) => ({
                studentId,
                status: data.status,
                remark: data.remark
            }));

        if (payload.length === 0) {
            alert("Please mark attendance (P/A/L) for at least one student before saving.");
            return;
        }

        try {
            await api.post(`/course-attendance/sessions/bulk/${selectedSectionId}?facultyUid=${currentUser.uid}`, payload);
            alert("Attendance saved successfully!");
            setIsLoggingAttendance(false); // Go back to dashboard screen
        } catch (e) {
            console.error("Error saving attendance", e);
            alert("Failed to save attendance.");
        }
    };

    const renderLogAttendanceView = () => {
        const totalEnrolled = roster.length;
        let present = 0, absent = 0, late = 0;

        Object.values(attendanceData).forEach(d => {
            if (d.status === 'P') present++;
            if (d.status === 'A') absent++;
            if (d.status === 'L') late++;
        });

        return (
            <div className="mw-card" style={{ marginTop: '20px' }}>
                <div className="log-att-header-row">
                    <div className="log-att-title-group">
                        <button className="back-btn" onClick={() => setIsLoggingAttendance(false)}>
                            <ArrowLeft size={18} />
                        </button>
                        <div className="log-att-title-text">
                            <h1>Log Attendance</h1>
                            <p>Select a class and record attendance for today's session.</p>
                        </div>
                    </div>
                    <div className="log-att-actions">
                        <button className="mw-btn-outline" onClick={() => setIsLoggingAttendance(false)}>Cancel</button>
                        {attendanceMode === 'manual' && selectedDate === new Date().toISOString().split('T')[0] && (
                            <button className="mw-btn-primary" onClick={handleSaveAttendance}>Save Attendance</button>
                        )}
                    </div>
                </div>

                <div className="log-att-form-grid">
                    <div className="form-group">
                        <label>Class & Section</label>
                        <select
                            className="form-control"
                            value={selectedSectionId}
                            onChange={(e) => setSelectedSectionId(e.target.value)}
                        >
                            <option value="">Select a section</option>
                            {facultySections.map(sec => (
                                <option key={sec.id} value={sec.id}>
                                    {sec.course?.code} - {sec.course?.name} (Sem {sec.semester} {sec.course?.department})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Date</label>
                        <input type="date" className="form-control" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Session Type</label>
                        <select className="form-control" value={selectedScheduleId} onChange={(e) => setSelectedScheduleId(e.target.value)}>
                            {availableSchedules.length > 0 ? availableSchedules.map(sch => (
                                <option key={sch.id} value={sch.id}>
                                    {sch.type.replace('_', ' ')} ({formatTime(sch.startTime)} - {formatTime(sch.endTime)})
                                </option>
                            )) : (
                                <option value="">No Schedule Found</option>
                            )}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Topic Covered</label>
                        <input type="text" className="form-control" placeholder="Add topic..." />
                    </div>
                </div>

                <div className="log-att-summary-bar">
                    <div className="summary-stat">
                        <div className="stat-dot dot-purple"></div> Total Enrolled: {totalEnrolled}
                    </div>
                    <div className="summary-stat">
                        <div className="stat-dot dot-green"></div> Present: {present}
                    </div>
                    <div className="summary-stat">
                        <div className="stat-dot dot-red"></div> Absent: {absent}
                    </div>
                    <div className="summary-stat">
                        <div className="stat-dot dot-yellow"></div> Late: {late}
                    </div>
                </div>

                <div className="roster-header" style={{ marginTop: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="mw-tabs" style={{ marginBottom: 0 }}>
                        <button
                            onClick={() => setAttendanceMode('otp')}
                            className={`mw-tab-btn ${attendanceMode === 'otp' ? 'active' : ''}`}
                            title={selectedDate !== new Date().toISOString().split('T')[0] ? 'OTP is only available for today' : ''}
                        >
                            <Smartphone size={14} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} /> OTP Verification
                            {selectedDate !== new Date().toISOString().split('T')[0] && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px', opacity: 0.5 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            )}
                        </button>
                        <button
                            onClick={() => setAttendanceMode('manual')}
                            className={`mw-tab-btn ${attendanceMode === 'manual' ? 'active' : ''}`}
                        >
                            <List size={14} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} /> Manual Entry
                            {selectedDate !== new Date().toISOString().split('T')[0] && (
                                <span style={{ marginLeft: '6px', fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>VIEW ONLY</span>
                            )}
                        </button>
                    </div>

                    {attendanceMode === 'manual' && selectedDate === new Date().toISOString().split('T')[0] && (
                        <button className="mw-text-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={markAllPresent}>
                            <CheckCircle size={14} /> Mark all as Present
                        </button>
                    )}
                </div>

                {attendanceMode === 'otp' ? (
                    <div className="otp-attendance-layout" style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
                        {/* LEFT COLUMN: OTP GENERATION / DISPLAY */}
                        <div className="otp-control-panel" style={{ flex: '1', backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            {selectedDate !== new Date().toISOString().split('T')[0] ? (
                                /* ── Past date: read-only historical notice ── */
                                <div style={{ textAlign: 'center', margin: '40px auto', maxWidth: '360px' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: '#334155' }}>Historical Record</h2>
                                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                                        You are viewing attendance for <strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                                        OTP generation is only available for today's sessions.
                                    </p>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: '#fef9ec', border: '1px solid #fde68a', color: '#92400e', fontSize: '13px', fontWeight: '600' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                        Switch to today to generate a new OTP
                                    </div>
                                </div>
                            ) : !generatedOtp ? (
                                /* ── Today, no active OTP yet ── */
                                <div className="generate-otp-prompt" style={{ textAlign: 'center', margin: '40px auto' }}>
                                    <Smartphone size={48} color="#6366f1" style={{ margin: '0 auto 20px' }} />
                                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>Generate Session OTP</h2>
                                    <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '30px' }}>Students will enter this one-time password in their application to mark themselves present.</p>
                                    <button
                                        onClick={generateOtp}
                                        style={{ padding: '12px 24px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(99, 102, 241, 0.2)' }}
                                    >
                                        <Clock size={18} /> Enable OTP Sign-in
                                    </button>
                                </div>
                            ) : (
                                /* ── Today, active OTP session running ── */
                                <div className="active-otp-display" style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <span style={{ height: '10px', width: '10px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)' }} className="pulse-dot"></span>
                                        <span style={{ color: '#10b981', fontWeight: '600', fontSize: '14px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Sign-in Active</span>
                                    </div>
                                    <div className="otp-code-box" style={{ backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '40px 20px', marginBottom: '30px' }}>
                                        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#64748b', fontWeight: '500' }}>Tell students to enter code:</h3>
                                        <div style={{ letterSpacing: '12px', fontSize: '64px', fontWeight: '800', fontFamily: 'monospace', color: '#334155' }}>
                                            {generatedOtp}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ebf8ff', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3182ce' }}>
                                        <div style={{ textAlign: 'left' }}>
                                            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#2c5282', fontWeight: '600' }}>Live Progress</p>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#4a5568' }}>{present} of {totalEnrolled} students verified today</p>
                                        </div>
                                        <button
                                            onClick={stopOtpSession}
                                            style={{ backgroundColor: 'white', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                                        >
                                            Stop OTP Session
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: RECENTLY VERIFIED CARDS */}
                        <div className="otp-participants-panel" style={{ width: '420px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={18} className="text-indigo-500" />
                                {selectedDate === new Date().toISOString().split('T')[0]
                                    ? "Today's"
                                    : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                } Verified Students ({otpVerifiedStudents.length})
                            </h4>
                            {otpVerifiedStudents.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '500px', paddingRight: '4px' }}>
                                    {otpVerifiedStudents.map((att, idx) => {
                                        const timeStr = att.markedAt ? new Date(att.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";
                                        return (
                                            <div key={att.student?.id || idx} className="fade-in-badge" style={{ padding: '16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeDown 0.3s ease-out forwards', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ backgroundColor: '#ecfdf5', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <CheckCircle size={18} color="#10b981" />
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '2px' }}>{att.studentName || att.student?.fullName || 'Unknown Student'}</span>
                                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>{att.studentRollNumber || att.student?.rollNumber || 'Verified ID'}</span>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>
                                                    <Clock size={14} /> {timeStr}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1', padding: '32px 20px' }}>
                                    {generatedOtp ? (
                                        <>
                                            <Loader size={28} className="animate-spin text-slate-400" style={{ margin: '0 auto 12px auto' }} />
                                            <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#334155', fontWeight: '600' }}>Waiting for Responses</h5>
                                            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>As students enter the code, their verification cards will appear here.</p>
                                        </>
                                    ) : selectedDate !== new Date().toISOString().split('T')[0] ? (
                                        <>
                                            <ClipboardCheck size={32} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
                                            <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#334155', fontWeight: '600' }}>No attendance records found</h5>
                                            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>No OTP or manual attendance was logged for this course on {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.</p>
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardCheck size={32} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
                                            <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#334155', fontWeight: '600' }}>No attendances yet</h5>
                                            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>Generate an OTP to start tracking presences today.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <table className="roster-table">
                        <thead>
                            <tr>
                                <th>STUDENT</th>
                                <th>STATUS</th>
                                <th>REMARKS (OPTIONAL)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roster.map((enrollment, idx) => {
                                const student = enrollment.student;
                                const currentStatus = attendanceData[student.id]?.status || null;
                                const currentRemark = attendanceData[student.id]?.remark || '';

                                return (
                                    <tr key={student.id}>
                                        <td>
                                            <div className="student-cell">
                                                <div className={`mentee-avatar ${getBgClass(idx)}`}>
                                                    {getInitials(student.fullName)}
                                                </div>
                                                <div>
                                                    <h4>{student.fullName}</h4>
                                                    <p>Roll No: {student.rollNumber || `CS2300${idx + 1}`}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="status-toggles">
                                                <button
                                                    className={`toggle-btn btn-p ${currentStatus === 'P' ? 'active' : ''}`}
                                                    onClick={() => handleStatusChange(student.id, 'P')}
                                                    disabled={selectedDate !== new Date().toISOString().split('T')[0]}
                                                    style={selectedDate !== new Date().toISOString().split('T')[0] ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                                >
                                                    P
                                                </button>
                                                <button
                                                    className={`toggle-btn btn-a ${currentStatus === 'A' ? 'active' : ''}`}
                                                    onClick={() => handleStatusChange(student.id, 'A')}
                                                    disabled={selectedDate !== new Date().toISOString().split('T')[0]}
                                                    style={selectedDate !== new Date().toISOString().split('T')[0] ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                                >
                                                    A
                                                </button>
                                                <button
                                                    className={`toggle-btn btn-l ${currentStatus === 'L' ? 'active' : ''}`}
                                                    onClick={() => handleStatusChange(student.id, 'L')}
                                                    disabled={selectedDate !== new Date().toISOString().split('T')[0]}
                                                    style={selectedDate !== new Date().toISOString().split('T')[0] ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                                >
                                                    L
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="remark-input"
                                                placeholder={selectedDate !== new Date().toISOString().split('T')[0] ? 'View only' : 'Add remark...'}
                                                value={currentRemark}
                                                onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                                                disabled={selectedDate !== new Date().toISOString().split('T')[0]}
                                                style={selectedDate !== new Date().toISOString().split('T')[0] ? { opacity: 0.5, cursor: 'not-allowed', background: '#f8fafc' } : {}}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            {roster.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No students enrolled in this section.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        );
    }

    const renderNewCheckInModal = () => {
        if (!isNewCheckInModalOpen) return null;

        const checkInTopics = [
            'Academic progress', 'Career & Internships', 'Personal counseling',
            'Attendance issue', 'General check-in'
        ];

        return createPortal(
            <div className="task-modal-overlay">
                <div className="task-modal-card animate-slide-up" style={{ width: '480px' }}>
                    <div className="task-modal-header" style={{ alignItems: 'flex-start' }}>
                        <div>
                            <h2>New Check-in</h2>
                            <p className="task-modal-subtitle" style={{ fontSize: '0.75rem', marginTop: '4px', margin: 0, color: 'var(--text-muted)' }}>Record a mentoring session or interaction.</p>
                        </div>
                        <button className="task-modal-close" onClick={() => setIsNewCheckInModalOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="task-modal-body" style={{ gap: '1.25rem' }}>
                        <div className="task-form-group">
                            <label className="task-form-label">Mentee</label>
                            <div className="input-icon-wrap" style={{ position: 'relative' }}>
                                <Users size={16} className="input-icon" style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                                <select
                                    className="task-form-select"
                                    style={{ paddingLeft: '2.5rem', appearance: 'auto' }}
                                    value={checkInData.mentee}
                                    onChange={e => setCheckInData({ ...checkInData, mentee: e.target.value })}
                                >
                                    <option value="" style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}>Select a mentee...</option>
                                    {mentees.map(m => (
                                        <option key={m.id} value={m.id} style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}>{m.fullName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="task-form-row">
                            <div className="task-form-group half-width">
                                <label className="task-form-label">Date</label>
                                <div className="input-icon-wrap" style={{ position: 'relative' }}>
                                    <input type="date" className="task-form-input" value={checkInData.date} onChange={e => setCheckInData({ ...checkInData, date: e.target.value })} />
                                </div>
                            </div>
                            <div className="task-form-group half-width">
                                <label className="task-form-label">Time</label>
                                <div className="input-icon-wrap" style={{ position: 'relative' }}>
                                    <input type="time" className="task-form-input" value={checkInData.time} onChange={e => setCheckInData({ ...checkInData, time: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="task-form-group">
                            <label className="task-form-label">Topic / Area</label>
                            <div className="task-labels-container" style={{ gap: '8px' }}>
                                {checkInTopics.map(topic => {
                                    const isSelected = checkInData.topic === topic;
                                    return (
                                        <span
                                            key={topic}
                                            className="topic-badge"
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '0.75rem',
                                                borderRadius: '20px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                border: '1px solid',
                                                borderColor: isSelected ? 'var(--primary)' : 'var(--glass-border)',
                                                backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                                                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => setCheckInData({ ...checkInData, topic })}
                                        >
                                            {topic}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="task-form-group">
                            <label className="task-form-label">Session Notes</label>
                            <textarea
                                className="task-form-input"
                                rows={4}
                                placeholder="Discussed recent performance in internal assessments. Student is doing well but needs to focus more on practical applications. Recommended joining the upcoming technical workshop."
                                style={{ resize: 'none' }}
                                value={checkInData.notes}
                                onChange={e => setCheckInData({ ...checkInData, notes: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="task-form-group">
                            <label className="task-form-label">Action Items</label>
                            <div className="input-icon-wrap" style={{ position: 'relative' }}>
                                <Plus size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="task-form-input"
                                    placeholder="Add a follow-up task..."
                                    style={{ borderStyle: 'dashed', paddingLeft: '2.5rem' }}
                                    value={checkInData.actionItem}
                                    onChange={e => setCheckInData({ ...checkInData, actionItem: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="task-form-group" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <div>
                                <label className="task-form-label" style={{ marginBottom: '4px', display: 'block', color: 'var(--text-primary)' }}>Requires follow-up</label>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Flag this interaction for a future review</p>
                            </div>
                            <div
                                onClick={() => setCheckInData({ ...checkInData, requiresFollowUp: !checkInData.requiresFollowUp })}
                                style={{
                                    width: '36px', height: '20px', borderRadius: '12px',
                                    background: checkInData.requiresFollowUp ? 'var(--primary)' : 'var(--glass-border)',
                                    position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                                }}
                            >
                                <div style={{
                                    width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                                    position: 'absolute', top: '2px', left: checkInData.requiresFollowUp ? '18px' : '2px',
                                    transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="task-modal-footer">
                        <button className="task-cancel-btn" onClick={() => setIsNewCheckInModalOpen(false)}>Cancel</button>
                        <button className="task-create-btn" onClick={() => {
                            if (checkInData.mentee) {
                                const menteeObj = mentees.find(m => String(m.id) === String(checkInData.mentee));
                                const menteeName = menteeObj ? (menteeObj.fullName || 'Unknown Student') : 'Mentee';
                                const newInteraction = {
                                    id: Date.now(),
                                    menteeId: checkInData.mentee,
                                    title: `${checkInData.topic} with ${menteeName}`,
                                    date: `${checkInData.date} \u00B7 ${checkInData.time}`,
                                    notes: checkInData.notes || 'No extensive notes provided.'
                                };
                                setRecentInteractions([newInteraction, ...recentInteractions]);
                                setActiveMenteeFilter('Recent meetings');
                            }
                            setIsNewCheckInModalOpen(false);
                            setCheckInData({ ...checkInData, mentee: '', notes: '', actionItem: '' });
                        }}>Save Check-in</button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    const renderNewTaskModal = () => {
        if (!isNewTaskModalOpen) return null;

        return createPortal(
            <div className="task-modal-overlay">
                <div className="task-modal-card animate-slide-up">
                    <div className="task-modal-header">
                        <h2>{editingTaskId ? 'Edit Task' : 'New Task'}</h2>
                        <button className="task-modal-close" onClick={closeTaskModal}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="task-modal-body">
                        <div className="task-form-group">
                            <label className="task-form-label">Task Title</label>
                            <input
                                type="text"
                                className="task-form-input"
                                placeholder="e.g. Schedule check-in"
                                value={newTaskData.title}
                                onChange={e => handleInputChange('title', e.target.value)}
                            />
                        </div>

                        <div className="task-form-row">
                            <div className="task-form-group half-width">
                                <label className="task-form-label">Assignee</label>
                                <select
                                    className="task-form-select"
                                    value={newTaskData.assignee}
                                    onChange={e => handleInputChange('assignee', e.target.value)}
                                >
                                    <option>Self</option>
                                    <option>Rahul S</option>
                                    <option>Priya M</option>
                                </select>
                            </div>
                            <div className="task-form-group half-width">
                                <label className="task-form-label">Board Column</label>
                                <select
                                    className="task-form-select"
                                    value={newTaskData.column}
                                    onChange={e => handleInputChange('column', e.target.value)}
                                >
                                    <option>Upcoming</option>
                                    <option>This Week</option>
                                    <option>Later</option>
                                    <option>Completed</option>
                                </select>
                            </div>
                        </div>

                        <div className="task-form-row">
                            <div className="task-form-group half-width">
                                <label className="task-form-label">Due Date</label>
                                <div className="input-icon-wrap">
                                    <Calendar size={16} />
                                    <input
                                        type="date"
                                        className="task-form-input has-icon"
                                        value={newTaskData.dueDate}
                                        onChange={e => handleInputChange('dueDate', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="task-form-group half-width">
                                <label className="task-form-label">Time (Optional)</label>
                                <div className="input-icon-wrap">
                                    <Clock size={16} />
                                    <input
                                        type="time"
                                        className="task-form-input has-icon"
                                        value={newTaskData.time}
                                        onChange={e => handleInputChange('time', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="task-form-group">
                            <label className="task-form-label">Labels</label>
                            <div className="task-labels-container">
                                {[
                                    { id: 'PRIORITY', color: 'orange' },
                                    { id: 'MEETING', color: 'blue-indigo' },
                                    { id: 'CAREER', color: 'blue' },
                                    { id: 'ACADEMIC', color: 'yellow' },
                                    { id: 'ADMIN', color: 'gray' },
                                ].map(label => (
                                    <span
                                        key={label.id}
                                        className={`task-label-chip ${newTaskLabels.includes(label.id) ? `selected ${label.color}` : ''}`}
                                        onClick={() => setNewTaskLabels(prev =>
                                            prev.includes(label.id)
                                                ? prev.filter(l => l !== label.id)
                                                : [...prev, label.id]
                                        )}
                                    >
                                        {label.id}
                                    </span>
                                ))}
                                <button className="task-add-label-btn"><Plus size={12} /> NEW LABEL</button>
                            </div>
                        </div>

                        <div className="task-form-group">
                            <label className="task-form-label">Description</label>
                            <textarea
                                className="task-form-input"
                                placeholder="Add details or agenda for this task..."
                                rows={3}
                                style={{ resize: 'none' }}
                                value={newTaskData.description}
                                onChange={e => handleInputChange('description', e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    <div className="task-modal-footer">
                        <button className="task-cancel-btn" onClick={closeTaskModal}>Cancel</button>
                        <button className="task-create-btn" onClick={handleSaveTask}>{editingTaskId ? 'Save Changes' : 'Create Task'}</button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    const renderMenteeDetails = () => {
        if (!selectedMentee) return null;

        const menteeInteractions = recentInteractions.filter(int => String(int.menteeId) === String(selectedMentee.id));

        let filteredHistory = menteeInteractions;
        if (activeMenteeHistoryTab === 'Counseling') {
            filteredHistory = menteeInteractions.filter(i => i.title.toLowerCase().includes('counseling') || i.title.toLowerCase().includes('general'));
        } else if (activeMenteeHistoryTab === 'Academic') {
            filteredHistory = menteeInteractions.filter(i => i.title.toLowerCase().includes('academic') || i.title.toLowerCase().includes('attendance') || i.title.toLowerCase().includes('career'));
        } else if (activeMenteeHistoryTab === 'Disciplinary') {
            filteredHistory = menteeInteractions.filter(i => i.title.toLowerCase().includes('issue') || i.title.toLowerCase().includes('disciplinary'));
        }

        const dept = selectedMentee.department || 'Dept Not Assigned';
        const sem = selectedMentee.semester ? `Sem ${selectedMentee.semester}` : 'Sem Not Assigned';
        const rollNo = selectedMentee.rollNumber || 'Not Assigned';
        const gpa = selectedMentee.gpa;
        const attendance = selectedMentee.attendance;
        const arrears = selectedMentee.arrearCount !== undefined && selectedMentee.arrearCount !== null ? selectedMentee.arrearCount : '0';
        // Assume internalAvg comes from backend later, fallback if null
        const internalAvg = selectedMentee.internalAvg || 'N/A';

        let badgeClass = "on-track";
        let badgeText = "On Track";
        if (selectedMentee.studentStatus) {
            badgeText = selectedMentee.studentStatus;
            badgeClass = badgeText.toLowerCase().includes('track') ? 'on-track' : 'high-priority';
        } else {
            if (gpa && gpa < 7.0) {
                badgeClass = "high-priority";
                badgeText = "High priority";
            } else if (attendance && attendance < 75) {
                badgeClass = "high-priority";
                badgeText = "Low Attd.";
            }
        }

        return (
            <div className="mentee-details-view animate-fade-in" style={{ padding: '0 0px', marginTop: '16px' }}>
                <div className="mw-card" style={{ marginBottom: '24px', padding: '24px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                        <span style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => setIsViewingMenteeDetails(false)}>My Mentees</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>&gt;</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{selectedMentee.fullName || 'Student'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div className={`mentee-avatar bg-indigo`} style={{ width: '72px', height: '72px', fontSize: '2.2rem', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', flexShrink: 0 }}>
                                {getInitials(selectedMentee.fullName)}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <h2 style={{ fontSize: '1.6rem', margin: '0', textTransform: 'uppercase', color: 'var(--text-primary)', fontWeight: '800' }}>{selectedMentee.fullName || 'Unknown Student'}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
                                    <span>{sem} {dept}</span>
                                    <span>&middot;</span>
                                    <span>Roll: {rollNo}</span>
                                    <span>&middot;</span>
                                    <span className={`mw-badge-pill ${badgeClass}`} style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '600' }}>{badgeText}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button className="mw-text-btn" style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', fontSize: '0.9rem' }} onClick={() => {
                                setEditMenteeData({
                                    rollNumber: selectedMentee.rollNumber || '',
                                    department: selectedMentee.department || '',
                                    semester: selectedMentee.semester || '',
                                    studentStatus: selectedMentee.studentStatus || badgeText
                                });
                                setIsEditMenteeModalOpen(true);
                            }}><Edit2 size={16} /> Edit</button>
                            <button className="mw-text-btn" style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}><BookOpen size={16} style={{ marginRight: '8px' }} /> Message</button>
                            <button className="mw-btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', fontSize: '0.9rem' }} onClick={() => {
                                setCheckInData(prev => ({ ...prev, mentee: String(selectedMentee.id) }));
                                setIsNewCheckInModalOpen(true);
                            }}><Plus size={18} style={{ marginRight: '6px' }} /> Log Interaction</button>
                        </div>
                    </div>
                </div>

                <div className="mw-grid" style={{ marginTop: 0 }}>
                    {/* Left Column */}
                    <div className="mw-main">
                        <div className="mw-card">
                            <div className="mw-card-header space-between" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                                <div>
                                    <h2>Student Profile</h2>
                                </div>
                                <button className="mw-text-btn">View full records</button>
                            </div>
                            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>Email Address</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedMentee.email || 'Not provided'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>Phone Number</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedMentee.mobileNumber || 'Not provided'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>Parent Contact</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedMentee.parentContact || 'Not provided'} {selectedMentee.fatherName ? `(${selectedMentee.fatherName})` : ''}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>Accommodation</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedMentee.hostellerDayScholar === 'Hosteller' ? `${selectedMentee.hostelName || 'Hostel'} (Room ${selectedMentee.hostelRoomNo || 'N/A'})` : (selectedMentee.hostellerDayScholar || 'Not provided')}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>Date of Birth</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedMentee.dob || selectedMentee.studentDetails?.dob || 'Not provided'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>Mentoring Batch</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedMentee.batch || 'Not provided'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mw-card">
                            <div className="mw-card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                                <h2>Mentoring History</h2>
                                <p>Past counseling sessions, meetings, and general notes</p>
                            </div>
                            <div className="mw-filters" style={{ padding: '0 24px', marginBottom: '16px' }}>
                                {['All Notes', 'Counseling', 'Academic', 'Disciplinary'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveMenteeHistoryTab(filter)}
                                        className={`mw-filter-btn ${activeMenteeHistoryTab === filter ? 'active' : ''}`}
                                        style={{ margin: 0, marginRight: '8px' }}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                            <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {filteredHistory.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No history found for this category.</p>
                                ) : (
                                    filteredHistory.map(interaction => (
                                        <div key={interaction.id} style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '16px', background: 'var(--bg-subtle)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{interaction.title.split(' with ')[0]}</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{interaction.date}</span>
                                            </div>
                                            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{interaction.notes}</p>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <span className="mw-badge-pill" style={{ background: 'var(--glass-bg)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>{interaction.title.split(' with ')[0]}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="mw-sidebar">


                        <div className="mw-card">
                            <div className="mw-card-header" style={{ borderBottom: 'none', paddingBottom: '12px' }}>
                                <h2 style={{ color: 'var(--text-primary)' }}>Academic Snapshot</h2>
                                <p>Current semester performance</p>
                            </div>
                            <div style={{ padding: '0 24px 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="dashed-box" style={{ padding: '16px', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Current CGPA</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{gpa || 'N/A'}</div>
                                </div>
                                <div className="dashed-box" style={{ padding: '16px', borderRadius: '8px', borderStyle: 'dashed', borderWidth: '1px', borderColor: attendance && attendance < 75 ? '#f59e0b' : 'var(--glass-border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Attendance</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: attendance && attendance < 75 ? '#f59e0b' : 'var(--text-primary)' }}>{attendance ? `${attendance}%` : 'N/A'}</div>
                                </div>
                                <div className="dashed-box" style={{ padding: '16px', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Active Arrears</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: arrears > 0 ? '#ef4444' : 'var(--text-primary)' }}>{arrears}</div>
                                </div>
                                <div className="dashed-box" style={{ padding: '16px', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Internal Avg</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{internalAvg}</div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        );
    };

    const getLabelColor = (labelName) => {
        const mapping = {
            'PRIORITY': 'orange',
            'MEETING': 'blue-indigo',
            'CAREER': 'blue',
            'ACADEMIC': 'yellow',
            'ADMIN': 'gray',
            'REVIEW': 'blue',
            'GROUP ClipboardList': 'yellow',
            'DONE': 'green'
        };
        return mapping[labelName] || 'gray';
    };

    const renderCard = (task) => (
        <div className="board-card-item" key={task.id} style={{ opacity: task.column === 'Completed' ? 0.7 : 1, position: 'relative' }}>
            <div className="card-actions" style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                <button onClick={() => handleEditTask(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <Edit2 size={14} />
                </button>
                <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={14} />
                </button>
            </div>
            {task.labels && task.labels.length > 0 && (
                <div className="board-card-tags" style={{ paddingRight: '40px' }}>
                    {task.labels.map(lbl => (
                        <span key={lbl} className={`board-tag ${getLabelColor(lbl)}`}>{lbl}</span>
                    ))}
                </div>
            )}
            <h4 style={{ textDecoration: task.column === 'Completed' ? 'line-through' : 'none', paddingRight: '40px' }}>{task.title}</h4>
            {task.description && <p>{task.description}</p>}

            {(task.assignee || task.dueDate) && (
                <>
                    <div className="board-card-divider"></div>
                    <div className="board-card-footer">
                        {task.assignee && (
                            <div className="board-card-user">
                                <div className="board-avatar-mini" style={{ backgroundColor: task.assignee === 'Self' ? '#e2e8f0' : '#6366f1', color: task.assignee === 'Self' ? '#475569' : 'white' }}>
                                    {task.assignee === 'Self' ? 'S' : task.assignee.charAt(0)}
                                </div>
                                <span className="board-user-name">{task.assignee}</span>
                            </div>
                        )}
                        {task.dueDate && (
                            <div className="board-card-date"><Calendar size={12} /> {task.dueDate} {task.time}</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );

    const renderTasksBoardView = () => (
        <div style={{ marginTop: '20px' }}>
            <div className="mw-card" style={{ marginBottom: '20px', padding: '1rem 1.5rem' }}>
                <div className="board-header-row" style={{ marginBottom: 0 }}>
                    <div className="board-title-group">
                        <button className="back-btn" onClick={() => setIsViewingBoard(false)}>
                            <ArrowLeft size={18} />
                        </button>
                        <div className="board-title-text">
                            <div className="board-sup-text">{isFaculty ? 'FACULTY WORKSPACE / TASKS' : 'MENTOR WORKSPACE / TASKS'}</div>
                            <h1>{isFaculty ? 'Teaching Tasks Board' : 'Mentoring Tasks Board'}</h1>
                            <p>Organize and track all your {isFaculty ? 'course preps, grading, and tasks' : 'mentoring sessions, follow-ups, and action items'}.</p>
                        </div>
                    </div>
                    <div className="board-actions">
                        <div className="view-toggle">
                            <button className="view-btn"><List size={14} /> List</button>
                            <button className="view-btn active"><LayoutGrid size={14} /> Board</button>
                        </div>
                        <button className="filter-btn-board"><Filter size={14} /> Filters</button>
                        <button className="add-task-btn-top" onClick={() => openCreateTaskModal('Upcoming')}><Plus size={16} /> New Task</button>
                    </div>
                </div>
            </div>

            <div className="board-columns-container custom-scrollbar">

                {/* UPCOMING */}
                <div className="board-col-wrap">
                    <div className="board-col-header">
                        <div className="col-title-group">
                            <h3>UPCOMING</h3>
                            <span className="col-count">{getColTasks('Upcoming').length}</span>
                        </div>
                        <button className="col-more-btn"><MoreHorizontal size={16} /></button>
                    </div>
                    <div className="board-cards-list">
                        {getColTasks('Upcoming').map(renderCard)}
                    </div>
                    <button className="add-task-col-btn" onClick={() => openCreateTaskModal('Upcoming')}><Plus size={14} /> Add a task</button>
                </div>

                {/* THIS WEEK */}
                <div className="board-col-wrap">
                    <div className="board-col-header">
                        <div className="col-title-group">
                            <h3>THIS WEEK</h3>
                            <span className="col-count">{getColTasks('This Week').length}</span>
                        </div>
                        <button className="col-more-btn"><MoreHorizontal size={16} /></button>
                    </div>
                    <div className="board-cards-list">
                        {getColTasks('This Week').map(renderCard)}
                    </div>
                    <button className="add-task-col-btn" onClick={() => openCreateTaskModal('This Week')}><Plus size={14} /> Add a task</button>
                </div>

                {/* LATER */}
                <div className="board-col-wrap">
                    <div className="board-col-header">
                        <div className="col-title-group">
                            <h3>LATER</h3>
                            <span className="col-count">{getColTasks('Later').length}</span>
                        </div>
                        <button className="col-more-btn"><MoreHorizontal size={16} /></button>
                    </div>
                    <div className="board-cards-list">
                        {getColTasks('Later').map(renderCard)}
                    </div>
                    <button className="add-task-col-btn" onClick={() => openCreateTaskModal('Later')}><Plus size={14} /> Add a task</button>
                </div>

                {/* COMPLETED */}
                <div className="board-col-wrap">
                    <div className="board-col-header">
                        <div className="col-title-group">
                            <h3>COMPLETED</h3>
                            <span className="col-count">{getColTasks('Completed').length}</span>
                        </div>
                        <button className="col-more-btn"><MoreHorizontal size={16} /></button>
                    </div>
                    <div className="board-cards-list">
                        {getColTasks('Completed').map(renderCard)}
                    </div>
                </div>

            </div>
        </div>
    );

    const renderMentorView = () => (
        <div className="mw-grid">
            {/* Left Column */}
            <div className="mw-main">

                {/* Mentoring Snapshot */}
                <div className="mw-card">
                    <div className="mw-card-header">
                        <h2>Mentoring snapshot</h2>
                        <p>Key numbers for your assigned mentees</p>
                    </div>
                    <div className="mw-snapshot-grid">
                        <div className="mw-snap-item">
                            <div className="snap-label">ACTIVE MENTEES</div>
                            <div className="snap-value-row">
                                <div className="snap-icon users-icon"><Users size={20} /></div>
                                <span className="snap-value">{stats.activeMentees}</span>
                            </div>
                            <div className="snap-desc">{stats.openConcerns} with open concerns</div>
                        </div>

                        <div className="mw-snap-item">
                            <div className="snap-label">PENDING CHECK-INS</div>
                            <div className="snap-value-row">
                                <div className="snap-icon check-icon"><ClipboardCheck size={20} /></div>
                                <span className="snap-value">{stats.pendingCheckIns}</span>
                            </div>
                            <div className="snap-desc">Due this week</div>
                        </div>

                        <div className="mw-snap-item">
                            <div className="snap-label">MENTOR ALERTS</div>
                            <div className="snap-value-row">
                                <div className="snap-icon alert-icon"><Bell size={20} /></div>
                                <span className="snap-value">{stats.alertsHigh + stats.alertsLow}</span>
                            </div>
                            <div className="snap-desc">{stats.alertsHigh} high - {stats.alertsLow} low</div>
                        </div>
                    </div>
                </div>

                {/* My Mentees */}
                <div className="mw-card">
                    <div className="mw-card-header space-between">
                        <div>
                            <h2>My Mentees</h2>
                            <p>Students assigned to you for mentoring and guidance</p>
                        </div>
                        <button className="mw-text-btn">View all {mentees.length} mentees</button>
                    </div>

                    <div className="mw-filters">
                        {['All', 'Action required', 'Recent meetings', 'No recent ClipboardList'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveMenteeFilter(filter)}
                                className={`mw-filter-btn ${activeMenteeFilter === filter ? 'active' : ''}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <div className="mw-mentee-list">
                        {filteredMentees.length === 0 ? (
                            <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>No mentees found matching criteria.</p>
                        ) : (
                            filteredMentees.slice(0, 4).map((mentee, index) => {
                                const dept = mentee.department || 'Dept Not Assigned';
                                const sem = mentee.semester ? `Sem ${mentee.semester}` : 'Sem Not Assigned';
                                const gpa = mentee.gpa;
                                const attendance = mentee.attendance;

                                let badgeClass = "on-track";
                                let badgeText = "On Track";
                                let subtitle = `${sem} · ${dept}`.trim();

                                if (mentee.studentStatus) {
                                    badgeText = mentee.studentStatus;
                                    // Use specific color classes based on exact dropdown choices
                                    if (badgeText === 'On Track') badgeClass = 'on-track';
                                    else if (badgeText === 'Needs Follow-up') badgeClass = 'follow-up';
                                    else badgeClass = 'high-priority';

                                    subtitle = `${sem} · ${dept} · ${badgeText}`.trim();
                                } else if (gpa && gpa < 7.0) {
                                    badgeClass = "high-priority";
                                    badgeText = "High priority";
                                    subtitle = `${sem} · ${dept} · Low GPA requires attention`.trim();
                                } else if (attendance && attendance < 75) {
                                    badgeClass = "high-priority";
                                    badgeText = "Low Attd.";
                                    subtitle = `${sem} · ${dept} · Attendance requires attention`.trim();
                                } else if (index % 2 !== 0 && index > 0) {
                                    badgeClass = "follow-up";
                                    badgeText = "Follow up";
                                    subtitle = `${sem} · ${dept} · Needs check-in`.trim();
                                }

                                if (activeMenteeFilter === 'Recent meetings') {
                                    const latestInteraction = recentInteractions.find(interaction => String(interaction.menteeId) === String(mentee.id));
                                    if (latestInteraction) {
                                        subtitle = `${latestInteraction.title} · ${latestInteraction.notes}`.trim();
                                        if (subtitle.length > 55) subtitle = subtitle.substring(0, 55) + '...';
                                        badgeClass = "on-track";
                                        badgeText = "Recent";
                                    }
                                }

                                return (
                                    <div
                                        className="mw-mentee-item"
                                        key={mentee.id || index}
                                        onClick={() => {
                                            setSelectedMentee(mentee);
                                            setIsViewingMenteeDetails(true);
                                        }}
                                        style={{ cursor: 'pointer', transition: 'background-color 0.2s', padding: '16px', borderRadius: '12px', marginBottom: '8px' }}
                                    >
                                        <div className="mentee-info">
                                            <div className={`mentee-avatar ${getBgClass(index)}`}>
                                                {getInitials(mentee.fullName)}
                                            </div>
                                            <div className="mentee-details">
                                                <h4>{mentee.fullName || 'Unknown Student'}</h4>
                                                <p>{subtitle}</p>
                                            </div>
                                        </div>
                                        <div className={`mw-badge-pill ${badgeClass}`}>{badgeText}</div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Mentoring Summary */}
                <div className="mw-card">
                    <div className="mw-card-header">
                        <h2>Mentoring summary</h2>
                        <p>Quick overview of your mentoring workload</p>
                    </div>
                    <div className="mw-summary-grid">
                        <div className="mw-summary-item dashed-box">
                            <div className="sum-label">Counseling sessions this month</div>
                            <div className="sum-value">{stats.sessionsThisMonth}</div>
                            <div className="sum-desc">Based on scheduled events</div>
                        </div>
                        <div className="mw-summary-item dashed-box">
                            <div className="sum-label">Pending follow-ups</div>
                            <div className="sum-value">{stats.pendingCheckIns}</div>
                            <div className="sum-desc">Upcoming standard checks</div>
                        </div>
                        <div className="mw-summary-item dashed-box">
                            <div className="sum-label">Mentees with low GPA (&lt; 7)</div>
                            <div className="sum-value">{stats.lowGpaCount}</div>
                            <div className="sum-desc">Academic support needed</div>
                        </div>
                        <div className="mw-summary-item dashed-box">
                            <div className="sum-label">Open counseling notes</div>
                            <div className="sum-value">{stats.openConcerns}</div>
                            <div className="sum-desc">Awaiting closure</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="mw-sidebar">
                {/* Mentoring Tasks */}
                <div className="mw-card">
                    <div className="mw-card-header space-between">
                        <div>
                            <h2>Mentoring tasks</h2>
                            <p>Organize your upcoming sessions and follow-ups</p>
                        </div>
                        <button className="mw-text-btn" onClick={() => setIsViewingBoard(true)}>View full board</button>
                    </div>

                    <div className="mw-kanban">
                        <div className="kanban-col">
                            <div className="kanban-header">Upcoming</div>
                            {getColTasks('Upcoming').length === 0 ? (
                                <div className="kanban-card">
                                    <h4>No scheduled</h4>
                                    <p>events found.</p>
                                </div>
                            ) : getColTasks('Upcoming').slice(0, 2).map((t, i) => (
                                <div className="kanban-card" key={i}>
                                    <h4>{t.title}</h4>
                                    <p>{t.description ? (t.description.length > 20 ? t.description.substring(0, 20) + '...' : t.description) : 'No description'}</p>
                                </div>
                            ))}
                        </div>
                        <div className="kanban-col">
                            <div className="kanban-header">This Week</div>
                            {getColTasks('This Week').length === 0 ? (
                                <div className="kanban-card">
                                    <h4>No tasks</h4>
                                    <p>found.</p>
                                </div>
                            ) : getColTasks('This Week').slice(0, 2).map((t, i) => (
                                <div className="kanban-card highlight" key={i}>
                                    <h4>{t.title}</h4>
                                    <p>{t.description ? (t.description.length > 20 ? t.description.substring(0, 20) + '...' : t.description) : 'No description'}</p>
                                </div>
                            ))}
                        </div>
                        <div className="kanban-col">
                            <div className="kanban-header">Later</div>
                            {getColTasks('Later').length === 0 ? (
                                <div className="kanban-card">
                                    <h4>No tasks</h4>
                                    <p>found.</p>
                                </div>
                            ) : getColTasks('Later').slice(0, 2).map((t, i) => (
                                <div className="kanban-card" key={i}>
                                    <h4>{t.title}</h4>
                                    <p>{t.description ? (t.description.length > 20 ? t.description.substring(0, 20) + '...' : t.description) : 'No description'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mentoring ClipboardList */}
                <div className="mw-card custom-flex-grow">
                    <div className="mw-card-header">
                        <h2>Mentoring ClipboardList</h2>
                        <p>Recent notes and sessions with your mentees</p>
                    </div>

                    <div className="mw-timeline">
                        {recentInteractions.length === 0 ? (
                            <div className="timeline-item">
                                <div className="timeline-dot"></div>
                                <div className="timeline-content">
                                    <h4>No recent ClipboardList</h4>
                                    <p>Your logged interactions will appear here</p>
                                </div>
                            </div>
                        ) : (
                            recentInteractions.slice(0, 5).map(interaction => (
                                <div className="timeline-item" key={interaction.id}>
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <h4>{interaction.title}</h4>
                                        <p>{interaction.date} &middot; {interaction.notes.substring(0, 50)}{interaction.notes.length > 50 ? '...' : ''}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderFacultyView = () => (
        <div className="mw-grid">
            {/* Left Column */}
            <div className="mw-main">

                {/* Teaching Snapshot */}
                <div className="mw-card">
                    <div className="mw-card-header">
                        <h2>Teaching snapshot</h2>
                        <p>Key numbers for your current semester</p>
                    </div>
                    <div className="mw-snapshot-grid">
                        <div className="mw-snap-item">
                            <div className="snap-label">ACTIVE COURSES</div>
                            <div className="snap-value-row">
                                <div className="snap-icon users-icon"><BookOpen size={20} /></div>
                                <span className="snap-value">{stats.activeCourses}</span>
                            </div>
                            <div className="snap-desc">{stats.activeCourses} core</div>
                        </div>

                        <div className="mw-snap-item">
                            <div className="snap-label">PENDING GRADING</div>
                            <div className="snap-value-row">
                                <div className="snap-icon check-icon"><FileEdit size={20} /></div>
                                <span className="snap-value">{stats.pendingGrading || 0}</span>
                            </div>
                            <div className="snap-desc">Assignments due</div>
                        </div>

                        <div className="mw-snap-item">
                            <div className="snap-label">ATTENDANCE ALERTS</div>
                            <div className="snap-value-row">
                                <div className="snap-icon alert-icon"><Bell size={20} /></div>
                                <span className="snap-value">{stats.alertsHigh + stats.alertsLow}</span>
                            </div>
                            <div className="snap-desc">Below 75% limit</div>
                        </div>
                    </div>
                </div>

                {/* My Classes */}
                <div className="mw-card">
                    <div className="mw-card-header space-between">
                        <div>
                            <h2>My Classes</h2>
                            <p>Courses you are teaching this semester</p>
                        </div>
                        <button className="mw-text-btn">View all schedule</button>
                    </div>

                    <div className="mw-filters">
                        {['All', 'Lectures', 'Laboratories', 'Pending grading'].map(filter => (
                            <button
                                key={filter}
                                className={`mw-filter-btn ${filter === 'All' ? 'active' : ''}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <div className="mw-mentee-list">
                        {facultySections.length === 0 ? (
                            <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>No sections found.</p>
                        ) : (
                            facultySections.slice(0, 4).map((section, index) => {
                                const dept = section.course?.department || '';
                                const code = section.course?.code || '';
                                const name = section.course?.name || '';
                                const sem = section.semester ? `Sem ${section.semester}` : '';

                                // Mock dynamic pills based on index
                                let badgeClass = "on-track";
                                let badgeText = "On track";
                                let statusText = "Class scheduled soon";

                                if (index === 1) {
                                    badgeClass = "high-priority";
                                    badgeText = "Action required";
                                    statusText = "Mid-terms grading in progress";
                                } else if (index === 2) {
                                    badgeClass = "met-recently border-only";
                                    badgeText = "Lab pending";
                                    statusText = "Next class tomorrow";
                                }

                                return (
                                    <div className="mw-mentee-item" key={section.id || index}>
                                        <div className="mentee-info">
                                            <div className={`mentee-avatar ${getBgClass(index)}`}>
                                                {code.slice(0, 2)}
                                            </div>
                                            <div className="mentee-details">
                                                <h4>{code} · {name}</h4>
                                                <p>{sem} {dept} · {statusText}</p>
                                            </div>
                                        </div>
                                        <div className={`mw-badge-pill ${badgeClass}`}>{badgeText}</div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Teaching summary */}
                <div className="mw-card">
                    <div className="mw-card-header">
                        <h2>Teaching summary</h2>
                        <p>Quick overview of your academic workload</p>
                    </div>
                    <div className="mw-summary-grid">
                        <div className="mw-summary-item dashed-box">
                            <div className="sum-label">Total Students Taught</div>
                            <div className="sum-value">{stats.totalStudentsTaught}</div>
                            <div className="sum-desc">Across {stats.activeCourses} sections</div>
                        </div>
                        <div className="mw-summary-item dashed-box">
                            <div className="sum-label">Average Attendance</div>
                            <div className="sum-value">82%</div>
                            <div className="sum-desc">Needs improvement</div>
                        </div>
                        <div className="mw-summary-item dashed-box">
                            <div className="sum-label">Assignments Published</div>
                            <div className="sum-value">{facultySections.length * 3}</div>
                            <div className="sum-desc">4 currently active</div>
                        </div>
                        <div className="mw-summary-item dashed-box">
                            <div className="sum-label">Pending Approvals</div>
                            <div className="sum-value">2</div>
                            <div className="sum-desc">Student leave requests</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="mw-sidebar">
                {/* Teaching Tasks */}
                <div className="mw-card">
                    <div className="mw-card-header space-between">
                        <div>
                            <h2>Teaching tasks</h2>
                            <p>Organize your prep and grading</p>
                        </div>
                        <button className="mw-text-btn" onClick={() => setIsViewingBoard(true)}>View full board</button>
                    </div>

                    <div className="mw-kanban">
                        <div className="kanban-col">
                            <div className="kanban-header">Upcoming</div>
                            {getColTasks('Upcoming').length === 0 ? (
                                <div className="kanban-card">
                                    <h4>No scheduled</h4>
                                    <p>events found.</p>
                                </div>
                            ) : getColTasks('Upcoming').slice(0, 2).map((t, i) => (
                                <div className="kanban-card" key={i}>
                                    <h4>{t.title}</h4>
                                    <p>{t.description ? (t.description.length > 20 ? t.description.substring(0, 20) + '...' : t.description) : 'No description'}</p>
                                </div>
                            ))}
                        </div>
                        <div className="kanban-col">
                            <div className="kanban-header">This Week</div>
                            {getColTasks('This Week').length === 0 ? (
                                <div className="kanban-card">
                                    <h4>No tasks</h4>
                                    <p>found.</p>
                                </div>
                            ) : getColTasks('This Week').slice(0, 2).map((t, i) => (
                                <div className="kanban-card highlight" key={i}>
                                    <h4>{t.title}</h4>
                                    <p>{t.description ? (t.description.length > 20 ? t.description.substring(0, 20) + '...' : t.description) : 'No description'}</p>
                                </div>
                            ))}
                        </div>
                        <div className="kanban-col">
                            <div className="kanban-header">Later</div>
                            {getColTasks('Later').length === 0 ? (
                                <div className="kanban-card">
                                    <h4>No tasks</h4>
                                    <p>found.</p>
                                </div>
                            ) : getColTasks('Later').slice(0, 2).map((t, i) => (
                                <div className="kanban-card" key={i}>
                                    <h4>{t.title}</h4>
                                    <p>{t.description ? (t.description.length > 20 ? t.description.substring(0, 20) + '...' : t.description) : 'No description'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Teaching ClipboardList */}
                <div className="mw-card custom-flex-grow">
                    <div className="mw-card-header">
                        <h2>Teaching ClipboardList</h2>
                        <p>Recent actions across your courses</p>
                    </div>

                    <div className="mw-timeline">
                        <div className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <h4>Published Assignment 3 for CSE301</h4>
                                <p>Today · Data Structures arrays and lists</p>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <h4>Recorded attendance for IT201</h4>
                                <p>Yesterday · 4 absentees marked</p>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <h4>Uploaded lecture notes</h4>
                                <p>2 days ago · Algorithms Chapter 4</p>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <h4>Approved leave request for John D</h4>
                                <p>4 days ago · Medical leave</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="mw-container">
            {/* Main Header (Hidden when viewing Full Board) */}
            {!isViewingBoard && !isViewingMenteeDetails && (
                <header className="mw-header-wrap">
                    <div className="mw-header-left">
                        <div className="mw-badge">
                            <span className="mw-star">★</span> {isFaculty ? 'FACULTY VIEW' : 'MENTOR VIEW'}
                        </div>
                        <h1>{isFaculty ? 'Faculty workspace' : 'Mentor workspace'}</h1>
                        <p>{isFaculty ? 'Manage your courses, track student attendance, and review academic performance.' : 'Track your mentees\' progress, schedule counseling sessions, and review well-being alerts.'}</p>
                    </div>

                    <div className="mw-header-right">
                        {userData?.role !== 'TEACHER' && (
                            <div className="mw-tabs">
                                {['Mentor', 'Faculty'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`mw-tab-btn ${activeTab === tab ? 'active' : ''}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="mw-date">
                            <Calendar size={14} /> Today · {formatDate()}
                        </div>
                        <button className="mw-btn-primary" onClick={isFaculty ? handleLogAttendanceClick : () => setIsNewCheckInModalOpen(true)}>
                            <Plus size={14} /> {isFaculty ? 'Log attendance' : 'New check-in'}
                        </button>
                    </div>
                </header>
            )}

            {isViewingMenteeDetails && selectedMentee
                ? renderMenteeDetails()
                : isViewingBoard
                    ? renderTasksBoardView()
                    : isLoggingAttendance && isFaculty
                        ? renderLogAttendanceView()
                        : (isFaculty ? renderFacultyView() : renderMentorView())
            }

            {renderNewTaskModal()}
            {renderNewCheckInModal()}

            {isEditMenteeModalOpen && createPortal(
                <div className="task-modal-overlay">
                    <div className="task-modal-card animate-slide-up" style={{ width: '400px' }}>
                        <div className="task-modal-header">
                            <div>
                                <h2>Edit Mentee Profile</h2>
                                <p className="task-modal-subtitle" style={{ fontSize: '0.75rem', marginTop: '4px', margin: 0, color: 'var(--text-muted)' }}>Update core details for {selectedMentee?.fullName}</p>
                            </div>
                            <button className="task-modal-close" onClick={() => setIsEditMenteeModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="task-modal-body">
                            <div className="form-group row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Roll Number</label>
                                    <input type="text" className="form-control" value={editMenteeData.rollNumber} onChange={e => setEditMenteeData({ ...editMenteeData, rollNumber: e.target.value })} placeholder="e.g. 21CSE045" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Status / Track</label>
                                    <select className="form-control" value={editMenteeData.studentStatus} onChange={e => setEditMenteeData({ ...editMenteeData, studentStatus: e.target.value })} style={{ padding: '8px 12px', fontSize: '0.9rem', color: '#ffffff', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: 'none' }}>
                                        <option value="On Track" style={{ color: '#000' }}>On Track</option>
                                        <option value="High priority" style={{ color: '#000' }}>High priority</option>
                                        <option value="Low Attd." style={{ color: '#000' }}>Low Attd.</option>
                                        <option value="Needs Follow-up" style={{ color: '#000' }}>Needs Follow-up</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Department</label>
                                    <input type="text" className="form-control" value={editMenteeData.department} onChange={e => setEditMenteeData({ ...editMenteeData, department: e.target.value })} placeholder="e.g. CSE" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Semester</label>
                                    <input type="number" className="form-control" value={editMenteeData.semester} onChange={e => setEditMenteeData({ ...editMenteeData, semester: e.target.value })} placeholder="e.g. 6" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                                </div>
                            </div>
                        </div>
                        <div className="task-modal-footer">
                            <button className="task-cancel-btn" onClick={() => setIsEditMenteeModalOpen(false)}>Cancel</button>
                            <button className="task-create-btn" onClick={async () => {
                                try {
                                    const updatePayload = {
                                        rollNumber: editMenteeData.rollNumber,
                                        department: editMenteeData.department,
                                        semester: editMenteeData.semester ? parseInt(editMenteeData.semester) : null,
                                        studentStatus: editMenteeData.studentStatus
                                    };
                                    const res = await api.put(`/users/${selectedMentee.firebaseUid}`, updatePayload);

                                    // Update locally to reflect changes immediately
                                    const updatedUserRes = await api.get(`/users/${selectedMentee.firebaseUid}`);
                                    setSelectedMentee(updatedUserRes.data);

                                    // If we rely on the mentees array for list updates
                                    setMentees(prevMentees => {
                                        if (!prevMentees) return prevMentees;
                                        return prevMentees.map(m => m.firebaseUid === selectedMentee.firebaseUid ? updatedUserRes.data : m);
                                    });
                                    setIsEditMenteeModalOpen(false);
                                } catch (error) {
                                    console.error("Failed to update mentee", error);
                                    alert("Could not update details.");
                                }
                            }}>Save Details</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default MentorDashboard;