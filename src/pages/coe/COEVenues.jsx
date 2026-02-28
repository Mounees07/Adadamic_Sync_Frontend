import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Plus,
    Users,
    Edit,
    Trash2,
    X,
    Search,
    Building,
    Layers,
    CheckCircle
} from 'lucide-react';
import api from '../../utils/api';
import './COEVenues.css';

const COEVenues = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentVenue, setCurrentVenue] = useState(null); // For edit
    const [formData, setFormData] = useState({
        name: '',
        block: '',
        capacity: '',
        examType: 'Semester',
        isAvailable: true
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchVenues();
    }, []);

    const fetchVenues = async () => {
        setLoading(true);
        try {
            const res = await api.get('/exam-venues');
            setVenues(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Failed to fetch venues", error);
            // Fallback for demo if API fails
            // setVenues([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentVenue) {
                // Update
                const res = await api.put(`/exam-venues/${currentVenue.id}`, formData);
                setVenues(venues.map(v => v.id === currentVenue.id ? res.data : v));
            } else {
                // Create
                const res = await api.post('/exam-venues', formData);
                setVenues([...venues, res.data]);
            }
            closeModal();
        } catch (error) {
            console.error("Failed to save venue", error);
            alert("Failed to save venue details.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this venue?")) return;
        try {
            await api.delete(`/exam-venues/${id}`);
            setVenues(venues.filter(v => v.id !== id));
        } catch (error) {
            console.error("Failed to delete venue", error);
            alert("Failed to delete venue.");
        }
    };

    const openModal = (venue = null) => {
        if (venue) {
            setCurrentVenue(venue);
            setFormData({
                name: venue.name,
                block: venue.block,
                capacity: venue.capacity,
                examType: venue.examType || 'Semester',
                isAvailable: venue.isAvailable
            });
        } else {
            setCurrentVenue(null);
            setFormData({
                name: '',
                block: '',
                capacity: '',
                examType: 'Semester',
                isAvailable: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentVenue(null);
    };

    const filteredVenues = venues.filter(v =>
        (v.name && v.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.block && v.block.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="coe-venues-container">
            <div className="venues-header">
                <div>
                    <h1>Exam Venues</h1>
                    <p>Manage examination halls and seating capacity</p>
                </div>
                <button className="btn-add-venue" onClick={() => openModal()}>
                    <Plus size={20} /> Add Venue
                </button>
            </div>

            <div className="search-bar mb-6 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search venues by name or block..."
                    className="w-full pl-12 pr-4 py-3 bg-[var(--bg-subtle)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-10 text-[var(--text-secondary)]">Loading venues...</div>
            ) : filteredVenues.length === 0 ? (
                <div className="empty-state">
                    <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                    <h3>No Venues Found</h3>
                    <p>Create a new venue to get started with exam scheduling.</p>
                </div>
            ) : (
                <div className="venues-grid">
                    {filteredVenues.map(venue => (
                        <div key={venue.id} className="venue-card">
                            <div className="venue-header">
                                <div className="venue-icon">
                                    <Building size={24} />
                                </div>
                                <div className={`venue-capacity-badge ${!venue.isAvailable ? 'opacity-50 grayscale' : ''}`}>
                                    <Users size={12} className="inline mr-1" />
                                    {venue.capacity} Seats
                                </div>
                            </div>
                            <div className="venue-details">
                                <h3>{venue.name}</h3>
                                <div className="venue-info-row">
                                    <Layers size={14} />
                                    <span>{venue.block}</span>
                                </div>
                                <div className="venue-tags">
                                    <span className="venue-tag">{venue.examType}</span>
                                    {venue.isAvailable ? (
                                        <span className="venue-tag text-green-500 border-green-500/20 bg-green-500/10 flex items-center gap-1">
                                            <CheckCircle size={10} /> Active
                                        </span>
                                    ) : (
                                        <span className="venue-tag text-red-500 border-red-500/20 bg-red-500/10">Inactive</span>
                                    )}
                                </div>
                            </div>
                            <div className="venue-actions">
                                <button className="action-btn" onClick={() => openModal(venue)} title="Edit">
                                    <Edit size={18} />
                                </button>
                                <button className="action-btn delete" onClick={() => handleDelete(venue.id)} title="Delete">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{currentVenue ? 'Edit Venue' : 'Add New Venue'}</h2>
                            <button className="close-btn" onClick={closeModal}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Venue Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    placeholder="e.g. Hall A-101"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label>Block / Building</label>
                                    <input
                                        type="text"
                                        name="block"
                                        className="form-input"
                                        placeholder="e.g. Science Block"
                                        value={formData.block}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Seating Capacity</label>
                                    <input
                                        type="number"
                                        name="capacity"
                                        className="form-input"
                                        placeholder="e.g. 60"
                                        value={formData.capacity}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Suitable For</label>
                                <select
                                    name="examType"
                                    className="form-select"
                                    value={formData.examType}
                                    onChange={handleInputChange}
                                >
                                    <option value="Semester">Semester Exam</option>
                                    <option value="Internal">Internal Assessment</option>
                                    <option value="Lab">Laboratory</option>
                                    <option value="All">All Types</option>
                                </select>
                            </div>
                            <div className="form-group flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="isAvailable"
                                    id="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                                />
                                <label htmlFor="isAvailable" style={{ marginBottom: 0, cursor: 'pointer' }}>Available for Booking</label>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-save">
                                    {currentVenue ? 'Update Venue' : 'Create Venue'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default COEVenues;
