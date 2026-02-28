import React, { useState } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import './COEResultPublish.css';

const COEResultPublish = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [logs, setLogs] = useState([]);

    const [dept, setDept] = useState("CSE");
    const [sem, setSem] = useState("8");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setLogs([]);
    };

    const downloadTemplate = async () => {
        try {
            const res = await api.get('/results/template', {
                params: { dept, sem },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `result_template_${dept}_Sem${sem}.csv`;
            a.click();
        } catch (err) {
            let errorMsg = "Unknown error";
            if (err.response?.data instanceof Blob) {
                try {
                    errorMsg = await err.response.data.text();
                    // Try to parse JSON if possible
                    const json = JSON.parse(errorMsg);
                    if (json.message) errorMsg = json.message;
                } catch (e) { /* use raw text */ }
            } else if (err.message) {
                errorMsg = err.message;
            }
            alert("Failed to download template: " + errorMsg);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a CSV file first.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/results/publish-bulk', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setLogs(res.data);
            if (res.data.some(l => l.includes('✅'))) {
                // partial or full success
            }
        } catch (err) {
            setLogs(["❗ Critical Error: " + (err.response?.data?.message || err.message)]);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Publish Exam Results</h1>
            <p className="text-muted">Generate templates with student data, enter marks, and upload to auto-calculate CGPA.</p>

            <div className="glass-card" style={{ padding: '30px', marginTop: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h3>1. Generate & Download Template</h3>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>Select batch details to get a pre-filled list of students.</p>

                    <div className="flex gap-4 mb-4" style={{ display: 'flex', gap: '16px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Department</label>
                            <select value={dept} onChange={e => setDept(e.target.value)} className="form-input">
                                <option value="CSE">CSE</option>
                                <option value="ECE">ECE</option>
                                <option value="EEE">EEE</option>
                                <option value="MECH">MECH</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Semester</label>
                            <select value={sem} onChange={e => setSem(e.target.value)} className="form-input">
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="8">8</option>
                            </select>
                        </div>
                    </div>

                    <button onClick={downloadTemplate} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} /> Download Pre-filled CSV
                    </button>
                    <div className="card-note mt-2">
                        <strong>Instructions:</strong>
                        <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                            <li>The CSV contains student details. <strong>Do not change Email/RegNo.</strong></li>
                            <li><strong>Add columns</strong> for each subject code (e.g. <code>CS801</code>, <code>CS802</code>).</li>
                            <li>Enter <strong>Marks (0-100)</strong> under each subject code.</li>
                            <li>The system will detect codes, calculate Grades & SGPA automatically.</li>
                        </ul>
                    </div>
                </div>

                <div className="divider"></div>

                <div style={{ marginBottom: '20px' }}>
                    <h3>2. Upload Results</h3>
                    <div className="file-drop-area">
                        <input type="file" accept=".csv" onChange={handleFileChange} id="fileInput" />
                        <label htmlFor="fileInput" className="drop-label">
                            <Upload size={32} className="mb-2" />
                            {file ? file.name : "Click to browse CSV file"}
                        </label>
                    </div>
                </div>

                <button
                    className="btn btn-primary w-full"
                    onClick={handleUpload}
                    disabled={uploading || !file}
                >
                    {uploading ? 'Publishing...' : 'Publish Results'}
                </button>
            </div>

            {logs.length > 0 && (
                <div className="glass-card mt-6" style={{ padding: '20px' }}>
                    <h3>Upload Logs</h3>
                    <div className="logs-container" style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{
                                color: log.includes('✅') ? '#4ade80' : '#f87171',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                {log.includes('✅') ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default COEResultPublish;
