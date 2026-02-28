import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Loader, Trash2, Calendar, Clock, MapPin, User, Video, Edit } from 'lucide-react';
import './MentorMeetings.css'; // We will create this or inline styles

const MentorMeetings = () => {
    const { currentUser } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [mentees, setMentees] = useState([]);
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
        targetMentee: 'all' // 'all' or specific mentee UID
    });

    useEffect(() => {
        const loadData = async () => {
            if (!currentUser) return;
            try {

                // Parallel fetch: Meetings where I am Mentor, Meetings where I am Mentee/Participant, and My Mentees list
                const [mentorRes, menteeRes, menteesRes] = await Promise.all([
                    api.get(`/meetings/mentor/${currentUser.uid}`),
                    api.get(`/meetings/mentee/${currentUser.uid}`).catch(() => ({ data: [] })), // Handle if endpoint not ready yet
                    api.get(`/users/mentees/${currentUser.uid}`)
                ]);

                // Merge and deduplicate (just in case)
                const allMeetings = [...mentorRes.data, ...(menteeRes.data || [])];

                // Unique by ID
                const uniqueMeetings = Array.from(new Map(allMeetings.map(m => [m.id, m])).values());

                // Sort meetings by upcoming
                const sorted = uniqueMeetings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                setMeetings(sorted);
                setMentees(menteesRes.data);
            } catch (err) {
                console.error("Error loading meeting data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentUser]);

    const handleCreate = () => {
        setFormMode('create');
        setFormData({
            title: '',
            startTime: '',
            location: '',
            description: '',
            targetMentee: 'all'
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
            targetMentee: meeting.mentee ? meeting.mentee.firebaseUid : 'all'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formMode === 'create') {
                if (formData.targetMentee === 'all') {
                    await api.post(`/meetings/schedule-bulk?mentorUid=${currentUser.uid}`, {
                        title: formData.title,
                        startTime: formData.startTime,
                        location: formData.location,
                        description: formData.description
                    });
                } else {
                    await api.post(`/meetings/schedule?mentorUid=${currentUser.uid}&menteeUid=${formData.targetMentee}`, {
                        title: formData.title,
                        startTime: formData.startTime,
                        location: formData.location,
                        description: formData.description
                    });
                }
                alert("Meeting scheduled successfully!");
            } else {
                await api.put(`/meetings/${editId}`, {
                    title: formData.title,
                    startTime: formData.startTime,
                    location: formData.location,
                    description: formData.description
                });
                alert("Meeting updated successfully!");
            }

            // Reload page to refresh data simply
            window.location.reload();
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
                    <h1>Meeting Schedule</h1>
                    <p>Manage your upcoming sessions and meetings.</p>
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
                        <p>No upcoming meetings found.</p>
                        <button className="btn-text" onClick={handleCreate}>Schedule your first meeting</button>
                    </div>
                ) : meetings.map(meeting => {
                    const isOrganizer = meeting.mentor && meeting.mentor.firebaseUid === currentUser.uid;
                    const otherPerson = isOrganizer ? meeting.mentee : meeting.mentor;
                    const displayRole = isOrganizer ? 'Participant' : 'Organizer';

                    return (
                        <div key={meeting.id} className="meeting-card glass-card">
                            <div className="meeting-date">
                                <span className="month">{new Date(meeting.startTime).toLocaleString('default', { month: 'short' })}</span>
                                <span className="day">{new Date(meeting.startTime).getDate()}</span>
                            </div>

                            <div className="meeting-details">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <h3>{meeting.title}</h3>
                                    {!isOrganizer && (
                                        <span style={{
                                            fontSize: '0.7em',
                                            background: '#3b82f6',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            color: 'white'
                                        }}>
                                            Invited
                                        </span>
                                    )}
                                </div>
                                <div className="meeting-meta">
                                    <span className="meta-item">
                                        <Clock size={14} /> {formatDate(meeting.startTime)}
                                    </span>
                                    <span className="meta-item">
                                        {meeting.location.includes('http') ? <Video size={14} /> : <MapPin size={14} />}
                                        {meeting.location}
                                    </span>
                                    <span className="meta-item highlight">
                                        <User size={14} />
                                        {otherPerson ? otherPerson.fullName : 'Unknown User'}
                                        <span style={{ opacity: 0.7, marginLeft: '4px' }}>({displayRole})</span>
                                    </span>
                                </div>
                                {meeting.description && <p className="meeting-desc">{meeting.description}</p>}
                            </div>

                            {isOrganizer && (
                                <div className="meeting-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                                    <button
                                        className="icon-btn"
                                        onClick={() => handleEdit(meeting)}
                                        title="Edit Meeting"
                                        style={{ color: '#6366f1' }}
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        className="icon-btn danger"
                                        onClick={() => handleCancel(meeting.id, meeting.title)}
                                        title="Cancel and Notify Participant"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-fade-in">
                        <div className="modal-header">
                            <h2>{formMode === 'create' ? 'Schedule Meeting' : 'Edit Meeting'}</h2>
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
                                    placeholder="e.g. Weekly Progress Check"
                                    required
                                />
                            </div>

                            {formMode === 'create' && (
                                <div className="form-group">
                                    <label>Attendee(s)</label>
                                    <select
                                        className="form-input custom-select"
                                        value={formData.targetMentee}
                                        onChange={e => setFormData({ ...formData, targetMentee: e.target.value })}
                                    >
                                        <option value="all">All Mentees (Group Meeting)</option>
                                        {mentees.map(m => (
                                            <option key={m.id} value={m.firebaseUid}>{m.fullName} ({m.rollNumber})</option>
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
                                    placeholder="Room 304 or Zoom Link"
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
                                    placeholder="Topics to discuss..."
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

export default MentorMeetings;
