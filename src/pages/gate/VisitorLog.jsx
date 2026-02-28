import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Loader, UserPlus, LogOut, Search, Clock, PlusCircle } from 'lucide-react';
import './VisitorLog.css';

const VisitorLog = () => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewMode, setViewMode] = useState('ACTIVE'); // ACTIVE, ALL
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    // New Visitor Form State
    const [formData, setFormData] = useState({
        name: '',
        contactNumber: '',
        purpose: '',
        personToMeet: '',
        vehicleNumber: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchVisitors();
        setCurrentPage(1);
    }, [viewMode]);

    const fetchVisitors = async () => {
        setLoading(true);
        try {
            const endpoint = viewMode === 'ACTIVE' ? '/gate/visitors/active' : '/gate/visitors';
            const res = await api.get(endpoint);
            setVisitors(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditMode(false);
        setCurrentId(null);
        setFormData({ name: '', contactNumber: '', purpose: '', personToMeet: '', vehicleNumber: '' });
        setShowAddModal(true);
    };

    const openEditModal = (visitor) => {
        setEditMode(true);
        setCurrentId(visitor.id);
        setFormData({
            name: visitor.name,
            contactNumber: visitor.contactNumber,
            purpose: visitor.purpose,
            personToMeet: visitor.personToMeet,
            vehicleNumber: visitor.vehicleNumber
        });
        setShowAddModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/gate/visitors/${currentId}`, formData);
                alert("Visitor updated successfully");
            } else {
                await api.post('/gate/visitors/check-in', formData);
                alert("Visitor Checked-In Successfully");
            }
            setShowAddModal(false);
            fetchVisitors();
        } catch (err) {
            alert("Operation failed: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this visitor record?")) return;
        try {
            await api.delete(`/gate/visitors/${id}`);
            fetchVisitors();
        } catch (err) {
            alert("Deletion failed: " + err.message);
        }
    };

    const handleCheckOut = async (id) => {
        if (!window.confirm("Confirm check-out for this visitor?")) return;
        try {
            await api.post(`/gate/visitors/${id}/check-out`);
            // Refresh list
            fetchVisitors();
        } catch (err) {
            alert("Failed to check-out: " + err.message);
        }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentVisitors = visitors.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(visitors.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="visitor-dashboard">
            <header className="visitor-header">
                <div>
                    <h1>Visitor Management</h1>
                    <p>Track student entries, guest check-ins, and daily logs.</p>
                </div>
                <div className="header-controls">
                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'ACTIVE' ? 'active' : ''}`}
                            onClick={() => setViewMode('ACTIVE')}
                        >
                            Active Now
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'ALL' ? 'active' : ''}`}
                            onClick={() => setViewMode('ALL')}
                        >
                            History
                        </button>
                    </div>

                    <button className="btn-primary-add" onClick={openAddModal}>
                        <PlusCircle size={18} />
                        New Entry
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="loading-screen"><Loader className="animate-spin" /></div>
            ) : (
                <div className="visitor-table-card">
                    <div className="table-wrapper">
                        <table className="visitor-table">
                            <thead>
                                <tr>
                                    <th>Visitor Details</th>
                                    <th>Purpose</th>
                                    <th>Vehicle / Contact</th>
                                    <th>Check-In Time</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentVisitors.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Search size={32} opacity={0.5} />
                                                <span>No records found in this view.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : currentVisitors.map(v => (
                                    <tr key={v.id}>
                                        <td>
                                            <div className="meta-info">
                                                <span className="visitor-name">{v.name}</span>
                                                <span className="meta-secondary">Meeting: {v.personToMeet}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="meta-primary">{v.purpose}</span>
                                        </td>
                                        <td>
                                            <div className="meta-info">
                                                <span className="meta-primary">{v.contactNumber || 'N/A'}</span>
                                                {v.vehicleNumber && <span className="meta-secondary">Veh: {v.vehicleNumber}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="time-cell">
                                                <Clock size={14} className="text-secondary" />
                                                <div className="meta-info">
                                                    <span className="time-text">
                                                        {new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="meta-secondary">
                                                        {new Date(v.checkInTime).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {v.status === 'CHECKED_IN' ? (
                                                <span className="status-badge status-checkin">
                                                    <div className="status-dot"></div> Active
                                                </span>
                                            ) : (
                                                <div className="meta-info">
                                                    <span className="status-badge status-checkout">Checked Out</span>
                                                    {v.checkOutTime && (
                                                        <span className="meta-secondary" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                                                            {new Date(v.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {v.status === 'CHECKED_IN' && (
                                                    <button
                                                        className="btn-action-icon btn-checkout"
                                                        title="Check Out"
                                                        onClick={() => handleCheckOut(v.id)}
                                                    >
                                                        <LogOut size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn-action-icon btn-edit"
                                                    title="Edit"
                                                    onClick={() => openEditModal(v)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                </button>
                                                <button
                                                    className="btn-action-icon btn-delete"
                                                    title="Delete"
                                                    onClick={() => handleDelete(v.id)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', padding: '20px', gap: '15px', alignItems: 'center', borderTop: '1px solid var(--glass-border)' }}>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="toggle-btn"
                                style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            >
                                Previous
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Page <span style={{ color: 'white', fontWeight: 'bold', margin: '0 5px' }}>{currentPage}</span> of {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="toggle-btn"
                                style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Visitor Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-container visitor-modal" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>{editMode ? 'Edit Visitor Details' : 'New Visitor Check-In'}</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label>Visitor Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="custom-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Contact Number</label>
                                    <input
                                        type="text"
                                        className="custom-input"
                                        value={formData.contactNumber}
                                        onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Vehicle Number (Optional)</label>
                                    <input
                                        type="text"
                                        className="custom-input"
                                        value={formData.vehicleNumber}
                                        onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Person To Meet (Student/Staff) *</label>
                                <input
                                    type="text"
                                    required
                                    className="custom-input"
                                    placeholder="e.g. John Doe (CSE - IV)"
                                    value={formData.personToMeet}
                                    onChange={e => setFormData({ ...formData, personToMeet: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Purpose of Visit *</label>
                                <textarea
                                    required
                                    className="custom-input"
                                    rows="3"
                                    value={formData.purpose}
                                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                                ></textarea>
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                                {editMode ? 'Update Visitor' : 'Check In Visitor'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitorLog;
