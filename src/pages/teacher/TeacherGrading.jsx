import React, { useState, useEffect } from 'react';
import {
    Award,
    FileText,
    Users,
    CheckCircle,
    Clock,
    Filter,
    ChevronRight,
    Search,
    X
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './TeacherGrading.css';

const TeacherGrading = () => {
    const { currentUser } = useAuth();
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    // Grading State
    const [gradingSubmission, setGradingSubmission] = useState(null);
    const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });
    const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

    useEffect(() => {
        const fetchSections = async () => {
            if (currentUser) {
                try {
                    const res = await api.get(`/courses/sections/faculty/${currentUser.uid}`);
                    setSections(Array.isArray(res.data) ? res.data : []);
                } catch (error) {
                    console.error("Failed to fetch sections", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchSections();
    }, [currentUser]);

    const handleSelectSection = async (section) => {
        setSelectedSection(section);
        setLoadingSubmissions(true);
        try {
            const res = await api.get(`/assignments/teacher/section/${section.id}/submissions`);
            if (Array.isArray(res.data)) {
                // Sort by date descending
                setSubmissions(res.data.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate)));
            }
        } catch (error) {
            console.error("Failed to fetch submissions", error);
            alert("Failed to load submissions for this section.");
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleGradeClick = (submission) => {
        setGradingSubmission(submission);
        setGradeForm({
            grade: submission.grade !== null ? submission.grade : '',
            feedback: submission.feedback || ''
        });
    };

    const handleSubmitGrade = async (e) => {
        e.preventDefault();
        setIsSubmittingGrade(true);
        try {
            const res = await api.post(`/assignments/submissions/${gradingSubmission.id}/grade`, {
                grade: gradeForm.grade,
                feedback: gradeForm.feedback
            });
            // Update local state
            setSubmissions(submissions.map(s => s.id === gradingSubmission.id ? { ...s, ...res.data } : s));
            setGradingSubmission(null);
            // alert("Graded successfully!");
        } catch (err) {
            console.error("Failed to grade", err);
            alert("Failed to grade: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmittingGrade(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: 'var(--bg-deep)' }}>
            <div className="text-indigo-500 animate-spin"><Clock size={48} /></div>
            <div className="font-bold text-xs uppercase tracking-widest text-gray-500">Loading Academic Data...</div>
        </div>
    );

    return (
        <div className="grading-container">
            <div className="grading-header">
                <div>
                    <h1 className="grading-title">Grading Center</h1>
                    <p className="grading-subtitle">Manage assignments, review submissions, and provide feedback for all your active courses.</p>
                </div>
                <div className="hidden md:block">
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase tracking-wider text-xs">
                        {sections.length} Active Courses
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 pl-2">Select Course to Grade</h3>
                <div className="course-grid">
                    {sections.map(section => (
                        <div
                            key={section.id}
                            onClick={() => handleSelectSection(section)}
                            className={`course-card ${selectedSection?.id === section.id ? 'active' : ''}`}
                        >
                            <div className="course-card-header">
                                <div className="course-icon">
                                    {section.course?.name?.charAt(0)}
                                </div>
                                {selectedSection?.id === section.id && <CheckCircle className="text-green-500" size={20} />}
                            </div>
                            <h4 className="course-name">{section.course?.name}</h4>
                            <span className="course-code">{section.course?.code} - {section.sectionName}</span>
                            <div className="course-meta">
                                <span><Users size={14} className="inline mr-1" /> {section.enrollmentCount || 0} Students</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedSection && (
                <div className="submissions-section">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileText className="text-indigo-500" />
                            Submissions
                            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{submissions.length}</span>
                        </h2>
                        {/* <div className="flex gap-2">
                            <button className="px-4 py-2 rounded-xl bg-gray-800 text-xs font-bold uppercase hover:bg-gray-700 transition-colors">
                                <Filter size={14} className="inline mr-2" /> Filter
                            </button>
                        </div> */}
                    </div>

                    {loadingSubmissions ? (
                        <div className="py-20 text-center animate-pulse text-gray-500">
                            Loading submissions...
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="empty-state">
                            <div className="mb-4 text-gray-600"><FileText size={48} className="mx-auto" /></div>
                            <p className="font-bold text-lg">No Submissions Found</p>
                            <p className="text-sm">Students haven't submitted any assignments for this course yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Assignment</th>
                                        <th>Submitted On</th>
                                        <th>Status</th>
                                        <th>Score</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map(sub => (
                                        <tr key={sub.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                                        {sub.student?.fullName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-white">{sub.student?.fullName}</div>
                                                        <div className="text-[10px] text-gray-500 uppercase">{sub.student?.rollNumber}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-sm font-medium text-gray-400">{sub.assignment?.title}</td>
                                            <td className="text-xs font-mono text-gray-500">{new Date(sub.submissionDate).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${sub.grade !== null ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                    {sub.grade !== null ? 'Graded' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="font-mono text-sm font-bold">
                                                {sub.grade !== null ? sub.grade : '-'} <span className="text-gray-600 text-[10px]">/ {sub.assignment?.maxPoints}</span>
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    onClick={() => handleGradeClick(sub)}
                                                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                                                >
                                                    {sub.grade !== null ? 'Update' : 'Grade'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Grading Modal */}
            {gradingSubmission && (
                <div className="classic-modal-overlay">
                    <div className="classic-modal-content">
                        <button onClick={() => setGradingSubmission(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>

                        <div className="classic-header">
                            <h2>
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><Award size={24} /></div>
                                Grade Submission
                            </h2>
                            <p className="text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)', marginLeft: '3.5rem' }}>
                                <span className="text-white">{gradingSubmission.student?.fullName}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                <span>{gradingSubmission.assignment?.title}</span>
                            </p>
                        </div>

                        <div className="mb-8 p-1 rounded-2xl border" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-subtle)' }}>
                            <div className="flex items-center gap-4 p-4">
                                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <FileText size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-white mb-1">Attached Submission</h4>
                                    <p className="text-xs text-gray-400 font-mono truncate">
                                        {gradingSubmission.fileUrl || 'No file attached'}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1">
                                        Submitted: {new Date(gradingSubmission.submissionDate).toLocaleString()}
                                    </p>
                                </div>
                                {gradingSubmission.fileUrl && (
                                    <a
                                        href={gradingSubmission.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-900/20"
                                    >
                                        View
                                    </a>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSubmitGrade} className="flex flex-col">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="classic-label">Grade (Points)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="classic-input-field font-mono text-lg font-bold"
                                            value={gradeForm.grade}
                                            onChange={e => setGradingSubmission({ ...gradingSubmission, grade: e.target.value }) || setGradeForm({ ...gradeForm, grade: e.target.value })}
                                            max={gradingSubmission.assignment?.maxPoints || 100}
                                            min="0"
                                            required
                                            placeholder="0"
                                            style={{ color: 'var(--primary)' }}
                                        />
                                        <span className="absolute right-4 top-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Max: {gradingSubmission.assignment?.maxPoints || 100} pts
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="classic-label">Feedback & Comments</label>
                                    <textarea
                                        className="classic-input-field min-h-[120px] resize-none"
                                        value={gradeForm.feedback}
                                        onChange={e => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                                        placeholder="Enter constructive feedback for the student..."
                                        style={{ lineHeight: '1.6' }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="classic-btn flex items-center justify-center gap-2"
                                disabled={isSubmittingGrade}
                            >
                                {isSubmittingGrade ? (
                                    <span className="animate-pulse">Publishing Grade...</span>
                                ) : (
                                    <>
                                        <Award size={18} /> Publish Results
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherGrading;
