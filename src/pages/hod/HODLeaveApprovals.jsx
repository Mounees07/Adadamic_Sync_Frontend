import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    CheckCircle, XCircle, Clock, User, Calendar,
    FileText, AlertCircle, X, Loader2
} from 'lucide-react';
import '../student/StudentLeaves.css';
import '../mentor/FacultyLeaves.css';

const HODLeaveApprovals = () => {
    const { currentUser } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionModal, setActionModal] = useState(null); // { leave, type: 'APPROVED'|'REJECTED' }
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [tab, setTab] = useState('pending'); // 'pending' | 'all'

    useEffect(() => {
        fetchLeaves();
    }, [currentUser]);

    const fetchLeaves = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const res = await api.get(`/faculty-leaves/hod/pending?hodUid=${currentUser.uid}`);
            setLeaves(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openAction = (leave, type) => {
        setActionModal({ leave, type });
        setRemarks('');
    };

    const submitAction = async () => {
        if (!actionModal) return;
        setSubmitting(true);
        try {
            await api.post(`/faculty-leaves/${actionModal.leave.id}/hod-action?hodUid=${currentUser.uid}`, {
                action: actionModal.type,
                remarks,
            });
            setActionModal(null);
            fetchLeaves();
            alert(actionModal.type === 'APPROVED'
                ? 'Leave approved! Admin will be notified for final approval.'
                : 'Leave rejected. Faculty has been notified.');
        } catch (err) {
            alert('Action failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const getDuration = (from, to) => {
        if (!from || !to) return '—';
        const days = Math.round((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1;
        return `${days} day${days !== 1 ? 's' : ''}`;
    };

    return (
        <div className="leaves-page">
            <div className="leaves-header">
                <div>
                    <h1>Faculty Leave Approvals</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Review and approve leave requests from your department faculty
                    </p>
                </div>
                <div className="fl-workflow-banner" style={{ margin: 0, padding: '10px 16px' }}>
                    <div className="fl-wf-step done">
                        <div className="fl-wf-dot" style={{ background: '#e0e7ff', color: '#6366f1' }}>1</div>
                        <span>Faculty Applies</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>›</span>
                    <div className="fl-wf-step active">
                        <div className="fl-wf-dot">2</div>
                        <span>HOD Reviews (You)</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>›</span>
                    <div className="fl-wf-step">
                        <div className="fl-wf-dot">3</div>
                        <span>Admin Final</span>
                    </div>
                </div>
            </div>

            {/* Info notice: HOD's own leaves go to Admin */}
            <div className="fl-workflow-banner" style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)' }}>
                <AlertCircle size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                    <strong>Note:</strong> This page shows leave requests from your department faculty only.&nbsp;
                    <strong>Your own personal leave requests</strong> (as HOD) go directly to <strong>Admin</strong> for approval — manage them from <em>My Leaves</em>.
                </span>
            </div>

            {/* Stats */}
            <div className="fl-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="fl-stat-card">
                    <div className="fl-stat-icon" style={{ color: '#f59e0b' }}><Clock size={18} /></div>
                    <div>
                        <div className="fl-stat-value">{leaves.length}</div>
                        <div className="fl-stat-label">Pending Your Review</div>
                    </div>
                </div>
                <div className="fl-stat-card">
                    <div className="fl-stat-icon" style={{ color: '#10b981' }}><CheckCircle size={18} /></div>
                    <div>
                        <div className="fl-stat-value">—</div>
                        <div className="fl-stat-label">Approved This Month</div>
                    </div>
                </div>
                <div className="fl-stat-card">
                    <div className="fl-stat-icon" style={{ color: '#6366f1' }}><FileText size={18} /></div>
                    <div>
                        <div className="fl-stat-value">—</div>
                        <div className="fl-stat-label">Total Processed</div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="leaves-content-card">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '48px' }}>
                        <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
                    </div>
                ) : leaves.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                        <CheckCircle size={48} style={{ opacity: 0.25, marginBottom: 12 }} />
                        <h3 style={{ margin: '0 0 6px', color: 'var(--text-secondary)' }}>All Caught Up!</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>No pending leave requests from your faculty.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Faculty Member</th>
                                    <th>Leave Type</th>
                                    <th>Period</th>
                                    <th>Duration</th>
                                    <th>Reason</th>
                                    <th>Applied On</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map(leave => (
                                    <tr key={leave.id} className="clickable-row">
                                        <td>
                                            <div className="applicant-badge">
                                                <div className="applicant-avatar">
                                                    {(leave.applicant?.fullName || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="applicant-name">{leave.applicant?.fullName || '—'}</div>
                                                    <div className="applicant-role">{leave.applicant?.role || 'Faculty'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="type-pill-purple">{leave.leaveType}</span></td>
                                        <td>
                                            <span className="font-bold">{leave.fromDate}</span>
                                            <br />
                                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>to {leave.toDate}</span>
                                        </td>
                                        <td>{getDuration(leave.fromDate, leave.toDate)}</td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {leave.reason}
                                        </td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                            {leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-approve" onClick={() => openAction(leave, 'APPROVED')}>
                                                    <CheckCircle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                                    Approve
                                                </button>
                                                <button className="btn-reject" onClick={() => openAction(leave, 'REJECTED')}>
                                                    <XCircle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Action Confirm Modal */}
            {actionModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ width: 440 }}>
                        <div className="modal-header">
                            <h3>
                                {actionModal.type === 'APPROVED' ? '✅ Approve Leave' : '❌ Reject Leave'}
                            </h3>
                            <button className="close-icon" onClick={() => setActionModal(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                                <div className="applicant-name">{actionModal.leave.applicant?.fullName}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                    {actionModal.leave.leaveType} · {actionModal.leave.fromDate} to {actionModal.leave.toDate}
                                    {' '}({getDuration(actionModal.leave.fromDate, actionModal.leave.toDate)})
                                </div>
                                <div style={{ marginTop: 6, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                                    {actionModal.leave.reason}
                                </div>
                            </div>

                            {actionModal.type === 'APPROVED' && (
                                <div className="fl-workflow-banner" style={{ marginBottom: 16, padding: '10px 14px' }}>
                                    <AlertCircle size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        After your approval, Admin will give the <strong>final approval</strong> and notify the faculty.
                                    </span>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Remarks {actionModal.type === 'REJECTED' ? '*' : '(Optional)'}</label>
                                <textarea
                                    className="custom-input"
                                    rows={2}
                                    placeholder={actionModal.type === 'REJECTED' ? 'Reason for rejection...' : 'Any remarks...'}
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                    required={actionModal.type === 'REJECTED'}
                                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button className="btn-secondary-action" onClick={() => setActionModal(null)}>Cancel</button>
                                <button
                                    className={actionModal.type === 'APPROVED' ? 'btn-approve' : 'btn-reject'}
                                    onClick={submitAction}
                                    disabled={submitting || (actionModal.type === 'REJECTED' && !remarks.trim())}
                                    style={{ padding: '0.6rem 1.4rem' }}
                                >
                                    {submitting ? 'Processing...' : actionModal.type === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HODLeaveApprovals;
