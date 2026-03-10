import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    ArrowLeft,
    Download,
    Calendar as CalendarIcon,
    FlaskConical,
    BarChart2,
    MonitorPlay,
    Users,
    Laptop,
    Wrench,
    AlertTriangle,
    Clock,
    AlertCircle
} from 'lucide-react';
import './HODResourceUtilization.css';

const HODResourceUtilization = () => {
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();

    // Stats states initialized safely to 0
    const [stats, setStats] = useState({
        labCount: 0,
        labCountDelta: 0,
        avgLabOccupancy: 0,
        avgLabOccupancyDelta: 0,
        classroomCount: 0,
        classroomCountDelta: 0,
        avgClassOccupancy: 0,
        labSystems: 0,
        labSystemsInUse: 0,
        systemsMaintenance: 0,
        systemsMaintenanceDelta: 0,
        labsMaintenance: 0,
        dailyCheckins: 0,
        dailyCheckinsDelta: 0
    });

    const [utilization, setUtilization] = useState({
        labsAvg: 0,
        classesAvg: 0,
        unbooked: 0,
        studentsPct: 0,
        facultyPct: 0,
        othersPct: 0,
        studentsHrs: 0,
        facultyHrs: 0,
        othersHrs: 0
    });

    const [riskLabs, setRiskLabs] = useState([]);

    useEffect(() => {
        const fetchResourceData = async () => {
            if (!currentUser) return;
            try {
                let dept = userData?.department;
                if (!dept) {
                    const hodRes = await api.get(`/department/by-hod/${currentUser.uid}`);
                    dept = hodRes.data.department;
                }
                if (!dept) return;
                const res = await api.get(`/department/resource-utilization/${dept}`);
                const data = res.data;
                if (data.stats) setStats(data.stats);
                if (data.utilization) setUtilization(data.utilization);
                if (data.riskLabs) setRiskLabs(data.riskLabs);
            } catch (err) {
                console.error("Failed to fetch resource utilization data", err);
            }
        };
        fetchResourceData();
    }, [currentUser, userData]);

    return (
        <div className="resource-utilization-container">
            {/* Header Section */}
            <div className="resource-breadcrumb">
                <span onClick={() => navigate('/department-analytics')} className="link-back">
                    <ArrowLeft size={14} className="inline-icon" /> Reports
                </span>
                <span className="separator">&gt;</span>
                <span className="current">Resource Utilization</span>
            </div>

            <header className="resource-header">
                <div className="header-titles">
                    <h1>Resource Utilization Overview</h1>
                    <p>Track lab & classroom capacity, equipment health, and who is using resources most.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <CalendarIcon size={16} /> Fall Semester 2024
                    </button>
                    <button className="btn-primary">
                        <Download size={16} /> Export Report
                    </button>
                </div>
            </header>

            {/* KPI Cards Grid - Two Rows of 4 */}
            <div className="kpi-cards-grid-resource">
                {/* Row 1 */}
                <div className="kpi-card-resource">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Lab Count</span>
                        <FlaskConical size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.labCount}</span>
                        <span className="kpi-right-text">Teaching & research labs</span>
                    </div>
                    <div className="kpi-trend positive">
                        <TrendingIcon type="up" /> +{stats.labCountDelta} new lab added this year
                    </div>
                </div>

                <div className="kpi-card-resource">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Average Lab Occupancy</span>
                        <BarChart2 size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.avgLabOccupancy}%</span>
                        <span className="kpi-right-text">Peak: 0% (Afternoons)</span>
                    </div>
                    <div className="kpi-trend positive">
                        <TrendingIcon type="up" /> +{stats.avgLabOccupancyDelta}% vs last semester
                    </div>
                </div>

                <div className="kpi-card-resource">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Classroom Count</span>
                        <MonitorPlay size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.classroomCount}</span>
                        <span className="kpi-right-text">Dept-owned classrooms</span>
                    </div>
                    <div className="kpi-trend negative-alt">
                        <TrendingIcon type="down" /> {stats.classroomCountDelta} room offline for renovation
                    </div>
                </div>

                <div className="kpi-card-resource">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Average Class Occupancy</span>
                        <Users size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.avgClassOccupancy}%</span>
                        <span className="kpi-right-text">Ideal target: 80%</span>
                    </div>
                    <div className="kpi-subtitle-empty"> </div>
                </div>

                {/* Row 2 */}
                <div className="kpi-card-resource">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Lab Systems</span>
                        <Laptop size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.labSystems}</span>
                        <span className="kpi-right-text">Desktops & workstations</span>
                    </div>
                    <div className="kpi-subtitle">
                        {stats.labSystemsInUse} in use ({stats.labSystems === 0 ? 0 : Math.round((stats.labSystemsInUse / stats.labSystems) * 100)}%)
                    </div>
                </div>

                <div className="kpi-card-resource">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Systems Under Maintenance</span>
                        <Wrench size={18} className="kpi-icon text-orange" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.systemsMaintenance}</span>
                        <span className="kpi-right-text">0 hardware, 0 software</span>
                    </div>
                    <div className="kpi-trend negative-alt">
                        <TrendingIcon type="down" /> {stats.systemsMaintenanceDelta} tickets vs last month
                    </div>
                </div>

                <div className="kpi-card-resource">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Labs Under Maintenance</span>
                        <AlertTriangle size={18} className="kpi-icon text-red" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.labsMaintenance}</span>
                        <span className="kpi-right-text">Short-term downtime</span>
                    </div>
                    <div className="kpi-subtitle">
                        Expected back online in pending days
                    </div>
                </div>

                <div className="kpi-card-resource">
                    <div className="kpi-card-header">
                        <span className="kpi-title">Daily Lab Check-ins</span>
                        <Clock size={18} className="kpi-icon" />
                    </div>
                    <div className="kpi-main">
                        <span className="kpi-value">{stats.dailyCheckins}</span>
                        <span className="kpi-right-text">Avg. swipes per weekday</span>
                    </div>
                    <div className="kpi-trend positive">
                        <TrendingIcon type="up" /> +{stats.dailyCheckinsDelta}% after midterms
                    </div>
                </div>
            </div>

            {/* Main Grid Two Columns */}
            <div className="resource-main-grid">

                {/* Left Column - Utilization Details */}
                <div className="resource-card-left">
                    <div className="card-header-flex">
                        <h2>Lab &amp; Classroom Utilization Detail</h2>
                        <span className="badge-light">This week</span>
                    </div>

                    <div className="utilization-bars-section">
                        <div className="util-bar-group">
                            <div className="util-bar-label-row">
                                <span className="util-label">Labs (avg occupancy)</span>
                                <span className="util-pct">{utilization.labsAvg}%</span>
                            </div>
                            <div className="util-progress-container">
                                <div className="util-progress-fill bg-blue-base" style={{ width: `${utilization.labsAvg}%` }}></div>
                            </div>
                            <p className="util-desc">Peak 2-6 PM, mostly student project work.</p>
                        </div>

                        <div className="util-bar-group">
                            <div className="util-bar-label-row">
                                <span className="util-label">Classes (avg occupancy)</span>
                                <span className="util-pct">{utilization.classesAvg}%</span>
                            </div>
                            <div className="util-progress-container">
                                <div className="util-progress-fill bg-orange-base" style={{ width: `${utilization.classesAvg}%` }}></div>
                            </div>
                            <p className="util-desc">Several core courses running above 85% capacity.</p>
                        </div>

                        <div className="util-bar-group">
                            <div className="util-bar-label-row">
                                <span className="util-label">Unbooked Slots (labs + classes)</span>
                                <span className="util-pct">{utilization.unbooked}%</span>
                            </div>
                            <div className="util-progress-container">
                                <div className="util-progress-fill bg-green-base" style={{ width: `${utilization.unbooked}%` }}></div>
                            </div>
                            <p className="util-desc">Good window for workshops or remedial sessions.</p>
                        </div>
                    </div>

                    <div className="utilization-who-section">
                        <div className="who-header">
                            <h3>Who is using the labs?</h3>
                            <div className="who-legend">
                                <span className="legend-item"><span className="dot bg-blue-base"></span>Students</span>
                                <span className="legend-item"><span className="dot bg-green-base"></span>Faculty</span>
                                <span className="legend-item"><span className="dot bg-orange-alt"></span>Others</span>
                            </div>
                        </div>

                        {/* Stacked Bar Percentages */}
                        <div className="who-stacked-bar">
                            {(utilization.studentsPct === 0 && utilization.facultyPct === 0 && utilization.othersPct === 0) ? (
                                <div className="who-segment bg-gray-subtle" style={{ width: '100%' }}>
                                    <span>0% Data</span>
                                </div>
                            ) : (
                                <>
                                    <div className="who-segment bg-blue-base" style={{ width: `${utilization.studentsPct}%` }}>
                                        <span>Students {utilization.studentsPct}%</span>
                                    </div>
                                    <div className="who-segment bg-green-base" style={{ width: `${utilization.facultyPct}%` }}>
                                        <span>Faculty {utilization.facultyPct}%</span>
                                    </div>
                                    <div className="who-segment bg-orange-alt" style={{ width: `${utilization.othersPct}%` }}>
                                        <span>Others {utilization.othersPct}%</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Vertical Bar Chart Mockup in CSS */}
                        <div className="who-vertical-bars">
                            <div className="v-bar-col">
                                <div className="v-bar-container">
                                    <div className="v-bar-fill bg-blue-base" style={{ height: `${utilization.studentsHrs === 0 ? 0 : 80}%` }}></div>
                                </div>
                                <div className="v-bar-val">{utilization.studentsHrs.toLocaleString()} hrs</div>
                                <div className="v-bar-lbl">Students</div>
                            </div>
                            <div className="v-bar-col">
                                <div className="v-bar-container">
                                    <div className="v-bar-fill bg-green-base" style={{ height: `${utilization.facultyHrs === 0 ? 0 : 50}%` }}></div>
                                </div>
                                <div className="v-bar-val">{utilization.facultyHrs.toLocaleString()} hrs</div>
                                <div className="v-bar-lbl">Faculty</div>
                            </div>
                            <div className="v-bar-col">
                                <div className="v-bar-container">
                                    <div className="v-bar-fill bg-orange-alt" style={{ height: `${utilization.othersHrs === 0 ? 0 : 20}%` }}></div>
                                </div>
                                <div className="v-bar-val">{utilization.othersHrs.toLocaleString()} hrs</div>
                                <div className="v-bar-lbl">Guests & staff</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Maintenance & Risk Snapshot */}
                <div className="resource-card-right">
                    <div className="card-header-flex mb-24">
                        <h2>Maintenance &amp; Risk Snapshot</h2>
                        <span className="badge-attention">
                            <AlertCircle size={14} /> Attention
                        </span>
                    </div>

                    <div className="table-wrapper">
                        <table className="risk-table">
                            <thead>
                                <tr>
                                    <th>Lab / Room</th>
                                    <th>Lab Occupancy</th>
                                    <th>Systems</th>
                                    <th>Under Maintenance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {riskLabs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="empty-state-message text-center p-8">
                                            No maintenance and risk data available
                                        </td>
                                    </tr>
                                ) : (
                                    riskLabs.map((lab, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="lab-name-cell">
                                                    <span className="lab-name">{lab.name}</span>
                                                    <span className="lab-slot">Lab count slot: {index + 1} of {riskLabs.length}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="occupancy-cell">
                                                    <div className="mini-progress-container">
                                                        <div className={`mini-progress-fill ${lab.occupancyColor}`} style={{ width: `${lab.occupancy}%` }}></div>
                                                    </div>
                                                    <span className="mini-progress-text">{lab.occupancy}% avg</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="sys-count">{lab.systems}</span><br />
                                                <span className="sys-lbl">systems</span>
                                            </td>
                                            <td>
                                                <span className="sys-count">{lab.maintenance}</span><br />
                                                <span className="sys-lbl">systems</span>
                                            </td>
                                            <td>
                                                <span className={`risk-status-badge ${lab.statusClass}`}>{lab.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="risk-footer">
                        Summary: {riskLabs.length} of {stats.labCount} labs shown. Additional labs currently offline for renovation are included in the *Labs Under Maintenance* metric above.
                    </div>
                </div>

            </div>
        </div>
    );
};

// Helper Icon for Trending Up/Down arrows
const TrendingIcon = ({ type }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {type === 'up' ? (
            <>
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
            </>
        ) : (
            <>
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                <polyline points="17 18 23 18 23 12"></polyline>
            </>
        )}
    </svg>
);

export default HODResourceUtilization;
