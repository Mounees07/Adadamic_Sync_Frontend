import React, { useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Loader, Upload, Download, FileText } from 'lucide-react';
import '../hod/MentorshipManagement.css'; // Reusing HOD CSS for now or create generic one

const COEExamSchedule = () => {
    const { currentUser } = useAuth();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage('');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setMessage("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        // We still pass this as 'hodUid' because the backend probably expects it, 
        // but we should check if backend enforces role check on this parameter.
        // For now, we pass the current user (COE) ID.
        formData.append('hodUid', currentUser.uid);

        setUploading(true);
        try {
            await api.post('/schedules/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Exam schedule uploaded successfully!');
            setFile(null);
        } catch (err) {
            console.error("Upload Error:", err);
            let errorMsg = err.response?.data?.message || err.response?.data || err.message;
            if (typeof errorMsg === 'object') {
                errorMsg = JSON.stringify(errorMsg);
            }
            setMessage('Upload failed: ' + errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = "Title,Type,Date,Session(FN/AN),StartTime,EndTime,Subject Name,Description";
        const sample = "End Semester Exam,SEMESTER_EXAM,2026-05-15,FN,10:00,13:00,Advanced Architecture,Main Hall";
        const content = headers + "\n" + sample;

        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "exam_schedule_template.csv";
        a.click();
    };

    return (
        <div className="coe-upload-container" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header mb-6">
                <h1>Exam Schedule Management</h1>
                <p className="text-muted">Upload and manage official examination schedules for all departments.</p>
            </div>

            <div className="glass-card" style={{ padding: '30px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h3>1. Download Template</h3>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Use this standard CSV format for exam schedules.</p>
                    <button onClick={downloadTemplate} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} /> Download Exam Template
                    </button>
                    <div style={{ marginTop: '15px', fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '15px', borderRadius: '8px' }}>
                        <strong>Allowed Exam Types:</strong> INTERNAL_EXAM, SEMESTER_EXAM
                        <br />
                        <span className="text-muted mt-1 d-block">Please ensure dates do not overlap with existing schedules.</span>
                    </div>
                </div>

                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '24px 0' }} />

                <form onSubmit={handleUpload}>
                    <h3>2. Upload Exam Schedule</h3>
                    <div style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '40px', textAlign: 'center', marginBottom: '20px' }}>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="exam-file-upload"
                        />
                        <label htmlFor="exam-file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <Upload size={48} color="#6366f1" />
                            <span style={{ fontSize: '1.1rem' }}>
                                {file ? file.name : "Click to browse or drag CSV file here"}
                            </span>
                        </label>
                    </div>

                    {message && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '6px',
                            marginBottom: '20px',
                            background: message.includes('success') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: message.includes('success') ? '#10b981' : '#ef4444'
                        }}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="btn-primary"
                        style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                        {uploading ? <Loader className="animate-spin" /> : <Upload size={20} />}
                        Publish Exam Schedule
                    </button>
                </form>
            </div>
        </div>
    );
};

export default COEExamSchedule;
