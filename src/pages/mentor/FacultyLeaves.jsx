import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    Calendar, FileText, Clock, CheckCircle, XCircle,
    AlertCircle, Plus, X, Trash2, ChevronRight, Loader2
} from 'lucide-react';
import '../student/StudentLeaves.css';
import './FacultyLeaves.css';

const STATUS_LABELS = {
    PENDING: { label: 'Pending', cls: 'pending' },
    HOD_APPROVED: { label: 'HOD Approved', cls: 'approved' },
    APPROVED: { label: 'Fully Approved', cls: 'approved' },
    REJECTED: { label: 'Rejected', cls: 'rejected' },
};

const getStatusMeta = (leave) => {
    if (!leave) return STATUS_LABELS.PENDING;
    const overall = leave.overallStatus || 'PENDING';
    return STATUS_LABELS[overall] || STATUS_LABELS.PENDING;
};

const FacultyLeaves = () => {
    const { currentUser, userData } = useAuth();
    const isHOD = userData?.role === 'HOD';
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);

    const [form, setForm] = useState({
        leaveType: 'Casual Leave',
        fromDate: '',
        toDate: '',
        reason: '',
    });

    useEffect(() => {
        fetchLeaves();
    }, [currentUser]);

    const fetchLeaves = async () => {
        if (!currentUser) return;
        try {
            const res = await api.get(`/faculty-leaves/my?uid=${currentUser.uid}`);
            setLeaves(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.fromDate || !form.toDate || !form.reason.trim()) {
            alert('Please fill all required fields.');
            return;
        }
        setSubmitting(true);
        try {
            await api.post(`/faculty-leaves/apply?uid=${currentUser.uid}`, form);
            setShowModal(false);
            setForm({ leaveType: 'Casual Leave', fromDate: '', toDate: '', reason: '' });
            fetchLeaves();
            alert('Leave applied successfully!');
        } catch (err) {
            alert('Failed to apply: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this leave request?')) return;
        try {
            await api.delete(`/faculty-leaves/${id}?uid=${currentUser.uid}`);
            fetchLeaves();
        } catch (err) {
            alert('Could not cancel: ' + (err.response?.data?.message || err.message));
        }
    };

    const getDuration = (from, to) => {
        if (!from || !to) return '—';
        const d1 = new Date(from), d2 = new Date(to);
        const days = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
        return `${days} day${days !== 1 ? 's' : ''}`;
    };

    return (
        <div className="leaves-page">
            <div className="leaves-header">
                <div>
                    <h1>My Leave Applications</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {isHOD
                            ? 'Your leave requests go directly to Admin for approval'
                            : 'Track your leave requests through HOD and Admin approval stages'}
                    </p>
                </div>
                <button className="btn-primary-action" onClick={() => setShowModal(true)}>
                    <Plus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Apply for Leave
                </button>
            </div>

            {/* Summary Stats */}
            <div className="fl-stats-row">
                {[
                    { label: 'Total Applied', value: leaves.length, icon: <FileText size={18} />, color: '#6366f1' },
                    { label: 'Pending', value: leaves.filter(l => !l.overallStatus || l.overallStatus === 'PENDING').length, icon: <Clock size={18} />, color: '#f59e0b' },
                    { label: 'Approved', value: leaves.filter(l => l.overallStatus === 'APPROVED').length, icon: <CheckCircle size={18} />, color: '#10b981' },
                    { label: 'Rejected', value: leaves.filter(l => l.overallStatus === 'REJECTED').length, icon: <XCircle size={18} />, color: '#ef4444' },
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

            {/* Table */}
            <div className="leaves-content-card">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '48px' }}>
                        <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Leave Type</th>
                                    <th>Period</th>
                                    <th>Duration</th>
                                    <th>Reason</th>
                                    {!isHOD && <th>HOD</th>}
                                    <th>Admin</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.length === 0 ? (
                                    <tr>
                                        <td colSpan={isHOD ? '7' : '8'} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                            <Calendar size={40} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                                            No leave applications yet. Click "Apply for Leave" to start.
                                        </td>
                                    </tr>
                                ) : leaves.map(leave => {
                                    const status = getStatusMeta(leave);
                                    const canCancel = leave.overallStatus !== 'APPROVED';
                                    return (
                                        <tr key={leave.id} className="clickable-row" onClick={() => setSelectedLeave(leave)}>
                                            <td>
                                                <span className="type-pill-purple">{leave.leaveType}</span>
                                            </td>
                                            <td>
                                                <span className="font-bold">{leave.fromDate}</span>
                                                <br />
                                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>to {leave.toDate}</span>
                                            </td>
                                            <td>{getDuration(leave.fromDate, leave.toDate)}</td>
                                            <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {leave.reason}
                                            </td>
                                            {!isHOD && (
                                                <td>
                                                    <span className={`status-pill ${leave.hodStatus === 'APPROVED' ? 'approved' : leave.hodStatus === 'REJECTED' ? 'rejected' : 'pending'}`}>
                                                        {leave.hodStatus}
                                                    </span>
                                                </td>
                                            )}
                                            <td>
                                                <span className={`status-pill ${leave.adminStatus === 'APPROVED' ? 'approved' : leave.adminStatus === 'REJECTED' ? 'rejected' : 'pending'}`}>
                                                    {leave.adminStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${status.cls}`}>{status.label}</span>
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                {canCancel && leave.overallStatus !== 'REJECTED' && (
                                                    <button
                                                        className="btn-icon-danger"
                                                        onClick={() => handleCancel(leave.id)}
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
                )}
            </div>

            {/* Apply Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ width: 500 }}>
                        <div className="modal-header">
                            <h3>Apply for Leave</h3>
                            <button className="close-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            {/* Workflow banner: HOD sees 2-step, Faculty sees 3-step */}
                            <div className="fl-workflow-banner">
                                <div className="fl-wf-step active">
                                    <div className="fl-wf-dot">1</div>
                                    <span>You Apply</span>
                                </div>
                                {!isHOD && (
                                    <>
                                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                                        <div className="fl-wf-step">
                                            <div className="fl-wf-dot">2</div>
                                            <span>HOD Reviews</span>
                                        </div>
                                    </>
                                )}
                                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                                <div className="fl-wf-step">
                                    <div className="fl-wf-dot">{isHOD ? 2 : 3}</div>
                                    <span>Admin Approves</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Leave Type</label>
                                <select
                                    className="custom-input"
                                    value={form.leaveType}
                                    onChange={e => setForm({ ...form, leaveType: e.target.value })}
                                    required
                                >
                                    {['Casual Leave', 'Earned Leave', 'Medical Leave', 'Duty Leave', 'Personal Leave'].map(t => (
                                        <option key={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>From Date *</label>
                                    <input
                                        type="date"
                                        className="custom-input"
                                        value={form.fromDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={e => setForm({ ...form, fromDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>To Date *</label>
                                    <input
                                        type="date"
                                        className="custom-input"
                                        value={form.toDate}
                                        min={form.fromDate || new Date().toISOString().split('T')[0]}
                                        onChange={e => setForm({ ...form, toDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Reason *</label>
                                <textarea
                                    className="custom-input"
                                    rows={3}
                                    placeholder="Briefly describe the reason for leave..."
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                    required
                                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-secondary-action" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary-action" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedLeave && (
                <div className="modal-overlay" onClick={() => setSelectedLeave(null)}>
                    <div className="modal-container" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Leave Details</h3>
                            <button className="close-icon" onClick={() => setSelectedLeave(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="field-group">
                                    <label>Leave Type</label>
                                    <div className="field-value">{selectedLeave.leaveType}</div>
                                </div>
                                <div className="field-group">
                                    <label>Duration</label>
                                    <div className="field-value">{getDuration(selectedLeave.fromDate, selectedLeave.toDate)}</div>
                                </div>
                                <div className="field-group">
                                    <label>From</label>
                                    <div className="field-value">{selectedLeave.fromDate}</div>
                                </div>
                                <div className="field-group">
                                    <label>To</label>
                                    <div className="field-value">{selectedLeave.toDate}</div>
                                </div>
                                <div className="field-group full-width">
                                    <label>Reason</label>
                                    <div className="field-value">{selectedLeave.reason}</div>
                                </div>
                            </div>

                            {/* Approval Timeline */}
                            <div className="fl-timeline" style={{ marginTop: 24 }}>
                                <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>Approval Timeline</h4>

                                {selectedLeave.applicantRole !== 'HOD' && (
                                    <div className={`fl-timeline-step ${selectedLeave.hodStatus === 'APPROVED' ? 'done' : selectedLeave.hodStatus === 'REJECTED' ? 'fail' : 'waiting'}`}>
                                        <div className="fl-tl-dot">
                                            {selectedLeave.hodStatus === 'APPROVED' ? <CheckCircle size={14} /> :
                                                selectedLeave.hodStatus === 'REJECTED' ? <XCircle size={14} /> :
                                                    <Clock size={14} />}
                                        </div>
                                        <div className="fl-tl-content">
                                            <div className="fl-tl-title">HOD Approval</div>
                                            <div className="fl-tl-sub">{selectedLeave.hodRemarks || 'Awaiting HOD review'}</div>
                                            {selectedLeave.hodAt && <div className="fl-tl-time">{selectedLeave.hodAt}</div>}
                                        </div>
                                    </div>
                                )}

                                <div className={`fl-timeline-step ${selectedLeave.adminStatus === 'APPROVED' ? 'done' : selectedLeave.adminStatus === 'REJECTED' ? 'fail' : 'waiting'}`}>
                                    <div className="fl-tl-dot">
                                        {selectedLeave.adminStatus === 'APPROVED' ? <CheckCircle size={14} /> :
                                            selectedLeave.adminStatus === 'REJECTED' ? <XCircle size={14} /> :
                                                <Clock size={14} />}
                                    </div>
                                    <div className="fl-tl-content">
                                        <div className="fl-tl-title">Admin Final Approval</div>
                                        <div className="fl-tl-sub">{selectedLeave.adminRemarks || 'Awaiting Admin review'}</div>
                                        {selectedLeave.adminAt && <div className="fl-tl-time">{selectedLeave.adminAt}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyLeaves;
