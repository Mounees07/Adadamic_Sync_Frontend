import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './StudentAssignments.css';
import Pagination from '../../components/Pagination';

const StudentAssignments = () => {
    const { currentUser } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING, SUBMITTED

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;
            try {
                // 1. Get Enrollments
                const enrollRes = await api.get(`/courses/enrollments/student/${currentUser.uid}`);
                const enrollments = enrollRes.data;

                // 2. Get Assignments for each section
                const assignmentPromises = enrollments.map(e =>
                    api.get(`/assignments/section/${e.section.id}`).then(res => ({
                        data: res.data,
                        courseName: e.section.course.name,
                        courseCode: e.section.course.code
                    }))
                );

                const assignmentsRes = await Promise.all(assignmentPromises);

                // 3. Get Student Submissions
                const submissionsRes = await api.get(`/assignments/student/${currentUser.uid}`);
                const submissions = submissionsRes.data;
                const submissionMap = new Map(submissions.map(s => [s.assignment.id, s]));

                // 4. Merge Data
                let allAssignments = [];
                assignmentsRes.forEach(group => {
                    const enhancedArgs = group.data.map(a => ({
                        ...a,
                        courseName: group.courseName,
                        courseCode: group.courseCode,
                        submission: submissionMap.get(a.id) || null,
                        status: submissionMap.has(a.id) ? 'SUBMITTED' : (new Date(a.dueDate) < new Date() ? 'OVERDUE' : 'PENDING')
                    }));
                    allAssignments = [...allAssignments, ...enhancedArgs];
                });

                // Sort by due date
                allAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

                // Filter out demo assignments per user request
                const cleanAssignments = allAssignments.filter(a =>
                    !a.title.startsWith("Assignment 1:") &&
                    !a.title.includes("Midterm Project")
                );

                setAssignments(cleanAssignments);

            } catch (error) {
                console.error("Failed to fetch assignments", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const handleFileUpload = async (assignmentId) => {
        // Placeholder for file upload logic
        const url = prompt("Enter file URL for submission (Simulated):", "http://example.com/file.pdf");
        if (url) {
            try {
                await api.post(`/assignments/${assignmentId}/submit?studentUid=${currentUser.uid}`, { fileUrl: url });
                alert("Assignment submitted successfully!");
                window.location.reload(); // Simple reload to refresh state
            } catch (e) {
                alert("Submission failed: " + e.message);
            }
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    const filteredAssignments = filter === 'ALL' ? assignments : assignments.filter(a =>
        filter === 'PENDING' ? (a.status === 'PENDING' || a.status === 'OVERDUE') : a.status === 'SUBMITTED'
    );

    const paginatedAssignments = filteredAssignments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) return <div className="p-8 text-center">Loading assignments...</div>;

    return (
        <div className="student-assignments-container">
            <header className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Assignments</h1>
                        <p>Track your upcoming deadlines and submissions.</p>
                    </div>
                    <select
                        className="filter-select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="ALL">All Assignments</option>
                        <option value="PENDING">Pending & Overdue</option>
                        <option value="SUBMITTED">Completed</option>
                    </select>
                </div>
            </header>

            <div className="assignments-list">
                {paginatedAssignments.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} className="text-gray-400 mb-4" />
                        <h3>No Assignments Found</h3>
                        <p>You're all caught up!</p>
                    </div>
                ) : (
                    paginatedAssignments.map(assignment => (
                        <div key={assignment.id} className={`assignment-item glass-card status-${assignment.status.toLowerCase()}`}>
                            <div className="assignment-left">
                                <div className={`status-indicator ${assignment.status.toLowerCase()}`}>
                                    {assignment.status === 'SUBMITTED' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                </div>
                                <div className="assignment-info">
                                    <h4>{assignment.title}</h4>
                                    <div className="assignment-meta">
                                        <span className="course-tag">{assignment.courseCode}</span>
                                        <span className="due-date">
                                            <Clock size={14} />
                                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                        </span>
                                        {assignment.maxPoints && <span className="points">{assignment.maxPoints} pts</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="assignment-right">
                                {assignment.status === 'SUBMITTED' ? (
                                    <div className="submission-status">
                                        <span className="submitted-badge">Submitted</span>
                                        {assignment.submission.grade && (
                                            <span className="grade-badge">
                                                Grade: {assignment.submission.grade}/{assignment.maxPoints}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleFileUpload(assignment.id)}
                                    >
                                        <Upload size={16} /> Submit
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {filteredAssignments.length > itemsPerPage && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredAssignments.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
};

export default StudentAssignments;
