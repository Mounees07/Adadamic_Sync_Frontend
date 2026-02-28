import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Plus, Search, Loader, Filter, ChevronRight, User, X, MailX } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import FeatureGate from '../../components/FeatureGate';
import './StudentLeaves.css';

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
    // today's date string for min= attribute
    const todayStr = new Date().toISOString().split('T')[0];
    // current time rounded up to nearest 5 min, for min= on time input
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

    // Auto-fill parent email from profile when apply modal opens or userData changes
    useEffect(() => {
        if (userData) {
            // Check for parentEmailId at root (JsonUnwrapped) or nested
            const pEmail = userData.parentEmailId || userData.studentDetails?.parentEmailId || '';
            setFormData(prev => ({ ...prev, parentEmail: pEmail }));
        }
    }, [userData, showApplyModal]);

    const fetchLeaves = async () => {
        try {
            const res = await api.get(`/leaves/student/${currentUser.uid}`);
            setLeaves(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        // Validate fromDate is today or future
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
        const start = new Date(from);
        const end = new Date(to);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return `${diffDays} days`;
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

    if (loading) return <div className="loading-screen"><Loader className="animate-spin" /></div>;

    return (
        <FeatureGate featureKey="feature.leave.enabled" title="Leave Management">
            <div className="leaves-page">
                <div className="leaves-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h1>My Leaves</h1>
                        <button
                            className="btn-primary-action"
                            style={{ background: '#4b5563', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                            onClick={async () => {
                                const email = prompt("Enter email address for test:");
                                if (!email) return;
                                try {
                                    await api.post(`/leaves/test-email?email=${email}`);
                                    alert("Test email sent!");
                                } catch (e) {
                                    alert("Failed: " + e.message);
                                }
                            }}
                        >
                            Test Email
                        </button>
                    </div>
                    {!emailEnabled && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#d97706', fontSize: '0.82rem', marginBottom: '10px' }}>
                            <MailOff size={15} />
                            <span><strong>Email notifications are disabled.</strong> Parent approval emails will NOT be sent until the admin re-enables them.</span>
                        </div>
                    )}
                    <button className="btn-primary-action" onClick={() => setShowApplyModal(true)}>
                        Apply Leave
                    </button>
                </div>

                <div className="leaves-content-card">
                    <div className="filter-section">
                        <div className="search-box">
                            <label>Search</label>
                            <div className="search-input-wrapper">
                                <input type="text" placeholder="Search by leave type or remarks..." />
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Leave Type <Filter size={12} /></th>
                                    <th>Type <Filter size={12} /></th>
                                    <th>From Date</th>
                                    <th>Remarks <Filter size={12} /></th>
                                    <th>Parent Status</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map(leave => (
                                    <tr key={leave.id} onClick={() => openViewModal(leave)} className="clickable-row">
                                        <td>
                                            <div className="flex-center-gap">
                                                <ChevronRight size={14} className="text-muted" />
                                                <span className="font-bold">{leave.leaveType || 'Leave'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="type-pill">Leave</span>
                                        </td>
                                        <td>{formatDate(leave.fromDate)}</td>
                                        <td className="remarks-cell">{leave.reason}</td>
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-footer">
                        <span>Show <select defaultValue={10}><option>10</option></select> entries</span>
                        <span>Showing 1 to {leaves.length} of {leaves.length} entries</span>
                    </div>
                </div>

                {/* VIEW DETAILS MODAL */}
                {showViewModal && selectedLeave && (
                    <div className="modal-overlay">
                        <div className="modal-container detail-modal">
                            <div className="modal-header">
                                <h3>Leave Details - {selectedLeave.leaveType || 'Leave'}</h3>
                                <button className="close-icon" onClick={() => setShowViewModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body scrollable">
                                <section className="detail-section">
                                    <h4 className="section-title">Leave Information</h4>
                                    <div className="detail-grid">
                                        <div className="field-group">
                                            <label>Leave Type</label>
                                            <div className="field-value">{selectedLeave.leaveType || 'Leave'}</div>
                                        </div>
                                        <div className="field-group">
                                            <label>Type</label>
                                            <div className="field-value"><span className="type-pill-purple">Leave</span></div>
                                        </div>
                                        <div className="field-group">
                                            <label>From Date</label>
                                            <div className="field-value">{formatDate(selectedLeave.fromDate)}</div>
                                        </div>
                                        <div className="field-group">
                                            <label>To Date</label>
                                            <div className="field-value">{formatDate(selectedLeave.toDate)}</div>
                                        </div>
                                        <div className="field-group">
                                            <label>Gate Out (Planned)</label>
                                            <div className="field-value">
                                                {formatDate(selectedLeave.fromDate)}
                                                {selectedLeave.fromTime ? `, ${selectedLeave.fromTime.slice(0, 5)}` : ', 08:30 AM'}
                                            </div>
                                        </div>
                                        <div className="field-group">
                                            <label>Gate In (Planned)</label>
                                            <div className="field-value">
                                                {formatDate(selectedLeave.toDate)}
                                                {selectedLeave.toTime ? `, ${selectedLeave.toTime.slice(0, 5)}` : ', 04:30 PM'}
                                            </div>
                                        </div>
                                        {selectedLeave.actualExitTime && (
                                            <div className="field-group">
                                                <label>Actual Gate Out</label>
                                                <div className="field-value" style={{ color: '#ef4444', fontWeight: 600 }}>
                                                    {new Date(selectedLeave.actualExitTime).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        )}
                                        {selectedLeave.actualReturnTime && (
                                            <div className="field-group">
                                                <label>Actual Gate In</label>
                                                <div className="field-value" style={{ color: '#10b981', fontWeight: 600 }}>
                                                    {new Date(selectedLeave.actualReturnTime).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        )}
                                        <div className="field-group">
                                            <label>Duration</label>
                                            <div className="field-value">{getDuration(selectedLeave.fromDate, selectedLeave.toDate)}</div>
                                        </div>
                                        <div className="field-group">
                                            <label>Status</label>
                                            <div className="field-value">
                                                <span className={getStatusClass(selectedLeave.mentorStatus)}>
                                                    {getStatusLabel(selectedLeave.mentorStatus)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="field-group full-width">
                                            <label>Remarks</label>
                                            <div className="field-value">{selectedLeave.reason}</div>
                                        </div>
                                    </div>
                                </section>

                                <section className="detail-section">
                                    <h4 className="section-title">Approval Status</h4>
                                    <div className="approver-card-wrapper">
                                        <div className="approver-card">
                                            <div className="approver-details">
                                                <div className="approver-icon">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="role-label">Mentor</div>
                                                    <div className="approver-name">Class Mentor</div>
                                                    <small className="text-muted">Faculty ID: N/A</small>
                                                </div>
                                            </div>
                                            <span className={getStatusClass(selectedLeave.mentorStatus)}>
                                                {getStatusLabel(selectedLeave.mentorStatus)}
                                            </span>
                                        </div>

                                        <div className="approver-card">
                                            <div className="approver-details">
                                                <div className="approver-icon">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="role-label">Parent</div>
                                                    <div className="approver-name">{selectedLeave.parentEmail}</div>
                                                    <small className="text-muted">External Approver</small>
                                                </div>
                                            </div>
                                            <span className={getStatusClass(selectedLeave.parentStatus)}>
                                                {getStatusLabel(selectedLeave.parentStatus)}
                                            </span>
                                        </div>
                                    </div>
                                </section>

                                {(selectedLeave.mentorStatus === 'PENDING' || selectedLeave.mentorStatus === 'REJECTED_BY_PARENT') && (
                                    <div className="modal-footer" style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                                        <button
                                            className="btn-primary-action"
                                            style={{ background: '#ef4444', width: '100%' }}
                                            onClick={() => handleDelete(selectedLeave.id)}
                                        >
                                            Cancel Leave Application
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
                }

                {/* APPLY MODAL */}
                {
                    showApplyModal && (
                        <div className="modal-overlay">
                            <div className="modal-container">
                                <div className="modal-header">
                                    <h3>Apply Leave</h3>
                                    <button className="close-icon" onClick={() => setShowApplyModal(false)}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleApply} className="modal-body">
                                    <div className="form-group">
                                        <label>Leave Type</label>
                                        <select
                                            value={formData.leaveType}
                                            onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                                            className="custom-input"
                                        >
                                            <option>Leave</option>
                                            <option>Sick Leave</option>
                                            <option>On Duty</option>
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
                                            style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
                                        />
                                        {!formData.parentEmail && (
                                            <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                                                Parent email not found in your profile. Please contact administration to update it.
                                            </small>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Remarks</label>
                                        <input
                                            type="text"
                                            className="custom-input"
                                            required
                                            value={formData.reason}
                                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                        />
                                    </div>
                                    <div className="modal-footer">
                                        <button type="submit" className="btn-primary-action" disabled={applyLoading}>
                                            {applyLoading ? 'Applying...' : 'Apply Leave'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }
            </div>
        </FeatureGate>
    );
};

export default StudentLeaves;