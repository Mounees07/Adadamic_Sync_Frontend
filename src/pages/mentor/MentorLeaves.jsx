import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Loader, CheckCircle, XCircle, Clock, ShieldCheck, X } from 'lucide-react';
import "../student/StudentLeaves.css";

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
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const initiateApproval = (id) => {
        // No longer generate OTP immediately. It should have been generated when Parent approved.
        // We just open the modal.
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

    if (loading) return <div className="loading-screen"><Loader className="animate-spin" /></div>;

    return (
        <div className="leaves-page">
            <div className="leaves-header">
                <h1>Leave Approvals</h1>
            </div>

            <div className="leaves-content-card">
                <div className="table-responsive">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Dates</th>
                                <th>Reason</th>
                                <th>Parent Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                        No pending leave requests.
                                    </td>
                                </tr>
                            ) : requests.map(req => (
                                <tr key={req.id}>
                                    <td style={{ fontWeight: 600 }}>{req.student.fullName}</td>
                                    <td>{req.fromDate} to {req.toDate}</td>
                                    <td>{req.reason}</td>
                                    <td>
                                        <span className={`status-pill ${req.parentStatus === 'APPROVED' ? 'approved' : 'pending'}`}>
                                            {req.parentStatus === 'APPROVED' ? (
                                                <>Verified <CheckCircle size={12} style={{ verticalAlign: 'middle', marginLeft: '4px' }} /></>
                                            ) : (
                                                req.parentStatus
                                            )}
                                        </span>
                                    </td>
                                    <td>
                                        {req.mentorStatus === 'PENDING' ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="btn-primary-action"
                                                    style={{ background: '#10b981', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                                    onClick={() => initiateApproval(req.id)}
                                                    disabled={otpLoading}
                                                >
                                                    {otpLoading && currentActionId === req.id ? 'Sending...' : 'Approve'}
                                                </button>
                                                <button
                                                    className="btn-primary-action"
                                                    style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
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
                <div className="modal-overlay">
                    <div className="modal-container" style={{ width: '400px' }}>
                        <div className="modal-header">
                            <h3>Verify Approval</h3>
                            <button className="close-icon" onClick={() => setShowOtpModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submitApproval} className="modal-body">
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <ShieldCheck size={48} className="text-indigo-500 mb-2" />
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Enter the 6-digit OTP provided by the parent (sent to their email upon approval).
                                </p>
                            </div>

                            <div className="form-group">
                                <label>Enter OTP</label>
                                <input
                                    type="text"
                                    className="custom-input"
                                    style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 'bold' }}
                                    placeholder="000000"
                                    maxLength="6"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Remarks (Optional)</label>
                                <input
                                    type="text"
                                    className="custom-input"
                                    placeholder="e.g. Approved, take care."
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                />
                            </div>

                            <div className="modal-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button type="submit" className="btn-primary-action" style={{ width: '100%' }} disabled={otpLoading}>
                                    {otpLoading ? 'Verifying...' : 'Verify & Approve'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resendParentOtp}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
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