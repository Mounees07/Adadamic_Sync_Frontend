import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft,
    BookOpen,
    PlayCircle,
    FileText,
    Clock,
    User,
    Shield,
    CheckCircle,
    Lock,
    Award,
    X,
    HelpCircle,
    ArrowRight
} from 'lucide-react';
import api from '../../utils/api';
import './StudentCourseDetails.css';

const parseQuizOptions = (rawOptions) => {
    if (!rawOptions) return [];

    try {
        const parsed = JSON.parse(rawOptions);
        if (Array.isArray(parsed)) {
            return parsed.map(option => String(option).trim()).filter(Boolean);
        }
    } catch (error) {
        // Fall back to legacy comma-separated option strings.
    }

    return String(rawOptions)
        .split(',')
        .map(option => option.trim())
        .filter(Boolean);
};

const normalizeAnswer = (answer) => String(answer ?? '').trim();
const QUIZ_RESULTS_STORAGE_PREFIX = 'student_quiz_results_';

const StudentCourseDetails = () => {
    const { sectionId } = useParams();
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();
    const [section, setSection] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    // Attendance State
    const [attendanceOtp, setAttendanceOtp] = useState('');
    const [markingAttendance, setMarkingAttendance] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [myAttendances, setMyAttendances] = useState([]);

    // Progress State
    const [completedLessonIds, setCompletedLessonIds] = useState(() => {
        const saved = localStorage.getItem(`completed_lessons_${sectionId}`);
        return saved ? JSON.parse(saved) : [];
    });

    // Quiz State
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [quizzes, setQuizzes] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sectionRes = await api.get(`/courses/sections/${sectionId}`);
                setSection(sectionRes.data);

                if (sectionRes.data?.course?.id) {
                    const lessonsRes = await api.get(`/courses/${sectionRes.data.course.id}/lessons`);
                    setLessons(lessonsRes.data);
                }

                if (userData && sectionId) {
                    const attRes = await api.get(`/course-attendance/section/${sectionId}/student/${userData.id}`);
                    setMyAttendances(attRes.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch course details", error);
            } finally {
                setLoading(false);
            }
        };

        if (sectionId && userData) fetchData();
    }, [sectionId, userData]);

    useEffect(() => {
        let interval;
        if (sectionId) {
            const checkActiveSession = async () => {
                try {
                    const res = await api.get(`/course-attendance/sessions/section/${sectionId}/active`);
                    if (res.data && res.data.id) {
                        if (!activeSession || activeSession.id !== res.data.id) {
                            setActiveSession(res.data);
                        }
                    } else {
                        setActiveSession(null);
                    }
                } catch (e) {
                    setActiveSession(null);
                }
            };

            checkActiveSession();
            interval = setInterval(checkActiveSession, 5000);
        }
        return () => clearInterval(interval);
    }, [sectionId, activeSession]);

    const uniqueLessons = lessons.filter((lesson, index, self) =>
        index === self.findIndex((t) => (
            t.title === lesson.title && t.contentUrl === lesson.contentUrl
        ))
    );

    const markAsViewed = (id) => {
        setCompletedLessonIds(prev => {
            if (prev.includes(id)) return prev;
            const newSet = [...prev, id];
            localStorage.setItem(`completed_lessons_${sectionId}`, JSON.stringify(newSet));
            return newSet;
        });
    };

    const allCompleted = uniqueLessons.length > 0 && uniqueLessons.every(l => completedLessonIds.includes(l.id));

    const handleStartQuiz = async () => {
        try {
            const res = await api.get(`/courses/${section.course.id}/quizzes`);
            if (res.data && res.data.length > 0) {
                setQuizzes(res.data);
                setActiveQuiz(res.data[0]);
                setShowQuizModal(true);
                setQuizResult(null);
                setUserAnswers({});
            } else {
                alert("No quizzes are currently available for this course.");
            }
        } catch (e) {
            console.error("Failed to fetch quizzes", e);
            alert("System error fetching quizzes.");
        }
    };

    const handleAnswerChange = (questionId, option) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: option
        }));
    };

    const handleSubmitQuiz = async () => {
        if (!activeQuiz) return;
        let score = 0;
        activeQuiz.questions.forEach(q => {
            if (normalizeAnswer(userAnswers[q.id]) === normalizeAnswer(q.correctAnswer)) {
                score++;
            }
        });
        const result = {
            score,
            total: activeQuiz.questions.length,
            percentage: Math.round((score / activeQuiz.questions.length) * 100)
        };

        setQuizResult(result);

        if (currentUser?.uid && section?.course) {
            const storageKey = `${QUIZ_RESULTS_STORAGE_PREFIX}${currentUser.uid}`;
            const existingResults = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const nextResult = {
                quizId: activeQuiz.id,
                sectionId: Number(sectionId),
                courseId: section.course.id,
                subjectCode: section.course.code,
                subjectName: section.course.name,
                title: activeQuiz.title || 'Course Assessment',
                ...result,
                submittedAt: new Date().toISOString()
            };

            const filteredResults = existingResults.filter(item =>
                !(item.quizId === nextResult.quizId && item.sectionId === nextResult.sectionId)
            );

            localStorage.setItem(storageKey, JSON.stringify([...filteredResults, nextResult]));

            try {
                await api.post(`/courses/quizzes/${activeQuiz.id}/attempts`, {
                    studentUid: currentUser.uid,
                    score: result.score,
                    total: result.total,
                    percentage: result.percentage
                });
            } catch (error) {
                console.error('Failed to persist quiz attempt', error);
            }
        }
    };

    const handleMarkAttendance = async () => {
        if (!attendanceOtp) return;
        setMarkingAttendance(true);
        try {
            const res = await api.post(`/course-attendance/mark?otp=${attendanceOtp}&studentUid=${currentUser.uid}`);
            alert("Attendance marked successfully! Status: " + res.data.status);
            setShowOtpModal(false);
            setAttendanceOtp('');
            setActiveSession(null); // Clear active session to prevent double entry
        } catch (e) {
            alert("Failed to mark attendance: " + (e.response?.data || e.message));
        } finally {
            setMarkingAttendance(false);
        }
    };

    if (loading) return (
        <div className="course-details-container flex items-center justify-center">
            <div className="animate-pulse text-indigo-500 font-bold tracking-widest text-xs uppercase">Loading Curriculum...</div>
        </div>
    );

    if (!section) return (
        <div className="course-details-container flex flex-col items-center justify-center text-center">
            <Shield size={48} className="text-red-500/50 mb-6" />
            <h2 className="text-2xl font-black mb-4 uppercase">Course Not Found</h2>
            <button onClick={() => navigate('/student/courses')} className="btn-view-material">
                Return to Courses
            </button>
        </div>
    );

    return (
        <div className="course-details-container">
            {/* Nav */}
            <button onClick={() => navigate('/student/courses')} className="back-nav-btn">
                <ArrowLeft size={16} /> Back to My Courses
            </button>

            {/* Banner */}
            <div className="details-banner">
                <div className="banner-glow"></div>
                <h1 className="course-title-large">{section.course?.name}</h1>
                <div className="course-meta-row">
                    <div className="meta-pill">
                        <User size={14} className="text-indigo-400" />
                        <span>{section.faculty?.fullName}</span>
                    </div>
                    <div className="meta-pill">
                        <Clock size={14} className="text-purple-400" />
                        <span>Semester {section.semester}</span>
                    </div>
                    <div className="meta-pill highlight">
                        <span>{section.course?.code}</span>
                    </div>
                    <div className="meta-pill">
                        <span>{section.course?.credits} Credits</span>
                    </div>
                </div>
            </div>

            {/* Attendance Summary */}
            <div className="attendance-summary-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: 'rgba(100, 116, 139, 0.1)', padding: '10px', borderRadius: '50%', color: 'var(--text-secondary)' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: '700' }}>My Attendance</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Overall class participation</p>
                    </div>
                </div>
                <div className="attendance-stats-row">
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#3b82f6' }}>{myAttendances.length}</div>
                        <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Total</div>
                    </div>
                    <div className="attendance-divider"></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{myAttendances.filter(a => a.status === 'P').length}</div>
                        <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Present</div>
                    </div>
                    <div className="attendance-divider"></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444' }}>{myAttendances.filter(a => a.status === 'A').length}</div>
                        <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Absent</div>
                    </div>
                    <div className="attendance-divider"></div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            {myAttendances.length > 0 ? Math.round((myAttendances.filter(a => a.status === 'P').length / myAttendances.length) * 100) : 0}%
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Percentage</div>
                    </div>
                </div>
            </div>

            {/* Course Actions Header */}
            <div className="active-session-card" onClick={() => setShowOtpModal(true)} style={{ cursor: 'pointer', border: activeSession ? '2px solid #10b981' : '1px solid var(--glass-border)', boxShadow: activeSession ? '0 10px 15px -3px rgba(16, 185, 129, 0.2)' : undefined }}>
                <div className="active-session-info">
                    {activeSession ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '4px' }}>
                            <div className="pulse-dot" style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                            <h3 className="active-session-title" style={{ color: '#10b981' }}>Live Attendance Session Active</h3>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h3 className="active-session-title">
                                <Shield size={20} className="text-indigo-500" /> Attendance Verification
                            </h3>
                        </div>
                    )}
                    <p className="active-session-desc" style={{ color: activeSession ? '#059669' : undefined }}>
                        {activeSession ? 'Your professor is running a live attendance check. Click here to enter the OTP.' : 'Has your professor generated a live attendance code? Click to verify your presence.'}
                    </p>
                </div>
                <button className="active-session-btn" style={{ backgroundColor: activeSession ? '#10b981' : '#2563eb' }}>Verify Now</button>
            </div>
            {showOtpModal && createPortal(
                <div className="otp-modal-overlay" onClick={() => setShowOtpModal(false)}>
                    <div className="otp-modal-content" onClick={e => e.stopPropagation()}>

                        <button onClick={() => setShowOtpModal(false)} className="otp-modal-close">
                            <X size={20} />
                        </button>

                        <div className="otp-live-badge">
                            <div className="dot"></div>
                            Session Live
                        </div>

                        <h2 className="otp-modal-title">Enter Attendance Code</h2>
                        <p className="otp-modal-desc">
                            {section.faculty?.fullName} has started a live attendance session for {section.course?.code}. Enter the 6-digit code shown on the screen.
                        </p>

                        <div className="otp-inputs-row">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <React.Fragment key={idx}>
                                    <input
                                        id={`otp-${idx}`}
                                        type="text"
                                        maxLength={1}
                                        value={attendanceOtp[idx] || ''}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            const pasted = e.clipboardData.getData('text').replace(/[^0-9a-zA-Z]/g, '').slice(0, 6);
                                            if (pasted) {
                                                setAttendanceOtp(pasted);
                                                const focusIndex = Math.min(pasted.length, 5);
                                                const next = document.getElementById(`otp-${focusIndex}`);
                                                if (next) next.focus();
                                            }
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value.slice(-1);
                                            if (val && !/^[0-9a-zA-Z]*$/.test(val)) return;

                                            let newOtp = attendanceOtp.split('');
                                            newOtp[idx] = val;
                                            setAttendanceOtp(newOtp.join(''));

                                            if (val && idx < 5) {
                                                const next = document.getElementById(`otp-${idx + 1}`);
                                                if (next) next.focus();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !attendanceOtp[idx] && idx > 0) {
                                                const prev = document.getElementById(`otp-${idx - 1}`);
                                                if (prev) {
                                                    prev.focus();
                                                }
                                            }
                                        }}
                                        className="otp-modal-input"
                                        autoComplete="off"
                                    />
                                    {idx === 2 && <span className="otp-modal-dash">-</span>}
                                </React.Fragment>
                            ))}
                        </div>

                        <button
                            onClick={handleMarkAttendance}
                            disabled={markingAttendance || attendanceOtp.length < 6}
                            className="otp-modal-btn"
                        >
                            {markingAttendance ? 'Verifying...' : 'Mark Attendance'}
                        </button>

                        <div className="otp-modal-footer">
                            Code not working? <button className="otp-modal-link">Request assistance</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modules List */}
            <div className="modules-header">
                <BookOpen size={20} className="text-indigo-500" />
                <h2>Learning Modules</h2>
                <div className="ml-auto text-xs font-bold text-gray-500 uppercase tracking-widest">
                    {completedLessonIds.length} / {uniqueLessons.length} Completed
                </div>
            </div>

            <div className="modules-grid mb-20">
                {uniqueLessons.length === 0 ? (
                    <div className="empty-modules">
                        <BookOpen size={32} className="mx-auto mb-4 text-gray-700" />
                        <p className="text-sm font-bold uppercase tracking-wider">No learning modules published yet</p>
                    </div>
                ) : (
                    uniqueLessons.map((lesson, idx) => {
                        const isCompleted = completedLessonIds.includes(lesson.id);
                        return (
                            <div key={lesson.id} className={`module-card group ${isCompleted ? 'border-green-500/30 bg-green-900/5' : ''}`}>
                                <div className="module-left">
                                    <div className="w-1 h-1 rounded-full bg-[var(--text-muted)] opacity-50 ml-2" />

                                    <div className="module-info">
                                        <h3 className={`text-[var(--text-primary)] font-bold mb-1 ${isCompleted ? 'opacity-70' : ''}`}>{lesson.title}</h3>
                                        <div className="flex gap-2">
                                            <span className="module-type">{lesson.contentType}</span>
                                            {lesson.description && <span className="text-xs text-[var(--text-secondary)] flex items-center line-clamp-1 max-w-md">{lesson.description}</span>}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (lesson.contentUrl) {
                                            window.open(lesson.contentUrl, '_blank');
                                            markAsViewed(lesson.id);
                                        }
                                    }}
                                    className={`btn-view-material ${isCompleted ? 'opacity-70' : ''}`}
                                >
                                    {lesson.contentType === 'VIDEO' ? <PlayCircle size={14} className="text-[var(--text-secondary)]" /> : <FileText size={14} className="text-[var(--text-secondary)]" />}
                                    <span>{isCompleted ? 'Review Content' : 'Access Content'}</span>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* PREMIUM Quiz Section */}
            <div className="mb-24">
                <div className={`module-card ${allCompleted ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-[var(--glass-border)]'}`}>

                    <div className="module-left">
                        <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500
                            ${allCompleted
                                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30'
                                : 'bg-[var(--bg-subtle)] border border-[var(--glass-border)] text-[var(--text-muted)]'}
                        `}>
                            {allCompleted ? <Award size={24} /> : <Lock size={24} />}
                        </div>

                        <div className="module-info flex flex-col justify-center">
                            <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${allCompleted ? 'text-indigo-500' : 'text-[var(--text-secondary)]'}`}>
                                {allCompleted ? 'Validation Unlocked' : 'Module Locked'}
                            </span>
                            <h3 className={`text-base font-black uppercase tracking-tight mb-1 ${allCompleted ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                                Final Assessment
                            </h3>
                            <p className="text-[var(--text-secondary)] text-[11px] font-medium max-w-lg leading-relaxed md:text-xs">
                                {allCompleted
                                    ? "Congratulations! You have successfully mastered the curriculum. You may now proceed."
                                    : `To access the certification quiz, you must complete all ${uniqueLessons.length} learning modules above.`}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleStartQuiz}
                        disabled={!allCompleted || !section.testsEnabled}
                        className={`
                            btn-view-material !rounded-full
                            ${allCompleted && section.testsEnabled
                                ? '!bg-indigo-600 !text-white !border-indigo-600 hover:!bg-indigo-700'
                                : '!bg-red-50/50 !text-red-400 !border-red-100/50 hover:!bg-red-50/50 cursor-not-allowed dark:!bg-red-900/10 dark:!border-red-900/30'}
                        `}
                    >
                        {allCompleted && section.testsEnabled ? (
                            <>
                                <span>Start Attempt</span>
                                <ArrowRight size={14} />
                            </>
                        ) : (
                            <>
                                <span>{allCompleted && !section.testsEnabled ? 'Not Enabled' : 'Restricted'}</span>
                                <Lock size={12} className="text-red-400" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Quiz Modal */}
            {showQuizModal && activeQuiz && createPortal(
                <div className="quiz-modal-overlay">
                    <div className="quiz-modal-card">
                        
                        {/* Header */}
                        <div className="quiz-modal-header">
                            <div className="quiz-modal-header-left">
                                <div className="quiz-modal-icon">
                                    <HelpCircle size={24} />
                                </div>
                                <div className="quiz-modal-title-box">
                                    <h3>{activeQuiz.title || 'Course Assessment'}</h3>
                                    <div className="quiz-modal-subtitle">
                                        <div className="quiz-pulse-dot"></div>
                                        <p>Assessment Session • {activeQuiz.questions.length} Questions</p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowQuizModal(false)} 
                                className="quiz-modal-close-btn"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="quiz-modal-body custom-scrollbar">
                            {!quizResult ? (
                                <div className="quiz-questions-list">
                                    {activeQuiz.questions.map((q, idx) => (
                                        <div key={q.id} className="quiz-question-card">
                                            <div className="quiz-question-inner">
                                                <div className="quiz-question-number">
                                                    {String(idx + 1).padStart(2, '0')}
                                                </div>
                                                <div className="quiz-question-details">
                                                    <p className="quiz-question-text">{q.questionText}</p>
                                                    <div className="quiz-options-grid">
                                                        {parseQuizOptions(q.options).map((opt, optIdx) => {
                                                            const isSelected = normalizeAnswer(userAnswers[q.id]) === normalizeAnswer(opt);
                                                            return (
                                                                <label key={optIdx} className={`quiz-option-label ${isSelected ? 'selected' : ''}`}>
                                                                    <div className="quiz-radio-wrapper">
                                                                        <input
                                                                            type="radio"
                                                                            name={`q-${q.id}`}
                                                                            value={opt}
                                                                            checked={isSelected}
                                                                            onChange={() => handleAnswerChange(q.id, opt)}
                                                                            className="quiz-radio-input"
                                                                        />
                                                                        <div className={`quiz-radio-custom ${isSelected ? 'selected' : ''}`}>
                                                                            {isSelected && <div className="quiz-radio-dot" />}
                                                                        </div>
                                                                    </div>
                                                                    <span className="quiz-option-text">{opt}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="quiz-result-view">
                                    <div className="quiz-result-icon-wrapper">
                                        <div className="quiz-result-icon-glow"></div>
                                        <div className="quiz-result-icon">
                                            {quizResult.percentage >= 70 ? (
                                                <Award size={80} className="quiz-icon-success" />
                                            ) : (
                                                <HelpCircle size={80} className="quiz-icon-failure" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <h2 className="quiz-result-title">Assessment Complete</h2>
                                    
                                    <div className="quiz-score-display">
                                        <span className="quiz-score-value">{quizResult.score}</span>
                                        <span className="quiz-score-total">/ {quizResult.total}</span>
                                    </div>
                                    
                                    <div className="quiz-progress-bar">
                                        <div
                                            className={`quiz-progress-fill ${quizResult.percentage >= 70 ? 'success' : 'warning'}`}
                                            style={{ width: `${quizResult.percentage}%` }}
                                        />
                                    </div>
                                    
                                    <p className="quiz-result-message">
                                        {quizResult.percentage >= 70 
                                            ? 'Excellent work! You have successfully validated your knowledge for this course module.' 
                                            : 'Keep practicing! Review the materials and try again to improve your score.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="quiz-modal-footer">
                            {!quizResult ? (
                                <button
                                    onClick={handleSubmitQuiz}
                                    disabled={Object.keys(userAnswers).length !== activeQuiz.questions.length}
                                    className="quiz-submit-btn"
                                >
                                    <span>Submit Answers</span>
                                    {Object.keys(userAnswers).length === activeQuiz.questions.length && <CheckCircle size={18} />}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowQuizModal(false)}
                                    className="quiz-close-btn"
                                >
                                    Close Assessment
                                </button>
                            )}
                        </div>
                        
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default StudentCourseDetails;
