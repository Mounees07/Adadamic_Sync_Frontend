import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    BarChart3,
    Briefcase,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Download,
    FileSpreadsheet,
    Filter,
    IndianRupee,
    Loader2,
    MapPin,
    Pencil,
    PieChart as PieChartIcon,
    Plus,
    Ribbon,
    Search,
    SlidersHorizontal,
    ShieldCheck,
    Trash2,
    Upload,
    Users
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { exportData } from '../../utils/exportUtils';
import { parseSpreadsheetFile, validateImportedRows } from '../../utils/importUtils';
import './PlacementCoordinatorDashboard.css';

const READINESS_OPTIONS = [
    { value: 'ALL', label: 'All readiness' },
    { value: 'HIGH', label: 'High (75+)' },
    { value: 'MEDIUM', label: 'Medium (50-74)' },
    { value: 'LOW', label: 'Low (<50)' }
];

const PLACEMENT_STATUS_OPTIONS = ['NOT_READY', 'ELIGIBLE', 'PLACED'];
const RESUME_REVIEW_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED'];
const DRIVE_STATUS_OPTIONS = ['PLANNED', 'ACTIVE', 'COMPLETED'];
const COMPANY_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'];
const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6'];
const EXPORT_COLUMNS = [
    { header: 'UID', key: 'uid' },
    { header: 'Name', key: 'name' },
    { header: 'Department', key: 'department' },
    { header: 'Year', key: 'year' },
    { header: 'Readiness Score', key: 'readinessScore' },
    { header: 'Skills Completed', key: 'skillsCompleted' },
    { header: 'Aptitude Score', key: 'aptitudeScore' },
    { header: 'Mock Interview Score', key: 'mockInterviewScore' },
    { header: 'Placement Status', key: 'placementStatus' },
    { header: 'Resume Review', key: 'resumeReviewStatus' }
];

const emptyStudentForm = {
    uid: '',
    aptitudeScore: 0,
    mockInterviewScore: 0,
    skillsCompleted: 0,
    totalSkills: 10,
    completedSkillsList: '',
    placementStatus: 'NOT_READY',
    resumeReviewStatus: 'PENDING',
    resumeRemarks: '',
    preferredRole: '',
    preferredCompanies: ''
};

const emptyCompanyForm = {
    companyName: '',
    industry: '',
    location: '',
    website: '',
    packageOffered: '',
    status: 'ACTIVE',
    notes: ''
};

const emptyDriveForm = {
    companyId: '',
    roleTitle: '',
    driveDate: '',
    location: '',
    eligibilityCriteria: '',
    description: '',
    status: 'PLANNED',
    eligibleStudentUids: [],
    appliedStudentUids: [],
    selectedStudentUids: []
};

const formatScore = (value) => Number.parseFloat(value || 0).toFixed(1);

const getReadinessBand = (score) => {
    const numericScore = Number(score || 0);
    if (numericScore >= 75) return 'HIGH';
    if (numericScore >= 50) return 'MEDIUM';
    return 'LOW';
};

const getSectionFromPath = (pathname) => {
    if (pathname.includes('/students')) return 'students';
    if (pathname.includes('/drives')) return 'drives';
    if (pathname.includes('/analytics')) return 'analytics';
    return 'overview';
};

const getDriveType = (drive) => {
    const roleTitle = String(drive?.roleTitle || '').toLowerCase();
    const description = String(drive?.description || '').toLowerCase();
    const source = `${roleTitle} ${description}`;
    if (source.includes('intern')) return 'INTERNSHIP';
    if (source.includes('contract')) return 'CONTRACT';
    return 'FULL_TIME';
};

const formatDriveType = (type) => {
    switch (type) {
        case 'INTERNSHIP':
            return 'Internship';
        case 'CONTRACT':
            return 'Contract';
        default:
            return 'Full Time';
    }
};

const formatDriveDate = (value) => {
    if (!value) return 'Date to be announced';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const PlacementCoordinatorDashboard = () => {
    const { userData } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const importInputRef = useRef(null);
    const driveFormRef = useRef(null);
    const activeSection = getSectionFromPath(location.pathname);

    const [dashboard, setDashboard] = useState(null);
    const [students, setStudents] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savingStudent, setSavingStudent] = useState(false);
    const [savingCompany, setSavingCompany] = useState(false);
    const [savingDrive, setSavingDrive] = useState(false);
    const [importing, setImporting] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('ALL');
    const [readinessFilter, setReadinessFilter] = useState('ALL');
    const [placementStatusFilter, setPlacementStatusFilter] = useState('ALL');
    const [sortConfig, setSortConfig] = useState({ key: 'readinessScore', direction: 'desc' });
    const [driveSearchTerm, setDriveSearchTerm] = useState('');
    const [driveStatusFilter, setDriveStatusFilter] = useState('ALL');
    const [driveTypeFilter, setDriveTypeFilter] = useState('ALL');
    const [analyticsYear, setAnalyticsYear] = useState('2024-2025');

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentForm, setStudentForm] = useState(emptyStudentForm);

    const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
    const [editingCompanyId, setEditingCompanyId] = useState(null);

    const [driveForm, setDriveForm] = useState(emptyDriveForm);
    const [editingDriveId, setEditingDriveId] = useState(null);

    const canManagePlacement = userData?.role === 'PLACEMENT_COORDINATOR' || userData?.role === 'ADMIN';

    const departmentOptions = useMemo(() => [
        'ALL',
        ...Array.from(new Set(students.map((student) => student.department).filter(Boolean))).sort()
    ], [students]);

    const filteredStudents = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const data = students.filter((student) => {
            const matchesSearch = !normalizedSearch || [
                student.name,
                student.department,
                student.email,
                student.uid,
                student.rollNumber,
                student.completedSkillsList
            ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
            const matchesDepartment = departmentFilter === 'ALL' || student.department === departmentFilter;
            const matchesReadiness = readinessFilter === 'ALL' || getReadinessBand(student.readinessScore) === readinessFilter;
            const matchesPlacementStatus = placementStatusFilter === 'ALL' || student.placementStatus === placementStatusFilter;
            return matchesSearch && matchesDepartment && matchesReadiness && matchesPlacementStatus;
        });

        return [...data].sort((left, right) => {
            const leftValue = left[sortConfig.key];
            const rightValue = right[sortConfig.key];
            if (typeof leftValue === 'number' || typeof rightValue === 'number') {
                const numericLeft = Number(leftValue || 0);
                const numericRight = Number(rightValue || 0);
                return sortConfig.direction === 'asc' ? numericLeft - numericRight : numericRight - numericLeft;
            }
            return sortConfig.direction === 'asc'
                ? String(leftValue || '').localeCompare(String(rightValue || ''))
                : String(rightValue || '').localeCompare(String(leftValue || ''));
        });
    }, [departmentFilter, placementStatusFilter, readinessFilter, searchTerm, sortConfig, students]);

    const skillsDistributionData = useMemo(() => {
        const source = dashboard?.skillsDistribution || {};
        return Object.entries(source).map(([name, value], index) => ({
            name,
            value,
            fill: CHART_COLORS[index % CHART_COLORS.length]
        }));
    }, [dashboard]);

    const placementStatsData = useMemo(() => {
        const source = dashboard?.placementStats || {};
        return Object.entries(source).map(([key, value]) => ({
            name: key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase()),
            value
        }));
    }, [dashboard]);

    const companySelectionsData = useMemo(() => {
        const source = analytics?.companyWiseSelections || {};
        return Object.entries(source).map(([name, value]) => ({ name, value }));
    }, [analytics]);

    const departmentPerformanceData = useMemo(() => {
        const source = analytics?.departmentWisePerformance || {};
        return Object.entries(source).map(([name, value]) => ({ name, value }));
    }, [analytics]);

    const filteredDrives = useMemo(() => {
        const normalizedSearch = driveSearchTerm.trim().toLowerCase();

        return drives.filter((drive) => {
            const driveType = getDriveType(drive);
            const matchesSearch = !normalizedSearch || [
                drive.companyName,
                drive.roleTitle,
                drive.location,
                drive.description
            ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
            const matchesStatus = driveStatusFilter === 'ALL' || String(drive.status || '').toUpperCase() === driveStatusFilter;
            const matchesType = driveTypeFilter === 'ALL' || driveType === driveTypeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [driveSearchTerm, driveStatusFilter, driveTypeFilter, drives]);

    const studentManagementMetrics = useMemo(() => {
        const visibleStudents = filteredStudents;
        const placementReadyCount = visibleStudents.filter((student) => {
            const readiness = Number(student.readinessScore || 0);
            return readiness >= 80 || ['ELIGIBLE', 'PLACED'].includes(student.placementStatus);
        }).length;
        const mockInterviewAttentionCount = visibleStudents.filter(
            (student) => Number(student.mockInterviewScore || 0) < 70
        ).length;
        const averageAptitude = visibleStudents.length
            ? visibleStudents.reduce((sum, student) => sum + Number(student.aptitudeScore || 0), 0) / visibleStudents.length
            : 0;

        return {
            visibleCount: visibleStudents.length,
            placementReadyCount,
            mockInterviewAttentionCount,
            averageAptitude
        };
    }, [filteredStudents]);

    const analyticsSummary = useMemo(() => {
        const packages = drives
            .map((drive) => Number(drive.packageOffered || 0))
            .filter((value) => value > 0);
        const averagePackage = packages.length
            ? packages.reduce((sum, value) => sum + value, 0) / packages.length
            : 0;
        const highestPackage = packages.length ? Math.max(...packages) : 0;
        const highestPackageDrive = drives.find((drive) => Number(drive.packageOffered || 0) === highestPackage);

        return {
            overallPlacement: Number(analytics?.placementPercentage || 0),
            averagePackage,
            highestPackage,
            highestPackageCompany: highestPackageDrive?.companyName || 'No recruiter data'
        };
    }, [analytics, drives]);

    const monthlyHiringTrendData = useMemo(() => {
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const currentYear = new Date().getFullYear();
        const totals = new Map(monthLabels.map((label) => [label, 0]));

        drives.forEach((drive) => {
            const dateValue = drive.driveDate ? new Date(drive.driveDate) : null;
            if (!dateValue || Number.isNaN(dateValue.getTime())) return;
            if (dateValue.getFullYear() !== currentYear && dateValue.getFullYear() !== currentYear - 1) return;
            const label = dateValue.toLocaleDateString('en-US', { month: 'short' });
            if (!totals.has(label)) return;
            totals.set(label, totals.get(label) + Number(drive.selectedCount || drive.appliedCount || 0));
        });

        return monthLabels.map((month, index) => ({
            month,
            offers: totals.get(month) || 0,
            fill: index === 2 ? '#3b82f6' : '#e8eef9'
        }));
    }, [drives]);

    const recruiterBreakdown = useMemo(() => {
        const total = companySelectionsData.reduce((sum, item) => sum + Number(item.value || 0), 0);
        return companySelectionsData.map((item, index) => ({
            ...item,
            percentage: total ? Math.round((Number(item.value || 0) / total) * 100) : 0,
            fill: CHART_COLORS[index % CHART_COLORS.length]
        }));
    }, [companySelectionsData]);

    const departmentPlacementRows = useMemo(() => {
        return departmentPerformanceData.map((item, index) => {
            const eligible = students.filter((student) => student.department === item.name).length || 0;
            const placed = Math.round((Number(item.value || 0) / 100) * eligible);
            const colors = ['#10b981', '#22c55e', '#14b8a6', '#f97316', '#ef4444'];
            return {
                ...item,
                eligible,
                placed,
                fill: colors[index % colors.length]
            };
        });
    }, [departmentPerformanceData, students]);

    const packageDistributionData = useMemo(() => {
        const buckets = [
            { name: '< 5 LPA', min: 0, max: 5 },
            { name: '5-10 LPA', min: 5, max: 10 },
            { name: '10-15 LPA', min: 10, max: 15 },
            { name: '15-20 LPA', min: 15, max: 20 },
            { name: '> 20 LPA', min: 20, max: Number.POSITIVE_INFINITY }
        ];

        return buckets.map((bucket, index) => {
            const count = drives.reduce((sum, drive) => {
                const pkg = Number(drive.packageOffered || 0);
                const inBucket = pkg >= bucket.min && pkg < bucket.max;
                return sum + (inBucket ? Number(drive.selectedCount || drive.appliedCount || 0) : 0);
            }, 0);

            return {
                range: bucket.name,
                students: count,
                fill: index === 1 ? '#3b82f6' : '#e8eef9'
            };
        });
    }, [drives]);

    const fetchPlacementData = async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [dashboardRes, studentsRes, analyticsRes, companiesRes, drivesRes] = await Promise.all([
                api.get('/placement/coordinator/dashboard'),
                api.get('/placement/coordinator/students'),
                api.get('/placement/coordinator/analytics'),
                api.get('/placement/coordinator/companies'),
                api.get('/placement/coordinator/drives')
            ]);

            setDashboard(dashboardRes.data);
            setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
            setAnalytics(analyticsRes.data);
            setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
            setDrives(Array.isArray(drivesRes.data) ? drivesRes.data : []);
        } catch (error) {
            console.error('Failed to fetch placement coordinator data', error);
            setStatusMessage({ type: 'error', text: 'Failed to load placement coordinator data.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (canManagePlacement) {
            fetchPlacementData();
        }
    }, [canManagePlacement]);

    useEffect(() => {
        if (!selectedStudent) {
            setStudentForm(emptyStudentForm);
            return;
        }

        setStudentForm({
            uid: selectedStudent.uid,
            aptitudeScore: selectedStudent.aptitudeScore || 0,
            mockInterviewScore: selectedStudent.mockInterviewScore || 0,
            skillsCompleted: selectedStudent.skillsCompleted || 0,
            totalSkills: selectedStudent.totalSkills || 10,
            completedSkillsList: selectedStudent.completedSkillsList || '',
            placementStatus: selectedStudent.placementStatus || 'NOT_READY',
            resumeReviewStatus: selectedStudent.resumeReviewStatus || 'PENDING',
            resumeRemarks: selectedStudent.resumeRemarks || '',
            preferredRole: selectedStudent.preferredRole || '',
            preferredCompanies: selectedStudent.preferredCompanies || ''
        });
    }, [selectedStudent]);

    const setMessage = (type, text) => {
        setStatusMessage({ type, text });
    };

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleStudentFieldChange = (event) => {
        const { name, value } = event.target;
        setStudentForm((prev) => ({
            ...prev,
            [name]: ['aptitudeScore', 'mockInterviewScore', 'skillsCompleted', 'totalSkills'].includes(name)
                ? Number(value)
                : value
        }));
    };

    const handleSaveStudent = async () => {
        if (!selectedStudent) return;
        setSavingStudent(true);

        try {
            const payload = {
                aptitudeScore: Number(studentForm.aptitudeScore || 0),
                mockInterviewScore: Number(studentForm.mockInterviewScore || 0),
                skillsCompleted: Number(studentForm.skillsCompleted || 0),
                totalSkills: Number(studentForm.totalSkills || 0),
                completedSkillsList: studentForm.completedSkillsList,
                placementStatus: studentForm.placementStatus,
                resumeReviewStatus: studentForm.resumeReviewStatus,
                resumeRemarks: studentForm.resumeRemarks,
                preferredRole: studentForm.preferredRole,
                preferredCompanies: studentForm.preferredCompanies
            };

            const response = await api.put(`/placement/coordinator/students/${selectedStudent.uid}`, payload);
            const updatedStudent = response.data;

            setStudents((prev) => prev.map((student) => student.uid === updatedStudent.uid ? updatedStudent : student));
            setSelectedStudent(updatedStudent);
            setMessage('success', `Updated placement data for ${updatedStudent.name}.`);
            await fetchPlacementData(true);
        } catch (error) {
            console.error('Failed to update placement student', error);
            setMessage('error', 'Failed to update student placement data.');
        } finally {
            setSavingStudent(false);
        }
    };

    const handleExportStudents = (format) => {
        if (filteredStudents.length === 0) {
            setMessage('error', 'There is no visible student data to export.');
            return;
        }

        exportData({
            format,
            fileName: 'placement_students_data',
            title: 'Placement Student Readiness Report',
            rows: filteredStudents,
            columns: EXPORT_COLUMNS,
            sheetName: 'PlacementStudents'
        });
        setMessage('success', `Exported ${filteredStudents.length} student record(s) as ${format.toUpperCase()}.`);
    };

    const handleExportDrives = (format) => {
        if (drives.length === 0) {
            setMessage('error', 'There are no placement drives to export.');
            return;
        }

        exportData({
            format,
            fileName: 'placement_drive_report',
            title: 'Placement Drives Report',
            rows: drives,
            columns: [
                { header: 'Company', key: 'companyName' },
                { header: 'Role', key: 'roleTitle' },
                { header: 'Date', accessor: (row) => row.driveDate || '' },
                { header: 'Status', key: 'status' },
                { header: 'Eligible', key: 'eligibleCount' },
                { header: 'Applied', key: 'appliedCount' },
                { header: 'Selected', key: 'selectedCount' }
            ],
            sheetName: 'PlacementDrives'
        });
        setMessage('success', `Exported ${drives.length} drive record(s) as ${format.toUpperCase()}.`);
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const buildImportPayload = (row) => {
        const payload = {};
        const assignIfPresent = (sourceKey, targetKey = sourceKey) => {
            if (row[sourceKey] !== undefined && String(row[sourceKey]).trim() !== '') {
                payload[targetKey] = row[sourceKey];
            }
        };

        assignIfPresent('aptitude_score', 'aptitudeScore');
        assignIfPresent('mock_interview_score', 'mockInterviewScore');
        assignIfPresent('skills_completed', 'skillsCompleted');
        assignIfPresent('total_skills', 'totalSkills');
        assignIfPresent('placement_status', 'placementStatus');
        assignIfPresent('resume_review_status', 'resumeReviewStatus');
        assignIfPresent('resume_remarks', 'resumeRemarks');
        assignIfPresent('preferred_role', 'preferredRole');
        assignIfPresent('preferred_companies', 'preferredCompanies');

        if (row.completed_skills_list !== undefined) {
            payload.completedSkillsList = row.completed_skills_list;
            if (payload.skillsCompleted === undefined) {
                payload.skillsCompleted = String(row.completed_skills_list)
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .length;
            }
        }

        return payload;
    };

    const handleImportFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setImporting(true);
        try {
            const rows = validateImportedRows(await parseSpreadsheetFile(file), ['uid']);
            let successCount = 0;

            for (const row of rows) {
                const payload = buildImportPayload(row);
                if (Object.keys(payload).length === 0) {
                    continue;
                }
                await api.put(`/placement/coordinator/students/${row.uid}`, payload);
                successCount += 1;
            }

            await fetchPlacementData(true);
            setMessage('success', `Imported placement updates for ${successCount} student record(s).`);
        } catch (error) {
            console.error('Failed to import placement data', error);
            setMessage('error', error.message || 'Failed to import placement data.');
        } finally {
            setImporting(false);
        }
    };

    const handleCompanyFieldChange = (event) => {
        const { name, value } = event.target;
        setCompanyForm((prev) => ({ ...prev, [name]: value }));
    };

    const resetCompanyForm = () => {
        setCompanyForm(emptyCompanyForm);
        setEditingCompanyId(null);
    };

    const handleSaveCompany = async (event) => {
        event.preventDefault();
        setSavingCompany(true);

        try {
            const payload = {
                ...companyForm,
                packageOffered: companyForm.packageOffered === '' ? null : Number(companyForm.packageOffered)
            };
            if (editingCompanyId) {
                await api.put(`/placement/coordinator/companies/${editingCompanyId}`, payload);
            } else {
                await api.post('/placement/coordinator/companies', payload);
            }
            resetCompanyForm();
            await fetchPlacementData(true);
            setMessage('success', 'Company details saved successfully.');
        } catch (error) {
            console.error('Failed to save company', error);
            setMessage('error', 'Failed to save company details.');
        } finally {
            setSavingCompany(false);
        }
    };

    const handleEditCompany = (company) => {
        setEditingCompanyId(company.id);
        setCompanyForm({
            companyName: company.companyName || '',
            industry: company.industry || '',
            location: company.location || '',
            website: company.website || '',
            packageOffered: company.packageOffered ?? '',
            status: company.status || 'ACTIVE',
            notes: company.notes || ''
        });
    };

    const handleDeleteCompany = async (companyId) => {
        if (!window.confirm('Delete this company?')) return;
        try {
            await api.delete(`/placement/coordinator/companies/${companyId}`);
            await fetchPlacementData(true);
            setMessage('success', 'Company deleted successfully.');
        } catch (error) {
            console.error('Failed to delete company', error);
            setMessage('error', 'Failed to delete company.');
        }
    };

    const handleDriveFieldChange = (event) => {
        const { name, value } = event.target;
        setDriveForm((prev) => ({ ...prev, [name]: value }));
    };

    const toggleDriveStudent = (field, uid) => {
        setDriveForm((prev) => {
            const current = new Set(prev[field]);
            if (current.has(uid)) {
                current.delete(uid);
            } else {
                current.add(uid);
            }
            return { ...prev, [field]: Array.from(current) };
        });
    };

    const resetDriveForm = () => {
        setDriveForm(emptyDriveForm);
        setEditingDriveId(null);
    };

    const handleSaveDrive = async (event) => {
        event.preventDefault();
        setSavingDrive(true);

        try {
            const payload = {
                ...driveForm,
                companyId: Number(driveForm.companyId)
            };

            if (editingDriveId) {
                await api.put(`/placement/coordinator/drives/${editingDriveId}`, payload);
            } else {
                await api.post('/placement/coordinator/drives', payload);
            }

            resetDriveForm();
            await fetchPlacementData(true);
            setMessage('success', 'Placement drive saved successfully.');
        } catch (error) {
            console.error('Failed to save drive', error);
            setMessage('error', 'Failed to save placement drive.');
        } finally {
            setSavingDrive(false);
        }
    };

    const handleEditDrive = (drive) => {
        setEditingDriveId(drive.id);
        setDriveForm({
            companyId: drive.companyId || '',
            roleTitle: drive.roleTitle || '',
            driveDate: drive.driveDate || '',
            location: drive.location || '',
            eligibilityCriteria: drive.eligibilityCriteria || '',
            description: drive.description || '',
            status: drive.status || 'PLANNED',
            eligibleStudentUids: (drive.eligibleStudents || []).map((student) => student.uid),
            appliedStudentUids: (drive.appliedStudents || []).map((student) => student.uid),
            selectedStudentUids: (drive.selectedStudents || []).map((student) => student.uid)
        });
    };

    const handleDeleteDrive = async (driveId) => {
        if (!window.confirm('Delete this placement drive?')) return;
        try {
            await api.delete(`/placement/coordinator/drives/${driveId}`);
            await fetchPlacementData(true);
            setMessage('success', 'Placement drive deleted successfully.');
        } catch (error) {
            console.error('Failed to delete drive', error);
            setMessage('error', 'Failed to delete placement drive.');
        }
    };

    const openDriveEditor = (drive = null) => {
        if (drive) {
            handleEditDrive(drive);
        } else {
            resetDriveForm();
        }
        driveFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleViewApplicants = (drive) => {
        setMessage(
            'success',
            `${drive.companyName}: ${drive.appliedCount || 0} applied, ${drive.selectedCount || 0} selected, ${drive.eligibleCount || 0} eligible.`
        );
    };

    if (!canManagePlacement) {
        return (
            <div className="placement-coordinator-page">
                <div className="placement-coordinator-empty">
                    <ShieldCheck size={40} />
                    <h1>Placement Coordinator Access Required</h1>
                    <p>This module is available only to placement coordinators and admins.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="placement-coordinator-page">
                <div className="placement-coordinator-empty">
                    <Loader2 size={36} className="pc-spin" />
                    <p>Loading placement coordinator dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="placement-coordinator-page">
            <input
                ref={importInputRef}
                type="file"
                accept=".csv,.xlsx"
                hidden
                onChange={handleImportFile}
            />

            <div className="placement-coordinator-hero">
                <div>
                    <div className="placement-coordinator-eyebrow">
                        {activeSection === 'students'
                            ? 'Student Operations'
                            : activeSection === 'drives'
                                ? 'Drive Operations'
                                : activeSection === 'analytics'
                                    ? 'Analytics Hub'
                                : 'Placement Operations'}
                    </div>
                    <h1>
                        {activeSection === 'students'
                            ? 'Student Management'
                            : activeSection === 'drives'
                                ? 'Placement Drives'
                                : activeSection === 'analytics'
                                    ? 'Analytics & Insights'
                                : 'Placement Coordinator Dashboard'}
                    </h1>
                    <p>
                        {activeSection === 'students'
                            ? 'Track readiness, review skill progress, and take quick actions across the graduating batch.'
                            : activeSection === 'drives'
                                ? 'Manage active hiring drives, view applicants, and publish new company opportunities.'
                                : activeSection === 'analytics'
                                    ? 'Detailed overview of placement statistics, department performance, and hiring trends.'
                                : 'Monitor readiness, review resumes, and manage company drives from one place.'}
                    </p>
                </div>
                <div className="placement-coordinator-actions">
                    {activeSection === 'students' ? (
                        <>
                            <button className="pc-button pc-button-secondary" onClick={() => handleExportStudents('xlsx')}>
                                <Download size={16} />
                                Export List
                            </button>
                            <button className="pc-button" onClick={handleImportClick} disabled={importing}>
                                {importing ? <Loader2 size={16} className="pc-spin" /> : <Upload size={16} />}
                                Import Scores
                            </button>
                        </>
                    ) : activeSection === 'drives' ? (
                        <>
                            <button className="pc-button pc-button-secondary" onClick={() => handleExportDrives('pdf')}>
                                <Download size={16} />
                                Export Report
                            </button>
                            <button className="pc-button" onClick={() => openDriveEditor()}>
                                <Plus size={16} />
                                Add Drive
                            </button>
                        </>
                    ) : activeSection === 'analytics' ? (
                        <>
                            <label className="pc-select pc-analytics-year-select">
                                <CalendarDays size={16} />
                                <select value={analyticsYear} onChange={(event) => setAnalyticsYear(event.target.value)}>
                                    <option value="2024-2025">2024-2025</option>
                                    <option value="2023-2024">2023-2024</option>
                                    <option value="2022-2023">2022-2023</option>
                                </select>
                            </label>
                            <button className="pc-button" onClick={() => handleExportDrives('pdf')}>
                                <Download size={16} />
                                Export PDF
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="pc-button pc-button-secondary" onClick={() => fetchPlacementData(true)} disabled={refreshing}>
                                {refreshing ? <Loader2 size={16} className="pc-spin" /> : <BarChart3 size={16} />}
                                Refresh
                            </button>
                            <button className="pc-button pc-button-secondary" onClick={handleImportClick} disabled={importing}>
                                {importing ? <Loader2 size={16} className="pc-spin" /> : <Upload size={16} />}
                                Import Scores
                            </button>
                            <button className="pc-button" onClick={() => handleExportStudents('xlsx')}>
                                <Download size={16} />
                                Export Students
                            </button>
                        </>
                    )}
                </div>
            </div>

            {statusMessage && (
                <div className={`pc-status-banner ${statusMessage.type}`}>
                    {statusMessage.text}
                </div>
            )}

            <div className="pc-stats-grid">
                <div
                    className={`pc-stat-card ${activeSection !== 'students' ? 'pc-stat-card-clickable' : ''}`}
                    onClick={activeSection !== 'students' ? () => navigate('/placement-coordinator/students') : undefined}
                    role={activeSection !== 'students' ? 'button' : undefined}
                    tabIndex={activeSection !== 'students' ? 0 : undefined}
                    onKeyDown={activeSection !== 'students' ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            navigate('/placement-coordinator/students');
                        }
                    } : undefined}
                >
                    <span>Total Students</span>
                    <strong>{dashboard?.totalStudents || 0}</strong>
                    <small>Tracked across placement readiness</small>
                </div>
                <div className="pc-stat-card">
                    <span>Eligible Students</span>
                    <strong>{dashboard?.eligibleStudents || 0}</strong>
                    <small>Students ready for active drives</small>
                </div>
                <div className="pc-stat-card">
                    <span>Placed Students</span>
                    <strong>{dashboard?.placedStudents || 0}</strong>
                    <small>Confirmed placement outcomes</small>
                </div>
                <div className="pc-stat-card">
                    <span>Average Readiness</span>
                    <strong>{formatScore(dashboard?.averageReadinessScore || 0)}</strong>
                    <small>Average readiness score across students</small>
                </div>
            </div>

            {activeSection === 'students' ? (
                <div className="pc-student-management-page">
                    <div className="pc-student-management-filters">
                        <label className="pc-search pc-search-wide">
                            <Search size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search by student name, registration number, or skill"
                            />
                        </label>
                        <label className="pc-select">
                            <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                                {departmentOptions.map((department) => (
                                    <option key={department} value={department}>
                                        {department === 'ALL' ? 'Dept: All Departments' : `Dept: ${department}`}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="pc-select">
                            <select value={placementStatusFilter} onChange={(event) => setPlacementStatusFilter(event.target.value)}>
                                <option value="ALL">Status: All</option>
                                {PLACEMENT_STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>Status: {status.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </label>
                        <label className="pc-select">
                            <select value={readinessFilter} onChange={(event) => setReadinessFilter(event.target.value)}>
                                {READINESS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.value === 'ALL' ? 'Score: 60-100' : option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button className="pc-button pc-button-secondary" onClick={() => fetchPlacementData(true)} disabled={refreshing}>
                            {refreshing ? <Loader2 size={16} className="pc-spin" /> : <Filter size={16} />}
                            More Filters
                        </button>
                    </div>

                    <div className="pc-student-summary-grid">
                        <article className="pc-student-summary-card">
                            <span>Students in view</span>
                            <strong>{studentManagementMetrics.visibleCount}</strong>
                            <small>Filtered final-year records</small>
                        </article>
                        <article className="pc-student-summary-card">
                            <span>Placement ready</span>
                            <strong>{studentManagementMetrics.placementReadyCount}</strong>
                            <small>Readiness 80+ or already eligible</small>
                        </article>
                        <article className="pc-student-summary-card">
                            <span>Need mock interview</span>
                            <strong>{studentManagementMetrics.mockInterviewAttentionCount}</strong>
                            <small>Priority outreach this week</small>
                        </article>
                        <article className="pc-student-summary-card">
                            <span>Average aptitude</span>
                            <strong>{Math.round(studentManagementMetrics.averageAptitude)}%</strong>
                            <small>Visible student average</small>
                        </article>
                    </div>

                    <section className="pc-panel pc-student-records-panel">
                        <div className="pc-panel-header">
                            <div>
                                <h2>Student Records</h2>
                                <p>Name, department, year, readiness score, skills, aptitude, and mock interview progress</p>
                            </div>
                            <span className="pc-records-chip">{studentManagementMetrics.visibleCount} active records</span>
                        </div>

                        <div className="pc-table-wrap">
                            <table className="pc-table pc-student-records-table">
                                <thead>
                                    <tr>
                                        <th>
                                            <button type="button" onClick={() => handleSort('name')}>Name</button>
                                        </th>
                                        <th>
                                            <button type="button" onClick={() => handleSort('department')}>Dept</button>
                                        </th>
                                        <th>
                                            <button type="button" onClick={() => handleSort('year')}>Year</button>
                                        </th>
                                        <th>
                                            <button type="button" onClick={() => handleSort('readinessScore')}>Readiness Score</button>
                                        </th>
                                        <th>Skills</th>
                                        <th>Aptitude</th>
                                        <th>Mock Interview</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="pc-empty-table">No students match the current filters.</td>
                                        </tr>
                                    ) : filteredStudents.map((student) => {
                                        const skillList = String(student.completedSkillsList || '')
                                            .split(',')
                                            .map((item) => item.trim())
                                            .filter(Boolean)
                                            .slice(0, 3);

                                        return (
                                            <tr key={student.uid}>
                                                <td>
                                                    <div className="pc-student-cell">
                                                        <span className="pc-avatar">{student.name?.charAt(0) || 'S'}</span>
                                                        <div>
                                                            <strong>{student.name}</strong>
                                                            <small>{student.rollNumber || student.uid}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{student.department || 'N/A'}</td>
                                                <td>{student.year}</td>
                                                <td>
                                                    <span className={`pc-readiness-pill ${getReadinessBand(student.readinessScore).toLowerCase()}`}>
                                                        {Math.round(Number(student.readinessScore || 0))}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="pc-skills-stack">
                                                        {(skillList.length ? skillList : ['No skills']).map((skill) => (
                                                            <span key={`${student.uid}-${skill}`} className="pc-skill-pill">{skill}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="pc-metric-cell">
                                                        <strong>{Math.round(Number(student.aptitudeScore || 0))}%</strong>
                                                        <div className="pc-mini-bar">
                                                            <div style={{ width: `${Math.max(0, Math.min(100, Number(student.aptitudeScore || 0)))}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="pc-metric-cell">
                                                        <strong>{Math.round(Number(student.mockInterviewScore || 0))}%</strong>
                                                        <div className="pc-mini-bar mock">
                                                            <div style={{ width: `${Math.max(0, Math.min(100, Number(student.mockInterviewScore || 0)))}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button className="pc-record-action" onClick={() => setSelectedStudent(student)}>
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            ) : null}

            {activeSection === 'drives' ? (
                <div className="pc-drives-page">
                    <div className="pc-drive-filter-bar">
                        <label className="pc-search pc-search-wide">
                            <Search size={16} />
                            <input
                                type="text"
                                value={driveSearchTerm}
                                onChange={(event) => setDriveSearchTerm(event.target.value)}
                                placeholder="Search companies, roles, or locations"
                            />
                        </label>
                        <label className="pc-select">
                            <select value={driveStatusFilter} onChange={(event) => setDriveStatusFilter(event.target.value)}>
                                <option value="ALL">Status: All</option>
                                {DRIVE_STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        Status: {status.charAt(0) + status.slice(1).toLowerCase()}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="pc-select">
                            <select value={driveTypeFilter} onChange={(event) => setDriveTypeFilter(event.target.value)}>
                                <option value="ALL">Type: All</option>
                                <option value="FULL_TIME">Type: Full Time</option>
                                <option value="INTERNSHIP">Type: Internship</option>
                                <option value="CONTRACT">Type: Contract</option>
                            </select>
                        </label>
                        <button className="pc-button pc-button-secondary" onClick={() => fetchPlacementData(true)} disabled={refreshing}>
                            {refreshing ? <Loader2 size={16} className="pc-spin" /> : <SlidersHorizontal size={16} />}
                            More Filters
                        </button>
                    </div>

                    <div className="pc-drive-card-grid">
                        {filteredDrives.length === 0 ? (
                            <div className="pc-panel pc-empty-inline">No placement drives match the current filters.</div>
                        ) : filteredDrives.map((drive) => {
                            const eligibleCount = Number(drive.eligibleCount || 0);
                            const appliedCount = Number(drive.appliedCount || 0);
                            const progress = eligibleCount > 0
                                ? Math.min(100, Math.round((appliedCount / eligibleCount) * 100))
                                : 0;
                            const driveType = formatDriveType(getDriveType(drive));
                            const statusClass = String(drive.status || 'PLANNED').toLowerCase();

                            return (
                                <article key={drive.id} className="pc-drive-overview-card">
                                    <div className="pc-drive-card-top">
                                        <div className="pc-drive-company">
                                            <span className="pc-drive-company-mark">
                                                {String(drive.companyName || 'D').charAt(0).toUpperCase()}
                                            </span>
                                            <div>
                                                <h3>{drive.companyName}</h3>
                                                <p>{driveType}</p>
                                            </div>
                                        </div>
                                        <span className={`pc-badge ${statusClass}`}>{String(drive.status || 'PLANNED').replace('_', ' ')}</span>
                                    </div>

                                    <div className="pc-drive-card-body">
                                        <div className="pc-drive-meta-grid">
                                            <div className="pc-drive-meta-item">
                                                <Briefcase size={14} />
                                                <span>Role</span>
                                                <strong>{drive.roleTitle || 'Role pending'}</strong>
                                            </div>
                                            <div className="pc-drive-meta-item">
                                                <IndianRupee size={14} />
                                                <span>Package</span>
                                                <strong>{drive.packageOffered ? `${drive.packageOffered} LPA` : 'Not set'}</strong>
                                            </div>
                                            <div className="pc-drive-meta-item">
                                                <CalendarDays size={14} />
                                                <span>Deadline</span>
                                                <strong>{formatDriveDate(drive.driveDate)}</strong>
                                            </div>
                                            <div className="pc-drive-meta-item">
                                                <MapPin size={14} />
                                                <span>Location</span>
                                                <strong>{drive.location || 'Location pending'}</strong>
                                            </div>
                                        </div>

                                        <div className="pc-drive-progress">
                                            <div className="pc-drive-progress-head">
                                                <span>Applicants Processed</span>
                                                <strong>{appliedCount} / {eligibleCount || 0}</strong>
                                            </div>
                                            <div className="pc-mini-bar">
                                                <div style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pc-drive-card-actions">
                                        <button className="pc-button pc-button-secondary" onClick={() => openDriveEditor(drive)}>
                                            Edit Drive
                                        </button>
                                        <button className="pc-button" onClick={() => handleViewApplicants(drive)}>
                                            View Applicants
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    <div ref={driveFormRef} className="pc-section-grid pc-section-grid-bottom">
                        <section className="pc-panel">
                            <div className="pc-panel-header">
                                <div>
                                    <h2>Drive Management</h2>
                                    <p>Create drives, assign eligible students, and track outcomes.</p>
                                </div>
                                <Users size={18} />
                            </div>

                            <form className="pc-form" onSubmit={handleSaveDrive}>
                                <div className="pc-form-grid">
                                    <select name="companyId" value={driveForm.companyId} onChange={handleDriveFieldChange} required>
                                        <option value="">Select company</option>
                                        {companies.map((company) => (
                                            <option key={company.id} value={company.id}>{company.companyName}</option>
                                        ))}
                                    </select>
                                    <input name="roleTitle" value={driveForm.roleTitle} onChange={handleDriveFieldChange} placeholder="Role title" required />
                                    <input name="driveDate" value={driveForm.driveDate} onChange={handleDriveFieldChange} type="date" />
                                    <input name="location" value={driveForm.location} onChange={handleDriveFieldChange} placeholder="Drive location" />
                                    <select name="status" value={driveForm.status} onChange={handleDriveFieldChange}>
                                        {DRIVE_STATUS_OPTIONS.map((status) => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                    <input name="eligibilityCriteria" value={driveForm.eligibilityCriteria} onChange={handleDriveFieldChange} placeholder="Eligibility criteria" />
                                </div>
                                <textarea name="description" value={driveForm.description} onChange={handleDriveFieldChange} placeholder="Drive description" rows="3" />

                                <div className="pc-drive-assignments">
                                    {[
                                        { key: 'eligibleStudentUids', title: 'Eligible Students' },
                                        { key: 'appliedStudentUids', title: 'Applied Students' },
                                        { key: 'selectedStudentUids', title: 'Selected Students' }
                                    ].map((group) => (
                                        <div key={group.key} className="pc-assignment-box">
                                            <h3>{group.title}</h3>
                                            <div className="pc-assignment-list">
                                                {students.map((student) => (
                                                    <label key={`${group.key}-${student.uid}`} className="pc-check-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={driveForm[group.key].includes(student.uid)}
                                                            onChange={() => toggleDriveStudent(group.key, student.uid)}
                                                        />
                                                        <span>{student.name}</span>
                                                        <small>{student.department}</small>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pc-form-actions">
                                    {editingDriveId ? (
                                        <button type="button" className="pc-button pc-button-secondary" onClick={resetDriveForm}>Cancel</button>
                                    ) : null}
                                    <button type="submit" className="pc-button" disabled={savingDrive}>
                                        {savingDrive ? <Loader2 size={16} className="pc-spin" /> : <Plus size={16} />}
                                        {editingDriveId ? 'Update Drive' : 'Create Drive'}
                                    </button>
                                </div>
                            </form>
                        </section>

                        <section className="pc-panel">
                            <div className="pc-panel-header">
                                <div>
                                    <h2>Company Management</h2>
                                    <p>Add, edit, and maintain recruiter records.</p>
                                </div>
                                <Building2 size={18} />
                            </div>

                            <form className="pc-form" onSubmit={handleSaveCompany}>
                                <div className="pc-form-grid">
                                    <input name="companyName" value={companyForm.companyName} onChange={handleCompanyFieldChange} placeholder="Company name" required />
                                    <input name="industry" value={companyForm.industry} onChange={handleCompanyFieldChange} placeholder="Industry" />
                                    <input name="location" value={companyForm.location} onChange={handleCompanyFieldChange} placeholder="Location" />
                                    <input name="website" value={companyForm.website} onChange={handleCompanyFieldChange} placeholder="Website" />
                                    <input name="packageOffered" value={companyForm.packageOffered} onChange={handleCompanyFieldChange} placeholder="Package offered (LPA)" type="number" min="0" step="0.1" />
                                    <select name="status" value={companyForm.status} onChange={handleCompanyFieldChange}>
                                        {COMPANY_STATUS_OPTIONS.map((status) => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <textarea name="notes" value={companyForm.notes} onChange={handleCompanyFieldChange} placeholder="Notes or coordinator remarks" rows="3" />
                                <div className="pc-form-actions">
                                    {editingCompanyId ? (
                                        <button type="button" className="pc-button pc-button-secondary" onClick={resetCompanyForm}>Cancel</button>
                                    ) : null}
                                    <button type="submit" className="pc-button" disabled={savingCompany}>
                                        {savingCompany ? <Loader2 size={16} className="pc-spin" /> : <Plus size={16} />}
                                        {editingCompanyId ? 'Update Company' : 'Add Company'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            ) : null}

            {activeSection === 'analytics' ? (
                <div className="pc-analytics-page">
                    <div className="pc-analytics-summary-grid">
                        <article className="pc-analytics-kpi-card">
                            <div className="pc-analytics-kpi-head">
                                <span>Overall Placement</span>
                                <Clock3 size={18} />
                            </div>
                            <strong>{analyticsSummary.overallPlacement.toFixed(1)}%</strong>
                            <small>+5.2% vs last year</small>
                        </article>
                        <article className="pc-analytics-kpi-card">
                            <div className="pc-analytics-kpi-head">
                                <span>Average Package</span>
                                <IndianRupee size={18} />
                            </div>
                            <strong>{analyticsSummary.averagePackage.toFixed(1)} LPA</strong>
                            <small>+12.5% vs last year</small>
                        </article>
                        <article className="pc-analytics-kpi-card">
                            <div className="pc-analytics-kpi-head">
                                <span>Highest Package</span>
                                <Ribbon size={18} />
                            </div>
                            <strong>{analyticsSummary.highestPackage.toFixed(1)} LPA</strong>
                            <small>Offered by {analyticsSummary.highestPackageCompany}</small>
                        </article>
                    </div>

                    <div className="pc-analytics-top-grid">
                        <section className="pc-panel pc-analytics-chart-panel">
                            <div className="pc-panel-header">
                                <div>
                                    <h2>Monthly Hiring Trends</h2>
                                    <p>Number of students placed per month</p>
                                </div>
                                <label className="pc-select pc-analytics-range-select">
                                    <select defaultValue="Last 6 Months">
                                        <option>Last 6 Months</option>
                                        <option>Last 12 Months</option>
                                    </select>
                                </label>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={monthlyHiringTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="offers" radius={[10, 10, 0, 0]}>
                                        {monthlyHiringTrendData.map((entry) => (
                                            <Cell key={entry.month} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </section>

                        <section className="pc-panel pc-analytics-chart-panel">
                            <div className="pc-panel-header">
                                <div>
                                    <h2>Top Recruiters</h2>
                                    <p>Company-wise hiring breakdown</p>
                                </div>
                            </div>
                            <div className="pc-recruiter-donut-wrap">
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie data={recruiterBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={92}>
                                            {recruiterBreakdown.map((entry) => (
                                                <Cell key={entry.name} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pc-donut-center-text">
                                    <strong>{recruiterBreakdown.reduce((sum, item) => sum + Number(item.value || 0), 0)}</strong>
                                    <span>Offers</span>
                                </div>
                            </div>
                            <div className="pc-recruiter-list">
                                {recruiterBreakdown.map((item) => (
                                    <div key={item.name} className="pc-recruiter-row">
                                        <div className="pc-recruiter-name">
                                            <span className="pc-recruiter-dot" style={{ background: item.fill }} />
                                            <span>{item.name}</span>
                                        </div>
                                        <strong>{item.percentage}% <small>({item.value})</small></strong>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="pc-analytics-bottom-grid">
                        <section className="pc-panel pc-analytics-chart-panel">
                            <div className="pc-panel-header">
                                <div>
                                    <h2>Department-wise Placement</h2>
                                    <p>Percentage of eligible students placed</p>
                                </div>
                            </div>
                            <div className="pc-department-progress-list">
                                {departmentPlacementRows.map((department) => (
                                    <div key={department.name} className="pc-department-progress-row">
                                        <div className="pc-department-progress-head">
                                            <span>{department.name}</span>
                                            <strong>{Number(department.value || 0).toFixed(0)}% <small>({department.placed}/{department.eligible || 0})</small></strong>
                                        </div>
                                        <div className="pc-department-progress-bar">
                                            <div style={{ width: `${Math.max(0, Math.min(100, Number(department.value || 0)))}%`, background: department.fill }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="pc-panel pc-analytics-chart-panel">
                            <div className="pc-panel-header">
                                <div>
                                    <h2>Package Distribution</h2>
                                    <p>Number of students across CTC brackets</p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={packageDistributionData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="students" radius={[10, 10, 0, 0]}>
                                        {packageDistributionData.map((entry) => (
                                            <Cell key={entry.range} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </section>
                    </div>
                </div>
            ) : null}

            {activeSection === 'overview' ? (
            <>
            <div className="pc-section-grid">
                <section className={`pc-panel ${activeSection === 'overview' ? 'highlighted' : ''}`}>
                    <div className="pc-panel-header">
                        <div>
                            <h2>Readiness Distribution</h2>
                            <p>See how students are spread across readiness bands.</p>
                        </div>
                        <PieChartIcon size={18} />
                    </div>
                    <div className="pc-chart-wrap">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={skillsDistributionData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                                    {skillsDistributionData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className={`pc-panel ${activeSection === 'analytics' ? 'highlighted' : ''}`}>
                    <div className="pc-panel-header">
                        <div>
                            <h2>Placement Activity</h2>
                            <p>Track ongoing company and drive activity.</p>
                        </div>
                        <Briefcase size={18} />
                    </div>
                    <div className="pc-chart-wrap">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={placementStatsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#6366f1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>

            <div className="pc-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>Student Management</h2>
                        <p>Search, filter, review resumes, and update readiness details.</p>
                    </div>
                    <div className="pc-panel-actions">
                        <button className="pc-button pc-button-secondary" onClick={() => handleExportStudents('csv')}>
                            <FileSpreadsheet size={16} />
                            CSV
                        </button>
                        <button className="pc-button pc-button-secondary" onClick={() => handleExportStudents('pdf')}>
                            <Download size={16} />
                            PDF
                        </button>
                    </div>
                </div>

                <div className="pc-filter-row">
                    <label className="pc-search">
                        <Search size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by student, department, email, UID..."
                        />
                    </label>
                    <label className="pc-select">
                        <Filter size={16} />
                        <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                            {departmentOptions.map((department) => (
                                <option key={department} value={department}>
                                    {department === 'ALL' ? 'All departments' : department}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="pc-select">
                        <select value={readinessFilter} onChange={(event) => setReadinessFilter(event.target.value)}>
                            {READINESS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>
                    <label className="pc-select">
                        <select value={placementStatusFilter} onChange={(event) => setPlacementStatusFilter(event.target.value)}>
                            <option value="ALL">All statuses</option>
                            {PLACEMENT_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="pc-table-wrap">
                    <table className="pc-table">
                        <thead>
                            <tr>
                                <th>
                                    <button type="button" onClick={() => handleSort('name')}>Name</button>
                                </th>
                                <th>
                                    <button type="button" onClick={() => handleSort('department')}>Dept</button>
                                </th>
                                <th>
                                    <button type="button" onClick={() => handleSort('year')}>Year</button>
                                </th>
                                <th>
                                    <button type="button" onClick={() => handleSort('readinessScore')}>Readiness</button>
                                </th>
                                <th>Skills</th>
                                <th>Aptitude</th>
                                <th>Mock Interview</th>
                                <th>Resume</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="pc-empty-table">No students match the current filters.</td>
                                </tr>
                            ) : filteredStudents.map((student) => (
                                <tr key={student.uid}>
                                    <td>
                                        <div className="pc-student-cell">
                                            <span className="pc-avatar">{student.name?.charAt(0) || 'S'}</span>
                                            <div>
                                                <strong>{student.name}</strong>
                                                <small>{student.email}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{student.department || 'N/A'}</td>
                                    <td>{student.year}</td>
                                    <td>
                                        <div className="pc-score-bar">
                                            <div style={{ width: `${Math.max(0, Math.min(100, Number(student.readinessScore || 0)))}%` }} />
                                            <span>{formatScore(student.readinessScore)}</span>
                                        </div>
                                    </td>
                                    <td>{student.skillsCompleted}/{student.totalSkills}</td>
                                    <td>{formatScore(student.aptitudeScore)}</td>
                                    <td>{formatScore(student.mockInterviewScore)}</td>
                                    <td>
                                        <span className={`pc-badge ${String(student.resumeReviewStatus || 'PENDING').toLowerCase()}`}>
                                            {student.resumeReviewStatus || 'PENDING'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`pc-badge ${String(student.placementStatus || 'NOT_READY').toLowerCase()}`}>
                                            {student.placementStatus || 'NOT_READY'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="pc-icon-button" onClick={() => setSelectedStudent(student)}>
                                            <Pencil size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="pc-section-grid pc-section-grid-bottom">
                <section className="pc-panel">
                    <div className="pc-panel-header">
                        <div>
                            <h2>Company Management</h2>
                            <p>Add, edit, and maintain recruiter records.</p>
                        </div>
                        <Building2 size={18} />
                    </div>

                    <form className="pc-form" onSubmit={handleSaveCompany}>
                        <div className="pc-form-grid">
                            <input name="companyName" value={companyForm.companyName} onChange={handleCompanyFieldChange} placeholder="Company name" required />
                            <input name="industry" value={companyForm.industry} onChange={handleCompanyFieldChange} placeholder="Industry" />
                            <input name="location" value={companyForm.location} onChange={handleCompanyFieldChange} placeholder="Location" />
                            <input name="website" value={companyForm.website} onChange={handleCompanyFieldChange} placeholder="Website" />
                            <input name="packageOffered" value={companyForm.packageOffered} onChange={handleCompanyFieldChange} placeholder="Package offered (LPA)" type="number" min="0" step="0.1" />
                            <select name="status" value={companyForm.status} onChange={handleCompanyFieldChange}>
                                {COMPANY_STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                        <textarea name="notes" value={companyForm.notes} onChange={handleCompanyFieldChange} placeholder="Notes or coordinator remarks" rows="3" />
                        <div className="pc-form-actions">
                            {editingCompanyId ? (
                                <button type="button" className="pc-button pc-button-secondary" onClick={resetCompanyForm}>Cancel</button>
                            ) : null}
                            <button type="submit" className="pc-button" disabled={savingCompany}>
                                {savingCompany ? <Loader2 size={16} className="pc-spin" /> : <Plus size={16} />}
                                {editingCompanyId ? 'Update Company' : 'Add Company'}
                            </button>
                        </div>
                    </form>

                    <div className="pc-list">
                        {companies.length === 0 ? (
                            <div className="pc-empty-inline">No companies added yet.</div>
                        ) : companies.map((company) => (
                            <article key={company.id} className="pc-list-card">
                                <div>
                                    <h3>{company.companyName}</h3>
                                    <p>{company.industry || 'Industry not set'} • {company.location || 'Location not set'}</p>
                                    <small>{company.website || 'No website added'}</small>
                                </div>
                                <div className="pc-list-actions">
                                    <span className={`pc-badge ${String(company.status || 'ACTIVE').toLowerCase()}`}>{company.status || 'ACTIVE'}</span>
                                    <button className="pc-icon-button" onClick={() => handleEditCompany(company)}>
                                        <Pencil size={16} />
                                    </button>
                                    <button className="pc-icon-button danger" onClick={() => handleDeleteCompany(company.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className={`pc-panel ${activeSection === 'drives' ? 'highlighted' : ''}`}>
                    <div className="pc-panel-header">
                        <div>
                            <h2>Drive Management</h2>
                            <p>Create drives, assign eligible students, and track outcomes.</p>
                        </div>
                        <Users size={18} />
                    </div>

                    <form className="pc-form" onSubmit={handleSaveDrive}>
                        <div className="pc-form-grid">
                            <select name="companyId" value={driveForm.companyId} onChange={handleDriveFieldChange} required>
                                <option value="">Select company</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>{company.companyName}</option>
                                ))}
                            </select>
                            <input name="roleTitle" value={driveForm.roleTitle} onChange={handleDriveFieldChange} placeholder="Role title" required />
                            <input name="driveDate" value={driveForm.driveDate} onChange={handleDriveFieldChange} type="date" />
                            <input name="location" value={driveForm.location} onChange={handleDriveFieldChange} placeholder="Drive location" />
                            <select name="status" value={driveForm.status} onChange={handleDriveFieldChange}>
                                {DRIVE_STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <input name="eligibilityCriteria" value={driveForm.eligibilityCriteria} onChange={handleDriveFieldChange} placeholder="Eligibility criteria" />
                        </div>
                        <textarea name="description" value={driveForm.description} onChange={handleDriveFieldChange} placeholder="Drive description" rows="3" />

                        <div className="pc-drive-assignments">
                            {[
                                { key: 'eligibleStudentUids', title: 'Eligible Students' },
                                { key: 'appliedStudentUids', title: 'Applied Students' },
                                { key: 'selectedStudentUids', title: 'Selected Students' }
                            ].map((group) => (
                                <div key={group.key} className="pc-assignment-box">
                                    <h3>{group.title}</h3>
                                    <div className="pc-assignment-list">
                                        {students.map((student) => (
                                            <label key={`${group.key}-${student.uid}`} className="pc-check-row">
                                                <input
                                                    type="checkbox"
                                                    checked={driveForm[group.key].includes(student.uid)}
                                                    onChange={() => toggleDriveStudent(group.key, student.uid)}
                                                />
                                                <span>{student.name}</span>
                                                <small>{student.department}</small>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pc-form-actions">
                            {editingDriveId ? (
                                <button type="button" className="pc-button pc-button-secondary" onClick={resetDriveForm}>Cancel</button>
                            ) : null}
                            <button type="submit" className="pc-button" disabled={savingDrive}>
                                {savingDrive ? <Loader2 size={16} className="pc-spin" /> : <Plus size={16} />}
                                {editingDriveId ? 'Update Drive' : 'Create Drive'}
                            </button>
                        </div>
                    </form>

                    <div className="pc-list">
                        {drives.length === 0 ? (
                            <div className="pc-empty-inline">No placement drives scheduled yet.</div>
                        ) : drives.map((drive) => (
                            <article key={drive.id} className="pc-list-card pc-drive-card">
                                <div>
                                    <h3>{drive.companyName} • {drive.roleTitle}</h3>
                                    <p>{drive.location || 'Location pending'} • {drive.driveDate || 'Date not fixed'}</p>
                                    <small>Eligible {drive.eligibleCount} • Applied {drive.appliedCount} • Selected {drive.selectedCount}</small>
                                </div>
                                <div className="pc-list-actions">
                                    <span className={`pc-badge ${String(drive.status || 'PLANNED').toLowerCase()}`}>{drive.status || 'PLANNED'}</span>
                                    <button className="pc-icon-button" onClick={() => handleEditDrive(drive)}>
                                        <Pencil size={16} />
                                    </button>
                                    <button className="pc-icon-button danger" onClick={() => handleDeleteDrive(drive.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="pc-panel-actions">
                        <button className="pc-button pc-button-secondary" onClick={() => handleExportDrives('csv')}>
                            <Download size={16} />
                            Export Drives
                        </button>
                    </div>
                </section>
            </div>

            <div className={`pc-panel ${activeSection === 'analytics' ? 'highlighted' : ''}`}>
                <div className="pc-panel-header">
                    <div>
                        <h2>Placement Analytics</h2>
                        <p>Compare department performance and company-wise selections.</p>
                    </div>
                    <CheckCircle2 size={18} />
                </div>

                <div className="pc-section-grid">
                    <div className="pc-chart-wrap">
                        <div className="pc-chart-summary">
                            <strong>{formatScore(analytics?.placementPercentage || 0)}%</strong>
                            <span>Overall placement percentage</span>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={departmentPerformanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#22c55e" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="pc-chart-wrap">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={companySelectionsData} dataKey="value" nameKey="name" outerRadius={90}>
                                    {companySelectionsData.map((entry, index) => (
                                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            </>
            ) : null}

            {selectedStudent ? (
                <div className="pc-modal-backdrop" onClick={() => setSelectedStudent(null)}>
                    <div className="pc-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="pc-panel-header">
                            <div>
                                <h2>{selectedStudent.name}</h2>
                                <p>{selectedStudent.department} • Year {selectedStudent.year} • {selectedStudent.uid}</p>
                            </div>
                            <button className="pc-icon-button" onClick={() => setSelectedStudent(null)}>×</button>
                        </div>

                        <div className="pc-form-grid">
                            <input name="aptitudeScore" type="number" min="0" max="100" value={studentForm.aptitudeScore} onChange={handleStudentFieldChange} placeholder="Aptitude score" />
                            <input name="mockInterviewScore" type="number" min="0" max="100" value={studentForm.mockInterviewScore} onChange={handleStudentFieldChange} placeholder="Mock interview score" />
                            <input name="skillsCompleted" type="number" min="0" value={studentForm.skillsCompleted} onChange={handleStudentFieldChange} placeholder="Skills completed" />
                            <input name="totalSkills" type="number" min="1" value={studentForm.totalSkills} onChange={handleStudentFieldChange} placeholder="Total skills" />
                            <select name="placementStatus" value={studentForm.placementStatus} onChange={handleStudentFieldChange}>
                                {PLACEMENT_STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <select name="resumeReviewStatus" value={studentForm.resumeReviewStatus} onChange={handleStudentFieldChange}>
                                {RESUME_REVIEW_OPTIONS.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <input name="preferredRole" value={studentForm.preferredRole} onChange={handleStudentFieldChange} placeholder="Preferred role" />
                            <input name="preferredCompanies" value={studentForm.preferredCompanies} onChange={handleStudentFieldChange} placeholder="Preferred companies" />
                        </div>

                        <textarea
                            name="completedSkillsList"
                            rows="3"
                            value={studentForm.completedSkillsList}
                            onChange={handleStudentFieldChange}
                            placeholder="Completed skills list (comma separated)"
                        />
                        <textarea
                            name="resumeRemarks"
                            rows="3"
                            value={studentForm.resumeRemarks}
                            onChange={handleStudentFieldChange}
                            placeholder="Resume feedback or coordinator remarks"
                        />

                        <div className="pc-modal-footer">
                            {selectedStudent.resumeUrl ? (
                                <a className="pc-button pc-button-secondary" href={selectedStudent.resumeUrl} target="_blank" rel="noreferrer">
                                    View Resume
                                </a>
                            ) : (
                                <span className="pc-muted">Resume link not uploaded yet.</span>
                            )}
                            <button className="pc-button" onClick={handleSaveStudent} disabled={savingStudent}>
                                {savingStudent ? <Loader2 size={16} className="pc-spin" /> : <CheckCircle2 size={16} />}
                                Save Updates
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default PlacementCoordinatorDashboard;
