import React, { useState, useEffect } from 'react';
import { Search, Plus, SlidersHorizontal, Filter, MoreHorizontal, Phone, Mail, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';
import StudentDetailsModal from '../../components/StudentDetailsModal';

const AdminStudentList = () => {
    // Original State
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const itemsPerPage = 8;

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({
        firebaseUid: '',
        fullName: '',
        email: '',
        password: '', // Only for add
        department: '',
        rollNumber: '',
        semester: '',
        section: '',
        mobileNumber: '',
        address: ''
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/role/STUDENT');
            setStudents(res.data);
        } catch (err) {
            console.error("Failed to fetch students", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const toggleSelectStudent = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(sId => sId !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    const filteredStudents = students.filter(student =>
        (student.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (student.rollNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice(
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openAddModal = () => {
        setModalMode('add');
        setFormData({
            firebaseUid: '',
            fullName: '',
            email: '',
            password: '',
            department: '',
            rollNumber: '',
            semester: '',
            section: '',
            mobileNumber: '',
            address: ''
        });
        setShowModal(true);
    };

    const openEditModal = (student) => {
        console.log("Opening edit modal for:", student);
        setModalMode('edit');
        setFormData({
            ...student,
            password: '' // Ensure password field is reset/empty for editing
        });
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
                    role: 'STUDENT'
                };
                await api.post('/users/create-user', payload);
            } else {
                // Edit
                const payload = { ...data };
                delete payload.password; // Don't send empty password on edit
                delete payload.firebaseUid; // Don't update UID

                // Sanitize numeric fields to prevent backend 400 errors
                const numericFields = ['parentIncome', 'feesDue', 'attendance', 'gpa', 'sgpa', 'cgpa', 'entranceMarksMin', 'entranceMarksMax', 'schoolCutOff200', 'schoolTotalMarks1', 'schoolTotalMarks2', 'schoolTotalMarks3', 'schoolTotalMarks4'];

                Object.keys(payload).forEach(key => {
                    const value = payload[key];
                    if (value && typeof value === 'string') {
                        // Check if it's a known numeric field
                        // OR if it strictly looks like a number with commas (e.g. "3,00,000" or "1,234.56")
                        // The regex checks for potential negative sign, then digits/commas, then optional decimal
                        if (numericFields.includes(key) || /^-?[\d,]+(\.\d+)?$/.test(value)) {
                            // Double check if it actually contains digits to avoid clearing pure comma strings
                            if (/\d/.test(value)) {
                                payload[key] = value.replace(/,/g, '');
                            }
                        }
                    }
                    if (payload[key] === '') {
                        payload[key] = null;
                    }
                });

                await api.put(`/users/${data.firebaseUid}`, payload);
            }
            // Refresh and close
            fetchStudents();
            closeModal();
            alert(modalMode === 'add' ? 'Student added successfully!' : 'Student updated successfully!');
        } catch (error) {
            console.error("Operation failed", error);
            const errorMsg = error.response?.data || error.message || "Unknown error";
            alert(`Failed to save student: ${errorMsg}`);
        }
    };

    const handleDelete = async (uid) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;
        try {
            await api.delete(`/users/${uid}`);
            fetchStudents();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete student.");
        }
    };

    return (
        <div className="student-list-container">
            {/* Header Section */}
            <div className="student-list-header">
                <h2 className="page-title">All Students List</h2>
                <div className="header-actions">
                    <div className="search-bar-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search by ID, Name, or Subject"
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
                                        if (selectedStudents.length === paginatedStudents.length) setSelectedStudents([]);
                                        else setSelectedStudents(paginatedStudents.map(s => s.id));
                                    }}
                                    checked={selectedStudents.length === paginatedStudents.length && paginatedStudents.length > 0}
                                />
                            </th>
                            <th>Student Name</th>
                            <th>Student ID</th>
                            <th>Department</th>
                            <th>Class</th>
                            <th>Phone Number</th>
                            <th>Address</th>
                            <th className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="loading-cell">Loading students...</td>
                            </tr>
                        ) : paginatedStudents.length > 0 ? (
                            paginatedStudents.map((student) => {
                                const isSelected = selectedStudents.includes(student.id);
                                return (
                                    <tr
                                        key={student.id}
                                        className={`student-row ${isSelected ? 'selected' : ''}`}
                                    >
                                        <td className="checkbox-cell">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelectStudent(student.id)}
                                                className="custom-checkbox"
                                            />
                                        </td>
                                        <td>
                                            <div className="student-name-cell">
                                                <div
                                                    className="avatar-circle"
                                                    style={{ backgroundColor: student.profilePictureUrl ? 'transparent' : getAvatarColor(student.fullName) }}
                                                >
                                                    {student.profilePictureUrl ? (
                                                        <img src={student.profilePictureUrl} alt="" className="avatar-img" />
                                                    ) : (
                                                        student.fullName?.charAt(0) || 'S'
                                                    )}
                                                </div>
                                                <div className="name-info">
                                                    <span className="student-name">{student.fullName}</span>
                                                    <span className="student-email">{student.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="font-bold-blue">
                                            #{student.rollNumber || 'N/A'}
                                        </td>
                                        <td className="font-medium-blue">
                                            {student.department || 'General'}
                                        </td>
                                        <td className="font-medium-blue">
                                            {student.semester ? `${student.semester}${student.section ? ' - ' + student.section : ''}` : 'N/A'}
                                        </td>
                                        <td>
                                            <div className="phone-cell">
                                                <span className="phone-icon-circle">
                                                    <Phone size={16} />
                                                </span>
                                                {student.mobileNumber || '(555) 000-0000'}
                                            </div>
                                        </td>
                                        <td className="address-cell">
                                            {student.address || '123 Education Lane, City'}
                                        </td>
                                        <td>
                                            <div className="action-buttons-cell">
                                                <button
                                                    className="icon-action-btn"
                                                    onClick={() => openEditModal(student)}
                                                >
                                                    <Edit size={20} />
                                                </button>
                                                <button
                                                    className="icon-action-btn delete"
                                                    onClick={() => handleDelete(student.firebaseUid)}
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
                                <td colSpan="8" className="loading-cell">No students found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Footer / Pagination */}
                <div className="table-footer">
                    <span className="showing-text">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStudents.length)}-
                        {Math.min(currentPage * itemsPerPage, filteredStudents.length)} from {filteredStudents.length} data
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
                <StudentDetailsModal
                    student={formData}
                    mode={modalMode}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default AdminStudentList;