import React, { useState, useEffect } from 'react';
import { Search, Plus, SlidersHorizontal, Filter, MoreHorizontal, Phone, Trash2, Edit, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';
import UserDetailsModal from '../../components/UserDetailsModal';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const itemsPerPage = 8;

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const roles = ['TEACHER', 'MENTOR', 'HOD', 'ADMIN', 'COE', 'PRINCIPAL', 'GATE_SECURITY', 'STUDENT'];
            const promises = roles.map(role => api.get(`/users/role/${role}`).catch(() => ({ data: [] })));
            const results = await Promise.all(promises);
            const allUsers = results.flatMap(r => r.data).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            const uniqueUsers = Array.from(new Map(allUsers.map(u => [u.id || u.firebaseUid, u])).values());
            setUsers(uniqueUsers);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const toggleSelectUser = (id) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(uId => uId !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getAvatarColor = (name) => {
        const colors = ['#FFD1DC', '#D1E8FF', '#E8D1FF', '#FFE8D1', '#D1FFF0'];
        const index = (name?.length || 0) % colors.length;
        return colors[index];
    };

    const openAddModal = () => {
        setModalMode('add');
        setFormData({ role: 'TEACHER', fullName: '', email: '', password: 'password123' });
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setModalMode('edit');
        setFormData(user);
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const handleSave = async (data) => {
        try {
            if (modalMode === 'add') {
                await api.post('/users/create-user', data);
                alert('User added successfully!');
            } else {
                const payload = { ...data };
                delete payload.password;
                delete payload.firebaseUid;
                await api.put(`/users/${data.firebaseUid}`, payload);
                alert('User updated successfully!');
            }
            fetchUsers();
            closeModal();
        } catch (error) {
            console.error("Operation failed", error);
            alert("Failed to save user.");
        }
    };

    const handleDelete = async (uid) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/users/${uid}`);
            fetchUsers();
        } catch (error) {
            alert("Failed to delete user.");
        }
    };

    const getRoleBadgeClass = (role) => {
        const base = 'admin-badge';
        return `${base} ${role ? role.toLowerCase() : 'user'}`;
    };

    return (
        <div className="student-list-container">
            <div className="student-list-header">
                <h2 className="page-title">User Management</h2>
                <div className="header-actions">
                    <div className="search-bar-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Name, Email, or Role"
                            value={searchTerm}
                            onChange={handleSearch}
                            className="search-input"
                        />
                    </div>
                    <button className="action-btn-yellow"><SlidersHorizontal size={24} /></button>
                    <button className="action-btn-yellow"><Filter size={24} /></button>
                    <button className="action-btn-yellow large" onClick={openAddModal}><Plus size={28} /></button>
                </div>
            </div>

            <div className="student-table-card">
                <table className="student-table">
                    <thead>
                        <tr>
                            <th className="checkbox-cell">
                                <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    onChange={() => {
                                        if (selectedUsers.length === paginatedUsers.length) setSelectedUsers([]);
                                        else setSelectedUsers(paginatedUsers.map(s => s.id));
                                    }}
                                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                                />
                            </th>
                            <th>User Name</th>
                            <th>Role</th>
                            <th>Department / ID</th>
                            <th>Phone Number</th>
                            <th>Date of Joining</th>
                            <th className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="loading-cell">Loading users...</td></tr>
                        ) : paginatedUsers.length > 0 ? (
                            paginatedUsers.map((user) => {
                                const isSelected = selectedUsers.includes(user.id);
                                return (
                                    <tr key={user.id || user.firebaseUid} className={`student-row ${isSelected ? 'selected' : ''}`}>
                                        <td className="checkbox-cell">
                                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelectUser(user.id)} className="custom-checkbox" />
                                        </td>
                                        <td>
                                            <div className="student-name-cell">
                                                <div className="avatar-circle" style={{ backgroundColor: getAvatarColor(user.fullName) }}>
                                                    {user.fullName?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div className="name-info">
                                                    <span className="student-name">{user.fullName}</span>
                                                    <span className="student-email">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={getRoleBadgeClass(user.role)}>{user.role || 'USER'}</span>
                                        </td>
                                        <td className="font-medium-blue">
                                            {user.department || 'N/A'} {user.rollNumber ? `(#${user.rollNumber})` : ''}
                                        </td>
                                        <td>
                                            <div className="phone-cell">
                                                <span className="phone-icon-circle"><Phone size={16} /></span>
                                                {user.mobileNumber || 'Not provided'}
                                            </div>
                                        </td>
                                        <td className="address-cell">{user.admissionYear || new Date(user.createdAt || Date.now()).toLocaleDateString() || 'N/A'}</td>
                                        <td>
                                            <div className="action-buttons-cell">
                                                <button className="icon-action-btn" onClick={() => openEditModal(user)}><Edit size={20} /></button>
                                                <button className="icon-action-btn delete" onClick={() => handleDelete(user.firebaseUid)}><Trash2 size={20} /></button>
                                                <button className="icon-action-btn"><MoreHorizontal size={20} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr><td colSpan="7" className="loading-cell">No users found.</td></tr>
                        )}
                    </tbody>
                </table>

                <div className="table-footer">
                    <span className="showing-text">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}-
                        {Math.min(currentPage * itemsPerPage, filteredUsers.length)} from {filteredUsers.length} data
                    </span>
                    <div className="pagination-wrapper">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="pagination-nav-btn"><ChevronLeft size={16} /></button>

                        {(() => {
                            const pages = [];
                            let startPage = Math.max(1, currentPage - 2);
                            let endPage = Math.min(totalPages, currentPage + 2);
                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                    <button key={i} onClick={() => setCurrentPage(i)} className={`pagination-number-btn ${currentPage === i ? 'active' : ''}`}>{i}</button>
                                );
                            }
                            return pages;
                        })()}

                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="pagination-nav-btn"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

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

export default UserManagement;
