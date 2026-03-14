import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    CheckCircle, XCircle, Clock, User, Calendar,
    FileText, AlertCircle, Filter, X, Loader2,
    ShieldCheck, ChevronDown
} from 'lucide-react';
import '../student/StudentLeaves.css';
import '../mentor/FacultyLeaves.css';

const TABS = [
    { key: 'pending', label: 'Pending Final Approval' },
    { key: 'all', label: 'All Leaves' },
];

const STATUS_COLOR = {
    PENDING: { bg: 'rgba(245,158,11,.12)', color: '#d97706' },
    APPROVED: { bg: 'rgba(16,185,129,.12)', color: '#059669' },
    REJECTED: { bg: 'rgba(239,68,68,.12)', color: '#dc2626' },
    SKIPPED: { bg: 'rgba(107,114,128,.12)', color: '#6b7280' },
    HOD_APPROVED: { bg: 'rgba(99,102,241,.12)', color: '#6366f1' },
};

const pill = (text, key) => {
    const s = STATUS_COLOR[key] || STATUS_COLOR.PENDING;
    return (
        <span style={{
            padding: '3px 10px',
            borderRadius: 12,
            fontSize: '0.75rem',
            fontWeight: 600,
            background: s.bg,
            color: s.color,
        }}>{text}</span>
    );
};

const AdminLeaveApprovals = () => {
    const { currentUser } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('pending');
    const [actionModal, setActionModal] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filterRole, setFilterRole] = useState('ALL'); // ALL | FACULTY | HOD

    useEffect(() => {
        fetchLeaves();
    }, [currentUser, tab]);

    const fetchLeaves = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const endpoint = tab === 'pending' ? '/faculty-leaves/admin/pending' : '/faculty-leaves/admin/all';
            const res = await api.get(endpoint);
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
            await api.post(`/faculty-leaves/${actionModal.leave.id}/admin-action?adminUid=${currentUser.uid}`, {
                action: actionModal.type,
                remarks,
            });
            setActionModal(null);
            fetchLeaves();
            alert(actionModal.type === 'APPROVED'
                ? '✅ Leave FINALLY APPROVED! Faculty has been notified via email and notification.'
                : '❌ Leave rejected. Faculty has been notified.');
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

    const getOverall = (leave) => {
        if (leave.adminStatus === 'APPROVED') return { label: 'Approved', key: 'APPROVED' };
        if (leave.adminStatus === 'REJECTED' || leave.hodStatus === 'REJECTED') return { label: 'Rejected', key: 'REJECTED' };
        if (leave.hodStatus === 'APPROVED' || leave.hodStatus === 'SKIPPED') return { label: 'HOD Approved', key: 'HOD_APPROVED' };
        return { label: 'Pending', key: 'PENDING' };
    };

    const filtered = leaves.filter(l =>
        filterRole === 'ALL' ? true : l.applicantRole === filterRole
    );

    const pending = leaves.length;
    const approved = leaves.filter(l => l.adminStatus === 'APPROVED').length;
    const rejected = leaves.filter(l => l.adminStatus === 'REJECTED').length;

    return (
        <div className="leaves-page">
            <div className="leaves-header">
                <div>
                    <h1>Faculty &amp; HOD Leave Management</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Give final approval for leave requests. Faculty leaves go through HOD first, HOD leaves come directly to you.
                    </p>
                </div>
            </div>

            {/* Workflow Info */}
            <div className="fl-workflow-banner" style={{ marginBottom: 20 }}>
                <ShieldCheck size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>Faculty Leave:</strong> Faculty → HOD approves → <strong>Admin gives final approval</strong> → Faculty notified. &nbsp;|&nbsp;
                    <strong>HOD Leave:</strong> HOD → <strong>Admin gives final approval directly</strong> → HOD notified.
                </span>
            </div>

            {/* Stats */}
            <div className="fl-stats-row">
                <div className="fl-stat-card">
                    <div className="fl-stat-icon" style={{ color: '#f59e0b' }}><Clock size={18} /></div>
                    <div>
                        <div className="fl-stat-value">{pending}</div>
                        <div className="fl-stat-label">Total Shown</div>
                    </div>
                </div>
                <div className="fl-stat-card">
                    <div className="fl-stat-icon" style={{ color: '#10b981' }}><CheckCircle size={18} /></div>
                    <div>
                        <div className="fl-stat-value">{approved}</div>
                        <div className="fl-stat-label">Approved</div>
                    </div>
                </div>
                <div className="fl-stat-card">
                    <div className="fl-stat-icon" style={{ color: '#ef4444' }}><XCircle size={18} /></div>
                    <div>
                        <div className="fl-stat-value">{rejected}</div>
                        <div className="fl-stat-label">Rejected</div>
                    </div>
                </div>
                <div className="fl-stat-card">
                    <div className="fl-stat-icon" style={{ color: '#6b7280' }}><FileText size={18} /></div>
                    <div>
                        <div className="fl-stat-value">{leaves.filter(l => l.applicantRole === 'HOD').length}</div>
                        <div className="fl-stat-label">Direct HOD Leaves</div>
                    </div>
                </div>
            </div>

            {/* Tabs + Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 8, padding: 3, border: '1px solid var(--glass-border)' }}>
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                padding: '6px 14px',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                background: tab === t.key ? 'var(--bg-card)' : 'transparent',
                                color: tab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                                boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                    }}
                >
                    <option value="ALL">All Applicants</option>
                    <option value="FACULTY">Faculty Only</option>
                    <option value="HOD">HOD Only</option>
                </select>
            </div>

            {/* Table */}
            <div className="leaves-content-card">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '48px' }}>
                        <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                        <CheckCircle size={48} style={{ opacity: 0.25, marginBottom: 12 }} />
                        <h3 style={{ margin: '0 0 6px', color: 'var(--text-secondary)' }}>
                            {tab === 'pending' ? 'No Pending Leaves' : 'No Leaves Found'}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            {tab === 'pending' ? 'All leave requests have been processed.' : 'No leave history available.'}
                        </p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Applicant</th>
                                    <th>Type</th>
                                    <th>Leave Type</th>
                                    <th>Period</th>
                                    <th>Duration</th>
                                    <th>HOD Status</th>
                                    <th>Admin Status</th>
                                    <th>Overall</th>
                                    {tab === 'pending' && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(leave => {
                                    const overall = getOverall(leave);
                                    return (
                                        <tr key={leave.id} className="clickable-row">
                                            <td>
                                                <div className="applicant-badge">
                                                    <div className="applicant-avatar">
                                                        {(leave.applicant?.fullName || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="applicant-name">{leave.applicant?.fullName || '—'}</div>
                                                        <div className="applicant-role">{leave.applicant?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: 700,
                                                    padding: '2px 8px',
                                                    borderRadius: 8,
                                                    ...(leave.applicantRole === 'HOD'
                                                        ? { background: 'rgba(245,158,11,.12)', color: '#d97706' }
                                                        : { background: 'rgba(99,102,241,.12)', color: '#6366f1' })
                                                }}>
                                                    {leave.applicantRole === 'HOD' ? 'HOD' : 'FACULTY'}
                                                </span>
                                            </td>
                                            <td><span className="type-pill-purple">{leave.leaveType}</span></td>
                                            <td>
                                                <span className="font-bold">{leave.fromDate}</span>
                                                <br />
                                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>to {leave.toDate}</span>
                                            </td>
                                            <td>{getDuration(leave.fromDate, leave.toDate)}</td>
                                            <td>
                                                {leave.applicantRole === 'HOD'
                                                    ? pill('SKIPPED', 'SKIPPED')
                                                    : pill(leave.hodStatus, leave.hodStatus === 'APPROVED' ? 'APPROVED' : leave.hodStatus === 'REJECTED' ? 'REJECTED' : 'PENDING')}
                                            </td>
                                            <td>{pill(leave.adminStatus, leave.adminStatus)}</td>
                                            <td>{pill(overall.label, overall.key)}</td>
                                            {tab === 'pending' && (
                                                <td>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button className="btn-approve" onClick={() => openAction(leave, 'APPROVED')}>
                                                            ✅ Approve
                                                        </button>
                                                        <button className="btn-reject" onClick={() => openAction(leave, 'REJECTED')}>
                                                            ❌ Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Final Action Modal */}
            {actionModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ width: 480 }}>
                        <div className="modal-header">
                            <h3>
                                {actionModal.type === 'APPROVED' ? '✅ Final Approval' : '❌ Reject Leave'}
                            </h3>
                            <button className="close-icon" onClick={() => setActionModal(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            {/* Show the applicant details */}
                            <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <div className="applicant-avatar">
                                        {(actionModal.leave.applicant?.fullName || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="applicant-name">{actionModal.leave.applicant?.fullName}</div>
                                        <div className="applicant-role">{actionModal.leave.applicantRole === 'HOD' ? 'Head of Department' : 'Faculty / Mentor'}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    <strong>Type:</strong> {actionModal.leave.leaveType}<br />
                                    <strong>Period:</strong> {actionModal.leave.fromDate} to {actionModal.leave.toDate} ({getDuration(actionModal.leave.fromDate, actionModal.leave.toDate)})<br />
                                    <strong>Reason:</strong> {actionModal.leave.reason}
                                </div>
                            </div>

                            {actionModal.type === 'APPROVED' && (
                                <div className="fl-workflow-banner" style={{ marginBottom: 16, padding: '10px 14px' }}>
                                    <ShieldCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        This is the <strong>FINAL approval</strong>. Upon confirmation, the faculty will receive an email notification and an in-app notification.
                                    </span>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Remarks {actionModal.type === 'REJECTED' ? '*' : '(Optional)'}</label>
                                <textarea
                                    className="custom-input"
                                    rows={3}
                                    placeholder={actionModal.type === 'REJECTED' ? 'Reason for rejection...' : 'Any final remarks for the faculty...'}
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
                                    style={{ padding: '0.6rem 1.6rem', fontSize: '0.9rem' }}
                                >
                                    {submitting ? 'Processing...' : actionModal.type === 'APPROVED' ? 'Give Final Approval' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLeaveApprovals;
