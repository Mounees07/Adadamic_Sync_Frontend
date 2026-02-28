import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Mail,
    Phone,
    ExternalLink,
    MoreVertical,
    UserPlus,
    Loader,
    Upload,
    Calendar,
    AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import '../../pages/DashboardOverview.css';
import './Mentees.css';
import Pagination from '../../components/Pagination';

const Mentees = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [allStudents, setAllStudents] = useState([]);
    const [adding, setAdding] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // Meeting Modal State
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [selectedMentee, setSelectedMentee] = useState(null);
    const [meetingForm, setMeetingForm] = useState({
        title: "",
        description: "",
        location: "",
        startTime: "",
    });
    const [scheduling, setScheduling] = useState(false);

    useEffect(() => {
        fetchMentees();
    }, [currentUser]);

    const fetchMentees = async () => {
        if (!currentUser) return;
        try {
            const res = await api.get(`/users/mentees/${currentUser.uid}`);
            setMentees(res.data);
        } catch (err) {
            console.error("Error fetching mentees", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableStudents = async () => {
        try {
            const res = await api.get('/users/role/STUDENT');
            // Filter out students who already have this mentor or just show all for assignment
            setAllStudents(res.data.filter(s => s.mentor?.firebaseUid !== currentUser.uid));
        } catch (err) {
            console.error("Error fetching students", err);
        }
    };

    const handleAddMentee = async (studentUid) => {
        setAdding(true);
        try {
            await api.post('/users/assign-mentor', {
                studentUid: studentUid,
                mentorUid: currentUser.uid
            });
            setShowAddModal(false);
            fetchMentees();
        } catch (err) {
            alert("Failed to assign mentee: " + err.message);
        } finally {
            setAdding(false);
        }
    };


    const handleScheduleMeeting = async (e) => {
        e.preventDefault();
        if (!selectedMentee && !window.confirm("Schedule this meeting for ALL your mentees?")) return;

        setScheduling(true);
        try {
            if (selectedMentee) {
                // Individual Meeting
                await api.post(`/meetings/schedule`, meetingForm, {
                    params: {
                        mentorUid: currentUser.uid,
                        menteeUid: selectedMentee.firebaseUid
                    }
                });
            } else {
                // Bulk Meeting (No specific mentee selected)
                await api.post(`/meetings/schedule-bulk`, meetingForm, {
                    params: { mentorUid: currentUser.uid }
                });
            }
            alert("Meeting scheduled! Mentee has been notified via email.");
            setShowMeetingModal(false);
            setMeetingForm({ title: "", description: "", location: "", startTime: "" });
        } catch (err) {
            alert("Failed to schedule meeting: " + err.message);
        } finally {
            setScheduling(false);
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            await api.put(`/users/${selectedMentee.firebaseUid}`, editForm);
            alert("Student details updated successfully!");
            setSelectedMentee(null); // Close modal
            fetchMentees(); // Refresh list
        } catch (err) {
            alert("Failed to update: " + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (gpa) => {
        if (gpa >= 3.8) return '#10b981'; // Excellent
        if (gpa >= 3.0) return '#6366f1'; // Good
        if (gpa >= 2.0) return '#f59e0b'; // Needs Support
        return '#ef4444'; // At Risk
    };

    const getStatusText = (gpa) => {
        if (gpa >= 3.8) return 'Excellent';
        if (gpa >= 3.0) return 'Good';
        if (gpa >= 2.0) return 'Needs Support';
        return 'At Risk';
    };

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Derived Logic
    const filteredMentees = mentees.filter(m => (m.fullName || "Unknown Student").toLowerCase().includes(searchTerm.toLowerCase()));
    const paginatedMentees = filteredMentees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) return <div className="loading-screen"><Loader className="animate-spin" /></div>;

    return (
        <div className="mentees-page">
            <header className="page-header">
                <div className="header-content">
                    <h1>My Mentees</h1>
                    <p>Monitor individual student performance and provide direct guidance.</p>
                </div>
                <div className="header-actions">

                    <button className="btn btn-primary" onClick={() => { fetchAvailableStudents(); setShowAddModal(true); }}>
                        <UserPlus size={18} />
                        Add Mentee
                    </button>
                </div>
            </header>

            <div className="mentee-controls glass-card">
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search mentees by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-secondary">
                    <Filter size={18} />
                    Filter
                </button>
            </div>

            <div className="mentees-grid">
                {paginatedMentees.map(mentee => (
                    <div key={mentee.id} className="mentee-card glass-card animate-fade-in">
                        <div className="mentee-card-header">
                            <div className="mentee-avatar">
                                {mentee.profilePictureUrl ? <img src={mentee.profilePictureUrl} alt="" /> : (mentee.fullName || "?").charAt(0)}
                            </div>
                            <div className="mentee-main-info">
                                <h3>{mentee.fullName}</h3>
                                <span className="mentee-status" style={{
                                    color: getStatusColor(mentee.gpa || 3.0),
                                    backgroundColor: `${getStatusColor(mentee.gpa || 3.0)}15`
                                }}>
                                    {getStatusText(mentee.gpa || 3.0)}
                                </span>
                            </div>
                            <button className="icon-btn"><MoreVertical size={18} /></button>
                        </div>

                        <div className="mentee-academic-info">
                            <span className="academic-item"><strong>Roll:</strong> {mentee.rollNumber || 'N/A'}</span>
                            <span className="academic-item"><strong>Dept:</strong> {mentee.department || 'N/A'}</span>
                            <span className="academic-item"><strong>Batch:</strong> Sem {mentee.semester || '?'}-{mentee.section || '?'}</span>
                        </div>

                        <div className="mentee-metrics">
                            <div className="metric">
                                <span className="metric-label">Current GPA</span>
                                <span className="metric-value">{mentee.gpa || "0.0"}</span>
                            </div>
                            <div className="metric">
                                <span className="metric-label">Attendance</span>
                                <span className="metric-value">{mentee.attendance || "0"}%</span>
                            </div>
                        </div>

                        <div className="progress-bar-container">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${mentee.attendance || 0}%`, backgroundColor: getStatusColor(mentee.gpa || 3.0) }}
                            ></div>
                        </div>

                        <div className="mentee-contact">
                            <a href={`mailto:${mentee.email}`} className="contact-link"><Mail size={16} /></a>
                            <a href={`tel:${mentee.phone || '#'}`} className="contact-link"><Phone size={16} /></a>

                            <button className="btn btn-text" onClick={() => {
                                navigate('/mentor/dashboard', { state: { selectedMentee: mentee, isViewingMenteeDetails: true } });
                            }}>
                                Details <ExternalLink size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {filteredMentees.length === 0 && <p className="empty-state">No mentees assigned yet.</p>}
            </div>

            {filteredMentees.length > itemsPerPage && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredMentees.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                />
            )}

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card">
                        <div className="modal-header">
                            <h2>Assign New Mentee</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
                        </div>
                        <div className="student-list">
                            {allStudents.length === 0 ? <p>No students available to assign.</p> :
                                allStudents.map(student => (
                                    <div key={student.id} className="student-item">
                                        <div className="student-info">
                                            <span className="name">{student.fullName} <span style={{ fontSize: '0.8em', opacity: 0.7 }}>({student.rollNumber})</span></span>
                                            <span className="email">{student.email}</span>
                                        </div>
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => handleAddMentee(student.firebaseUid)}
                                            disabled={adding}
                                        >
                                            {adding ? 'Assigning...' : 'Assign'}
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Student Details Modal */}
            {
                selectedMentee && !showMeetingModal && (
                    <div className="modal-overlay" onClick={() => setSelectedMentee(null)}>
                        <div className="modal-content glass-card detail-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{isEditing ? 'Edit Student Profile' : 'Student Profile'}</h2>
                                <button className="close-btn" onClick={() => setSelectedMentee(null)}>&times;</button>
                            </div>

                            <div className="student-detail-view">
                                <div className="detail-header">
                                    <div className="detail-avatar">
                                        {selectedMentee.profilePictureUrl ?
                                            <img src={selectedMentee.profilePictureUrl} alt="" /> :
                                            (selectedMentee.fullName || "?").charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {!isEditing ? (
                                            <>
                                                <h3>{selectedMentee.fullName}</h3>
                                                <p className="text-muted">{selectedMentee.email}</p>
                                                <span className={`status-badge ${selectedMentee.gpa > 7 ? 'success' : 'warning'}`}>
                                                    {selectedMentee.gpa > 7 ? 'Good Standing' : 'Needs Attention'}
                                                </span>
                                            </>
                                        ) : (
                                            <div className="form-group mb-0">
                                                <label>Full Name</label>
                                                <input
                                                    className="form-input"
                                                    value={editForm.fullName || ''}
                                                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-grid">
                                    <div className="detail-section">
                                        <h4>Academic Information</h4>
                                        {!isEditing ? (
                                            <>
                                                <div className="info-row"><span>Register No:</span> <strong>{selectedMentee.rollNumber || 'N/A'}</strong></div>
                                                <div className="info-row"><span>Department:</span> <strong>{selectedMentee.department || 'N/A'}</strong></div>
                                                <div className="info-row"><span>Semester:</span> <strong>{selectedMentee.semester || 'N/A'}</strong></div>
                                                <div className="info-row"><span>Section:</span> <strong>{selectedMentee.section || 'N/A'}</strong></div>
                                            </>
                                        ) : (
                                            <div className="edit-grid">
                                                <div className="form-group">
                                                    <label>Register No</label>
                                                    <input value={editForm.rollNumber || ''} onChange={e => setEditForm({ ...editForm, rollNumber: e.target.value })} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Dept</label>
                                                    <input value={editForm.department || ''} onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Semester</label>
                                                    <input type="number" value={editForm.semester || ''} onChange={e => setEditForm({ ...editForm, semester: e.target.value })} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Section</label>
                                                    <input value={editForm.section || ''} onChange={e => setEditForm({ ...editForm, section: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="detail-section">
                                        <h4>Performance Metrics</h4>
                                        {!isEditing ? (
                                            <>
                                                <div className="info-row"><span>CGPA:</span> <strong>{selectedMentee.gpa || '0.00'}</strong></div>
                                                <div className="info-row"><span>Attendance:</span> <strong>{selectedMentee.attendance || '0'}%</strong></div>
                                                <div className="info-row"><span>Arrears:</span> <strong style={{ color: selectedMentee.arrearCount > 0 ? '#ef4444' : 'inherit' }}>{selectedMentee.arrearCount !== undefined && selectedMentee.arrearCount !== null ? selectedMentee.arrearCount : '0'}</strong></div>
                                            </>
                                        ) : (
                                            <div className="edit-grid">
                                                <div className="form-group">
                                                    <label>CGPA</label>
                                                    <input type="number" step="0.01" value={editForm.gpa || ''} onChange={e => setEditForm({ ...editForm, gpa: e.target.value })} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Attendance (%)</label>
                                                    <input type="number" value={editForm.attendance || ''} onChange={e => setEditForm({ ...editForm, attendance: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-actions mt-6">
                                    <h4>Actions</h4>
                                    {!isEditing ? (
                                        <div className="action-buttons-row">
                                            <button className="btn btn-secondary w-full" onClick={() => setIsEditing(true)}>
                                                <Upload size={16} /> Edit Details
                                            </button>
                                            <button className="btn btn-danger w-full" onClick={() => alert(`Report discrepancy for ${selectedMentee.rollNumber} has been logged.`)}>
                                                <AlertTriangle size={16} /> Report Discrepancy
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="action-buttons-row">
                                            <button className="btn btn-secondary w-full" onClick={() => setIsEditing(false)}>
                                                Cancel
                                            </button>
                                            <button className="btn btn-success w-full" onClick={handleUpdate} disabled={saving}>
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted mt-2">
                                        * Use "Edit Details" to correct any discrepancies you find.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Mentees;
