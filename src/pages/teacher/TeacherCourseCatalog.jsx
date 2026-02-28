import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Users, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './TeacherCourseCatalog.css';

const TeacherCourseCatalog = () => {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const [mySections, setMySections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    }, [currentUser]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const sectionRes = await api.get(`/courses/sections/faculty/${currentUser.uid}`);
            setMySections(Array.isArray(sectionRes.data) ? sectionRes.data : []);
        } catch (error) {
            console.error("Error fetching course data", error);
            setMySections([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-deep)' }}>
            <div className="text-indigo-500 animate-pulse text-xs font-bold tracking-[0.2em] uppercase">Loading Academic Catalog...</div>
        </div>
    );

    return (
        <div className="teacher-catalog-container">
            <header className="catalog-header">
                <h1>My Courses</h1>
                <p className="font-bold text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>Professional Curriculum & Academic Management</p>
            </header>

            <div className="sections-container">
                {mySections.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={64} className="mx-auto" style={{ color: 'var(--primary)', opacity: 0.5 }} />
                        <h3>No Courses Assigned</h3>
                        <p className="font-medium text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            "You haven't been assigned any courses for this semester yet. Please verify with your HOD."
                        </p>
                    </div>
                ) : (
                    <div className="sections-grid">
                        {mySections.map(section => {
                            if (!section) return null;
                            return (
                                <div
                                    key={section.id}
                                    className="section-card"
                                    onClick={() => navigate(`/teacher/courses/${section.id}/manage`)}
                                >
                                    <div className="card-image-wrapper">
                                        {section.course?.thumbnailUrl ? (
                                            <img src={section.course.thumbnailUrl} alt={section.course.name || 'Course'} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--bg-card), var(--bg-subtle))' }}>
                                                <BookOpen size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                                            </div>
                                        )}
                                        <div className="card-overlay"></div>
                                        <div className="card-badges">
                                            <span className="badge badge-code">{section.course?.code || 'N/A'}</span>
                                            <span className="badge badge-term">{section.semester || 'Sem'} {section.year}</span>
                                        </div>
                                    </div>

                                    <div className="card-content">
                                        <h3 className="card-title">
                                            {section.course?.name || 'Untitled Course'}
                                        </h3>
                                        <p className="card-desc">
                                            {section.course?.description || 'No description available for this course.'}
                                        </p>

                                        <div className="card-footer">
                                            <div className="student-count">
                                                <Users size={14} style={{ color: 'var(--primary)' }} />
                                                <span>{section.enrollmentCount || '0'} Students</span>
                                            </div>
                                            <button className="view-hub-btn">
                                                View Hub
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherCourseCatalog;
