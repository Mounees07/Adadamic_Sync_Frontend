import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

const ParentResponse = () => {
    const { token } = useParams();
    const [leave, setLeave] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionProcessed, setActionProcessed] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchLeave = async () => {
            try {
                const res = await api.get(`/leaves/parent-view/${token}`);
                setLeave(res.data);
            } catch (err) {
                setError("Invalid or expired token.");
            } finally {
                setLoading(false);
            }
        };
        fetchLeave();
    }, [token]);

    const handleAction = async (status) => {
        setLoading(true);
        try {
            await api.post(`/leaves/parent-action/${token}?status=${status}`);
            setLeave({ ...leave, parentStatus: status });
            setActionProcessed(true);
        } catch (err) {
            alert("Action failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-screen" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader className="animate-spin" /></div>;

    if (error) return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
            <h2 style={{ color: '#ef4444' }}>Link Expired or Invalid</h2>
            <p>Please contact the student for a new request.</p>
        </div>
    );

    if (actionProcessed || leave.parentStatus !== 'PENDING') {
        const isApproved = leave.parentStatus === 'APPROVED' || leave.parentStatus === 'PROCESSED'; // Handling potential future statuses
        return (
            <div style={{ maxWidth: '600px', margin: '60px auto', padding: '40px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderRadius: '12px', background: 'white', fontFamily: 'Inter, sans-serif' }}>
                {isApproved ? (
                    <>
                        <CheckCircle size={60} color="#10b981" style={{ margin: '0 auto' }} />
                        <h1 style={{ color: '#10b981', marginTop: '20px', marginBottom: '10px' }}>
                            Request Approved
                        </h1>
                        <p style={{ color: '#64748b', marginBottom: '30px' }}>
                            You have successfully approved the leave request for <strong>{leave.student.fullName}</strong>.
                        </p>

                        {leave.approvalOtp && (
                            <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px dashed #cbd5e1', marginTop: '20px' }}>
                                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px' }}>
                                    Please share this One-Time Password (OTP) with your ward or their mentor to complete the process:
                                </p>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '8px', color: '#334155', fontFamily: 'monospace' }}>
                                    {leave.approvalOtp}
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '15px' }}>
                                    This code has also been sent to your email.
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <XCircle size={60} color="#ef4444" style={{ margin: '0 auto' }} />
                        <h1 style={{ color: '#ef4444', marginTop: '20px' }}>
                            Request Rejected
                        </h1>
                        <p style={{ color: '#64748b' }}>You have rejected this leave request.</p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ background: '#6366f1', padding: '30px', color: 'white' }}>
                    <h2 style={{ margin: 0 }}>Leave Approval Request</h2>
                    <p style={{ opacity: 0.9, marginTop: '8px' }}>Action required for your child's leave application</p>
                </div>

                <div style={{ padding: '30px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', marginBottom: '4px' }}>Student Name</label>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{leave.student.fullName}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', marginBottom: '4px' }}>From Date</label>
                            <div style={{ fontWeight: 500 }}>{leave.fromDate}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', marginBottom: '4px' }}>To Date</label>
                            <div style={{ fontWeight: 500 }}>{leave.toDate}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px', background: '#f1f5f9', padding: '16px', borderRadius: '8px' }}>
                        <label style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', marginBottom: '4px' }}>Reason</label>
                        <div style={{ color: '#334155', lineHeight: 1.5 }}>{leave.reason}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button
                            onClick={() => handleAction('APPROVED')}
                            style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}
                        >
                            Approve Request
                        </button>
                        <button
                            onClick={() => handleAction('REJECTED')}
                            style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #ef4444', background: 'white', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}
                        >
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentResponse;
