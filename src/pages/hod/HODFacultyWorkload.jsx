import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    ArrowLeft,
    Download,
    SlidersHorizontal,
    Users,
    BookOpen,
    Microscope,
    Clock,
    Search,
    Filter,
    Mail,
    Calendar,
    FileText
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import Loader from '../../components/Loader';
import './HODFacultyWorkload.css';

const HODFacultyWorkload = () => {
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();

    // States for data (initialized empty/0 to avoid mock system data)
    const [stats, setStats] = useState({
        totalFaculty: 0,
        avgTeachingHours: 0,
        activeGrants: 0,
        overallocatedFaculty: 0,
        leadResearchers: 0
    });

    const [workloadRecords, setWorkloadRecords] = useState([]);
    const [distributionData, setDistributionData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWorkloadData = async () => {
            if (!currentUser) return;
            try {
                let dept = userData?.department;
                if (!dept) {
                    const hodRes = await api.get(`/department/by-hod/${currentUser.uid}`);
                    dept = hodRes.data.department;
                }
                if (!dept) return;
                const res = await api.get(`/department/faculty-workload/${dept}`);
                const data = res.data;
                setStats(data.stats);
                setDistributionData(data.distributionData);
                setWorkloadRecords(data.workloadRecords);
            } catch (err) {
                console.error("Failed to fetch faculty workload data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkloadData();
    }, [currentUser, userData]);

    if (loading) {
        return <Loader fullScreen={false} text="Loading Faculty Workload Data..." />
    }

    return (
        <div className="faculty-workload-container">
            {/* Header Section */}
            <div className="workload-back-link" onClick={() => navigate('/department-analytics')}>
                <ArrowLeft size={16} />
                <span>Back to Reports</span>
            </div>

            <header className="workload-header">
                <div className="header-titles">
                    <h1>Faculty Workload</h1>
                    <p>Teaching hours, research output, and administrative allocations across the department.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <Download size={16} /> Export Data
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/department-analytics/adjust-allocations')}>
                        <SlidersHorizontal size={16} /> Adjust Allocations
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="kpi-cards-grid-workload">
                <div className="kpi-card-workload">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Total Faculty</span>
                        <Users size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.totalFaculty}</span>
                    </div>
                    <div className="kpi-subtitle">
                        Full-time & Adjunct
                    </div>
                </div>

                <div className="kpi-card-workload">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Avg Teaching Hours</span>
                        <BookOpen size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.avgTeachingHours.toFixed(1)} <span className="value-unit">hrs/wk</span></span>
                    </div>
                    <div className="kpi-subtitle">
                        Target: 15 hrs/wk
                    </div>
                </div>

                <div className="kpi-card-workload">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Active Research Grants</span>
                        <Microscope size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.activeGrants}</span>
                    </div>
                    <div className="kpi-subtitle">
                        Across {stats.leadResearchers} lead researchers
                    </div>
                </div>

                <div className="kpi-card-workload">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Overallocated Faculty</span>
                        <Clock size={18} className="kpi-icon text-orange" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value text-orange">{stats.overallocatedFaculty}</span>
                    </div>
                    <div className="kpi-subtitle">
                        &gt; 40 hours total workload
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="workload-content-grid">

                {/* Left Column: Workload Details Table */}
                <div className="workload-table-section">
                    <div className="section-header-flex">
                        <h2>Faculty Workload Details</h2>
                        <div className="table-actions">
                            <div className="search-box">
                                <Search size={16} className="search-icon" />
                                <input type="text" placeholder="Search faculty..." />
                            </div>
                            <button className="icon-filter-btn">
                                <Filter size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="workload-table">
                            <thead>
                                <tr>
                                    <th>Faculty Member</th>
                                    <th>Teaching</th>
                                    <th>Research</th>
                                    <th>Admin</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workloadRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state-message">
                                            No faculty workload records available
                                        </td>
                                    </tr>
                                ) : (
                                    workloadRecords.map((record, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div className="faculty-cell">
                                                    <div className="faculty-avatar">
                                                        {record.name.charAt(0)}
                                                    </div>
                                                    <div className="faculty-info">
                                                        <span className="faculty-name">{record.name}</span>
                                                        <span className="faculty-role">{record.role}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{record.teaching} hrs</td>
                                            <td>{record.research} hrs</td>
                                            <td>{record.admin} hrs</td>
                                            <td>
                                                <div className="total-hrs-cell">
                                                    <span className={`total-val ${record.status === 'Overloaded' ? 'text-orange' : ''}`}>
                                                        {record.total}<br /><span className="hrs-label">hrs</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`workload-status-badge ${record.statusClass}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Distribution & Quick Actions */}
                <div className="workload-side-column">

                    {/* Distribution Chart */}
                    <div className="side-card">
                        <h2 className="side-card-title">Overall Distribution</h2>
                        <div className="distribution-chart-container">
                            {distributionData.length === 0 ? (
                                <div className="empty-state-message text-center pt-8">No distribution data</div>
                            ) : (
                                <>
                                    <div style={{ height: '160px', width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={distributionData}
                                                    cx="50%"
                                                    cy="100%"
                                                    startAngle={180}
                                                    endAngle={0}
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {distributionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="distribution-legend">
                                        {distributionData.map((item, idx) => (
                                            <div className="legend-item" key={idx}>
                                                <div className="legend-left">
                                                    <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                                                    <span className="legend-label">{item.name}</span>
                                                </div>
                                                <span className="legend-value">{item.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="side-card">
                        <h2 className="side-card-title">Quick Actions</h2>
                        <div className="quick-action-list">
                            <button className="action-list-btn">
                                <Mail size={16} className="btn-icon" /> Email Overloaded Faculty
                            </button>
                            <button className="action-list-btn">
                                <Calendar size={16} className="btn-icon" /> Schedule Review Meeting
                            </button>
                            <button className="action-list-btn">
                                <FileText size={16} className="btn-icon" /> Generate Workload PDF
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HODFacultyWorkload;
