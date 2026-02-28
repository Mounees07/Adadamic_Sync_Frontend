import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Calendar, Clock } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './StudentCourses.css';

const StudentCourses = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                const response = await api.get(`/courses/enrollments/student/${currentUser.uid}`);
                setEnrollments(response.data);
            } catch (error) {
                console.error("Failed to fetch courses", error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchEnrollments();
        }
    }, [currentUser]);

    if (loading) return <div className="p-8 text-center text-white">Loading courses...</div>;

    return (
        <div className="student-courses-container">
            <header className="page-header">
                <h1>My Courses</h1>
                <p>Manage your academic courses and track progress.</p>
            </header>

            <div className="courses-grid">
                {enrollments.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={48} className="text-gray-400 mb-4" />
                        <h3>No Courses Enrolled</h3>
                        <p>You are not currently enrolled in any courses.</p>
                    </div>
                ) : (
                    enrollments.map(enrollment => {
                        if (!enrollment.section) return null;
                        return (
                            <div key={enrollment.id} className="transport-card">
                                <div className="tc-header">
                                    <div className="tc-user-info">
                                        <div className="tc-avatar">
                                            <BookOpen size={20} />
                                        </div>
                                        <div className="tc-user-details">
                                            <h4>{enrollment.section.course?.name || 'Untitled Course'}</h4>
                                            <span>{enrollment.section.course?.code || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="tc-status enrolled">Enrolled</div>
                                </div>

                                <div className="tc-route">
                                    {/* Start Point - Semester Info */}
                                    <div className="route-point">
                                        <div className="rp-icon start"></div>
                                        <div className="rp-details">
                                            <div className="rp-title">Semester {enrollment.section.semester}</div>
                                            <div className="rp-sub">Academic Year {enrollment.section.year}</div>
                                        </div>
                                    </div>

                                    {/* End Point - Faculty Info */}
                                    <div className="route-point">
                                        <div className="rp-icon end"></div>
                                        <div className="rp-details">
                                            <div className="rp-title">{enrollment.section.faculty?.fullName || 'Unknown Faculty'}</div>
                                            <div className="rp-sub">Course Instructor</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="tc-footer">
                                    <div className="footer-item">
                                        <Clock size={14} className="mr-2" />
                                        <span>{enrollment.section.course?.credits || 0} Credits</span>
                                    </div>
                                    <button
                                        className="footer-btn"
                                        onClick={() => navigate(`/student/courses/${enrollment.section.id}`)}
                                    >
                                        View Content
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StudentCourses;
