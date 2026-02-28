import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Loader, Calendar, MapPin, Clock } from 'lucide-react';

const AcademicCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const res = await api.get('/schedules');
            setEvents(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'INTERNAL_EXAM': return '#ef4444'; // Red
            case 'SEMESTER_EXAM': return '#dc2626'; // Dark Red
            case 'LAB_SLOT': return '#3b82f6'; // Blue
            case 'LAB_PRACTICAL': return '#2563eb'; // Dark Blue
            case 'SKILL_TRAINING': return '#f59e0b'; // Orange
            default: return '#10b981'; // Green (Academic)
        }
    };

    const filteredEvents = filter === 'ALL' ? events : events.filter(e => e.type === filter);

    if (loading) return <div className="loading-screen"><Loader className="animate-spin" /></div>;

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h1>Academic Calendar</h1>
                <select
                    className="form-input"
                    style={{ width: 'auto', minWidth: '200px' }}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="ALL">All Events</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="LAB_SLOT">Lab Slots</option>
                    <option value="LAB_PRACTICAL">Lab Practicals</option>
                    <option value="INTERNAL_EXAM">Internal Exams</option>
                    <option value="SEMESTER_EXAM">Semester Exams</option>
                    <option value="SKILL_TRAINING">Skill Training</option>
                </select>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
                {filteredEvents.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} style={{ opacity: 0.2, margin: '20px auto' }} />
                        <p>No scheduled events found.</p>
                    </div>
                ) : filteredEvents.map(event => (
                    <div key={event.id} className="glass-card" style={{ display: 'flex', padding: '0', overflow: 'hidden', borderLeft: `4px solid ${getTypeColor(event.type)}` }}>
                        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>
                            <span style={{ fontSize: '0.9rem', opacity: 0.8, textTransform: 'uppercase' }}>
                                {new Date(event.date).toLocaleString('default', { month: 'short' })}
                            </span>
                            <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                                {new Date(event.date).getDate()}
                            </span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                                {new Date(event.date).toLocaleString('default', { weekday: 'short' })}
                            </span>
                        </div>
                        <div style={{ padding: '20px', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <h3 style={{ margin: 0 }}>{event.title}</h3>
                                <span className="status-badge" style={{ background: getTypeColor(event.type), color: 'white' }}>
                                    {event.type.replace('_', ' ')}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '12px' }}>
                                {event.startTime && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={16} />
                                        {event.startTime} - {event.endTime} {event.session ? `(${event.session})` : ''}
                                    </div>
                                )}
                                {event.subjectName && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: 8, height: 8, background: '#a855f7', borderRadius: '50%' }}></div>
                                        {event.subjectName}
                                    </div>
                                )}
                            </div>

                            {event.description && <p style={{ margin: 0, color: '#cbd5e1' }}>{event.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AcademicCalendar;
