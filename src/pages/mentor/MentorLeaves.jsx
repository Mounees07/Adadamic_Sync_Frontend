import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Loader, CheckCircle, XCircle, Clock, ShieldCheck, X, FileText, LayoutList } from 'lucide-react';
import "../student/StudentLeaves.css";
import "./FacultyLeaves.css";
import LoaderComponent from '../../components/Loader';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';

const MentorLeaves = () => {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // OTP Modal State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [currentActionId, setCurrentActionId] = useState(null);
    const [otp, setOtp] = useState('');
    const [remarks, setRemarks] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [currentUser]);

    const fetchRequests = async () => {
        try {
            const res = await api.get(`/leaves/pending/${currentUser.uid}`);
            setRequests(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const initiateApproval = (id) => {
        setCurrentActionId(id);
        setOtp('');
        setRemarks('');
        setShowOtpModal(true);
    };

    const resendParentOtp = async () => {
        if (!currentActionId) return;
        setOtpLoading(true);
        try {
            await api.post(`/leaves/${currentActionId}/generate-otp?mentorUid=${currentUser.uid}`);
            alert("OTP has been resent to the Parent's email.");
        } catch (err) {
            alert("Failed to resend OTP: " + (err.response?.data?.message || err.message));
        } finally {
            setOtpLoading(false);
        }
    };

    const handleReject = async (id) => {
        const reason = prompt("Enter rejection remarks:", "");
        if (reason === null) return;

        try {
            await api.post(`/leaves/mentor-action/${id}`, { status: 'REJECTED', remarks: reason });
            alert("Leave rejected successfully.");
            fetchRequests();
        } catch (err) {
            alert("Action failed: " + err.message);
        }
    };

    const submitApproval = async (e) => {
        e.preventDefault();
        setOtpLoading(true);
        try {
            await api.post(`/leaves/${currentActionId}/verify-otp?mentorUid=${currentUser.uid}`, {
                otp,
                remarks
            });
            alert("Leave APPROVED successfully!");
            setShowOtpModal(false);
            fetchRequests();
        } catch (err) {
            alert("Verification failed: " + (err.response?.data?.message || err.message));
        } finally {
            setOtpLoading(false);
        }
    };

    if (loading) return <LoaderComponent fullScreen={false} text="Loading approvals..." />;

    return (
        <div className="leaves-page">
            <div className="leaves-header">
                <div>
                    <h1>Leave Approvals</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Review and approve pending student leave requests using parent-verified OTP.
                    </p>
                </div>
            </div>

            {/* Simple stats for mentor */}
            <div className="fl-stats-row">
                <div className="fl-stat-card">
                    <div className="fl-stat-icon" style={{ color: '#6366f1' }}><LayoutList size={18} /></div>
                    <div>
                        <div className="fl-stat-value">{requests.length}</div>
                        <div className="fl-stat-label">Pending Requests</div>
                    </div>
                </div>
                <div className="fl-stat-card">
                    <div className="fl-stat-icon" style={{ color: '#10b981' }}><CheckCircle size={18} /></div>
                    <div>
                        <div className="fl-stat-value">{requests.filter(r => r.parentStatus === 'APPROVED').length}</div>
                        <div className="fl-stat-label">Parent Verified</div>
                    </div>
                </div>
            </div>

            <div className="leaves-content-card">
                <div className="table-responsive">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Period</th>
                                <th>Reason</th>
                                <th>Parent Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                        <Clock size={40} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                                        No pending leave requests found.
                                    </td>
                                </tr>
                            ) : requests.map(req => (
                                <tr key={req.id}>
                                    <td style={{ fontWeight: 600 }}>{req.student.fullName}</td>
                                    <td>
                                        <span className="font-bold">{req.fromDate}</span>
                                        <br />
                                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>to {req.toDate}</span>
                                    </td>
                                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {req.reason}
                                    </td>
                                    <td>
                                        <span className={`status-pill ${req.parentStatus === 'APPROVED' ? 'approved' : 'pending'}`}>
                                            {req.parentStatus === 'APPROVED' ? 'Verified' : req.parentStatus}
                                        </span>
                                    </td>
                                    <td>
                                        {req.mentorStatus === 'PENDING' ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="btn-approve"
                                                    onClick={() => initiateApproval(req.id)}
                                                    disabled={otpLoading}
                                                >
                                                    {otpLoading && currentActionId === req.id ? 'Processing...' : 'Approve'}
                                                </button>
                                                <button
                                                    className="btn-reject"
                                                    onClick={() => handleReject(req.id)}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`status-pill ${req.mentorStatus === 'APPROVED' ? 'approved' : 'rejected'}`}>
                                                {req.mentorStatus}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* OTP Verification Modal */}
            {showOtpModal && (
                <div className="modal-overlay" onClick={() => setShowOtpModal(false)}>
                    <div className="modal-container" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Verify & Approve</h3>
                            <button className="close-icon" onClick={() => setShowOtpModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submitApproval} className="modal-body">
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'var(--bg-subtle)', padding: '20px', borderRadius: '12px' }}>
                                <ShieldCheck size={48} style={{ color: '#6366f1', marginBottom: '12px' }} />
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    Enter the 6-digit OTP provided by the parent. This OTP was sent to their email when they approved the request.
                                </p>
                            </div>

                            <div className="form-group">
                                <label>Enter OTP</label>
                                <input
                                    type="text"
                                    className="custom-input"
                                    style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1' }}
                                    placeholder="000000"
                                    maxLength="6"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Review Remarks (Optional)</label>
                                <textarea
                                    className="custom-input"
                                    rows={2}
                                    placeholder="Add any comments for the student..."
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                    style={{ resize: 'none', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div className="modal-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button type="submit" className="btn-primary-action" style={{ width: '100%', justifyContent: 'center' }} disabled={otpLoading}>
                                    {otpLoading ? 'Verifying...' : 'Verify OTP & Approve'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resendParentOtp}
                                    style={{ background: 'transparent', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                                    disabled={otpLoading}
                                >
                                    Resend OTP to Parent
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorLeaves;