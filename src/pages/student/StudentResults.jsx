import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Award, BookOpen, Calendar, TrendingUp, Download, Loader } from 'lucide-react';
import FeatureGate from '../../components/FeatureGate';
import './StudentResults.css';

const StudentResults = () => {
    const { currentUser } = useAuth();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ sgpa: 0, cgpa: 0, totalCredits: 0 });

    useEffect(() => {
        fetchResults();
    }, [currentUser]);

    const fetchResults = async () => {
        if (!currentUser) return;
        try {
            const res = await api.get(`/results/student/${currentUser.uid}`);
            setResults(res.data);
            calculateStats(res.data);
        } catch (err) {
            console.error("Failed to fetch results", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        // Group by semester
        const semGroups = {};
        data.forEach(r => {
            const sem = r.semester;
            if (!semGroups[sem]) semGroups[sem] = [];
            semGroups[sem].push(r);
        });

        // Calculate SGPA for latest sem (simple approx if not stored)
        // Actually, let's just use the GPA stored in User profile for CGPA.
        // But here we can compute statistics from the Results data.
        let totalPoints = 0;
        let totalCredits = 0;

        data.forEach(r => {
            if (r.credits > 0 && r.grade !== 'RA' && r.grade !== 'AB') {
                const points = getGradePoints(r.grade);
                totalPoints += (points * r.credits);
                totalCredits += r.credits;
            }
        });

        setStats({
            totalCredits,
            cgpa: totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00",
            totalSubjects: data.length
        });
    };

    const getGradePoints = (grade) => {
        switch (grade) {
            case "O": return 10;
            case "A+": return 9;
            case "A": return 8;
            case "B+": return 7;
            case "B": return 6;
            default: return 0;
        }
    };

    const getGradeColor = (grade) => {
        if (grade === 'O') return 'text-purple-500';
        if (grade === 'A+' || grade === 'A') return 'text-green-500';
        if (grade === 'B+' || grade === 'B') return 'text-blue-500';
        return 'text-red-500';
    };

    if (loading) return <div className="loading-screen"><Loader className="animate-spin" /></div>;

    // Group results by Semester
    const groupedResults = results.reduce((acc, curr) => {
        const sem = curr.semester || 'Unknown';
        if (!acc[sem]) acc[sem] = [];
        acc[sem].push(curr);
        return acc;
    }, {});

    return (
        <FeatureGate featureKey="feature.result.enabled" title="Results Module">
            <div className="student-results-page">
                <header className="page-header">
                    <div>
                        <h1>My Results</h1>
                        <p>Academic performance and grade history</p>
                    </div>
                    {/* <button className="btn btn-secondary">
                    <Download size={18} /> Download Transcript
                </button> */}
                </header>

                {/* Stats Overview */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon bg-purple-100 text-purple-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3>CGPA</h3>
                            <p className="stat-value">{stats.cgpa}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon bg-blue-100 text-blue-600">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h3>Total Credits</h3>
                            <p className="stat-value">{stats.totalCredits}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon bg-green-100 text-green-600">
                            <Award size={24} />
                        </div>
                        <div>
                            <h3>Subjects Cleared</h3>
                            <p className="stat-value">{results.filter(r => r.grade !== 'RA' && r.grade !== 'AB').length}</p>
                        </div>
                    </div>
                </div>

                {/* Semester Wise Results */}
                <div className="semesters-container">
                    {Object.keys(groupedResults).sort().reverse().map(sem => (
                        <div key={sem} className="semester-section glass-card">
                            <div className="sem-header">
                                <h2>Semester {sem}</h2>
                                <span className="sem-badge">Completed</span>
                            </div>
                            <div className="results-table-wrapper">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Subject Code</th>
                                            <th>Subject Name</th>
                                            <th>Credits</th>
                                            <th>Grade</th>
                                            <th>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedResults[sem].map((result, idx) => (
                                            <tr key={idx}>
                                                <td className="font-mono">{result.subjectCode}</td>
                                                <td>{result.subjectName}</td>
                                                <td>{result.credits}</td>
                                                <td className={`font-bold ${getGradeColor(result.grade)}`}>{result.grade}</td>
                                                <td>
                                                    <span className={`status-pill ${result.grade === 'RA' || result.grade === 'AB' ? 'fail' : 'pass'}`}>
                                                        {result.grade === 'RA' || result.grade === 'AB' ? 'Re-Appear' : 'Pass'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {results.length === 0 && (
                        <div className="empty-state">
                            <BookOpen size={48} className="text-gray-300 mb-4" />
                            <h3>No results published yet.</h3>
                            <p>Check back later after the exam results are announced.</p>
                        </div>
                    )}
                </div>
            </div>
        </FeatureGate>
    );
};

export default StudentResults;
