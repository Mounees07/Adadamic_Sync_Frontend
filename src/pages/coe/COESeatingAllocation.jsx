import React, { useState, useEffect, useMemo } from 'react';
import {
    Users,
    Upload,
    Calendar,
    MapPin,
    FileText,
    CheckCircle,
    AlertCircle,
    Download,
    Wand2,
    Grid3X3,
    TableProperties
} from 'lucide-react';
import api from '../../utils/api';
import './COESeatingAllocation.css';

const COESeatingAllocation = () => {
    const [exams, setExams] = useState([]);
    const [allocations, setAllocations] = useState([]);

    const [selectedExam, setSelectedExam] = useState('');
    const [csvFile, setCsvFile] = useState(null);
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [autoAllocating, setAutoAllocating] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedExam) {
            fetchAllocations(selectedExam);
        }
    }, [selectedExam]);

    const fetchInitialData = async () => {
        try {
            const examsRes = await api.get('/schedules'); // We filter for exams

            const examList = (examsRes.data || []).filter(s =>
                s.type === 'INTERNAL_EXAM' || s.type === 'SEMESTER_EXAM'
            );

            setExams(examList);
        } catch (error) {
            console.error("Failed to fetch initial data", error);
        }
    };

    const fetchAllocations = async (examId) => {
        setLoading(true);
        try {
            let res;
            if (examId === 'ALL') {
                res = await api.get('/exam-seating/all');
            } else {
                res = await api.get(`/exam-seating/exam/${examId}`);
            }
            setAllocations(res.data || []);
        } catch (error) {
            console.error("Failed to fetch allocations", error);
            setAllocations([]);
        } finally {
            setLoading(false);
        }
    };

    // ... (downloadTemplate stays same)

    // ... (drag drop stays same)

    // ... (handleFileChange stays same)



    // Actually, I can't easily replace just the check inside handleAllocate without replacing the whole function or using multi-replace.
    // I will use multi-replace to minimize disruption.

    // Let's just update the dropdown and the fetchAllocations logic first.

    // ...

    // Wait, the ReplacementContent above is getting messy. I will use MultiReplace.


    const downloadTemplate = () => {
        const headers = "Roll Number,Department,Venue Name,Seat Number (Optional)";
        const sample = [
            "22CSE001,Computer Science & Engineering,Seminar Hall A,A1",
            "22IT001,Information Technology,Seminar Hall A,A2",
            "22ECE001,Electronics & Communication,Seminar Hall A,A3",
            "22CSE002,Computer Science & Engineering,Seminar Hall A,A4",
            "22IT002,Information Technology,Library Block,",
            "22ECE002,Electronics & Communication,Library Block,"
        ].join("\n");
        const content = headers + "\n" + sample;

        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "seating_allocation_template.csv";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.csv')) {
                setCsvFile(file);
            } else {
                alert("Please upload a CSV file.");
            }
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setCsvFile(e.target.files[0]);
        }
    };

    const handleAllocate = async (e) => {
        e.preventDefault();
        if (!selectedExam || selectedExam === 'ALL' || !csvFile) {
            alert("Please select a specific exam (not 'All') and upload a CSV file.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('examId', selectedExam);
        formData.append('file', csvFile);

        try {
            await api.post('/exam-seating/allocate', formData);
            alert("Seating allocation successful!");
            setCsvFile(null);
            fetchAllocations(selectedExam);
        } catch (error) {
            let errorMsg = "Failed to allocate seats.";
            if (error.response?.data?.message) errorMsg = error.response.data.message;
            else if (typeof error.response?.data === 'string') errorMsg = error.response.data;
            else errorMsg = JSON.stringify(error.response?.data || error.message);
            alert(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    // Auto-allocate: system calculates seats automatically
    const handleAutoAllocate = async () => {
        if (!selectedExam || selectedExam === 'ALL') {
            alert("Please select a specific exam first.");
            return;
        }
        if (!window.confirm(
            "Auto-allocate will assign seats using the alternating dept+section algorithm.\n" +
            "This will REPLACE any existing allocations for this exam.\n\nProceed?"
        )) return;

        setAutoAllocating(true);
        try {
            await api.post(`/exam-seating/auto-allocate?examId=${selectedExam}`);
            alert("✅ Auto-allocation complete! Students are now seated alternately by department and section.");
            fetchAllocations(selectedExam);
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            alert("Auto-allocation failed: " + msg);
        } finally {
            setAutoAllocating(false);
        }
    };

    // Build dept → color map for seat grid
    // Note: @JsonUnwrapped on StudentDetails means dept/rollNumber/section
    // are directly on the student object in the API response.
    const deptColors = useMemo(() => {
        const palette = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#d946ef', '#f97316'];
        const depts = [...new Set(allocations.map(a => a.student?.department || 'UNKNOWN'))];
        const map = {};
        depts.forEach((d, i) => { map[d] = palette[i % palette.length]; });
        return map;
    }, [allocations]);

    // Group allocations by venue for grid view
    const byVenue = useMemo(() => {
        const map = {};
        allocations.forEach(a => {
            const v = a.venue?.name || 'Unknown Venue';
            if (!map[v]) map[v] = [];
            map[v].push(a);
        });
        return map;
    }, [allocations]);

    return (
        <div className="coe-seating-container">
            <div className="seating-header">
                <h1>Seating Allocation</h1>
                <p>Assign examination venues to students via CSV upload or smart auto-allocation</p>
            </div>

            <div className="seating-grid">
                {/* Left Panel: Allocation Form */}
                <div className="allocation-card">
                    <h3><Users size={20} className="text-indigo-500" /> Allocate Seats</h3>

                    <form onSubmit={handleAllocate}>
                        <div className="form-group">
                            <label>Select Examination</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    className="premium-select pl-10"
                                    value={selectedExam}
                                    onChange={(e) => setSelectedExam(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Exam --</option>
                                    <option value="ALL">All Allocations</option>
                                    {exams.map(exam => (
                                        <option key={exam.id} value={exam.id}>
                                            {exam.subjectName || exam.title} ({exam.date ? new Date(exam.date).toLocaleDateString() : 'Date TBD'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Auto-Allocate Button */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <Wand2 size={16} color="#7c3aed" />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Smart Auto-Allocation</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
                                System automatically assigns seats by <strong>alternating departments and sections</strong> — no two adjacent students share the same department or course group.
                            </p>
                            <button
                                type="button"
                                onClick={handleAutoAllocate}
                                disabled={autoAllocating || !selectedExam || selectedExam === 'ALL'}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    cursor: autoAllocating ? 'not-allowed' : 'pointer',
                                    opacity: autoAllocating ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Wand2 size={16} />
                                {autoAllocating ? 'Calculating Seats...' : 'Auto-Allocate Seats'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                            OR UPLOAD CSV MANUALLY
                            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                        </div>

                        <div className="form-group">
                            <div className="flex justify-between items-center mb-2">
                                <label style={{ marginBottom: 0 }}>Upload Allocation CSV</label>
                                <button
                                    type="button"
                                    onClick={downloadTemplate}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                >
                                    <Download size={14} /> Download Template
                                </button>
                            </div>
                            <label
                                className={`file-drop-area ${dragActive ? 'drag-active' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input type="file" hidden accept=".csv" onChange={handleFileChange} />
                                <div className="file-label">
                                    <Upload size={32} className="text-indigo-500 mb-2" />
                                    <span>Click or Drag to upload CSV</span>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '5px' }}>
                                        Format: <code>Roll Number, Venue Name, [Seat No]</code>
                                    </span>
                                </div>
                                {csvFile && (
                                    <div className="file-name animate-fade-in">
                                        <FileText size={14} />
                                        {csvFile.name}
                                    </div>
                                )}
                            </label>
                        </div>

                        <button type="submit" className="btn-allocate" disabled={uploading}>
                            {uploading ? <>Uploading...</> : <><CheckCircle size={20} /> Upload & Allocate</>}
                        </button>
                    </form>
                </div>

                {/* Right Panel: Current Allocations */}
                <div className="allocation-card view-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>
                            <FileText size={20} className="text-emerald-500" />
                            Allocations for {
                                selectedExam === 'ALL'
                                    ? 'All Students'
                                    : (exams.find(e => e.id.toString() === selectedExam)?.subjectName || 'Selected Exam')
                            }
                            {allocations.length > 0 && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '8px' }}>
                                    ({allocations.length} students)
                                </span>
                            )}
                        </h3>
                        {allocations.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    onClick={() => setViewMode('table')}
                                    title="Table View"
                                    style={{
                                        padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                                        background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                                        color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <TableProperties size={14} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    title="Seat Map"
                                    style={{
                                        padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                                        background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                                        color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Grid3X3 size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {!selectedExam ? (
                        <div className="empty-placeholder">
                            <AlertCircle size={48} className="opacity-20 mb-4" />
                            <p>Select an exam to view current allocations</p>
                        </div>
                    ) : loading ? (
                        <div className="text-center py-10">Loading allocations...</div>
                    ) : allocations.length === 0 ? (
                        <div className="empty-placeholder">
                            <Users size={48} className="opacity-20 mb-4" />
                            <p>No students allocated yet.</p>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="allocations-table-container">
                            <table className="clean-table">
                                <thead>
                                    <tr>
                                        <th>Exam</th>
                                        <th>Student Name</th>
                                        <th>Roll No</th>
                                        <th>Dept</th>
                                        <th>Sec</th>
                                        <th>Venue</th>
                                        <th>Seat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allocations.map((alloc, idx) => {
                                        // @JsonUnwrapped: dept, rollNumber, section are
                                        // directly on student, not nested under studentDetails
                                        const dept = alloc.student?.department || '—';
                                        const roll = alloc.student?.rollNumber || '—';
                                        const sec = alloc.student?.section || '—';
                                        const color = deptColors[dept] || '#888';
                                        return (
                                            <tr key={alloc.id || idx}>
                                                <td>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                        {alloc.exam?.subjectName || alloc.exam?.title || 'Unknown'}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                        {alloc.exam?.date ? new Date(alloc.exam.date).toLocaleDateString() : ''}
                                                    </div>
                                                </td>
                                                <td>{alloc.student?.fullName}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600 }}>{roll}</td>
                                                <td>
                                                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: color + '22', color }}>
                                                        {dept}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{sec}</td>
                                                <td>{alloc.venue?.name}</td>
                                                <td>
                                                    <span style={{
                                                        fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem',
                                                        color: alloc.seatNumber?.startsWith('OVF') ? '#ef4444' : 'var(--primary)'
                                                    }}>
                                                        {alloc.seatNumber || 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* SEAT GRID VIEW */
                        <div>
                            {/* Legend */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                {Object.entries(deptColors).map(([dept, color]) => (
                                    <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>{dept}</span>
                                    </div>
                                ))}
                            </div>
                            {Object.entries(byVenue).map(([venueName, seats]) => (
                                <div key={venueName} style={{ marginBottom: '24px' }}>
                                    <div style={{ fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={14} color="#4f46e5" /> {venueName}
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                            ({seats.length} students)
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {seats.sort((a, b) => (a.seatNumber || '').localeCompare(b.seatNumber || '', undefined, { numeric: true })).map((alloc, idx) => {
                                            // @JsonUnwrapped: fields directly on student
                                            const dept = alloc.student?.department || 'UNKNOWN';
                                            const roll = alloc.student?.rollNumber || '';
                                            const sec = alloc.student?.section || 'N/A';
                                            const color = deptColors[dept] || '#888';
                                            return (
                                                <div
                                                    key={idx}
                                                    title={`${alloc.student?.fullName} | ${roll} | ${dept} - Sec ${sec}`}
                                                    style={{
                                                        width: '60px', height: '64px',
                                                        borderRadius: '8px',
                                                        background: color + '22',
                                                        border: `2px solid ${color}`,
                                                        display: 'flex', flexDirection: 'column',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'default',
                                                        transition: 'transform 0.15s',
                                                        padding: '4px'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <span style={{ fontWeight: 800, fontSize: '0.75rem', color }}>{alloc.seatNumber}</span>
                                                    <span style={{ color: 'var(--text-primary)', fontSize: '0.6rem', textAlign: 'center', maxWidth: '56px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                                                        {roll}
                                                    </span>
                                                    <span style={{ color: color, fontSize: '0.55rem', fontWeight: 700, textAlign: 'center', maxWidth: '56px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {dept.split(' ').map(w => w[0]).join('').substring(0, 4)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default COESeatingAllocation;
