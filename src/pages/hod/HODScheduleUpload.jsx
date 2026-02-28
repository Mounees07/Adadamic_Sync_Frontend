import React, { useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Loader, Upload, Download, FileText } from 'lucide-react';

const HODScheduleUpload = () => {
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
        formData.append('hodUid', currentUser.uid);

        setUploading(true);
        try {
            await api.post('/schedules/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Schedule uploaded successfully!');
            setFile(null);
        } catch (err) {
            setMessage('Upload failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = "Title,Type,Date,Session(FN/AN),StartTime,EndTime,Subject Name,Description";
        // Updated sample to reflect HOD's new scope (Class Schedule instead of Exams)
        const sample = "Regular Class,ACADEMIC,2026-06-01,FN,09:00,10:00,Operating Systems,Unit 1 Introduction";
        const content = headers + "\n" + sample;

        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "class_schedule_template.csv";
        a.click();
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Upload Department Schedule</h1>
            <p className="text-muted">Upload CSV for Class Timetables, Labs, Skill Training, and Faculty Meetings.</p>

            <div className="glass-card" style={{ padding: '30px', marginTop: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h3>1. Download Template</h3>
                    <p className="text-muted">Use this CSV format to prepare your schedule.</p>
                    <button onClick={downloadTemplate} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} /> Download CSV Template
                    </button>
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', background: 'var(--bg-subtle)', padding: '10px', borderRadius: '4px' }}>
                        <strong>Allowed Types:</strong> ACADEMIC, LAB_SLOT, SKILL_TRAINING, FACULTY_MEETING
                        <br />
                        <span style={{ color: 'var(--danger)' }}>Note: Exam schedules are now handled by COE.</span>
                    </div>
                </div>

                <hr style={{ borderColor: 'var(--glass-border)', margin: '24px 0' }} />

                <form onSubmit={handleUpload}>
                    <h3>2. Upload File</h3>
                    <div style={{ border: '2px dashed var(--glass-border)', borderRadius: '8px', padding: '40px', textAlign: 'center', marginBottom: '20px' }}>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <Upload size={48} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                {file ? file.name : "Click to browse or drag file here"}
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
                        Upload Schedule
                    </button>
                </form>
            </div>
        </div>
    );
};

export default HODScheduleUpload;
