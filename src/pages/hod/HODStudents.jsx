import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Search, Download, Users, BookOpen, GraduationCap, AlertTriangle, ChevronLeft, ChevronRight, MoreVertical, UploadCloud, Plus } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { exportData } from '../../utils/exportUtils';
import { parseSpreadsheetFile, validateImportedRows } from '../../utils/importUtils';
import './HODStudents.css';

const HODStudents = () => {
    const { currentUser, userData } = useAuth();
    const [resolvedDept, setResolvedDept] = useState(null);
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState({ totalStudents: 0, undergraduates: 0, postgraduates: 0, atRisk: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All Students');
    const [currentPage, setCurrentPage] = useState(1);
    const [programFilter, setProgramFilter] = useState('ALL');
    const [yearFilter, setYearFilter] = useState('ALL');
    const [statusMessage, setStatusMessage] = useState(null);
    const [exportFormat, setExportFormat] = useState('csv');
    const [importing, setImporting] = useState(false);
    const importInputRef = useRef(null);
    const itemsPerPage = 6;

    useEffect(() => {
        if (currentUser) {
            fetchStudents();
        }
    }, [currentUser, userData]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            let dept = userData?.department;
            if (!dept && currentUser) {
                const hodRes = await api.get(`/department/by-hod/${currentUser.uid}`);
                dept = hodRes.data.department;
            }
            if (!dept) { setLoading(false); return; }
            setResolvedDept(dept);

            const res = await api.get(`/department/students-directory/${dept}`).catch(() => ({ data: { stats: null, students: [] } }));
            const fetchedData = res.data;
            const fetchedStudents = fetchedData.students || [];

            // Generate mapped array from actual backend data only
            const displayStudents = fetchedStudents.map((s, i) => ({
                id: s.id || i,
                fullName: s.fullName,
                rollNumber: s.rollNumber || '-',
                programName: s.courseName || s.department || 'B.Sc. Computer Science',
                programType: s.branchType || 'Full-time',
                yearName: s.semester ? (s.semester <= 2 ? 'Freshman' : s.semester <= 4 ? 'Sophomore' : s.semester <= 6 ? 'Junior' : 'Senior') : 'Unknown',
                yearLevel: s.semester ? `Year ${Math.ceil(s.semester / 2)}` : '-',
                gpa: s.gpa || s.cgpa || '-',
                status: s.studentStatus || 'Active',
                profilePictureUrl: s.profilePictureUrl
            }));

            setStudents(displayStudents);

            if (fetchedData.stats) {
                setStats(fetchedData.stats);
            } else {
                setStats({
                    totalStudents: 0,
                    undergraduates: 0,
                    postgraduates: 0,
                    atRisk: 0
                });
            }
        } catch (error) {
            console.error("Failed to fetch students data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const filteredStudents = useMemo(() => students.filter(s => {
        const matchesSearch = s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesTab = true;
        if (activeTab === 'Undergraduates') matchesTab = s.programName?.includes('B.Sc');
        if (activeTab === 'Postgraduates') matchesTab = s.programName?.includes('M.Sc') || s.programName?.includes('Ph.D');
        if (activeTab === 'Alumni') matchesTab = s.status === 'Graduated';

        const matchesProg = programFilter === 'ALL' || s.programName?.toLowerCase().includes(programFilter.toLowerCase());
        const matchesYear = yearFilter === 'ALL' || s.yearName === yearFilter;

        return matchesSearch && matchesTab && matchesProg && matchesYear;
    }), [students, searchTerm, activeTab, programFilter, yearFilter]);

    const exportColumns = [
        { header: 'Name', key: 'fullName' },
        { header: 'Roll Number', key: 'rollNumber' },
        { header: 'Program', key: 'programName' },
        { header: 'Year', key: 'yearLevel' },
        { header: 'GPA', key: 'gpa' },
        { header: 'Status', key: 'status' }
    ];

    const handleExport = () => {
        if (filteredStudents.length === 0) {
            setStatusMessage({ type: 'error', text: 'There is no filtered student data to export.' });
            return;
        }

        exportData({
            format: exportFormat,
            fileName: 'students_directory',
            title: 'Students Directory',
            rows: filteredStudents,
            columns: exportColumns,
            sheetName: 'Students'
        });
        setStatusMessage({ type: 'success', text: `Exported ${filteredStudents.length} student record(s) as ${exportFormat.toUpperCase()}.` });
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleImportFile = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setStatusMessage(null);

        try {
            const parsedRows = await parseSpreadsheetFile(file);
            const validRows = validateImportedRows(parsedRows, ['full_name', 'roll_number']);
            const importedStudents = validRows.map((row, index) => ({
                id: `import-${Date.now()}-${index}`,
                fullName: row.full_name,
                rollNumber: row.roll_number,
                programName: row.program_name || row.program || resolvedDept || userData?.department || 'Imported Program',
                programType: row.program_type || 'Imported',
                yearName: row.year_name || row.year || 'Unknown',
                yearLevel: row.year_level || row.year || 'Imported',
                gpa: row.gpa || '-',
                status: row.status || 'Active',
                email: row.email || '',
                profilePictureUrl: ''
            }));

            setStudents((prev) => [...importedStudents, ...prev]);
            setStats((prev) => ({
                ...prev,
                totalStudents: (prev.totalStudents || 0) + importedStudents.length,
                undergraduates: prev.undergraduates || 0,
                postgraduates: prev.postgraduates || 0,
                atRisk: prev.atRisk || 0
            }));
            setCurrentPage(1);
            setStatusMessage({ type: 'success', text: `Imported ${importedStudents.length} student record(s) from ${file.name}.` });
        } catch (error) {
            setStatusMessage({ type: 'error', text: error.message || 'Import failed. Please check the file and try again.' });
        } finally {
            setImporting(false);
            event.target.value = '';
        }
    };

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusClass = (status) => {
        if (status === 'Active') return 'status-active';
        if (status === 'Academic Warning') return 'status-warning';
        return 'status-leave';
    };

    return (
        <div className="hod-students-container-new">

            <div className="students-page-header">
                <div>
                    <h1>Students Directory</h1>
                    <p>Manage and view all enrolled students in the department.</p>
                </div>
                <div className="header-actions">
                    <input
                        ref={importInputRef}
                        type="file"
                        accept=".csv,.xlsx"
                        hidden
                        onChange={handleImportFile}
                    />
                    <button className="import-btn" onClick={handleImportClick} disabled={importing}>
                        <UploadCloud size={16} /> {importing ? 'Importing...' : 'Import'}
                    </button>
                    <button className="add-student-btn">
                        <Plus size={16} /> Add Student
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

            <div className="students-stats-grid">
                <div className="s-stat-card">
                    <div className="s-stat-header">
                        <span className="s-stat-label">Total Students</span>
                        <Users size={18} className="s-stat-icon" />
                    </div>
                    <div className="s-stat-value">{stats.totalStudents || 0}</div>
                    <div className="s-stat-trend positive">↗ +4.2% from last semester</div>
                </div>
                <div className="s-stat-card">
                    <div className="s-stat-header">
                        <span className="s-stat-label">Undergraduates</span>
                        <BookOpen size={18} className="s-stat-icon" />
                    </div>
                    <div className="s-stat-value">{stats.undergraduates || 0}</div>
                    <div className="s-stat-trend positive">↗ +2.5% from last semester</div>
                </div>
                <div className="s-stat-card">
                    <div className="s-stat-header">
                        <span className="s-stat-label">Postgraduates</span>
                        <GraduationCap size={18} className="s-stat-icon" />
                    </div>
                    <div className="s-stat-value">{stats.postgraduates || 0}</div>
                    <div className="s-stat-trend positive">↗ +8.1% from last semester</div>
                </div>
                <div className="s-stat-card">
                    <div className="s-stat-header">
                        <span className="s-stat-label">At-Risk Students</span>
                        <AlertTriangle size={18} className="s-stat-icon" />
                    </div>
                    <div className="s-stat-value">{stats.atRisk || 0}</div>
                    <div className="s-stat-trend negative">↘ -12% from last semester</div>
                </div>
            </div>

            <div className="students-directory-card">
                <div className="directory-tabs">
                    {['All Students', 'Undergraduates', 'Postgraduates', 'Alumni'].map(tab => (
                        <button
                            key={tab}
                            className={`dir-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="directory-toolbar">
                    <div className="directory-search">
                        <Search size={16} className="dir-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, ID or email..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className="directory-filters">
                        <select className="filter-dropdown" style={{ padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
                            value={programFilter} onChange={e => { setProgramFilter(e.target.value); setCurrentPage(1); }}>
                            <option value="ALL">All Programs</option>
                            <option value="B.Sc">Undergraduate (B.Sc)</option>
                            <option value="M.Sc">Postgraduate (M.Sc)</option>
                        </select>
                        <select className="filter-dropdown" style={{ padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
                            value={yearFilter} onChange={e => { setYearFilter(e.target.value); setCurrentPage(1); }}>
                            <option value="ALL">All Years</option>
                            <option value="Freshman">Freshman</option>
                            <option value="Sophomore">Sophomore</option>
                            <option value="Junior">Junior</option>
                            <option value="Senior">Senior</option>
                        </select>
                        <select
                            className="filter-dropdown"
                            style={{ padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value)}
                        >
                            <option value="csv">CSV</option>
                            <option value="xlsx">Excel (XLSX)</option>
                            <option value="pdf">PDF</option>
                        </select>
                        <button className="icon-btn-filter" onClick={handleExport} title={`Export ${exportFormat.toUpperCase()}`}>
                            <Download size={16} />
                        </button>
                    </div>
                </div>

                <div className="directory-table-wrapper">
                    <table className="directory-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Program</th>
                                <th>Year</th>
                                <th>GPA</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-4 text-muted">Loading Directory...</td></tr>
                            ) : paginatedStudents.length > 0 ? (
                                paginatedStudents.map((student, idx) => {
                                    return (
                                        <tr key={student.id || idx}>
                                            <td>
                                                <div className="student-cell">
                                                    <div className="student-avatar">
                                                        {student.profilePictureUrl ? (
                                                            <img src={student.profilePictureUrl} alt="" />
                                                        ) : (
                                                            <span>{student.fullName?.substring(0, 2).toUpperCase() || 'ST'}</span>
                                                        )}
                                                    </div>
                                                    <div className="student-info">
                                                        <span className="student-name">{student.fullName}</span>
                                                        <span className="student-id">{student.rollNumber || 'ID-TBD'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="program-cell">
                                                    <span className="program-name">{student.programName || `${resolvedDept || userData?.department || 'CS'} Dept`}</span>
                                                    <span className="program-type">{student.programType || 'Full-time'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="year-cell">
                                                    <span className="year-name">{student.yearName || 'Unknown'}</span>
                                                    <span className="year-level">{student.yearLevel || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="gpa-cell">{student.gpa || '-'}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(student.status || 'Active')}`}>
                                                    {student.status || 'Active'}
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
                                <tr><td colSpan="6" className="text-center p-4 text-muted">No students found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="directory-footer">
                    <div className="showing-info">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStudents.length)} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} entries
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

export default HODStudents;
