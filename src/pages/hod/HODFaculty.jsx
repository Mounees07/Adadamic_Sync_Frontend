import React, { useMemo, useState, useEffect } from 'react';
import { Search, Download, Users, GraduationCap, Plane, Briefcase, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { exportData } from '../../utils/exportUtils';
import './HODFaculty.css';

const HODFaculty = () => {
    const { currentUser, userData } = useAuth();
    const [faculty, setFaculty] = useState([]);
    const [stats, setStats] = useState({ totalFaculty: 0, onLeave: 0, openPositions: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All Members');
    const [currentPage, setCurrentPage] = useState(1);
    const [exportFormat, setExportFormat] = useState('csv');
    const [statusMessage, setStatusMessage] = useState(null);
    const itemsPerPage = 6;

    useEffect(() => {
        if (currentUser) {
            fetchFaculty();
        }
    }, [currentUser, userData]);

    const fetchFaculty = async () => {
        setLoading(true);
        try {
            let dept = userData?.department;
            if (!dept && currentUser) {
                const hodRes = await api.get(`/department/by-hod/${currentUser.uid}`);
                dept = hodRes.data.department;
            }
            if (!dept) { setLoading(false); return; }

            const [facultyRes, statsRes] = await Promise.all([
                api.get(`/users/faculty/department?department=${dept}`),
                api.get(`/department/dashboard/${dept}`)
            ]);
            setFaculty(facultyRes.data);

            setStats({
                totalFaculty: facultyRes.data.length,
                onLeave: statsRes.data.pendingLeaves || 0,
                openPositions: 2
            });
        } catch (error) {
            console.error("Failed to fetch faculty data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // Filter by search and tab (dummy logic for tabs right now)
    const filteredFaculty = useMemo(() => faculty.filter(f => {
        const matchesSearch = f.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.email?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesTab = true;
        if (activeTab === 'Professors') matchesTab = f.role === 'HOD' || f.role === 'PROFESSOR';
        if (activeTab === 'Assistant/Associate') matchesTab = f.role === 'TEACHER';
        // Add more specific filtering if roles allow

        return matchesSearch && matchesTab;
    }), [faculty, searchTerm, activeTab]);

    const exportColumns = [
        { header: 'Name', key: 'fullName' },
        { header: 'Role', accessor: (row) => row.role === 'HOD' ? 'Head of Department' : row.role === 'PROFESSOR' ? 'Professor' : 'Assistant Professor' },
        { header: 'Department', accessor: (row) => row.department ? `${row.department} Dept` : 'General Faculty' },
        { header: 'Email', key: 'email' },
        { header: 'Phone', accessor: (row) => row.mobileNumber || '' },
        { header: 'Status', accessor: () => 'Active' }
    ];

    const handleExport = () => {
        if (filteredFaculty.length === 0) {
            setStatusMessage({ type: 'error', text: 'There is no visible faculty data to export.' });
            return;
        }

        exportData({
            format: exportFormat,
            fileName: 'faculty_directory',
            title: 'Faculty Directory',
            rows: filteredFaculty,
            columns: exportColumns,
            sheetName: 'Faculty'
        });
        setStatusMessage({ type: 'success', text: `Exported ${filteredFaculty.length} faculty record(s) as ${exportFormat.toUpperCase()}.` });
    };

    const totalPages = Math.ceil(filteredFaculty.length / itemsPerPage) || 1;
    const paginatedFaculty = filteredFaculty.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusClass = (status) => {
        if (status === 'Active') return 'status-active';
        if (status === 'On Leave') return 'status-leave';
        return 'status-sabbatical';
    };

    return (
        <div className="hod-faculty-container-new">

            {/* Top Navigation Strip (Like Dashboard) */}
            <header className="hod-top-nav-shared">
                <div className="search-bar-container-shared">
                    <Search size={18} className="search-icon-shared" />
                    <input type="text" placeholder="Search students, faculty, or courses..." className="hod-search-input-shared" />
                </div>
                <div className="nav-actions-shared">
                    <button className="icon-btn-shared"><Users size={18} /></button>
                </div>
            </header>

            <div className="faculty-page-header">
                <div>
                    <h1>Faculty & Staff Directory</h1>
                    <p>Manage department personnel, academic roles, and availability.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    >
                        <option value="csv">CSV</option>
                        <option value="xlsx">Excel (XLSX)</option>
                        <option value="pdf">PDF</option>
                    </select>
                    <button className="export-csv-btn" onClick={handleExport}>
                        <Download size={16} /> Export Data
                    </button>
                </div>
            </div>

            {statusMessage && (
                <div
                    style={{
                        marginBottom: '16px',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: `1px solid ${statusMessage.type === 'error' ? 'rgba(239,68,68,0.28)' : 'rgba(34,197,94,0.28)'}`,
                        background: statusMessage.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                        color: statusMessage.type === 'error' ? '#b91c1c' : '#166534'
                    }}
                >
                    {statusMessage.text}
                </div>
            )}

            <div className="faculty-stats-grid">
                <div className="f-stat-card">
                    <div className="f-stat-header">
                        <span className="f-stat-label">Total Personnel</span>
                        <Users size={18} className="f-stat-icon" />
                    </div>
                    <div className="f-stat-value">{stats.totalFaculty}</div>
                    <div className="f-stat-trend neutral">All Registered Members</div>
                </div>
                <div className="f-stat-card">
                    <div className="f-stat-header">
                        <span className="f-stat-label">Full-Time Faculty</span>
                        <GraduationCap size={18} className="f-stat-icon" />
                    </div>
                    <div className="f-stat-value">{stats.totalFaculty}</div>
                    <div className="f-stat-trend neutral">— No change</div>
                </div>
                <div className="f-stat-card">
                    <div className="f-stat-header">
                        <span className="f-stat-label">On Leave</span>
                        <Plane size={18} className="f-stat-icon" />
                    </div>
                    <div className="f-stat-value">{stats.onLeave}</div>
                    <div className="f-stat-trend text-muted">Pending leave requests</div>
                </div>
                <div className="f-stat-card">
                    <div className="f-stat-header">
                        <span className="f-stat-label">Open Positions</span>
                        <Briefcase size={18} className="f-stat-icon" />
                    </div>
                    <div className="f-stat-value">{stats.openPositions}</div>
                    <div className="f-stat-trend positive">↗ Actively interviewing</div>
                </div>
            </div>

            <div className="faculty-directory-card">
                <div className="directory-toolbar">
                    <div className="directory-tabs">
                        {['All Members', 'Professors', 'Assistant/Associate', 'Adjunct', 'Staff'].map(tab => (
                            <button
                                key={tab}
                                className={`dir-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="directory-search">
                        <Search size={16} className="dir-search-icon" />
                        <input
                            type="text"
                            placeholder="Search directory..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div className="directory-table-wrapper">
                    <table className="directory-table">
                        <thead>
                            <tr>
                                <th>Personnel</th>
                                <th>Specialization</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center p-4 text-muted">Loading Directory...</td></tr>
                            ) : paginatedFaculty.length > 0 ? (
                                paginatedFaculty.map((member, idx) => {
                                    const roleStr = member.role === 'HOD' ? 'Head of Department' : member.role === 'PROFESSOR' ? 'Professor' : 'Assistant Professor';
                                    const status = 'Active'; // Default since DB doesn't track live presence right now
                                    const specStr = member.department ? member.department + ' Dept' : 'General Faculty';
                                    const phoneStr = member.mobileNumber || 'No Phone Provided';

                                    return (
                                        <tr key={member.id || idx}>
                                            <td>
                                                <div className="personnel-cell">
                                                    <div className="personnel-avatar">
                                                        {member.profilePictureUrl ? (
                                                            <img src={member.profilePictureUrl} alt="" />
                                                        ) : (
                                                            <span>{member.fullName?.substring(0, 2).toUpperCase() || 'FA'}</span>
                                                        )}
                                                    </div>
                                                    <div className="personnel-info">
                                                        <span className="personnel-name">{member.fullName}</span>
                                                        <span className="personnel-role">{roleStr}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="specialization-cell">{specStr}</td>
                                            <td>
                                                <div className="contact-cell">
                                                    <span className="contact-email">{member.email}</span>
                                                    <span className="contact-room">{phoneStr}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(status)}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="action-cell-right">
                                                <button className="more-btn">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="5" className="text-center p-4 text-muted">No members found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="directory-footer">
                    <div className="showing-info">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredFaculty.length)} to {Math.min(currentPage * itemsPerPage, filteredFaculty.length)} of {filteredFaculty.length} entries
                    </div>
                    <div className="pagination-controls">
                        <button
                            className="page-nav-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            className="page-nav-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HODFaculty;
