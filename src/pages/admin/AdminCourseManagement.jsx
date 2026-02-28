import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit, Save, X, BookOpen, Plus, Layers, Play, Video, FileText, Type, Image, Clock, Shield } from 'lucide-react';
import api from '../../utils/api';
import '../DashboardOverview.css';
import './Admin.css';

const AdminCourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editCourse, setEditCourse] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // New Course State
    const [newCourse, setNewCourse] = useState({
        name: '',
        code: '',
        description: '',
        credits: 3,
        department: '',
        semester: 1
    });

    // Content Management State
    const [contentModalOpen, setContentModalOpen] = useState(false);
    const [selectedCourseForContent, setSelectedCourseForContent] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [newLesson, setNewLesson] = useState({ title: '', contentType: 'VIDEO', contentUrl: '', description: '' });
    const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/courses'); // GET /api/courses returns all courses
            setCourses(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch courses", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (courseId) => {
        if (!window.confirm('Are you sure you want to permanently delete this course? This will remove all associated sections and data.')) return;
        try {
            await api.delete(`/courses/${courseId}?cascade=true`);
            setCourses(courses.filter(c => c.id !== courseId));
        } catch (err) {
            alert('Failed to delete course: ' + (err.response?.data || err.message));
        }
    };

    const handleEditStart = (course) => {
        setEditCourse({ ...course });
    };

    const handleEditSave = async () => {
        try {
            await api.put(`/courses/${editCourse.id}`, editCourse);
            setCourses(courses.map(c => c.id === editCourse.id ? editCourse : c));
            setEditCourse(null);
            alert('Course updated successfully');
        } catch (err) {
            alert('Failed to update: ' + err.message);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/courses', newCourse);
            alert('Course created successfully');
            setShowCreateModal(false);
            setNewCourse({ name: '', code: '', description: '', credits: 3, department: '', semester: 1 });
            fetchCourses();
        } catch (err) {
            alert('Failed to create course: ' + (err.response?.data || err.message));
        }
    };

    // --- Content Management Functions ---

    const handleOpenContent = async (course) => {
        setSelectedCourseForContent(course);
        setContentModalOpen(true);
        setLessons([]);
        setLoadingLessons(true);
        try {
            const res = await api.get(`/courses/${course.id}/lessons`);
            setLessons(res.data || []);
        } catch (err) {
            console.error("Failed to fetch lessons", err);
            // alert("Result: No lessons found or error fetching.");
        } finally {
            setLoadingLessons(false);
        }
    };

    const handleAddLesson = async (e) => {
        e.preventDefault();
        if (!newLesson.title || !newLesson.contentUrl) return;

        setIsSubmittingLesson(true);
        try {
            const res = await api.post(`/courses/${selectedCourseForContent.id}/lessons`, {
                ...newLesson,
                orderIndex: lessons.length + 1
            });
            setLessons([...lessons, res.data]);
            setNewLesson({ title: '', contentType: 'VIDEO', contentUrl: '', description: '' });
        } catch (error) {
            console.error("Failed to add lesson", error);
            alert("Failed to add lesson.");
        } finally {
            setIsSubmittingLesson(false);
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm("Are you sure you want to delete this lesson?")) return;
        try {
            await api.delete(`/courses/lessons/${lessonId}`);
            setLessons(lessons.filter(l => l.id !== lessonId));
        } catch (error) {
            console.error("Failed to delete lesson", error);
            alert("Failed to delete lesson.");
        }
    };

    const handleUpdateLesson = async (e) => {
        e.preventDefault();
        // Determine which lesson is being edited
        const lessonToUpdate = lessons.find(l => l.id === editingLessonId);
        if (!lessonToUpdate) return;

        try {
            // In a real app we would have a separate form state for editing, 
            // for now I'll assume we are using the array content (if we had mutable inputs in list)
            // simplified: we'll skip complex inline editing and just allow delete/add for this iteration 
            // unless I add a specific edit mode.
            // Let's stick to Add/Delete for simplicity unless requested otherwise.
            // Wait, user said "see the content". Viewing is primary. Adding is secondary.
            // I will leave this placeholder or implement if needed. 
            // Let's implement full edit in the list items directly
        } catch (err) { }
    };

    // Simplified: Just Add & Delete & View for now to keep UI clean. 
    // TeacherCourseManage has edit, I can copy it if needed.
    // I'll stick to a clean list with "View" and "Delete" and a "Add" form.


    const filteredCourses = courses.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="dashboard-layout-new">
                <div className="dashboard-main-col" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout-new">
            <div className="dashboard-main-col">
                <div className="dash-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>Course Oversight</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '12px' }}>
                                <Search size={18} color="var(--text-secondary)" />
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', marginLeft: '10px', outline: 'none' }}
                                />
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                                <Plus size={18} style={{ marginRight: '8px' }} /> Create Course
                            </button>
                        </div>
                    </div>

                    <div className="table-responsive" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                    <th style={{ padding: '16px' }}>Code</th>
                                    <th style={{ padding: '16px' }}>Course Name</th>
                                    <th style={{ padding: '16px' }}>Department</th>
                                    <th style={{ padding: '16px' }}>Credits</th>
                                    <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCourses.map(course => (
                                    <tr key={course.id} className="admin-table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        {/* Course Code */}
                                        <td style={{ padding: '16px' }}>
                                            {editCourse && editCourse.id === course.id ? (
                                                <input
                                                    value={editCourse.code}
                                                    onChange={e => setEditCourse({ ...editCourse, code: e.target.value })}
                                                    className="form-input"
                                                    style={{ maxWidth: '100px' }}
                                                />
                                            ) : (
                                                <span className="badge badge-code" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                                    {course.code}
                                                </span>
                                            )}
                                        </td>

                                        {/* Course Name */}
                                        <td style={{ padding: '16px' }}>
                                            {editCourse && editCourse.id === course.id ? (
                                                <input
                                                    value={editCourse.name}
                                                    onChange={e => setEditCourse({ ...editCourse, name: e.target.value })}
                                                    className="form-input"
                                                />
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                                                        <BookOpen size={16} color="var(--text-secondary)" />
                                                    </div>
                                                    <span style={{ fontWeight: 500 }}>{course.name}</span>
                                                </div>
                                            )}
                                        </td>

                                        {/* Department */}
                                        <td style={{ padding: '16px' }}>
                                            {editCourse && editCourse.id === course.id ? (
                                                <input
                                                    value={editCourse.department}
                                                    onChange={e => setEditCourse({ ...editCourse, department: e.target.value })}
                                                    className="form-input"
                                                />
                                            ) : (
                                                <span style={{ opacity: 0.8 }}>{course.department || 'General'}</span>
                                            )}
                                        </td>

                                        {/* Credits */}
                                        <td style={{ padding: '16px' }}>
                                            {editCourse && editCourse.id === course.id ? (
                                                <input
                                                    type="number"
                                                    value={editCourse.credits}
                                                    onChange={e => setEditCourse({ ...editCourse, credits: parseInt(e.target.value) })}
                                                    className="form-input"
                                                    style={{ maxWidth: '60px' }}
                                                />
                                            ) : (
                                                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                                                    {course.credits} Credits
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            {editCourse && editCourse.id === course.id ? (
                                                <>
                                                    <button onClick={handleEditSave} className="icon-btn admin-action-btn" style={{ color: '#10b981', marginRight: '8px' }}><Save size={18} /></button>
                                                    <button onClick={() => setEditCourse(null)} className="icon-btn admin-action-btn" style={{ color: '#ef4444' }}><X size={18} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleOpenContent(course)} className="icon-btn admin-action-btn" title="Manage Content" style={{ color: '#a78bfa', marginRight: '8px' }}><Layers size={18} /></button>
                                                    <button onClick={() => handleEditStart(course)} className="icon-btn admin-action-btn" style={{ color: '#6366f1', marginRight: '8px' }}><Edit size={18} /></button>
                                                    <button onClick={() => handleDelete(course.id)} className="icon-btn admin-action-btn" style={{ color: '#ef4444' }}><Trash2 size={18} /></button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredCourses.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                <BookOpen size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                                <p>No courses found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h2>Create New Course</h2>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreate} className="modal-form">
                            <div className="form-group">
                                <label>Course Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newCourse.name}
                                    onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                                    required
                                    placeholder="e.g. Advanced Data Structures"
                                />
                            </div>
                            <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Course Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newCourse.code}
                                        onChange={e => setNewCourse({ ...newCourse, code: e.target.value })}
                                        required
                                        placeholder="e.g. CS101"
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Credits</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={newCourse.credits}
                                        onChange={e => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) })}
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Department</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newCourse.department}
                                    onChange={e => setNewCourse({ ...newCourse, department: e.target.value })}
                                    placeholder="e.g. Computer Science"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="form-input"
                                    value={newCourse.description}
                                    onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                                    placeholder="Brief course overview..."
                                    rows={3}
                                    style={{ resize: 'vertical', minHeight: '80px' }}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-full">Create Course Catalog</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Content Management Modal */}
            {contentModalOpen && selectedCourseForContent && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{selectedCourseForContent.name}</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Content Management • {selectedCourseForContent.code}</p>
                            </div>
                            <button className="close-btn" onClick={() => setContentModalOpen(false)}>&times;</button>
                        </div>

                        <div className="modal-body" style={{ marginTop: '20px' }}>
                            {/* Add New Lesson Form */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ marginBottom: '16px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Add New Content</h4>
                                <form onSubmit={handleAddLesson} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                                        <input
                                            className="form-input"
                                            placeholder="Lesson Title"
                                            value={newLesson.title}
                                            onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                                            required
                                        />
                                        <select
                                            className="form-input"
                                            value={newLesson.contentType}
                                            onChange={e => setNewLesson({ ...newLesson, contentType: e.target.value })}
                                        >
                                            <option value="VIDEO">Video</option>
                                            <option value="PDF">PDF</option>
                                            <option value="DOC">Document</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <input
                                            className="form-input"
                                            placeholder="Content URL (e.g. https://...)"
                                            style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.9em' }}
                                            value={newLesson.contentUrl}
                                            onChange={e => setNewLesson({ ...newLesson, contentUrl: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isSubmittingLesson}
                                            style={{ minWidth: '100px' }}
                                        >
                                            {isSubmittingLesson ? 'Adding...' : 'Add'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Lessons List */}
                            <div className="lessons-list">
                                <h4 style={{ marginBottom: '16px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                                    Curriculum ({lessons.length})
                                </h4>

                                {loadingLessons ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                        <div className="loading-spinner"></div>
                                    </div>
                                ) : lessons.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                                        <Layers size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                        <p>No content has been added to this course yet.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {lessons.map((lesson, idx) => (
                                            <div
                                                key={lesson.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '16px',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(255,255,255,0.05)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <span style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-secondary)',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <h5 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{lesson.title}</h5>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            background: 'rgba(99, 102, 241, 0.1)',
                                                            color: '#818cf8',
                                                            marginTop: '4px',
                                                            display: 'inline-block'
                                                        }}>
                                                            {lesson.contentType}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <a
                                                        href={lesson.contentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="icon-btn"
                                                        title="View Content"
                                                        style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Play size={18} />
                                                    </a>
                                                    <button
                                                        onClick={() => handleDeleteLesson(lesson.id)}
                                                        className="icon-btn"
                                                        title="Delete Content"
                                                        style={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCourseManagement;
