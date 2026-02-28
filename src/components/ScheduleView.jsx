import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import './ScheduleView.css';
import { Calendar, Clock, MapPin, Info, BookOpen } from 'lucide-react';

const ScheduleView = ({ compact = false }) => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            const response = await api.get('/schedules');
            setSchedules(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch schedules", err);
            setError("Could not load schedules. Please try again later.");
            setLoading(false);
        }
    };

    // Group schedules by date
    const groupedSchedules = schedules.reduce((groups, schedule) => {
        const date = schedule.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(schedule);
        return groups;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(groupedSchedules).sort((a, b) => new Date(a) - new Date(b));

    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        // If already formatted or just HH:mm
        return timeString.substring(0, 5);
    };

    const getCardTypeClass = (type) => {
        return `card-type-${type?.toLowerCase() || 'academic'}`;
    };

    if (loading) return <div className="p-4 text-center text-gray-400">Loading schedules...</div>;
    if (error) return <div className="p-4 text-center text-red-400">{error}</div>;

    if (schedules.length === 0) {
        return (
            <div className="empty-state">
                <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>No Upcoming Schedules</h3>
                <p>There are no academic schedules posted at the moment.</p>
            </div>
        );
    }

    return (
        <div className="schedule-view-container">
            {!compact && (
                <div className="schedule-header">
                    <h2>Academic Schedule</h2>
                    {/* Potential filters could go here */}
                </div>
            )}

            <div className="schedule-list">
                {sortedDates.map(date => (
                    <div key={date} className="date-group">
                        <div className="date-header">
                            <Calendar size={18} />
                            {formatDate(date)}
                        </div>
                        <div className="schedule-cards">
                            {groupedSchedules[date].map(item => (
                                <div key={item.id} className={`schedule-card ${getCardTypeClass(item.type)}`}>
                                    <div className="card-header-row">
                                        <h4 className="card-title">{item.title}</h4>
                                        <span className="card-type-badge">{item.type?.replace('_', ' ')}</span>
                                    </div>

                                    <div className="card-time">
                                        <Clock size={14} />
                                        <span>{formatTime(item.startTime)} - {formatTime(item.endTime)} ({item.session})</span>
                                    </div>

                                    <div className="card-details">
                                        {item.subjectName && (
                                            <div className="card-detail-item">
                                                <BookOpen size={14} style={{ minWidth: '14px' }} />
                                                <span>{item.subjectName}</span>
                                            </div>
                                        )}
                                        {item.location && (
                                            <div className="card-detail-item">
                                                <MapPin size={14} style={{ minWidth: '14px' }} />
                                                <span>{item.location}</span>
                                            </div>
                                        )}
                                        {item.description && (
                                            <div className="card-detail-item">
                                                <Info size={14} style={{ minWidth: '14px' }} />
                                                <span style={{ opacity: 0.8 }}>{item.description}</span>
                                            </div>
                                        )}
                                        {item.rollNoRange && (
                                            <div className="card-detail-item">
                                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Rolls: {item.rollNoRange}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScheduleView;
