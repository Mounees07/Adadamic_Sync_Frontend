import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Plus,
    Trash2,
    FileText,
    Layers,
    CreditCard,
    Award
} from 'lucide-react';
import api from '../../utils/api';
import './HODCurriculum.css';

const HODCurriculum = () => {
    const [courses, setCourses] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // State for creating new course
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        credits: 3
    });

    // State for assigning faculty (Creating Section)
    const [assignData, setAssignData] = useState({
        courseId: null,
        facultyUid: '',
        semester: 'Fall',
        year: new Date().getFullYear()
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [courseRes, facultyRes] = await Promise.all([
                api.get('/courses'),
                api.get('/users/faculty')
            ]);
            setCourses(courseRes.data);
            setFacultyList(facultyRes.data);
            if (facultyRes.data.length > 0) {
                setAssignData(prev => ({ ...prev, facultyUid: facultyRes.data[0].firebaseUid }));
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/courses', formData);
            setShowModal(false);
            setFormData({ code: '', name: '', description: '', credits: 3 });
            fetchData();
            alert("Course Created Successfully!");
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Server error';
            alert(`Failed: ${msg}`);
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            // Find selected course object to pass full detailed object
            const selectedCourse = courses.find(c => c.id === assignData.courseId);

            await api.post(`/courses/sections?facultyUid=${assignData.facultyUid}`, {
                course: selectedCourse,
                semester: assignData.semester,
                year: assignData.year
            });
            setShowAssignModal(false);

            alert("Faculty assigned successfully! Class section created.");
        } catch (error) {
            console.error(error);
            alert("Failed to assign faculty: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this course?")) {
            try {
                // Try normal delete first
                await api.delete(`/courses/${id}`);
                setCourses(courses.filter(c => c.id !== id));
            } catch (error) {
                console.error(error);
                const msg = error.response?.data || "";

                // Check if it's the specific "active sections" error
                if (typeof msg === 'string' && msg.includes("active sections")) {
                    const confirmForce = window.confirm(
                        `This course has active class sections.\n\n` +
                        `Do you want to FORCE DELETE the course and ALL its 
sections/enrollments?\n` +
                        `This action cannot be undone.`
                    );

                    if (confirmForce) {
                        try {
                            // Retry with cascade=true
                            await api.delete(`/courses/${id}?cascade=true`);
                            setCourses(courses.filter(c => c.id !== id));
                            alert("Course and all associated data force deleted.");
                        } catch (forceError) {
                            alert("Force delete failed: " + (forceError.response?.data || forceError.message));
                        }
                        return;
                    }
                }

                alert(`Failed to delete course: ${msg}`);
            }
        }
    };

    const openAssignModal = (courseId) => {
        setAssignData(prev => ({ ...prev, courseId: courseId }));
        setShowAssignModal(true);
    };

    // Calculate generic stats
    const totalCredits = courses.reduce((acc, curr) => acc + curr.credits, 0);

    return (
        <div className="curriculum-container">
            {/* Header Section */}
            <div className="curriculum-header">
                <div className="header-content">
                    <h1>Curriculum Management</h1>
                    <p>Design, organize, and manage the department's academic course catalog.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                    style={{ padding: '12px 24px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)' }}
                >
                    <Plus size={20} /> Create New Course
                </button>
            </div>

            {/* Stats Row */}
            <div className="curriculum-stats">
                <div className="stat-item">
                    <div className="stat-icon"><BookOpen size={20} /></div>
                    <div className="stat-info">
                        <span className="value">{courses.length}</span>
                        <span className="label">Total Courses</span>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon"><Award size={20} /></div>
                    <div className="stat-info">
                        <span className="value">{totalCredits}</span>
                        <span className="label">Total Credits</span>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon"><Layers size={20} /></div>
                    <div className="stat-info">
                        <span className="value">{Math.ceil(courses.length / 6)}</span>
                        <span className="label">Est. Semesters</span>
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="courses-grid">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="course-card" style={{ height: '300px', opacity: 0.5 }}></div>
                    ))
                ) : courses.map(course => (
                    <div key={course.id} className="course-card">
                        <div className="card-header-gradient"></div>
                        <div className="card-content">
                            <div className="course-top">
                                <span className="course-code-badge">{course.code}</span>
                                <div className="course-credits">
                                    <CreditCard size={14} />
                                    <span>{course.credits} Credits</span>
                                </div>
                            </div>

                            <h3 className="course-title">{course.name}</h3>

                            <div className="syllabus-box">
                                <div className="syllabus-label">
                                    <FileText size={12} /> Syllabus Overview
                                </div>
                                <p className="syllabus-preview">
                                    {course.description || "No description provided."}
                                </p>
                            </div>

                            <div className="card-actions" style={{ justifyContent: 'space-between' }}>
                                <button className="delete-btn" onClick={() => handleDelete(course.id)}>
                                    <Trash2 size={16} /> Remove
                                </button>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    style={{ fontSize: '0.85rem' }}
                                    onClick={() => openAssignModal(course.id)}
                                >
                                    Assign Faculty
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in">
                        <div className="modal-header">
                            <h2>Define New Course</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Course Code *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. CS-301"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Credits *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.credits}
                                            onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                                            min="1"
                                            max="10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Course Title *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Advanced Data Structures"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Syllabus / Description *</label>
                                    <textarea
                                        rows="6"
                                        className="form-input"
                                        placeholder="Enter the detailed course description, objectives, and syllabus outline..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        style={{ resize: 'vertical' }}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Publish Course
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Faculty Modal */}
            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Assign Faculty to Course</h2>
                            <button className="btn-close" onClick={() => setShowAssignModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleAssignSubmit}>
                            <div className="modal-body">
                                <p className="text-gray-400 mb-4 text-sm">
                                    This will create a new Class Section for the selected course and assign it to the faculty member.
                                </p>

                                <div className="form-group">
                                    <label>Select Faculty (Teacher/Mentor) *</label>
                                    <select
                                        className="form-input"
                                        value={assignData.facultyUid}
                                        onChange={e => setAssignData({ ...assignData, facultyUid: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>-- Select Faculty --</option>
                                        {facultyList.map(f => (
                                            <option key={f.firebaseUid} value={f.firebaseUid}>
                                                {f.fullName} ({f.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Semester</label>
                                        <select
                                            className="form-input"
                                            value={assignData.semester}
                                            onChange={e => setAssignData({ ...assignData, semester: e.target.value })}
                                        >
                                            <option value="Fall">Fall</option>
                                            <option value="Spring">Spring</option>
                                            <option value="Summer">Summer</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Year</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={assignData.year}
                                            onChange={e => setAssignData({ ...assignData, year: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAssignModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Assign & Create Class
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HODCurriculum;
