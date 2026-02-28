import React, { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, Search, Filter, X, ChevronRight, ChevronLeft, Phone, Edit, Save, SlidersHorizontal } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';

const AdminDataReports = () => {
    const [activeTab, setActiveTab] = useState('faculty'); // 'faculty' or 'students'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [updateLoading, setUpdateLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchData();
        setSearchTerm('');
        setSelectedUser(null);
        setIsEditing(false);
        setCurrentPage(1);
    }, [activeTab]);

    useEffect(() => {
        if (selectedUser) {
            setEditFormData({
                fullName: selectedUser.fullName || '',
                role: selectedUser.role || '',
                department: selectedUser.department || '',
                rollNumber: selectedUser.rollNumber || ''
            });
            setIsEditing(false);
        }
    }, [selectedUser]);

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveChanges = async () => {
        setUpdateLoading(true);
        try {
            const res = await api.put(`/users/${selectedUser.firebaseUid}`, editFormData);
            // Update local state
            const updatedUser = { ...selectedUser, ...res.data };
            setSelectedUser(updatedUser);

            // Update the list data
            setData(prevData => prevData.map(u =>
                (u.firebaseUid === updatedUser.firebaseUid) ? updatedUser : u
            ));

            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update user", err);
            alert("Failed to update user details");
        } finally {
            setUpdateLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'faculty') {
                const roles = ['TEACHER', 'HOD', 'MENTOR'];
                const promises = roles.map(role => api.get(`/users/role/${role}`).catch(() => ({ data: [] })));
                const results = await Promise.all(promises);
                const combined = results.flatMap(r => r.data);
                // Unique
                const unique = Array.from(new Map(combined.map(u => [u.id || u.firebaseUid || u.email, u])).values());
                setData(unique);
            } else {
                const res = await api.get('/users/role/STUDENT');
                setData(Array.isArray(res.data) ? res.data : []);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = async (user) => {
        setSelectedUser(user);
        setDetailsLoading(true);
        setUserDetails(null);
        try {
            if (activeTab === 'faculty') {
                const res = await api.get(`/courses/sections/faculty/${user.firebaseUid}`);
                setUserDetails({ sections: res.data || [] });
            } else {
                const res = await api.get(`/courses/enrollments/student/${user.firebaseUid}`);
                setUserDetails({ enrollments: res.data || [] });
            }
        } catch (err) {
            console.error("Failed to fetch user details", err);
            setUserDetails({ error: "Could not fetch details." });
        } finally {
            setDetailsLoading(false);
        }
    };

    // Color generator for avatars
    const getAvatarColor = (name) => {
        const colors = ['#FFD1DC', '#D1E8FF', '#E8D1FF', '#FFE8D1', '#D1FFF0'];
        const index = (name?.length || 0) % colors.length;
        return colors[index];
    };

    const filteredData = data.filter(u =>
        (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.rollNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="student-list-container">
            {/* Header Section */}
            <div className="student-list-header">
                <div className="flex flex-col">
                    <h2 className="page-title">Institutional Data</h2>
                </div>

                <div className="header-actions">
                    <div style={{ display: 'flex', borderRadius: '50px', padding: '4px', border: '1px solid var(--glass-border)', marginRight: '16px', boxShadow: 'var(--shadow-subtle)', background: 'var(--bg-card)' }}>
                        <button
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'faculty' ? 'bg-purple text-white shadow-md' : 'text-gray hover:bg-subtle'}`}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: activeTab === 'faculty' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'faculty' ? 'white' : 'var(--text-secondary)'
                            }}
                            onClick={() => setActiveTab('faculty')}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> Faculty</span>
                        </button>
                        <button
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all`}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: activeTab === 'students' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'students' ? 'white' : 'var(--text-secondary)'
                            }}
                            onClick={() => setActiveTab('students')}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GraduationCap size={16} /> Students</span>
                        </button>
                    </div>

                    <div className="search-bar-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or email..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
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
                </div>
            </div>

            {/* Table Section */}
            <div className="student-table-card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="student-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '32px' }}>Name</th>
                                <th>Role</th>
                                <th>Department</th>
                                {activeTab === 'students' && <th>Roll ID</th>}
                                <th>Email</th>
                                <th>Contact</th>
                                <th style={{ textAlign: 'right', paddingRight: '32px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="loading-cell">Loading data...</td>
                                </tr>
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((user) => (
                                    <tr
                                        key={user.id || user.firebaseUid}
                                        className="student-row"
                                        onClick={() => handleUserClick(user)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td style={{ paddingLeft: '32px' }}>
                                            <div className="student-name-cell">
                                                <div
                                                    className="avatar-circle"
                                                    style={{ backgroundColor: getAvatarColor(user.fullName) }}
                                                >
                                                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div className="name-info">
                                                    <span className="student-name">{user.fullName}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${user.role ? user.role.toLowerCase() : 'student'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="font-medium-blue">
                                            {user.department || 'N/A'}
                                        </td>
                                        {activeTab === 'students' && (
                                            <td className="font-bold-blue">
                                                #{user.rollNumber || 'N/A'}
                                            </td>
                                        )}
                                        <td className="student-email">
                                            {user.email}
                                        </td>
                                        <td>
                                            <div className="phone-cell">
                                                <span className="phone-icon-circle">
                                                    <Phone size={16} />
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ paddingRight: '32px' }}>
                                            <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                                                <button className="icon-action-btn">
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="loading-cell">No records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="table-footer">
                    <span className="showing-text">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)}-
                        {Math.min(currentPage * itemsPerPage, filteredData.length)} from {filteredData.length} data
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
                            let startPage = Math.max(1, currentPage - 2);
                            let endPage = Math.min(totalPages, startPage + 4);

                            if (endPage - startPage < 4) {
                                startPage = Math.max(1, endPage - 4);
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

            {/* Detail Side Panel / Modal */}
            {/* Using inline styles here combined with glass-card because Admin.css might not cover all specific panel details */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            maxWidth: '400px',
                            borderRadius: '20px 0 0 20px',
                            height: '100vh',
                            overflowY: 'auto',
                            animation: 'slideInRight 0.3s ease-out'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                            <div style={{ flex: 1, marginRight: '16px' }}>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={editFormData.fullName}
                                        onChange={handleEditChange}
                                        className="search-input"
                                        placeholder="Full Name"
                                        style={{ fontSize: '1.25rem', fontWeight: 'bold', borderRadius: '8px', padding: '8px' }}
                                    />
                                ) : (
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{selectedUser.fullName}</h2>
                                )}
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>{selectedUser.email}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="icon-action-btn"
                                        title="Edit Profile"
                                    >
                                        <Edit size={20} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSaveChanges}
                                        disabled={updateLoading}
                                        className="action-btn-yellow"
                                        style={{ width: '36px', height: '36px' }}
                                        title="Save Changes"
                                    >
                                        {updateLoading ? <div style={{ width: 16, height: 16, border: '2px solid white', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="icon-action-btn"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="custom-scrollbar">
                            {/* User Profile Summary */}
                            <div style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>Profile Details</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Role</span>
                                        {isEditing ? (
                                            <select
                                                name="role"
                                                value={editFormData.role}
                                                onChange={handleEditChange}
                                                style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                            >
                                                {['STUDENT', 'TEACHER', 'MENTOR', 'HOD', 'PRINCIPAL', 'COE', 'ADMIN'].map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`role-badge ${selectedUser.role ? selectedUser.role.toLowerCase() : 'student'}`}>
                                                {selectedUser.role}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Department</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="department"
                                                value={editFormData.department}
                                                onChange={handleEditChange}
                                                style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-primary)', width: '120px' }}
                                            />
                                        ) : (
                                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{selectedUser.department || 'N/A'}</span>
                                        )}
                                    </div>
                                    {(selectedUser.role === 'STUDENT' || editFormData.role === 'STUDENT') && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Roll/Reg No</span>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="rollNumber"
                                                    value={editFormData.rollNumber}
                                                    onChange={handleEditChange}
                                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-primary)', width: '120px' }}
                                                />
                                            ) : (
                                                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{selectedUser.rollNumber || '-'}</span>
                                            )}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Join Date</span>
                                        <span style={{ color: 'var(--text-primary)' }}>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Data Section */}
                            <div>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '16px' }}>
                                    {activeTab === 'faculty' ? <BookOpen size={20} color="var(--primary)" /> : <GraduationCap size={20} color="var(--primary)" />}
                                    {activeTab === 'faculty' ? 'Teaching Portfolio' : 'Academic Record'}
                                </h3>

                                {detailsLoading ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
                                ) : (
                                    <>
                                        {activeTab === 'faculty' && userDetails?.sections && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {userDetails.sections.length > 0 ? userDetails.sections.map(sec => (
                                                    <div key={sec.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '16px', boxShadow: 'var(--shadow-subtle)' }}>
                                                        <h4 style={{ fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{sec.course?.name}</h4>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            <span style={{ fontFamily: 'monospace' }}>{sec.course?.code}</span>
                                                            <span>{sec.enrollmentCount || 0} Students</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                            <span className="role-badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--primary)', fontSize: '0.65rem' }}>Sem {sec.semester}</span>
                                                            <span className="role-badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--warning)', fontSize: '0.65rem' }}>{sec.year}</span>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                                                        <BookOpen size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                                                        <p>No active courses assigned.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'students' && userDetails?.enrollments && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {userDetails.enrollments.length > 0 ? userDetails.enrollments.map(enroll => (
                                                    <div key={enroll.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '16px' }}>
                                                        <div>
                                                            <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{enroll.section?.course?.name}</p>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '4px' }}>{enroll.section?.course?.code}</p>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold' }}>Enrolled</span>
                                                            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                                {new Date(enroll.enrollmentDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                                                        <GraduationCap size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                                                        <p>Not enrolled in any courses.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDataReports;