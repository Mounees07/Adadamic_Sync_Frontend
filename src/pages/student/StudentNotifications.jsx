import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Bell, CheckCheck, X, AlertTriangle, Clock, CreditCard, FileText, Star, Calendar, Award, GraduationCap } from 'lucide-react';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';
import './StudentNotifications.css';

const TYPE_CONFIG = {
    LOW_ATTENDANCE: { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Attendance' },
    ASSIGNMENT_DUE: { icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Pending Assignment' },
    MARK_UPDATE: { icon: Award, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', label: 'Grades' },
    FEE_DUE: { icon: CreditCard, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'Fee Due' },
    FEE_PAID: { icon: CheckCheck, color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'Payment' },
    LEAVE_UPDATE: { icon: FileText, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', label: 'Leave' },
    EXAM_REMINDER: { icon: Star, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Exam' },
    RESULT_PUBLISHED: { icon: GraduationCap, color: '#14b8a6', bg: 'rgba(20,184,166,0.08)', label: 'Result' },
    SCHEDULE_PUBLISHED: { icon: Calendar, color: '#ec4899', bg: 'rgba(236,72,153,0.08)', label: 'Schedule' },
    REGISTRATION_OPEN: { icon: FileText, color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'Registration' },
    GENERAL: { icon: Bell, color: '#64748b', bg: 'rgba(100,116,139,0.08)', label: 'General' },
};

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

const StudentNotifications = () => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (!currentUser) return;

        const fetchOrSeed = async () => {
            try {
                let res = await api.get(`/notifications/user/${currentUser.uid}`);
                let data = res.data || [];

                if (data.length === 0) {
                    // Seed some dummy notifications if the user has a fresh database
                    const mockData = [
                        { type: 'RESULT_PUBLISHED', title: 'Semester Results Available', message: 'The COE has published the final results for your previous semester. You may now view your SGPA and transcript.' },
                        { type: 'MARK_UPDATE', title: 'Assignment Graded', message: 'Your instructor has graded your Machine Learning Phase 1 Project. You scored 95/100.' },
                        { type: 'LEAVE_UPDATE', title: 'Leave Application Approved', message: 'Your medical leave request from March 15th to March 17th has been approved by your HOD.' },
                        { type: 'FEE_PAID', title: 'Payment Successful', message: 'We have successfully received your semester fee payment. Receipt #80921 has been generated.' },
                        { type: 'SCHEDULE_PUBLISHED', title: 'Timetable Published', message: 'The academic timetable for the upcoming semester has been finalized and uploaded to your portal.' },
                        { type: 'ASSIGNMENT_DUE', title: 'Pending Assignment', message: 'Your Data Structures Assignment #4 is due in exactly 2 days.' },
                        { type: 'EXAM_REMINDER', title: 'Examination Scheduled', message: 'The Machine Learning midterm starts tomorrow at 10:00 AM in Hall B.' },
                        { type: 'LOW_ATTENDANCE', title: 'Attendance Warning', message: 'Your attendance in OS has dropped below the 80% threshold.' },
                        { type: 'REGISTRATION_OPEN', title: 'Course Registration', message: 'Elective course registration is now open. Please register before the final deadline.' },
                        { type: 'GENERAL', title: 'System Notice', message: 'We have successfully provisioned your platform access for the current semester.' },
                    ];
                    for (const m of mockData) {
                        await api.post(`/notifications/user/${currentUser.uid}/create`, m);
                    }
                    res = await api.get(`/notifications/user/${currentUser.uid}`);
                    data = res.data || [];
                }

                // Sort newest first
                data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setNotifications(data);
            } catch (err) {
                console.error("Failed to load notifications", err);
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrSeed();
    }, [currentUser]);

    const markRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (_) { /* ignore */ }
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const markAllRead = async () => {
        try {
            await api.put(`/notifications/user/${currentUser.uid}/read-all`);
        } catch (_) { /* ignore */ }
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const filtered = filter === 'ALL' ? notifications
        : filter === 'UNREAD' ? notifications.filter(n => !n.isRead)
            : notifications.filter(n => n.type === filter);

    if (loading) return <div className="loading-screen"><Hourglass size="40" bgOpacity="0.1" speed="1.75" color="black" /></div>;

    return (
        <div className="notif-page">
            <div className="notif-header">
                <div>
                    <h1><Bell size={22} style={{ display: 'inline', marginRight: 8, color: '#6366f1' }} />Notifications</h1>
                    <p className="notif-subtitle">
                        {unreadCount > 0 ? <span className="notif-unread-count">{unreadCount} unread</span> : 'All caught up! 🎉'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn-mark-all" onClick={markAllRead}>
                        <CheckCheck size={16} /> Mark all read
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="notif-filters">
                {['ALL', 'UNREAD', ...Object.keys(TYPE_CONFIG).filter(k => k !== 'GENERAL')].map(f => (
                    <button key={f}
                        className={`filter-tab ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}>
                        {f === 'ALL' ? 'All' : f === 'UNREAD' ? `Unread (${unreadCount})` : TYPE_CONFIG[f]?.label || f}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="notif-list">
                {filtered.length === 0 ? (
                    <div className="notif-empty">
                        <Bell size={48} opacity={0.2} />
                        <p>No notifications here.</p>
                    </div>
                ) : (
                    filtered.map((n) => {
                        const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.GENERAL;
                        const Icon = cfg.icon;
                        return (
                            <div key={n.id}
                                className={`notif-item ${n.isRead ? 'read' : 'unread'}`}
                                onClick={() => !n.isRead && markRead(n.id)}>
                                <div className="notif-icon-wrap" style={{ background: cfg.bg }}>
                                    <Icon size={18} color={cfg.color} />
                                </div>
                                <div className="notif-body">
                                    <div className="notif-title">
                                        {n.title}
                                        {!n.isRead && <span className="notif-dot" />}
                                    </div>
                                    <div className="notif-message">{n.message}</div>
                                    <div className="notif-meta">
                                        <span className="notif-type-tag" style={{ color: cfg.color, background: cfg.bg }}>
                                            {cfg.label}
                                        </span>
                                        <span className="notif-time">{timeAgo(n.createdAt)}</span>
                                    </div>
                                </div>
                                {!n.isRead && (
                                    <button className="notif-read-btn" onClick={(e) => { e.stopPropagation(); markRead(n.id); }}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StudentNotifications;
