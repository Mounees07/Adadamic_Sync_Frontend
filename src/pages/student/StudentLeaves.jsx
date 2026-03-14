import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    Plus, Search, Loader, Filter, ChevronRight, User, X,
    BellOff, Calendar, FileText, Clock, CheckCircle, XCircle, Trash2, Loader2
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import FeatureGate from '../../components/FeatureGate';
import './StudentLeaves.css';
import '../mentor/FacultyLeaves.css'; // Reuse faculty styles
import LoaderComponent from '../../components/Loader';

const STATUS_LABELS = {
    PENDING: { label: 'Pending', cls: 'pending' },
    PARENT_APPROVED: { label: 'Parent Approved', cls: 'approved' }, // Orange/Blue technically but using approved class
    APPROVED: { label: 'Fully Approved', cls: 'approved' },
    REJECTED: { label: 'Rejected', cls: 'rejected' },
    REJECTED_BY_PARENT: { label: 'Parent Rejected', cls: 'rejected' },
};

const getStatusMeta = (leave) => {
    if (!leave) return STATUS_LABELS.PENDING;
    const s = leave.mentorStatus || 'PENDING';
    if (s === 'APPROVED') return STATUS_LABELS.APPROVED;
    if (s.includes('REJECTED')) return STATUS_LABELS.REJECTED;
    if (leave.parentStatus === 'APPROVED') return STATUS_LABELS.PARENT_APPROVED;
    if (leave.parentStatus === 'REJECTED') return STATUS_LABELS.REJECTED_BY_PARENT;
    return STATUS_LABELS.PENDING;
};

const StudentLeaves = () => {
    const { currentUser, userData } = useAuth();
    const { getBool } = useSettings();
    const emailEnabled = getBool('emailNotifications', true);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);

    // Form State
    const [applyLoading, setApplyLoading] = useState(false);
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = (() => {
        const d = new Date();
        d.setSeconds(0, 0);
        d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5);
        return d.toTimeString().slice(0, 5);
    })();

    const [formData, setFormData] = useState({
        leaveType: 'Leave',
        fromDate: '',
        fromTime: '',
        toDate: '',
        toTime: '',
        reason: '',
        parentEmail: ''
    });

    useEffect(() => {
        fetchLeaves();
    }, [currentUser]);

    useEffect(() => {
        if (userData) {
            const pEmail = userData.parentEmailId || userData.studentDetails?.parentEmailId || '';
            setFormData(prev => ({ ...prev, parentEmail: pEmail }));
        }
    }, [userData, showApplyModal]);

    const fetchLeaves = async () => {
        try {
            const res = await api.get(`/leaves/student/${currentUser.uid}`);
            setLeaves(Array.isArray(res.data) ? res.data.filter(Boolean) : []);
        } catch (err) {
            console.error(err);
            setLeaves([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        if (formData.fromDate < todayStr) {
            alert('From date cannot be in the past.');
            return;
        }
        if (formData.toDate < formData.fromDate) {
            alert('To date cannot be before From date.');
            return;
        }
        setApplyLoading(true);
        try {
            await api.post(`/leaves/apply?studentUid=${currentUser.uid}`, formData);
            alert("Leave applied successfully! An email has been sent to your parent for approval.");
            setShowApplyModal(false);
            setFormData({ leaveType: 'Leave', fromDate: '', fromTime: '', toDate: '', toTime: '', reason: '', parentEmail: '' });
            fetchLeaves();
        } catch (err) {
            alert("Operation failed: " + err.message);
        } finally {
            setApplyLoading(false);
        }
    };

    const openViewModal = (leave) => {
        setSelectedLeave(leave);
        setShowViewModal(true);
    };

    const getDuration = (from, to) => {
        if (!from || !to) return '—';
        const start = new Date(from);
        const end = new Date(to);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusClass = (status) => {
        const s = (status || 'PENDING').toUpperCase();
        if (s === 'APPROVED') return 'status-pill approved';
        if (s.includes('REJECTED')) return 'status-pill rejected';
        return 'status-pill pending';
    };

    const getStatusLabel = (status) => {
        const s = (status || 'PENDING').toUpperCase();
        if (s === 'APPROVED') return 'Approved';
        if (s.includes('REJECTED')) return 'Rejected';
        return 'Pending';
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this leave application?")) return;
        setLoading(true);
        try {
            await api.delete(`/leaves/${id}?studentUid=${currentUser.uid}`);
            alert("Leave cancelled successfully.");
            setShowViewModal(false);
            fetchLeaves();
        } catch (err) {
            alert("Failed to cancel leave: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoaderComponent fullScreen={false} text="Loading leaves..." />;

    return (
        <FeatureGate featureKey="feature.leave.enabled" title="Leave Management">
            <div className="leaves-page">
                <div className="leaves-header">
                    <div>
                        <h1>My Leave Applications</h1>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Your leave requests go through Parent approval before Mentor review.
                        </p>
                    </div>
                    <button className="btn-primary-action" onClick={() => setShowApplyModal(true)}>
                        <Plus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                        Apply for Leave
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="fl-stats-row">
                    {[
                        { label: 'Total Applied', value: leaves.length, icon: <FileText size={18} />, color: '#6366f1' },
                        { label: 'Pending', value: leaves.filter(l => l && (l.mentorStatus || 'PENDING') === 'PENDING' && (l.parentStatus || 'PENDING') !== 'REJECTED').length, icon: <Clock size={18} />, color: '#f59e0b' },
                        { label: 'Approved', value: leaves.filter(l => l && l.mentorStatus === 'APPROVED').length, icon: <CheckCircle size={18} />, color: '#10b981' },
                        { label: 'Rejected', value: leaves.filter(l => l && ((l.mentorStatus || '').includes('REJECTED') || l.parentStatus === 'REJECTED')).length, icon: <XCircle size={18} />, color: '#ef4444' },
                    ].map((s, i) => (
                        <div key={i} className="fl-stat-card">
                            <div className="fl-stat-icon" style={{ color: s.color }}>{s.icon}</div>
                            <div>
                                <div className="fl-stat-value">{s.value}</div>
                                <div className="fl-stat-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {!emailEnabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#d97706', fontSize: '0.82rem', marginBottom: '20px' }}>
                        <BellOff size={15} />
                        <span><strong>Email notifications are disabled.</strong> Parent approval emails will NOT be sent until re-enabled.</span>
                    </div>
                )}

                <div className="leaves-content-card">
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Leave Type</th>
                                    <th>Period</th>
                                    <th>Duration</th>
                                    <th>Reason</th>
                                    <th>Parent Approval</th>
                                    <th>Mentor Approval</th>
                                    <th>Overall Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                            <Calendar size={40} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                                            No leave applications yet. Click "Apply for Leave" to start.
                                        </td>
                                    </tr>
                                ) : leaves.map(leave => {
                                    if (!leave) return null;
                                    const status = getStatusMeta(leave);
                                    const canCancel = leave.mentorStatus !== 'APPROVED' && leave.mentorStatus !== 'REJECTED';
                                    return (
                                        <tr key={leave.id || Math.random()} onClick={() => openViewModal(leave)} className="clickable-row">
                                            <td>
                                                <span className="type-pill-purple">{leave.leaveType || 'Leave'}</span>
                                            </td>
                                            <td>
                                                <span className="font-bold">{formatDate(leave.fromDate)}</span>
                                                <br />
                                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>to {formatDate(leave.toDate)}</span>
                                            </td>
                                            <td>{getDuration(leave.fromDate, leave.toDate)}</td>
                                            <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {leave.reason}
                                            </td>
                                            <td>
                                                <span className={getStatusClass(leave.parentStatus)}>
                                                    {getStatusLabel(leave.parentStatus)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getStatusClass(leave.mentorStatus)}>
                                                    {getStatusLabel(leave.mentorStatus)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${status.cls}`}>{status.label}</span>
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                {canCancel && (
                                                    <button
                                                        className="btn-icon-danger"
                                                        onClick={() => handleDelete(leave.id)}
                                                        title="Cancel leave"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* VIEW DETAILS MODAL */}
                {showViewModal && selectedLeave && (
                    <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                        <div className="modal-container" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Leave Details</h3>
                                <button className="close-icon" onClick={() => setShowViewModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-grid">
                                    <div className="field-group">
                                        <label>Leave Type</label>
                                        <div className="field-value">{selectedLeave.leaveType || 'Leave'}</div>
                                    </div>
                                    <div className="field-group">
                                        <label>Duration</label>
                                        <div className="field-value">{getDuration(selectedLeave.fromDate, selectedLeave.toDate)}</div>
                                    </div>
                                    <div className="field-group">
                                        <label>From</label>
                                        <div className="field-value">{formatDate(selectedLeave.fromDate)} {selectedLeave.fromTime}</div>
                                    </div>
                                    <div className="field-group">
                                        <label>To</label>
                                        <div className="field-value">{formatDate(selectedLeave.toDate)} {selectedLeave.toTime}</div>
                                    </div>
                                    <div className="field-group full-width">
                                        <label>Reason</label>
                                        <div className="field-value">{selectedLeave.reason}</div>
                                    </div>
                                </div>

                                <div className="fl-timeline" style={{ marginTop: 24 }}>
                                    <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>Approval Timeline</h4>
                                    
                                    <div className={`fl-timeline-step ${selectedLeave.parentStatus === 'APPROVED' ? 'done' : selectedLeave.parentStatus === 'REJECTED' ? 'fail' : 'waiting'}`}>
                                        <div className="fl-tl-dot">
                                            {selectedLeave.parentStatus === 'APPROVED' ? <CheckCircle size={14} /> :
                                                selectedLeave.parentStatus === 'REJECTED' ? <XCircle size={14} /> :
                                                    <Clock size={14} />}
                                        </div>
                                        <div className="fl-tl-content">
                                            <div className="fl-tl-title">Parent Approval</div>
                                            <div className="fl-tl-sub">{selectedLeave.parentEmail}</div>
                                        </div>
                                    </div>

                                    <div className={`fl-timeline-step ${selectedLeave.mentorStatus === 'APPROVED' ? 'done' : selectedLeave.mentorStatus?.includes('REJECTED') ? 'fail' : 'waiting'}`}>
                                        <div className="fl-tl-dot">
                                            {selectedLeave.mentorStatus === 'APPROVED' ? <CheckCircle size={14} /> :
                                                selectedLeave.mentorStatus?.includes('REJECTED') ? <XCircle size={14} /> :
                                                    <Clock size={14} />}
                                        </div>
                                        <div className="fl-tl-content">
                                            <div className="fl-tl-title">Mentor Approval</div>
                                            <div className="fl-tl-sub">{selectedLeave.mentorRemarks || (selectedLeave.parentStatus === 'APPROVED' ? 'Awaiting mentor review' : 'Waiting for parent approval')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* APPLY MODAL */}
                {showApplyModal && (
                    <div className="modal-overlay">
                        <div className="modal-container" style={{ width: 500 }}>
                            <div className="modal-header">
                                <h3>Apply for Leave</h3>
                                <button className="close-icon" onClick={() => setShowApplyModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleApply} className="modal-body">
                                <div className="fl-workflow-banner">
                                    <div className="fl-wf-step active">
                                        <div className="fl-wf-dot">1</div>
                                        <span>You Apply</span>
                                    </div>
                                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                                    <div className="fl-wf-step">
                                        <div className="fl-wf-dot">2</div>
                                        <span>Parent</span>
                                    </div>
                                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                                    <div className="fl-wf-step">
                                        <div className="fl-wf-dot">3</div>
                                        <span>Mentor</span>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Leave Type</label>
                                    <select
                                        value={formData.leaveType}
                                        onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                                        className="custom-input"
                                    >
                                        <option>Casual Leave</option>
                                        <option>Sick Leave</option>
                                        <option>On Duty</option>
                                        <option>Personal Leave</option>
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>From Date</label>
                                        <input
                                            type="date"
                                            className="custom-input"
                                            required
                                            min={todayStr}
                                            value={formData.fromDate}
                                            onChange={e => setFormData({ ...formData, fromDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>From Time</label>
                                        <input
                                            type="time"
                                            className="custom-input"
                                            required
                                            min={formData.fromDate === todayStr ? nowTime : undefined}
                                            value={formData.fromTime}
                                            onChange={e => setFormData({ ...formData, fromTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>To Date</label>
                                        <input
                                            type="date"
                                            className="custom-input"
                                            required
                                            min={formData.fromDate || todayStr}
                                            value={formData.toDate}
                                            onChange={e => setFormData({ ...formData, toDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>To Time</label>
                                        <input
                                            type="time"
                                            className="custom-input"
                                            required
                                            value={formData.toTime}
                                            onChange={e => setFormData({ ...formData, toTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Parent Email</label>
                                    <input
                                        type="email"
                                        className="custom-input"
                                        required
                                        placeholder="Parent email from profile"
                                        value={formData.parentEmail}
                                        readOnly
                                        disabled
                                        style={{ backgroundColor: 'var(--bg-subtle)', cursor: 'not-allowed', color: 'var(--text-muted)' }}
                                    />
                                    {!formData.parentEmail && (
                                        <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                                            Parent email not found in your profile. Please contact administration.
                                        </small>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Reason *</label>
                                    <textarea
                                        className="custom-input"
                                        required
                                        rows={3}
                                        placeholder="Briefly describe the reason for leave..."
                                        value={formData.reason}
                                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                        style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn-secondary-action" onClick={() => setShowApplyModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary-action" disabled={applyLoading || !formData.parentEmail}>
                                        {applyLoading ? 'Applying...' : 'Submit Application'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </FeatureGate>
    );
};

export default StudentLeaves;