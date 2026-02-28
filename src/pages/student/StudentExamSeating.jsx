import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './StudentExamSeating.css';

const StudentExamSeating = () => {
    const { currentUser } = useAuth();
    const [seatings, setSeatings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSeating = async () => {
            if (!currentUser) return;
            try {
                const res = await api.get(`/exam-seating/student/uid/${currentUser.uid}`);
                setSeatings(res.data);
            } catch (error) {
                console.error("Failed to fetch seating", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSeating();
    }, [currentUser]);

    if (loading) return <div className="p-8 text-center">Loading seating allocation...</div>;

    return (
        <div className="student-seating-container">
            <header className="page-header">
                <div>
                    <h1>Exam Seating</h1>
                    <p>View your allocated exam venues.</p>
                </div>
            </header>

            <div className="seating-list">
                {seatings.length === 0 ? (
                    <div className="empty-state">
                        <MapPin size={48} className="text-gray-400 mb-4" />
                        <h3>No Seatings Found</h3>
                        <p>You have not been allocated any seats yet.</p>
                    </div>
                ) : (
                    seatings.map(seating => (
                        <div key={seating.id} className="seating-item glass-card">
                            <div className="seating-left">
                                <div className="exam-icon">
                                    <Calendar size={24} className="text-primary" />
                                </div>
                                <div className="seating-info">
                                    <h4>{seating.exam?.subjectName || "Exam"}</h4>
                                    <div className="seating-meta">
                                        <span className="meta-tag">
                                            <Calendar size={14} />
                                            {seating.exam?.date ? new Date(seating.exam.date).toLocaleDateString() : 'TBD'}
                                        </span>
                                        <span className="meta-tag">
                                            <Clock size={14} />
                                            {seating.exam?.time || 'TBD'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="seating-right">
                                <div className="venue-info">
                                    <span className="venue-label">Venue</span>
                                    <span className="venue-value">{seating.venue?.name}</span>
                                </div>
                                {seating.seatNumber && (
                                    <div className="seat-info">
                                        <span className="seat-label">Seat No</span>
                                        <span className="seat-value">{seating.seatNumber}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StudentExamSeating;
