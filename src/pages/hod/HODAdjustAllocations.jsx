import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    ArrowLeft,
    Search,
    BookOpen,
    Microscope,
    Briefcase,
    Minus,
    Plus,
    Save
} from 'lucide-react';
import Loader from '../../components/Loader';
import './HODAdjustAllocations.css';

const HODAdjustAllocations = () => {
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();

    const [facultyList, setFacultyList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Track active modifications to pass to the backend
    const [allocations, setAllocations] = useState({
        teaching: 0,
        research: 0,
        admin: 0
    });

    useEffect(() => {
        const fetchFacultyWorkload = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                let dept = userData?.department;
                if (!dept) {
                    const hodRes = await api.get(`/department/by-hod/${currentUser.uid}`);
                    dept = hodRes.data.department;
                }
                if (!dept) return;

                const res = await api.get(`/department/faculty-workload/${dept}`);
                const data = res.data.workloadRecords || [];

                // Map the data to the format expected by the UI.
                // We inject the facultyId from the backend. Since the current API
                // doesn't return ID directly in workloadRecords, we use name matching
                // or just rely on the API returning the actual user IDs eventually.
                // For now, assume the backend has been updated to return 'id',
                // or fall back to an internal id.
                const mappedFaculty = data.map((record, index) => ({
                    id: record.id || index, // Using real ID if returned, else index
                    name: record.name,
                    role: record.role,
                    email: record.email || '',
                    hrs: record.total,
                    teaching: record.teaching,
                    research: record.research,
                    admin: record.admin,
                    status: record.status
                }));

                setFacultyList(mappedFaculty);
            } catch (err) {
                console.error("Failed to fetch faculty workload for allocations", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFacultyWorkload();
    }, [currentUser, userData]);

    const filteredFaculty = facultyList.filter(faculty =>
        faculty.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectFaculty = (faculty) => {
        setSelectedFaculty(faculty);
        setAllocations({
            teaching: faculty.teaching,
            research: faculty.research,
            admin: faculty.admin
        });
    };

    const handleUpdateAllocation = (type, amount) => {
        setAllocations(prev => {
            const newAmount = Math.max(0, prev[type] + amount); // Prevent negative
            return { ...prev, [type]: newAmount };
        });
    };

    const handleSaveAllocations = async () => {
        if (!selectedFaculty || saving) return;
        setSaving(true);

        try {
            // Need a real faculty ID here. If we don't have it in the record,
            // the backend should be modified to include it in the user workload data.
            // Using a dummy/index based ID for now will fail the DB update if not real.
            const payload = {
                teaching: allocations.teaching,
                research: allocations.research,
                admin: allocations.admin
            };

            await api.put(`/department/faculty-workload/${selectedFaculty.id}`, payload);
            alert("Workload allocations updated successfully!");

            // Refresh list to show updated totals
            navigate('/department-analytics/faculty-workload');
        } catch (error) {
            console.error("Failed to save workload", error);
            alert("Error saving workload. Please ensure the backend returns valid faculty IDs.");
        } finally {
            setSaving(false);
        }
    };

    const currentTotalHrs = allocations.teaching + allocations.research + allocations.admin;

    return (
        <div className="adjust-allocations-container">
            {/* Header / Back Link */}
            <div className="allocations-back-link" onClick={() => navigate('/department-analytics/faculty-workload')}>
                <ArrowLeft size={16} />
                <span>Back to Faculty Workload</span>
            </div>

            <header className="allocations-header">
                <div className="header-titles">
                    <h1>Adjust Allocations</h1>
                    <p>Modify teaching, research, and administrative hours for faculty members.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => navigate('/department-analytics/faculty-workload')}>
                        Cancel
                    </button>
                    <button className="btn-primary" onClick={handleSaveAllocations} disabled={!selectedFaculty || saving}>
                        <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </header>

            <div className="allocations-layout">
                {/* Left Sidebar - Faculty List */}
                <div className="allocations-sidebar">
                    <div className="sidebar-search">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search faculty..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="faculty-list">
                        {loading ? (
                            <Loader text="Loading faculty members..." />
                        ) : filteredFaculty.length === 0 ? (
                            <div className="empty-state-message" style={{ padding: '32px 16px', fontSize: '13px' }}>
                                No faculty members found
                            </div>
                        ) : (
                            filteredFaculty.map(faculty => (
                                <div
                                    className={`faculty-list-item ${selectedFaculty?.id === faculty.id ? 'active' : ''}`}
                                    key={faculty.id}
                                    onClick={() => handleSelectFaculty(faculty)}
                                >
                                    <div className="faculty-item-info">
                                        <div className="faculty-item-avatar">
                                            {faculty.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="faculty-item-text">
                                            <span className="faculty-item-name">{faculty.name}</span>
                                            <span className="faculty-item-hrs">{faculty.hrs} hrs total</span>
                                        </div>
                                    </div>
                                    <span className={`status-pill ${faculty.status.toLowerCase().replace(' ', '-')}`}>
                                        {faculty.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Main Panel */}
                <div className="allocations-main-panel">
                    {/* Main Content Area */}
                    {!selectedFaculty ? (
                        <div className="panel-profile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                            <p className="empty-state-message text-center">Select a faculty member from the list to view and edit their workload allocations.</p>
                        </div>
                    ) : (
                        <>
                            {/* Top Info Profile Card */}
                            <div className="panel-profile-card">
                                <div className="profile-top-row">
                                    <div className="profile-info-block">
                                        <div className="profile-avatar large">
                                            {selectedFaculty.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="profile-details">
                                            <h2>{selectedFaculty.name}</h2>
                                            <p className="profile-role">{selectedFaculty.role || "Faculty Member"}</p>
                                        </div>
                                    </div>

                                    <div className="profile-limit-block">
                                        <div className="limit-hrs">
                                            <span className={`current-hrs ${currentTotalHrs > 40 ? 'text-orange' : 'text-primary'}`}>{currentTotalHrs}</span>
                                            <span className="max-hrs">/ 40 hrs limit</span>
                                        </div>
                                        <div className="limit-progress-bar">
                                            <div className="progress-fill bg-blue" style={{ width: `${Math.min(100, (currentTotalHrs / 40) * 100)}%` }}></div>
                                            {currentTotalHrs > 40 && (
                                                <div className="progress-overflow bg-orange" style={{ width: `${Math.min(100, ((currentTotalHrs - 40) / 40) * 100)}%` }}></div>
                                            )}
                                        </div>
                                        {currentTotalHrs > 40 && (
                                            <div className="limit-warning text-orange">
                                                +{currentTotalHrs - 40} hrs Overallocated
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Distribution Stack Bar */}
                                <div className="distribution-stack-section">
                                    <div className="stack-labels">
                                        <span>Current Distribution</span>
                                        <span>Total: {currentTotalHrs} hrs</span>
                                    </div>
                                    <div className="stack-bar">
                                        {currentTotalHrs > 0 ? (
                                            <>
                                                {allocations.teaching > 0 && <div className="stack-segment bg-blue" style={{ width: `${(allocations.teaching / currentTotalHrs) * 100}%` }}>{allocations.teaching}h Teach</div>}
                                                {allocations.research > 0 && <div className="stack-segment bg-purple" style={{ width: `${(allocations.research / currentTotalHrs) * 100}%` }}>{allocations.research}h Rsch</div>}
                                                {allocations.admin > 0 && <div className="stack-segment bg-orange" style={{ width: `${(allocations.admin / currentTotalHrs) * 100}%` }}>{allocations.admin}h Admin</div>}
                                            </>
                                        ) : (
                                            <div className="stack-segment bg-surface" style={{ width: '100%', color: 'var(--text-muted)' }}>0 hrs</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Accordion List */}
                            <div className="allocation-sections">

                                {/* Teaching Load */}
                                <div className="alloc-section-card border-blue">
                                    <div className="alloc-section-header bg-soft-blue">
                                        <div className="section-title text-blue">
                                            <BookOpen size={18} />
                                            <h3>Teaching Load</h3>
                                        </div>
                                        <div className="number-stepper">
                                            <button className="stepper-btn" onClick={() => handleUpdateAllocation('teaching', -1)}><Minus size={14} /></button>
                                            <span className="stepper-val" style={{ margin: '0 12px', fontWeight: 'bold' }}>{allocations.teaching}</span>
                                            <button className="stepper-btn" onClick={() => handleUpdateAllocation('teaching', 1)}><Plus size={14} /></button>
                                        </div>
                                    </div>
                                </div>

                                {/* Research Activities */}
                                <div className="alloc-section-card border-purple">
                                    <div className="alloc-section-header bg-soft-purple">
                                        <div className="section-title text-purple">
                                            <Microscope size={18} />
                                            <h3>Research Activities</h3>
                                        </div>
                                        <div className="number-stepper">
                                            <button className="stepper-btn" onClick={() => handleUpdateAllocation('research', -1)}><Minus size={14} /></button>
                                            <span className="stepper-val" style={{ margin: '0 12px', fontWeight: 'bold' }}>{allocations.research}</span>
                                            <button className="stepper-btn" onClick={() => handleUpdateAllocation('research', 1)}><Plus size={14} /></button>
                                        </div>
                                    </div>
                                </div>

                                {/* Administrative Duties */}
                                <div className="alloc-section-card border-orange">
                                    <div className="alloc-section-header bg-soft-orange">
                                        <div className="section-title text-orange">
                                            <Briefcase size={18} />
                                            <h3>Administrative Duties</h3>
                                        </div>
                                        <div className="number-stepper">
                                            <button className="stepper-btn" onClick={() => handleUpdateAllocation('admin', -1)}><Minus size={14} /></button>
                                            <span className="stepper-val text-orange" style={{ margin: '0 12px', fontWeight: 'bold' }}>{allocations.admin}</span>
                                            <button className="stepper-btn" onClick={() => handleUpdateAllocation('admin', 1)}><Plus size={14} /></button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HODAdjustAllocations;
