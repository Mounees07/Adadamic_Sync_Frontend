import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Loader, Trash2, Calendar, Clock, MapPin, User, Video, Edit, Users } from 'lucide-react';
import '../mentor/MentorMeetings.css'; // Reuse existing styles

const HODMeetings = () => {
    const { currentUser, userData } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
    const [editId, setEditId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        startTime: '',
        location: '',
        description: '',
        targetFaculty: 'all' // 'all' or specific faculty UID
    });

    useEffect(() => {
        const loadData = async () => {
            if (!currentUser || !userData) return;
            try {
                // Parallel fetch: Meetings and Faculty
                // We fetch BOTH lists and merge them to ensure no one is missed due to department naming mismatches.
                const [meetingsRes, deptFacultyRes, allFacultyRes] = await Promise.all([
                    api.get(`/meetings/mentor/${currentUser.uid}`),
                    userData.department ? api.get(`/users/faculty/department?department=${userData.department}`) : Promise.resolve({ data: [] }),
                    api.get('/users/faculty')
                ]);

                // Merge and Deduplicate
                const rawList = [...(deptFacultyRes.data || []), ...(allFacultyRes.data || [])];
                const uniqueFaculty = Array.from(new Map(rawList.map(item => [item.firebaseUid, item])).values());

                // Filter out the current HOD (himself/herself)
                const finalFacultyList = uniqueFaculty.filter(u => u.firebaseUid !== currentUser.uid);

                // Sort meetings
                const sorted = meetingsRes.data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

                setMeetings(sorted);
                setFaculty(finalFacultyList);
            } catch (err) {
                console.error("Error loading HOD meeting data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentUser, userData]);

    const handleCreate = () => {
        setFormMode('create');
        setFormData({
            title: '',
            startTime: '',
            location: '',
            description: '',
            targetFaculty: 'all'
        });
        setEditId(null);
        setShowModal(true);
    };

    const handleEdit = (meeting) => {
        setFormMode('edit');
        setEditId(meeting.id);
        setFormData({
            title: meeting.title,
            startTime: meeting.startTime,
            location: meeting.location,
            description: meeting.description || '',
            targetFaculty: meeting.mentee ? meeting.mentee.firebaseUid : 'all'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Reuse existing endpoints. Backend treats param 'mentorUid' as Organizer
            // and 'menteeUid' as Attendee/Participant.
            if (formMode === 'create') {
                if (formData.targetFaculty === 'all') {
                    // Bulk Schedule (Department Meeting)
                    // Note: The backend logic for 'schedule-bulk' fetches MENTEES of the mentor.
                    // THIS IS A PROBLEM. HOD's do not have mentees assigned in the same way.
                    // We need a specific endpoint for HOD Bulk or update backend to handle generic lists.

                    // For now, to support HOD "Group Meeting", we might have to loop strictly on frontend 
                    // OR implementing a new backend endpoint is safer.

                    // However, avoiding backend complexity first: 
                    // Let's loop through all faculty and call schedule individual 
                    // OR (Better) use the bulk endpoint but I need to make sure backend supports it.

                    // Check MeetingService.java -> scheduleGroupMeeting fetches `userRepository.findByMentorFirebaseUid(mentorUid)`.
                    // This will return NOTHING for HOD if they are not mentoring the faculty explicitly.

                    // FIX: I will iterate here on frontend to save time and ensure reliability without touching deep backend logic again unless necessary.
                    if (faculty.length === 0) {
                        alert("No faculty members found to schedule with.");
                        return;
                    }

                    // Send requests in parallel (capped concurrency if needed, but for <50 faculty it's fine)
                    const promises = faculty.map(f =>
                        api.post(`/meetings/schedule?mentorUid=${currentUser.uid}&menteeUid=${f.firebaseUid}`, {
                            title: formData.title,
                            startTime: formData.startTime,
                            location: formData.location,
                            description: formData.description
                        })
                    );

                    await Promise.all(promises);

                } else {
                    // Individual Schedule
                    await api.post(`/meetings/schedule?mentorUid=${currentUser.uid}&menteeUid=${formData.targetFaculty}`, {
                        title: formData.title,
                        startTime: formData.startTime,
                        location: formData.location,
                        description: formData.description
                    });
                }
                alert("Meeting scheduled successfully!");
            } else {
                // Update
                await api.put(`/meetings/${editId}`, {
                    title: formData.title,
                    startTime: formData.startTime,
                    location: formData.location,
                    description: formData.description
                });
                alert("Meeting updated successfully!");
            }

            // Refresh list
            const res = await api.get(`/meetings/mentor/${currentUser.uid}`);
            setMeetings(res.data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
            setShowModal(false);
        } catch (err) {
            console.error(err);
            alert("Operation failed: " + (err.response?.data?.message || err.message));
        }
    };

    const handleCancel = async (id, title) => {
        if (!window.confirm(`Are you sure you want to cancel the meeting "${title}"?`)) return;
        try {
            await api.delete(`/meetings/${id}`);
            setMeetings(meetings.filter(m => m.id !== id));
        } catch (err) {
            alert("Failed to cancel: " + err.message);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true
        });
    };

    if (loading) return <div className="loading-screen"><Loader className="animate-spin" /></div>;

    return (
        <div className="meetings-page">
            <header className="page-header">
                <div className="header-content">
                    <h1>Department Meetings</h1>
                    <p>Schedule and manage meetings with your faculty members.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={handleCreate}>
                        <Calendar size={18} /> Schedule Meeting
                    </button>
                </div>
            </header>

            <div className="meetings-grid">
                {meetings.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} style={{ opacity: 0.2, margin: '20px auto' }} />
                        <p>No upcoming meetings scheduled.</p>
                        <button className="btn-text" onClick={handleCreate}>Schedule your first meeting</button>
                    </div>
                ) : meetings.map(meeting => (
                    <div key={meeting.id} className="meeting-card glass-card">
                        <div className="meeting-date">
                            <span className="month">{new Date(meeting.startTime).toLocaleString('default', { month: 'short' })}</span>
                            <span className="day">{new Date(meeting.startTime).getDate()}</span>
                        </div>

                        <div className="meeting-details">
                            <h3>{meeting.title}</h3>
                            <div className="meeting-meta">
                                <span className="meta-item">
                                    <Clock size={14} /> {formatDate(meeting.startTime)}
                                </span>
                                <span className="meta-item">
                                    {meeting.location.includes('http') ? <Video size={14} /> : <MapPin size={14} />}
                                    {meeting.location}
                                </span>
                                <span className="meta-item highlight">
                                    <User size={14} /> {meeting.mentee ? meeting.mentee.fullName : 'Unknown Participant'}
                                </span>
                            </div>
                            {meeting.description && <p className="meeting-desc">{meeting.description}</p>}
                        </div>

                        <div className="meeting-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                            <button
                                className="icon-btn"
                                onClick={() => handleEdit(meeting)}
                                title="Edit Meeting"
                                style={{ color: 'var(--primary)' }}
                            >
                                <Edit size={18} />
                            </button>
                            <button
                                className="icon-btn danger"
                                onClick={() => handleCancel(meeting.id, meeting.title)}
                                title="Cancel"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Faculty List Missing & Seed Option */}
            {faculty.length === 0 && (
                <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--warning)',
                    borderRadius: '8px',
                    color: 'var(--warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <span>
                        <strong>Warning:</strong> No faculty members (Teachers/Mentors) found in the entire database.<br />
                        <span style={{ fontSize: '0.85em', opacity: 0.8 }}>
                            (Checked Department: {userData?.department || 'N/A'} & Fallback to All Faculty)
                        </span>
                    </span>

                    {!userData?.department ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="Enter Dept (e.g. CSE)"
                                id="manualDeptInput"
                                style={{
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--warning)',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <button
                                onClick={async () => {
                                    const val = document.getElementById('manualDeptInput').value;
                                    if (!val) return alert("Please enter a department name");
                                    try {
                                        await api.put(`/users/${currentUser.uid}`, { department: val });
                                        alert(`Department set to ${val}. Reloading...`);
                                        window.location.reload();
                                    } catch (e) {
                                        alert("Failed to set department: " + e.message);
                                    }
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: 'var(--warning)',
                                    color: 'black',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Set Department
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={async () => {
                                if (!window.confirm(`This will create 'Dr. Demo Faculty' in '${userData.department}' for testing. Proceed?`)) return;
                                try {
                                    setLoading(true); // Show local loading
                                    await api.post(`/users/dev/seed-faculty?department=${userData.department}`);
                                    alert("Demo faculty created! Reloading...");
                                    window.location.reload();
                                } catch (e) {
                                    alert("Error: " + (e.response?.data?.message || e.message));
                                    setLoading(false);
                                }
                            }}
                            style={{
                                padding: '8px 16px',
                                background: 'var(--warning)',
                                color: 'black',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            + Add Demo Faculty
                        </button>
                    )}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-fade-in">
                        <div className="modal-header">
                            <h2>{formMode === 'create' ? 'Schedule Department Meeting' : 'Edit Meeting'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Monthly Staff Meeting"
                                    required
                                />
                            </div>

                            {formMode === 'create' && (
                                <div className="form-group">
                                    <label>Attendee(s)</label>
                                    <select
                                        className="form-input custom-select"
                                        value={formData.targetFaculty}
                                        onChange={e => setFormData({ ...formData, targetFaculty: e.target.value })}
                                    >
                                        <option value="all">All Department Faculty (Bulk)</option>
                                        {faculty.map(f => (
                                            <option key={f.id} value={f.firebaseUid}>
                                                {f.fullName} ({f.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Date & Time</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Location / Video Link</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Conference Room 1 or Zoom Link"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="form-input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    placeholder="Agenda: 1. Budget..."
                                />
                            </div>
                            <button type="submit" className="btn-submit">
                                {formMode === 'create' ? 'Schedule Meeting' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HODMeetings;
