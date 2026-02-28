import React, { useState, useEffect } from 'react';
import {
    Users,
    UserCheck,
    Upload,
    Search,
    ChevronRight,
    Loader,
    CheckCircle2
} from 'lucide-react';
import api from '../../utils/api';
import '../../pages/DashboardOverview.css';
import './MentorshipManagement.css';

const MentorshipManagement = () => {
    const [students, setStudents] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [assigning, setAssigning] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [stuRes, mentRes] = await Promise.all([
                api.get('/users/role/STUDENT'),
                api.get('/users/role/MENTOR')
            ]);
            setStudents(stuRes.data);
            setMentors(mentRes.data);
        } catch (err) {
            console.error("Error fetching data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const res = await api.post('/users/bulk-assign-mentor', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Bulk assignment report:\n" + res.data.join('\n'));
            fetchData(); // Refresh both columns
        } catch (err) {
            alert("Bulk upload failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkRegister = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('role', 'STUDENT');

        setLoading(true);
        try {
            const res = await api.post('/users/bulk-register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Bulk registration report:\n" + res.data.join('\n'));
            fetchData(); // Refresh student list
        } catch (err) {
            alert("Registration failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedStudent || !selectedMentor) return;
        setAssigning(true);
        try {
            await api.post('/users/assign-mentor', {
                studentUid: selectedStudent.firebaseUid,
                mentorUid: selectedMentor.firebaseUid
            });
            // Update local state
            setStudents(students.map(s =>
                s.firebaseUid === selectedStudent.firebaseUid
                    ? { ...s, mentor: selectedMentor }
                    : s
            ));
            setSelectedStudent(null);
            setSelectedMentor(null);
            alert("Mentorship assigned successfully!");
        } catch (err) {
            alert("Assignment failed: " + err.message);
        } finally {
            setAssigning(false);
        }
    };

    const downloadMappingTemplate = () => {
        const csvContent = "Student Email,Mentor Email\nstudent@example.com,mentor@example.com";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'mentor_mapping_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="loading-screen"><Loader className="animate-spin" /></div>;

    return (
        <div className="mentorship-mgmt">
            <header className="page-header">
                <div className="header-content">
                    <h1>Mentorship Management</h1>
                    <p>Assign students to mentors and manage department-wide academic guidance.</p>
                </div>
                <div className="header-actions">
                    {/* Bulk Register Students */}
                    <input
                        type="file"
                        id="bulk-register"
                        accept=".csv"
                        hidden
                        onChange={handleBulkRegister}
                    />
                    <button className="btn btn-secondary" onClick={() => document.getElementById('bulk-register').click()}>
                        <Users size={18} />
                        Bulk Student Upload
                    </button>

                    <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 8px' }}></div>

                    {/* Bulk Assign Mentors */}
                    <button className="btn btn-outline" onClick={downloadMappingTemplate} title="Download Template">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Template
                    </button>

                    <input
                        type="file"
                        id="bulk-upload"
                        accept=".csv"
                        hidden
                        onChange={handleBulkUpload}
                    />
                    <button className="btn btn-primary" onClick={() => document.getElementById('bulk-upload').click()}>
                        <Upload size={18} />
                        Bulk Assign Mentors
                    </button>
                </div>
            </header>

            <div className="mgmt-grid">
                {/* Student Column */}
                <div className="mgmt-column glass-card">
                    <div className="column-header">
                        <h3>Students ({students.length})</h3>
                        <div className="mini-search">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Find student..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="item-list">
                        {students.filter(s => s.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(student => (
                            <div
                                key={student.id}
                                className={`mgmt-item ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                                onClick={() => setSelectedStudent(student)}
                            >
                                <div className="item-info">
                                    <span className="name">{student.fullName}</span>
                                    <span className="sub">{student.mentor ? `Mentor: ${student.mentor.fullName}` : 'No Mentor Assigned'}</span>
                                </div>
                                {student.mentor && <CheckCircle2 size={16} className="assigned-icon" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Column */}
                <div className="action-column">
                    <div className="assignment-status glass-card animate-fade-in">
                        <div className="status-box">
                            <span className="label">Student</span>
                            <span className="value">{selectedStudent ? selectedStudent.fullName : 'Select Student'}</span>
                        </div>
                        <div className="arrow-icon"><ChevronRight size={32} /></div>
                        <div className="status-box">
                            <span className="label">Mentor</span>
                            <span className="value">{selectedMentor ? selectedMentor.fullName : 'Select Mentor'}</span>
                        </div>
                        <button
                            className="btn btn-primary btn-block"
                            disabled={!selectedStudent || !selectedMentor || assigning}
                            onClick={handleAssign}
                        >
                            {assigning ? 'Processing...' : 'Confirm Assignment'}
                        </button>
                    </div>
                </div>

                {/* Mentor Column */}
                <div className="mgmt-column glass-card">
                    <div className="column-header">
                        <h3>Mentors ({mentors.length})</h3>
                    </div>
                    <div className="item-list">
                        {mentors.map(mentor => (
                            <div
                                key={mentor.id}
                                className={`mgmt-item ${selectedMentor?.id === mentor.id ? 'selected' : ''}`}
                                onClick={() => setSelectedMentor(mentor)}
                            >
                                <div className="item-info">
                                    <span className="name">{mentor.fullName}</span>
                                    <span className="sub">{mentor.email}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorshipManagement;
