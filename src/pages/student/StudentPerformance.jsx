import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';
import './StudentPerformance.css';

const SUBJECT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6'];
const QUIZ_RESULTS_STORAGE_PREFIX = 'student_quiz_results_';

const getMarkColor = (pct) =>
    pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const getSubjectKey = ({ subjectCode, subjectName, sectionId, courseId }) =>
    subjectCode || `${subjectName || 'unknown'}::${sectionId || courseId || 'na'}`;

const loadStoredQuizResults = (uid) => {
    if (!uid) return [];
    try {
        return JSON.parse(localStorage.getItem(`${QUIZ_RESULTS_STORAGE_PREFIX}${uid}`) || '[]');
    } catch (error) {
        return [];
    }
};

const createSubjectRow = ({ subjectName, subjectCode, sectionId = null, courseId = null }) => ({
    subjectName: subjectName || 'Untitled Course',
    subjectCode: subjectCode || '-',
    sectionId,
    courseId,
    assignmentMarks: null,
    maxAssignment: null,
    ut1Marks: null,
    ut2Marks: null,
    maxUt: null,
    modelMarks: null,
    maxModel: null,
    totalScore: null,
    maxTotal: null,
    percentageScore: 0,
    semester: null,
    academicYear: null,
});

const calculatePercentage = (row) => {
    const obtained = [row.assignmentMarks, row.ut1Marks, row.ut2Marks, row.modelMarks]
        .map(toNumber)
        .filter(value => value !== null)
        .reduce((sum, value) => sum + value, 0);

    const maximum = [row.maxAssignment, row.maxUt, row.maxUt, row.maxModel]
        .map(toNumber)
        .filter(value => value !== null)
        .reduce((sum, value) => sum + value, 0);

    if (maximum > 0) {
        return Number(((obtained / maximum) * 100).toFixed(1));
    }

    return toNumber(row.percentageScore) || 0;
};

const buildPerformanceRows = ({ marks, enrollments, submissions, quizResults }) => {
    const subjectMap = new Map();

    const ensureSubject = (data) => {
        const key = getSubjectKey(data);
        if (!subjectMap.has(key)) {
            subjectMap.set(key, createSubjectRow(data));
        }
        return subjectMap.get(key);
    };

    enrollments.forEach(enrollment => {
        const section = enrollment.section || {};
        const course = section.course || {};
        ensureSubject({
            subjectName: course.name,
            subjectCode: course.code,
            sectionId: section.id,
            courseId: course.id,
        });
    });

    marks.forEach(mark => {
        const row = ensureSubject({
            subjectName: mark.subjectName,
            subjectCode: mark.subjectCode,
            sectionId: mark.sectionId,
            courseId: mark.courseId,
        });

        Object.assign(row, {
            id: mark.id,
            subjectName: mark.subjectName || row.subjectName,
            subjectCode: mark.subjectCode || row.subjectCode,
            assignmentMarks: toNumber(mark.assignmentMarks),
            maxAssignment: toNumber(mark.maxAssignment),
            ut1Marks: toNumber(mark.ut1Marks),
            ut2Marks: toNumber(mark.ut2Marks),
            maxUt: toNumber(mark.maxUt),
            modelMarks: toNumber(mark.modelMarks),
            maxModel: toNumber(mark.maxModel),
            totalScore: toNumber(mark.totalScore),
            maxTotal: toNumber(mark.maxTotal),
            percentageScore: toNumber(mark.percentageScore),
            semester: mark.semester ?? row.semester,
            academicYear: mark.academicYear ?? row.academicYear,
        });
    });

    const assignmentTotals = new Map();
    submissions.forEach(submission => {
        if (submission.grade === null || submission.grade === undefined) return;

        const assignment = submission.assignment || {};
        const section = assignment.section || {};
        const course = section.course || {};
        const key = getSubjectKey({
            subjectCode: course.code,
            subjectName: course.name,
            sectionId: section.id,
            courseId: course.id,
        });

        const current = assignmentTotals.get(key) || { grade: 0, max: 0 };
        current.grade += Number(submission.grade) || 0;
        current.max += Number(assignment.maxPoints) || 0;
        assignmentTotals.set(key, current);

        ensureSubject({
            subjectName: course.name,
            subjectCode: course.code,
            sectionId: section.id,
            courseId: course.id,
        });
    });

    assignmentTotals.forEach((total, key) => {
        const row = subjectMap.get(key);
        if (!row) return;
        row.assignmentMarks = Number(total.grade.toFixed(1));
        row.maxAssignment = total.max || row.maxAssignment;
    });

    quizResults.forEach(result => {
        const row = ensureSubject({
            subjectName: result.subjectName,
            subjectCode: result.subjectCode,
            sectionId: result.sectionId,
            courseId: result.courseId,
        });
        row.ut1Marks = toNumber(result.score);
        row.maxUt = toNumber(result.total);
    });

    return Array.from(subjectMap.values())
        .map(row => ({
            ...row,
            percentageScore: calculatePercentage(row),
        }))
        .filter(row => [row.assignmentMarks, row.ut1Marks, row.ut2Marks, row.modelMarks]
            .some(value => toNumber(value) !== null))
        .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
};

const ScoreBar = ({ label, value, max, color }) => {
    const numericValue = toNumber(value);
    const numericMax = toNumber(max);
    const pct = numericMax > 0 && numericValue !== null ? (numericValue / numericMax) * 100 : 0;
    return (
        <div className="score-bar-row">
            <div className="sb-label">{label}</div>
            <div className="sb-track">
                <div className="sb-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <div className="sb-value">{numericValue ?? '-'} / {numericMax ?? '-'}</div>
        </div>
    );
};

const StudentPerformance = () => {
    const { currentUser } = useAuth();
    const [marks, setMarks] = useState([]);
    const [comparison, setComparison] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [quizAttempts, setQuizAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        Promise.all([
            api.get(`/internal-marks/student/${currentUser.uid}`).catch(() => ({ data: [] })),
            api.get(`/internal-marks/student/${currentUser.uid}/comparison`).catch(() => ({ data: [] })),
            api.get(`/courses/enrollments/student/${currentUser.uid}`).catch(() => ({ data: [] })),
            api.get(`/assignments/student/${currentUser.uid}`).catch(() => ({ data: [] })),
            api.get(`/courses/quizzes/attempts/student/${currentUser.uid}`).catch(() => ({ data: [] })),
        ]).then(([mRes, cRes, eRes, sRes, qRes]) => {
            setMarks(mRes.data || []);
            setComparison(cRes.data || []);
            setEnrollments(eRes.data || []);
            setSubmissions(sRes.data || []);
            setQuizAttempts(qRes.data || []);
        }).finally(() => setLoading(false));
    }, [currentUser]);

    if (loading) {
        return <div className="loading-screen"><Hourglass size="40" bgOpacity="0.1" speed="1.75" color="black" /></div>;
    }

    const performanceRows = buildPerformanceRows({
        marks,
        enrollments,
        submissions,
        quizResults: quizAttempts.length > 0 ? quizAttempts : loadStoredQuizResults(currentUser?.uid),
    });

    const overallAvg = performanceRows.length > 0
        ? Number((performanceRows.reduce((sum, row) => sum + (toNumber(row.percentageScore) || 0), 0) / performanceRows.length).toFixed(1))
        : 0;

    const excellentCount = performanceRows.filter(m => m.percentageScore >= 75).length;
    const averageCount = performanceRows.filter(m => m.percentageScore >= 50 && m.percentageScore < 75).length;
    const lowCount = performanceRows.filter(m => m.percentageScore < 50).length;

    const chartData = comparison.map(c => ({
        name: c.subjectName.split(' ').slice(0, 2).join(' '),
        My: parseFloat(c.studentScore),
        Avg: parseFloat(c.classAverage),
        improvement: c.improvement,
    }));

    if (performanceRows.length === 0) {
        return (
            <div className="perf-page">
                <div className="perf-header">
                    <div>
                        <h1>Academic Performance</h1>
                        <p className="perf-subtitle">Assessment, assignment, and internal marks breakdown</p>
                    </div>
                </div>
                <div className="saa-empty-state" style={{ marginTop: 48 }}>
                    <span style={{ fontSize: '3.5rem' }}>📝</span>
                    <p style={{ fontWeight: 700 }}>No marks recorded yet.</p>
                    <span>Your assessment attempts, assignment grades, and internal marks will appear here once they are available.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="perf-page">
            <div className="perf-header">
                <div>
                    <h1>Academic Performance</h1>
                    <p className="perf-subtitle">Assessment, assignment, and internal marks breakdown</p>
                </div>
                <div className="perf-overall-badge">
                    Overall Performance: <strong>{overallAvg}%</strong>
                </div>
            </div>

            <div className="perf-stats-strip">
                <div className="perf-stat-box">
                    <div className="perf-stat-label">Overall Average</div>
                    <div className="perf-stat-value" style={{ color: getMarkColor(overallAvg) }}>{overallAvg}%</div>
                    <div className="perf-stat-sub">across all subjects</div>
                </div>
                <div className="perf-stat-box">
                    <div className="perf-stat-label">Total Subjects</div>
                    <div className="perf-stat-value">{performanceRows.length}</div>
                    <div className="perf-stat-sub">with marks recorded</div>
                </div>
                <div className="perf-stat-box">
                    <div className="perf-stat-label">Excellent</div>
                    <div className="perf-stat-value" style={{ color: '#10b981' }}>{excellentCount}</div>
                    <div className="perf-stat-sub">{'>='} 75%</div>
                </div>
                <div className="perf-stat-box">
                    <div className="perf-stat-label">Needs Focus</div>
                    <div className="perf-stat-value" style={{ color: lowCount > 0 ? '#ef4444' : '#10b981' }}>{lowCount}</div>
                    <div className="perf-stat-sub">below 50%</div>
                </div>
            </div>

            <div className="perf-cards-grid">
                {performanceRows.map((m, i) => {
                    const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                    const comp = comparison.find(c => c.subjectName === m.subjectName);
                    const improvement = comp?.improvement || 'AT_PAR';
                    return (
                        <div key={`${m.subjectCode}-${m.subjectName}-${i}`} className="perf-card" style={{ borderTop: `3px solid ${color}` }}>
                            <div className="perf-card-header">
                                <div>
                                    <div className="perf-subj-name">{m.subjectName}</div>
                                    <div className="perf-subj-code">{m.subjectCode || '-'}</div>
                                </div>
                                <div className="perf-total-score" style={{ color }}>
                                    {m.percentageScore?.toFixed(1)}%
                                </div>
                            </div>

                            <ScoreBar label="Assignment" value={m.assignmentMarks} max={m.maxAssignment} color={color} />
                            <ScoreBar label="Unit Test 1" value={m.ut1Marks} max={m.maxUt} color={color} />
                            <ScoreBar label="Unit Test 2" value={m.ut2Marks} max={m.maxUt} color={color} />
                            <ScoreBar label="Model Exam" value={m.modelMarks} max={m.maxModel} color={color} />

                            <div
                                className="perf-indicator"
                                style={{
                                    background: improvement === 'ABOVE' ? 'rgba(16,185,129,0.08)' : improvement === 'BELOW' ? 'rgba(239,68,68,0.08)' : 'rgba(148,163,184,0.08)',
                                    color: improvement === 'ABOVE' ? '#10b981' : improvement === 'BELOW' ? '#ef4444' : '#94a3b8',
                                }}
                            >
                                {improvement === 'ABOVE'
                                    ? <><ChevronUp size={14} /> Above class avg ({comp?.classAverage?.toFixed(1)}%)</>
                                    : improvement === 'BELOW'
                                        ? <><ChevronDown size={14} /> Below class avg ({comp?.classAverage?.toFixed(1)}%)</>
                                        : <><Minus size={14} /> At class avg</>
                                }
                            </div>
                        </div>
                    );
                })}
            </div>

            {chartData.length > 0 && (
                <div className="perf-chart-card">
                    <div className="perf-chart-title">Performance vs Class Average</div>
                    <div className="perf-chart-sub">Percentage score per subject - Your score vs class average</div>

                    <div className="perf-grade-strip" style={{ marginBottom: 16 }}>
                        {[
                            { label: 'Excellent', color: '#10b981', count: excellentCount },
                            { label: 'Average', color: '#f59e0b', count: averageCount },
                            { label: 'Low', color: '#ef4444', count: lowCount },
                        ].map((g, i) => (
                            <div key={i} className="perf-grade-item">
                                <div className="perf-grade-dot" style={{ background: g.color }} />
                                <span className="perf-grade-count" style={{ color: g.color }}>{g.count}</span>
                                <span className="perf-grade-label">{g.label}</span>
                            </div>
                        ))}
                    </div>

                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} unit="%" />
                            <Tooltip
                                contentStyle={{ background: 'var(--bg-card)', border: 'none', borderRadius: 12, color: 'var(--text-primary)' }}
                                formatter={(v, name) => [`${parseFloat(v).toFixed(1)}%`, name === 'My' ? 'My Score' : 'Class Avg']}
                            />
                            <Legend formatter={(v) => v === 'My' ? 'My Score' : 'Class Average'} />
                            <Bar dataKey="My" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                            <Bar dataKey="Avg" fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default StudentPerformance;
