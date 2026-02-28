import React, { useState, useEffect } from 'react';
import { Search, Plus, SlidersHorizontal, Filter, MoreHorizontal, Phone, Mail, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';
import UserDetailsModal from '../../components/UserDetailsModal';

const AdminTeacherList = () => {
    // State
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTeachers, setSelectedTeachers] = useState([]);
    const itemsPerPage = 8;

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const roles = ['TEACHER', 'MENTOR', 'HOD'];
            const promises = roles.map(role => api.get(`/users/role/${role}`).catch(() => ({ data: [] })));
            const results = await Promise.all(promises);
            const allTeachers = results.flatMap(r => r.data);
            const unique = Array.from(new Map(allTeachers.map(u => [u.id || u.firebaseUid, u])).values());
            setTeachers(unique);
        } catch (err) {
            console.error("Failed to fetch teachers", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const toggleSelectTeacher = (id) => {
        if (selectedTeachers.includes(id)) {
            setSelectedTeachers(selectedTeachers.filter(tId => tId !== id));
        } else {
            setSelectedTeachers([...selectedTeachers, id]);
        }
    };

    const filteredTeachers = teachers.filter(teacher =>
        (teacher.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (teacher.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (teacher.rollNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
    const paginatedTeachers = filteredTeachers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Color generator for avatars
    const getAvatarColor = (name) => {
        const colors = ['#FFD1DC', '#D1E8FF', '#E8D1FF', '#FFE8D1', '#D1FFF0'];
        const index = (name?.length || 0) % colors.length;
        return colors[index];
    };

    // --- CRUD Handlers ---

    const openAddModal = () => {
        setModalMode('add');
        setFormData({});
        setShowModal(true);
    };

    const openEditModal = (teacher) => {
        setModalMode('edit');
        setFormData({ ...teacher });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const handleSave = async (data) => {
        try {
            if (modalMode === 'add') {
                const payload = {
                    ...data,
                    role: data.role || 'TEACHER'
                };
                await api.post('/users/create-user', payload);
            } else {
                // Edit
                const payload = { ...data };
                delete payload.password; // Don't send empty password on edit
                delete payload.firebaseUid; // Don't update UID

                await api.put(`/users/${data.firebaseUid}`, payload);
            }
            // Refresh and close
            fetchTeachers();
            closeModal();
            alert(modalMode === 'add' ? 'Faculty added successfully!' : 'Faculty updated successfully!');
        } catch (error) {
            console.error("Operation failed", error);
            const errorMsg = error.response?.data || error.message || "Unknown error";
            alert(`Failed to save faculty: ${errorMsg}`);
        }
    };

    const handleDelete = async (uid) => {
        if (!window.confirm("Are you sure you want to delete this faculty member?")) return;
        try {
            await api.delete(`/users/${uid}`);
            fetchTeachers();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete faculty.");
        }
    };

    return (
        <div className="student-list-container">
            {/* Header Section */}
            <div className="student-list-header">
                <h2 className="page-title">All Faculty List</h2>
                <div className="header-actions">
                    <div className="search-bar-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search by ID, Name, or Email"
                            value={searchTerm}
                            onChange={handleSearch}
                            className="search-input"
                        />
                    </div>
                    {/* Action Buttons */}
                    <button className="action-btn-yellow">
                        <SlidersHorizontal size={24} />
                    </button>
                    <button className="action-btn-yellow">
                        <Filter size={24} />
                    </button>
                    <button
                        className="action-btn-yellow large"
                        onClick={openAddModal}
                    >
                        <Plus size={28} />
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="student-table-card">
                <table className="student-table">
                    <thead>
                        <tr>
                            <th className="checkbox-cell">
                                <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    onChange={() => {
                                        if (selectedTeachers.length === paginatedTeachers.length) setSelectedTeachers([]);
                                        else setSelectedTeachers(paginatedTeachers.map(t => t.id || t.firebaseUid));
                                    }}
                                    checked={selectedTeachers.length === paginatedTeachers.length && paginatedTeachers.length > 0}
                                />
                            </th>
                            <th>Faculty Name</th>
                            <th>Faculty ID</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Phone Number</th>
                            <th>Address</th>
                            <th className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="loading-cell">Loading faculty...</td>
                            </tr>
                        ) : paginatedTeachers.length > 0 ? (
                            paginatedTeachers.map((teacher) => {
                                const tId = teacher.id || teacher.firebaseUid;
                                const isSelected = selectedTeachers.includes(tId);
                                return (
                                    <tr
                                        key={tId}
                                        className={`student-row ${isSelected ? 'selected' : ''}`}
                                    >
                                        <td className="checkbox-cell">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelectTeacher(tId)}
                                                className="custom-checkbox"
                                            />
                                        </td>
                                        <td>
                                            <div className="student-name-cell">
                                                <div
                                                    className="avatar-circle"
                                                    style={{ backgroundColor: teacher.profilePictureUrl ? 'transparent' : getAvatarColor(teacher.fullName) }}
                                                >
                                                    {teacher.profilePictureUrl ? (
                                                        <img src={teacher.profilePictureUrl} alt="" className="avatar-img" />
                                                    ) : (
                                                        teacher.fullName?.charAt(0) || 'F'
                                                    )}
                                                </div>
                                                <div className="name-info">
                                                    <span className="student-name">{teacher.fullName}</span>
                                                    <span className="student-email">{teacher.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="font-bold-blue">
                                            #{teacher.rollNumber || 'N/A'}
                                        </td>
                                        <td className="font-medium-blue">
                                            {teacher.department || 'General'}
                                        </td>
                                        <td className="font-medium-blue">
                                            <span className={`admin-badge ${(teacher.role || '').toLowerCase()}`}>
                                                {teacher.role || 'TEACHER'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="phone-cell">
                                                <span className="phone-icon-circle">
                                                    <Phone size={16} />
                                                </span>
                                                {teacher.mobileNumber || '(555) 000-0000'}
                                            </div>
                                        </td>
                                        <td className="address-cell">
                                            {teacher.address || '123 Education Lane, City'}
                                        </td>
                                        <td>
                                            <div className="action-buttons-cell">
                                                <button
                                                    className="icon-action-btn"
                                                    onClick={() => openEditModal(teacher)}
                                                >
                                                    <Edit size={20} />
                                                </button>
                                                <button
                                                    className="icon-action-btn delete"
                                                    onClick={() => handleDelete(teacher.firebaseUid)}
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                                <button className="icon-action-btn"><MoreHorizontal size={20} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" className="loading-cell">No faculty found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Footer / Pagination */}
                <div className="table-footer">
                    <span className="showing-text">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTeachers.length)}-
                        {Math.min(currentPage * itemsPerPage, filteredTeachers.length)} from {filteredTeachers.length} data
                    </span>
                    <div className="pagination-wrapper">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="pagination-nav-btn"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {(() => {
                            const pages = [];
                            if (totalPages > 0) {
                                pages.push(
                                    <button
                                        key={1}
                                        onClick={() => setCurrentPage(1)}
                                        className={`pagination-number-btn ${currentPage === 1 ? 'active' : ''}`}
                                    >
                                        1
                                    </button>
                                );
                            }

                            if (currentPage > 3 && totalPages > 5) {
                                pages.push(<span key="start-ellipsis" className="pagination-ellipsis">...</span>);
                            }

                            let startPage = Math.max(2, currentPage - 1);
                            let endPage = Math.min(totalPages - 1, currentPage + 1);

                            if (totalPages <= 5) {
                                startPage = 2;
                                endPage = totalPages - 1;
                            } else {
                                if (currentPage <= 3) {
                                    endPage = 4;
                                } else if (currentPage >= totalPages - 2) {
                                    startPage = totalPages - 3;
                                }
                            }

                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`pagination-number-btn ${currentPage === i ? 'active' : ''}`}
                                    >
                                        {i}
                                    </button>
                                );
                            }

                            if (currentPage < totalPages - 2 && totalPages > 5) {
                                pages.push(<span key="end-ellipsis" className="pagination-ellipsis">...</span>);
                            }

                            if (totalPages > 1) {
                                pages.push(
                                    <button
                                        key={totalPages}
                                        onClick={() => setCurrentPage(totalPages)}
                                        className={`pagination-number-btn ${currentPage === totalPages ? 'active' : ''}`}
                                    >
                                        {totalPages}
                                    </button>
                                );
                            }

                            return pages;
                        })()}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="pagination-nav-btn"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <UserDetailsModal
                    user={formData}
                    mode={modalMode}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default AdminTeacherList;
