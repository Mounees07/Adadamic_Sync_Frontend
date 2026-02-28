import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    List,
    Shield,
    CheckCircle,
    Settings,
    Layers,
    Code
} from 'lucide-react';
import api from '../../utils/api';
import './TeacherQuestionManager.css';

const TeacherQuestionManager = () => {
    const { sectionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [sectionDetails, setSectionDetails] = useState(null);

    const [quizList, setQuizList] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [newQuestion, setNewQuestion] = useState({
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const secRes = await api.get(`/courses/sections/${sectionId}`);
                setSectionDetails(secRes.data);

                if (secRes.data?.course?.id) {
                    const quizzesRes = await api.get(`/courses/${secRes.data.course.id}/quizzes`);
                    setQuizList(quizzesRes.data);
                    if (quizzesRes.data.length > 0) {
                        setActiveQuiz(quizzesRes.data[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to load question manager data", error);
            } finally {
                setLoading(false);
            }
        };

        if (sectionId) {
            fetchInitialData();
        } else {
            setLoading(false);
        }
    }, [sectionId]);

    const handleCreateQuiz = async () => {
        try {
            const res = await api.post(`/courses/${sectionDetails.course.id}/quizzes`, {
                title: `Assessment ${quizList.length + 1}`,
                description: "Course validation quiz."
            });
            setQuizList([...quizList, res.data]);
            setActiveQuiz(res.data);
        } catch (e) {
            alert("Failed to create quiz.");
        }
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        if (!activeQuiz) return;

        const payload = {
            questionText: newQuestion.questionText,
            options: JSON.stringify(newQuestion.options),
            correctAnswer: newQuestion.correctAnswer
        };

        try {
            const res = await api.post(`/courses/quizzes/${activeQuiz.id}/questions`, payload);

            const updatedQuestions = activeQuiz.questions ? [...activeQuiz.questions, res.data] : [res.data];
            setActiveQuiz({ ...activeQuiz, questions: updatedQuestions });
            setQuizList(quizList.map(q => q.id === activeQuiz.id ? { ...q, questions: updatedQuestions } : q));
            setNewQuestion({ questionText: '', options: ['', '', '', ''], correctAnswer: '' });
        } catch (e) {
            alert("Failed to add question.");
        }
    };

    const handleDeleteQuestion = async (qid) => {
        if (!window.confirm("Delete this question?")) return;
        try {
            await api.delete(`/courses/questions/${qid}`);
            const updatedQuestions = activeQuiz.questions.filter(q => q.id !== qid);
            setActiveQuiz({ ...activeQuiz, questions: updatedQuestions });
            setQuizList(quizList.map(q => q.id === activeQuiz.id ? { ...q, questions: updatedQuestions } : q));
        } catch (e) {
            alert("Failed to delete question");
        }
    };

    const handleDeleteQuiz = async (e, quizId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this assessment set? All questions within it will be lost.")) return;
        try {
            await api.delete(`/courses/quizzes/${quizId}`);
            const newQuizList = quizList.filter(q => q.id !== quizId);
            setQuizList(newQuizList);
            if (activeQuiz?.id === quizId) {
                setActiveQuiz(newQuizList.length > 0 ? newQuizList[0] : null);
            }
        } catch (error) {
            console.error("Failed to delete quiz", error);
            alert("Failed to delete assessment set.");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center">
            <div className="text-indigo-500 animate-spin"><Settings size={48} /></div>
            <div className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-4">Initializing Studio...</div>
        </div>
    );

    if (!sectionDetails) return (
        <div className="min-h-screen bg-[#050507] flex items-center justify-center text-white">Course not found</div>
    );

    return (
        <div className="question-manager-container">
            {/* Left Sidebar - 'The Vault' */}
            <div className="qm-sidebar">
                <div className="qm-sidebar-header">
                    <button onClick={() => navigate(`/teacher/courses/${sectionId}`)} className="qm-breadcrumb hover:text-white transition-colors">
                        <ArrowLeft size={14} /> Back to Course
                    </button>
                    <div className="qm-title mt-6 justify-between">
                        <span className="flex items-center gap-2"><Layers size={20} className="text-indigo-500" /> Assessment Sets</span>
                        <button onClick={handleCreateQuiz} className="bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors text-indigo-400">
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                    {(!quizList || quizList.length === 0) ? (
                        <div className="text-center py-10 opacity-50 text-sm">No assessments yet</div>
                    ) : (
                        quizList.map(quiz => (
                            <div
                                key={quiz.id}
                                onClick={() => setActiveQuiz(quiz)}
                                className={`quiz-nav-item ${activeQuiz?.id === quiz.id ? 'active' : ''} group relative pr-8 cursor-pointer flex flex-col`}
                            >
                                <span className="font-bold text-sm block truncate">{quiz.title}</span>
                                <span className="text-[10px] opacity-60 uppercase tracking-wider font-bold">{quiz.questions?.length || 0} Questions</span>
                                <button
                                    onClick={(e) => handleDeleteQuiz(e, quiz.id)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-black/40 text-gray-500 hover:text-red-400 transition-all duration-200"
                                    title="Delete Assessment Set"
                                >
                                    <Trash2 size={14} strokeWidth={2} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Workspace - 'The Canvas' */}
            <div className="qm-workspace custom-scrollbar">
                <div className="qm-header">
                    <div>
                        <div className="qm-breadcrumb"><Code size={14} className="text-pink-500" /> Question Editor Studio</div>
                        <h1 className="qm-headline bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
                            {activeQuiz ? activeQuiz.title : 'Select an Assessment'}
                        </h1>
                    </div>
                    {activeQuiz && (
                        <div className="text-right">
                            <div className="text-4xl font-black text-white/10 font-mono">{(activeQuiz.questions?.length || 0).toString().padStart(2, '0')}</div>
                        </div>
                    )}
                </div>

                {activeQuiz ? (
                    <div className="animate-slide-up space-y-8">
                        {/* Editor Deck */}
                        <div className="editor-panel">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                <Plus size={18} className="text-indigo-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-indigo-400">Design New Question</span>
                            </div>

                            <form onSubmit={handleAddQuestion}>
                                <div className="mb-6">
                                    <label className="editor-label">Question Stem</label>
                                    <input
                                        className="qm-input text-lg font-medium"
                                        placeholder="Enter the question prompt..."
                                        value={newQuestion.questionText}
                                        onChange={e => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="relative input-wrapper">
                                            <label className="editor-label text-xs opacity-70">Option {String.fromCharCode(65 + i)}</label>
                                            <input
                                                className="qm-input text-sm"
                                                placeholder={`Type answer choice...`}
                                                value={newQuestion.options[i]}
                                                onChange={e => {
                                                    const newOpts = [...newQuestion.options];
                                                    newOpts[i] = e.target.value;
                                                    setNewQuestion({ ...newQuestion, options: newOpts });
                                                }}
                                                required
                                            />
                                            {newQuestion.options[i] && newQuestion.options[i] === newQuestion.correctAnswer && (
                                                <CheckCircle size={16} className="absolute right-4 top-[2.2rem] text-green-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-end gap-4">
                                    <div className="flex-1">
                                        <label className="editor-label">Correct Solution</label>
                                        <select
                                            className="qm-input appearance-none cursor-pointer hover:bg-white/5"
                                            value={newQuestion.correctAnswer}
                                            onChange={e => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled>Select correct answer...</option>
                                            {newQuestion.options.map((opt, i) => (
                                                opt && <option key={i} value={opt}>Option {String.fromCharCode(65 + i)}: {opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white h-[52px] px-8 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                                        <Save size={16} /> Save to Bank
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Question Stream */}
                        <div className="border-t border-white/5 pt-8">
                            <h3 className="editor-label mb-6">Question Stream</h3>
                            <div className="questions-grid">
                                {activeQuiz.questions && activeQuiz.questions.length > 0 ? (
                                    activeQuiz.questions.map((q, idx) => (
                                        <div key={q.id} className="question-card group">
                                            <div className="q-number">{(idx + 1).toString().padStart(2, '0')}</div>
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                                <button
                                                    onClick={() => handleDeleteQuestion(q.id)}
                                                    className="p-2.5 rounded-xl bg-black/20 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 text-gray-500 hover:text-red-500 transition-all duration-300 backdrop-blur-sm shadow-lg"
                                                    title="Delete Question"
                                                >
                                                    <Trash2 size={16} strokeWidth={1.5} />
                                                </button>
                                            </div>
                                            <p className="q-text">{q.questionText}</p>
                                            <div className="space-y-2">
                                                {(() => {
                                                    let opts = [];
                                                    try { opts = JSON.parse(q.options); } catch (e) { opts = q.options ? q.options.split(',') : []; }
                                                    return opts.map((opt, i) => (
                                                        <div key={i} className={`option-pill ${opt.trim() === q.correctAnswer ? 'correct' : ''}`}>
                                                            {opt.trim() === q.correctAnswer ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-white/20" />}
                                                            {opt.trim()}
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-20 border border-dashed border-white/10 rounded-2xl">
                                        <p className="text-gray-500 font-mono text-sm">Stream Empty</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <Shield size={96} strokeWidth={1} className="text-indigo-500 mb-8" />
                        <h2 className="text-3xl font-black uppercase tracking-widest text-white/50">Select Assessment</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherQuestionManager;
