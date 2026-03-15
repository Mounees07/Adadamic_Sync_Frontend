import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    ChevronRight,
    Calendar,
    Printer,
    Download,
    GraduationCap,
    CheckCircle,
    AlertTriangle,
    Award,
    TrendingUp,
    TrendingDown,
    Loader2
} from 'lucide-react';
import './HODAcademicPerformance.css';

const HODAcademicPerformance = () => {
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();

    const [stats, setStats] = useState({
        avgGpa: 0,
        avgGpaDelta: 0,
        passRate: 0,
        passRateDelta: 0,
        probationCount: 0,
        probationDelta: 0,
        deansListCount: 0,
        deansListDelta: 0,
        totalEnrolled: 0,
        medianGpa: 0,
        probationRate: 0
    });

    const [gpaDistribution, setGpaDistribution] = useState([]);
    const [passRates, setPassRates] = useState([]);
    const [probationStudents, setProbationStudents] = useState([]);
    const [deansListStudents, setDeansListStudents] = useState([]);
    const [highestCohort, setHighestCohort] = useState('N/A');
    const [lowestCohort, setLowestCohort] = useState('N/A');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;
            setLoading(true);
            setError(null);
            try {
                let dept = userData?.department;
                if (!dept) {
                    const hodRes = await api.get(`/department/by-hod/${currentUser.uid}`);
                    dept = hodRes.data.department;
                }
                if (!dept) {
                    setLoading(false);
                    return;
                }
                const res = await api.get(`/department/academic-performance/${encodeURIComponent(dept)}`);
                const data = res.data;

                setStats(data.stats || {
                    avgGpa: 0, avgGpaDelta: 0, passRate: 0, passRateDelta: 0,
                    probationCount: 0, probationDelta: 0, deansListCount: 0,
                    deansListDelta: 0, totalEnrolled: 0, medianGpa: 0, probationRate: 0
                });
                setGpaDistribution(data.gpaDistribution || []);
                setPassRates(data.passRates || []);
                setProbationStudents(data.probationStudents || []);
                setDeansListStudents(data.deansListStudents || []);
                setHighestCohort(data.highestCohort || 'N/A');
                setLowestCohort(data.lowestCohort || 'N/A');
            } catch (err) {
                console.error('Failed to load academic performance data', err);
                const errorData = err?.response?.data;
                const msg = typeof errorData === 'object'
                    ? (errorData.message || errorData.error || JSON.stringify(errorData))
                    : errorData;
                setError(msg || err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser, userData]);

    if (loading) {
        return (
            <div className="academic-performance-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
                <Loader2 size={24} className="spin" />
                <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Loading academic performance data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="academic-performance-container">
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '24px', color: '#EF4444', fontSize: '14px' }}>
                    <strong>Failed to load data:</strong> {error}
                </div>
            </div>
        );
    }

    // Compute insight strings from real data
    const aboveAvgPct = gpaDistribution
        .filter(g => ['O (9-10)', 'A+ (8-9)', 'A (7-8)'].includes(g.label))
        .reduce((sum, g) => sum + g.percent, 0)
        .toFixed(1);
    const belowPassPct = gpaDistribution.find(g => g.label === '< 5')?.percent ?? 0;

    return (
        <div className="academic-performance-container">
            {/* Breadcrumb */}
            <div className="breadcrumb">
                <span className="breadcrumb-link" onClick={() => navigate('/department-analytics')}>Reports</span>
                <ChevronRight size={14} className="breadcrumb-separator" />
                <span className="breadcrumb-current">Academic Performance</span>
            </div>

            {/* Header */}
            <header className="performance-header">
                <div className="header-titles">
                    <h1>Academic Performance Overview</h1>
                    <p>Department-wide snapshot of GPA, pass rates, probation risk, and high performers.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <Calendar size={16} /> Current Semester
                    </button>
                    <button className="btn-secondary">
                        <Printer size={16} /> Print
                    </button>
                    <button className="btn-primary">
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </header>

            {/* Top Stat Cards */}
            <div className="kpi-cards-grid">
                <div className="kpi-card">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Average Dept GPA</span>
                        <GraduationCap size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.avgGpa.toFixed(2)}</span>
                        <div className={`kpi-badge ${stats.avgGpaDelta >= 0 ? 'positive' : 'negative'}`}>
                            {stats.avgGpaDelta >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                            {stats.avgGpaDelta >= 0 ? '+' : ''}{stats.avgGpaDelta}
                        </div>
                    </div>
                    <div className="kpi-subtitle">Median GPA: {stats.medianGpa.toFixed(2)} | {stats.totalEnrolled} enrolled</div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Overall Pass Rate</span>
                        <CheckCircle size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.passRate}%</span>
                        <div className={`kpi-badge ${stats.passRateDelta >= 0 ? 'positive' : 'negative'}`}>
                            {stats.passRateDelta >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                            {stats.passRateDelta >= 0 ? '+' : ''}{stats.passRateDelta}%
                        </div>
                    </div>
                    <div className="kpi-subtitle">Students with GPA {'>='} 5.0</div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Academic Probation</span>
                        <AlertTriangle size={18} className="kpi-icon danger" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value text-danger">{stats.probationCount}</span>
                        <div className={`kpi-badge ${stats.probationDelta > 0 ? 'danger-bg' : 'positive'}`}>
                            {stats.probationDelta > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                            {stats.probationDelta > 0 ? '+' : ''}{stats.probationDelta}
                        </div>
                    </div>
                    <div className="kpi-subtitle">
                        {stats.probationRate}% of {stats.totalEnrolled} enrolled students
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Dean's List Eligible</span>
                        <Award size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.deansListCount}</span>
                        <div className={`kpi-badge ${stats.deansListDelta >= 0 ? 'positive' : 'negative'}`}>
                            {stats.deansListDelta >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                            {stats.deansListDelta >= 0 ? '+' : ''}{stats.deansListDelta}
                        </div>
                    </div>
                    <div className="kpi-subtitle">Students achieving GPA &gt;= 8.5</div>
                </div>
            </div>

            {/* Middle Section */}
            <div className="performance-sections-grid">
                {/* GPA Distribution */}
                <div className="section-card">
                    <div className="section-header">
                        <div>
                            <h2>GPA Distribution &amp; Cohort Insight</h2>
                            <p>How the {stats.avgGpa.toFixed(2)} average GPA breaks down across the department.</p>
                        </div>
                        <span className="gray-badge">Median GPA {stats.medianGpa.toFixed(2)}</span>
                    </div>

                    <div className="gpa-bars">
                        {gpaDistribution.length === 0 ? (
                            <div className="text-muted" style={{ padding: '20px 0', fontSize: '13px' }}>No GPA distribution data available</div>
                        ) : (
                            gpaDistribution.map((group, idx) => (
                                <div className="gpa-bar-row" key={idx}>
                                    <span className="gpa-label">{group.label}</span>
                                    <div className="bar-bg">
                                        <div className={`bar-fill ${group.colorClass}`} style={{ width: `${group.percent}%` }}></div>
                                    </div>
                                    <span className="gpa-percent">{group.percent}% <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({group.count})</span></span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cohort-badges">
                        <span className="cohort-badge">Highest cohort GPA <strong>{highestCohort}</strong></span>
                        <span className="cohort-badge">Lowest cohort GPA <strong>{lowestCohort}</strong></span>
                    </div>

                    <div className="insights-list border-info">
                        <p><span className="dot blue"></span>
                            {aboveAvgPct}% of students are in the upper GPA bands (A and above).
                        </p>
                        <p><span className="dot orange"></span>
                            {belowPassPct}% of students fall below passing GPA ({stats.probationCount} on probation) and should be monitored closely.
                        </p>
                    </div>
                </div>

                {/* Pass Rate by Semester */}
                <div className="section-card">
                    <div className="section-header">
                        <div>
                            <h2>Pass Rate by Semester</h2>
                            <p>Current overall pass rate is {stats.passRate}% across the department.</p>
                        </div>
                        <span className="gray-badge">Target &ge; 90%</span>
                    </div>

                    <div className="pass-rate-stats">
                        {passRates.length === 0 ? (
                            <div className="text-muted" style={{ fontSize: '13px' }}>No pass rate data available by semester</div>
                        ) : (
                            passRates.map((pr, idx) => (
                                <div className="pr-col" key={idx}>
                                    <span className="pr-label">{pr.semester}</span>
                                    <span className={`pr-val ${pr.rate < 90 ? 'pr-warn' : ''}`}>{pr.rate}%</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pr.total} students</span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="insights-list border-warning mt-auto">
                        <p><span className="dot orange"></span>
                            {passRates.filter(p => p.rate < 90).length > 0
                                ? `${passRates.filter(p => p.rate < 90).length} semester(s) are below the 90% departmental pass rate target.`
                                : 'All semesters are meeting the 90% target — excellent department performance.'}
                        </p>
                        <p><span className="dot blue"></span>
                            Review courses in lower-performing semesters to identify and address root causes.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="performance-sections-grid">
                {/* Academic Probation Table */}
                <div className="section-card">
                    <div className="section-header">
                        <div>
                            <h2>Students on Academic Probation</h2>
                            <p>Breakdown of the {stats.probationCount} students currently flagged.</p>
                        </div>
                        <span className="red-badge">Probation Rate {stats.probationRate}%</span>
                    </div>

                    <div className="table-container">
                        <table className="perf-table">
                            <thead>
                                <tr>
                                    <th>Cohort</th>
                                    <th>Students</th>
                                    <th>Primary Reason</th>
                                    <th>Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {probationStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted" style={{ padding: '24px' }}>
                                            {stats.totalEnrolled === 0 ? 'No student data found for this department' : 'No students on academic probation — great performance!'}
                                        </td>
                                    </tr>
                                ) : (
                                    probationStudents.map((st, idx) => (
                                        <tr key={idx}>
                                            <td>{st.cohort}</td>
                                            <td><strong>{st.count}</strong></td>
                                            <td>{st.reason}</td>
                                            <td><span className="sub-text">{st.level}</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Dean's List Table */}
                <div className="section-card">
                    <div className="section-header">
                        <div>
                            <h2>Dean's List &amp; High Performers</h2>
                            <p>{stats.deansListCount} students eligible across the department.</p>
                        </div>
                        <span className="green-badge">GPA &ge; 8.5</span>
                    </div>

                    <div className="table-container">
                        <table className="perf-table">
                            <thead>
                                <tr>
                                    <th>Cohort / Year</th>
                                    <th>Students</th>
                                    <th>Avg GPA</th>
                                    <th>Notable Courses</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deansListStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted" style={{ padding: '24px' }}>
                                            {stats.totalEnrolled === 0 ? 'No student data found for this department' : 'No students currently meeting Dean\'s List criteria (GPA ≥ 8.5)'}
                                        </td>
                                    </tr>
                                ) : (
                                    deansListStudents.map((dl, idx) => (
                                        <tr key={idx}>
                                            <td>{dl.program}</td>
                                            <td><strong>{dl.count}</strong></td>
                                            <td><span className="gpa-highlight">{dl.avgGpa}</span></td>
                                            <td>{dl.courses}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="insights-list mt-auto">
                        <p><span className="dot emerald"></span>
                            {deansListStudents.length > 0
                                ? `Dean's List students are distributed across ${deansListStudents.length} year group(s).`
                                : 'Encourage students to aim for GPA ≥ 8.5 to qualify for the Dean\'s List.'}
                        </p>
                        <p><span className="dot blue"></span>
                            A total of {stats.deansListCount} out of {stats.totalEnrolled} students ({stats.totalEnrolled > 0 ? ((stats.deansListCount / stats.totalEnrolled) * 100).toFixed(1) : 0}%) are high performers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HODAcademicPerformance;
