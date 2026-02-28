import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Search, ChevronLeft, ChevronRight, Edit, Trash2,
    TrendingUp, TrendingDown, DollarSign, Building2,
    Plus, X, Calendar, Download, MoreHorizontal, RefreshCw
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import './AdminFinance.css';

/* ─────────────────────── CONSTANTS ─────────────────────── */
const MONTHS_FALLBACK = [
    { month: 'Jan', amount: 0 }, { month: 'Feb', amount: 0 },
    { month: 'Mar', amount: 0 }, { month: 'Apr', amount: 0 },
    { month: 'May', amount: 0 }, { month: 'Jun', amount: 0 },
    { month: 'Jul', amount: 0 }, { month: 'Aug', amount: 0 },
    { month: 'Sep', amount: 0 }, { month: 'Oct', amount: 0 },
    { month: 'Nov', amount: 0 }, { month: 'Dec', amount: 0 },
];

const STATUS_CONFIG = {
    Paid: { className: 'status-paid', label: 'Paid' },
    Pending: { className: 'status-pending', label: 'Pending' },
    Overdue: { className: 'status-overdue', label: 'Overdue' },
};

const AVATAR_COLORS = ['#c7d2fe', '#fde68a', '#bbf7d0', '#fecaca', '#e9d5ff', '#bfdbfe'];
const TYPE_COLORS = {
    Salaries: '#6366f1', Infrastructure: '#f59e0b', Utilities: '#06b6d4',
    Equipment: '#10b981', Events: '#ec4899', Library: '#8b5cf6', Other: '#64748b',
};

/* ─────────────────────── HELPERS ─────────────────────── */
const getAvatarColor = name => AVATAR_COLORS[(name?.length || 0) % AVATAR_COLORS.length];
const getInitials = name => (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ─────────────────────── TOOLTIP ─────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div className="fin-chart-tooltip">
                <p className="fin-tooltip-amount">${payload[0].value.toLocaleString()}</p>
                <p className="fin-tooltip-label">{label}</p>
            </div>
        );
    }
    return null;
};

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
const AdminFinance = () => {
    /* ── Data state ── */
    const [fees, setFees] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [students, setStudents] = useState([]);   // All STUDENT users for the dropdown
    const [chartData, setChartData] = useState(MONTHS_FALLBACK);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getBool } = useSettings();
    const exportEnabled = getBool('report.export.enabled', true);
    const emailEnabled = getBool('emailNotifications', true);

    /* ── UI state ── */
    const [activeTab, setActiveTab] = useState('fees');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All Status');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    /* ── Modal state ── */
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editFee, setEditFee] = useState(null);
    const [editExpense, setEditExpense] = useState(null);

    const emptyFeeForm = { studentUid: '', academicYear: '2025-26', semester: '', tuitionFee: '', activitiesFee: '', miscellaneous: '', paymentStatus: 'Pending', paymentDate: '', remarks: '' };
    const emptyExpForm = { category: '', description: '', amount: '', expenseDate: '', expenseType: '', academicYear: '2025-26', recordedBy: '' };

    const [feeForm, setFeeForm] = useState(emptyFeeForm);
    const [expForm, setExpForm] = useState(emptyExpForm);

    /* ── Fetch all data ── */
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [feesRes, expRes, chartRes, studentsRes] = await Promise.all([
                api.get('/finance/fees'),
                api.get('/finance/expenses'),
                api.get('/finance/monthly-chart'),
                api.get('/users/role/STUDENT'),
            ]);
            setFees(feesRes.data || []);
            setExpenses(expRes.data || []);
            setChartData(chartRes.data?.length ? chartRes.data : MONTHS_FALLBACK);
            setStudents(studentsRes.data || []);
        } catch (err) {
            console.error('Finance fetch failed:', err);
            setError('Failed to load finance data. Please check the server.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ── Derived stats ── */
    const totalAmount = useMemo(() => fees.reduce((s, f) => f.paymentStatus === 'Paid' ? s + (f.totalAmount || 0) : s, 0), [fees]);
    const totalTuition = useMemo(() => fees.reduce((s, f) => f.paymentStatus === 'Paid' ? s + (f.tuitionFee || 0) : s, 0), [fees]);
    const totalActivities = useMemo(() => fees.reduce((s, f) => f.paymentStatus === 'Paid' ? s + (f.activitiesFee || 0) : s, 0), [fees]);
    const totalMisc = useMemo(() => fees.reduce((s, f) => f.paymentStatus === 'Paid' ? s + (f.miscellaneous || 0) : s, 0), [fees]);
    const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + (e.amount || 0), 0), [expenses]);

    /* ── Helper to get student display info from a fee record ── */
    const getStudentName = (fee) => fee.student?.fullName || 'Unknown';
    const getStudentId = (fee) => fee.student?.studentDetails?.rollNumber || fee.student?.email || '—';
    const getStudentClass = (fee) => {
        const sd = fee.student?.studentDetails;
        if (!sd) return '—';
        const s = sd.semester ? `Sem ${sd.semester}` : '';
        const sec = sd.section ? ` - ${sd.section}` : '';
        return `${s}${sec}` || '—';
    };

    /* ── Filter & paginate fees ── */
    const filteredFees = useMemo(() => fees.filter(f => {
        const name = getStudentName(f).toLowerCase();
        const id = getStudentId(f).toLowerCase();
        const matchSearch = name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'All Status' || f.paymentStatus === filterStatus;
        return matchSearch && matchStatus;
    }), [fees, searchTerm, filterStatus]);

    const totalPages = Math.ceil(filteredFees.length / itemsPerPage);
    const paginatedFees = filteredFees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    /* ─────── FEE CRUD ─────── */
    const openAddFee = () => {
        setEditFee(null);
        setFeeForm(emptyFeeForm);
        setShowFeeModal(true);
    };

    const openEditFee = (fee) => {
        setEditFee(fee);
        setFeeForm({
            studentUid: fee.student?.firebaseUid || '',
            academicYear: fee.academicYear || '2025-26',
            semester: fee.semester != null ? String(fee.semester) : '',
            tuitionFee: fee.tuitionFee != null ? String(fee.tuitionFee) : '',
            activitiesFee: fee.activitiesFee != null ? String(fee.activitiesFee) : '',
            miscellaneous: fee.miscellaneous != null ? String(fee.miscellaneous) : '',
            paymentStatus: fee.paymentStatus || 'Pending',
            paymentDate: fee.paymentDate || '',
            remarks: fee.remarks || '',
        });
        setShowFeeModal(true);
    };

    const saveFee = async () => {
        try {
            const payload = {
                studentUid: feeForm.studentUid,
                academicYear: feeForm.academicYear,
                semester: feeForm.semester || null,
                tuitionFee: parseFloat(feeForm.tuitionFee) || 0,
                activitiesFee: parseFloat(feeForm.activitiesFee) || 0,
                miscellaneous: parseFloat(feeForm.miscellaneous) || 0,
                paymentStatus: feeForm.paymentStatus,
                paymentDate: feeForm.paymentDate || null,
                remarks: feeForm.remarks || null,
            };
            if (editFee) {
                await api.put(`/finance/fees/${editFee.id}`, payload);
            } else {
                await api.post('/finance/fees', payload);
            }
            setShowFeeModal(false);
            fetchAll();
        } catch (err) {
            alert('Failed to save fee record: ' + (err.response?.data || err.message));
        }
    };

    const deleteFee = async (id) => {
        if (!window.confirm('Delete this fee record?')) return;
        try {
            await api.delete(`/finance/fees/${id}`);
            fetchAll();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    /* ─────── EXPENSE CRUD ─────── */
    const openAddExpense = () => {
        setEditExpense(null);
        setExpForm(emptyExpForm);
        setShowExpenseModal(true);
    };

    const openEditExpense = (exp) => {
        setEditExpense(exp);
        setExpForm({
            category: exp.category || '',
            description: exp.description || '',
            amount: exp.amount != null ? String(exp.amount) : '',
            expenseDate: exp.expenseDate || '',
            expenseType: exp.expenseType || '',
            academicYear: exp.academicYear || '2025-26',
            recordedBy: exp.recordedBy || '',
        });
        setShowExpenseModal(true);
    };

    const saveExpense = async () => {
        try {
            const payload = {
                ...expForm,
                amount: parseFloat(expForm.amount) || 0,
            };
            if (editExpense) {
                await api.put(`/finance/expenses/${editExpense.id}`, payload);
            } else {
                await api.post('/finance/expenses', payload);
            }
            setShowExpenseModal(false);
            fetchAll();
        } catch (err) {
            alert('Failed to save expense: ' + (err.response?.data || err.message));
        }
    };

    const deleteExpense = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await api.delete(`/finance/expenses/${id}`);
            fetchAll();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    /* ─────── RENDER ─────── */
    return (
        <div className="fin-container">
            {/* Page Header */}
            <div className="fin-page-header">
                <div>
                    <h1 className="fin-page-title">Finance</h1>
                    <p className="fin-page-subtitle">Manage fees collection and college expenses</p>
                </div>
                <div className="fin-header-actions">
                    <button className="fin-btn-outline" onClick={fetchAll} title="Refresh">
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button
                        className="fin-btn-outline"
                        onClick={() => exportEnabled ? alert('Generating report…') : null}
                        disabled={!exportEnabled}
                        title={exportEnabled ? 'Export report' : 'Export is disabled by administrator'}
                        style={!exportEnabled ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                    >
                        <Download size={16} /> Export{!exportEnabled && ' (Disabled)'}
                    </button>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="fin-error-banner">
                    ⚠️ {error}
                    <button onClick={fetchAll} className="fin-error-retry">Retry</button>
                </div>
            )}

            {/* ── TOP: Chart + Stat Cards ── */}
            <div className="fin-top-grid">
                <div className="fin-chart-card">
                    <div className="fin-chart-header">
                        <h3 className="fin-section-title">Fees Collection</h3>
                        <button className="fin-more-btn"><MoreHorizontal size={20} /></button>
                    </div>
                    {loading ? (
                        <div className="fin-chart-loading">Loading chart…</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="feeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--glass-border)' }} />
                                <Area type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2.5} fill="url(#feeGradient)" dot={false} activeDot={{ r: 6, fill: '#f59e0b', stroke: 'var(--bg-card)', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="fin-stat-grid">
                    <StatCard label="Total Amount" value={`$${totalAmount.toLocaleString()}`} loading={loading} />
                    <StatCard label="Total Tuition" value={`$${totalTuition.toLocaleString()}`} loading={loading} />
                    <StatCard label="Total Activities" value={`$${totalActivities.toLocaleString()}`} loading={loading} />
                    <StatCard label="Total Miscellaneous" value={`$${totalMisc.toLocaleString()}`} loading={loading} />
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="fin-tabs">
                <button className={`fin-tab ${activeTab === 'fees' ? 'active' : ''}`} onClick={() => setActiveTab('fees')}>
                    <DollarSign size={16} /> Fees Collection
                </button>
                <button className={`fin-tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
                    <Building2 size={16} /> College Expenses
                </button>
            </div>

            {/* ════════ FEES TABLE ════════ */}
            {activeTab === 'fees' && (
                <div className="fin-section-card">
                    <div className="fin-table-header">
                        <h3 className="fin-section-title">Fees Collection</h3>
                        <div className="fin-table-controls">
                            <div className="fin-search-wrap">
                                <Search size={16} className="fin-search-icon" />
                                <input
                                    className="fin-search-input"
                                    placeholder="Search by Name or Roll No."
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                            <div className="fin-filter-wrap">
                                <Calendar size={14} />
                                <select className="fin-select" onChange={() => { }}>
                                    <option>Today</option>
                                    <option>This Week</option>
                                    <option>This Month</option>
                                    <option>This Year</option>
                                </select>
                            </div>
                            <select className="fin-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
                                {['All Status', 'Paid', 'Pending', 'Overdue'].map(s => <option key={s}>{s}</option>)}
                            </select>
                            <button className="fin-add-btn" onClick={openAddFee} title="Add fee record"><Plus size={18} /></button>
                        </div>
                    </div>

                    <div className="fin-table-wrap">
                        <table className="fin-table">
                            <thead>
                                <tr>
                                    <th className="fin-th-check"><input type="checkbox" className="fin-checkbox" /></th>
                                    <th>Student Name</th>
                                    <th>Class / Sem</th>
                                    <th>Tuition Fee</th>
                                    <th>Activities Fee</th>
                                    <th>Miscellaneous</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} className="fin-empty">Loading fee records…</td></tr>
                                ) : paginatedFees.length > 0 ? paginatedFees.map(fee => (
                                    <tr key={fee.id} className="fin-tr">
                                        <td className="fin-th-check"><input type="checkbox" className="fin-checkbox" /></td>
                                        <td>
                                            <div className="fin-name-cell">
                                                <div className="fin-avatar" style={{ backgroundColor: getAvatarColor(getStudentName(fee)) }}>
                                                    <span style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.8rem' }}>{getInitials(getStudentName(fee))}</span>
                                                </div>
                                                <div>
                                                    <p className="fin-student-name">{getStudentName(fee)}</p>
                                                    <p className="fin-student-id">{getStudentId(fee)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="fin-td">{getStudentClass(fee)}</td>
                                        <td className="fin-td">${(fee.tuitionFee || 0).toLocaleString()}</td>
                                        <td className="fin-td">${(fee.activitiesFee || 0).toLocaleString()}</td>
                                        <td className="fin-td">${(fee.miscellaneous || 0).toLocaleString()}</td>
                                        <td className="fin-td fin-amount">${(fee.totalAmount || 0).toLocaleString()}</td>
                                        <td>
                                            <span className={`fin-status-badge ${(STATUS_CONFIG[fee.paymentStatus] || STATUS_CONFIG.Pending).className}`}>
                                                <span className="fin-status-dot" />
                                                {fee.paymentStatus || 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="fin-action-cell">
                                                <button className="fin-icon-btn" onClick={() => openEditFee(fee)}><Edit size={16} /></button>
                                                <button className="fin-icon-btn fin-icon-btn--delete" onClick={() => deleteFee(fee.id)}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={9} className="fin-empty">No fee records found.{' '}
                                        <button className="fin-link-btn" onClick={openAddFee}>Add the first one →</button>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="fin-pagination">
                            <span className="fin-pagn-info">
                                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredFees.length)}–{Math.min(currentPage * itemsPerPage, filteredFees.length)} of {filteredFees.length}
                            </span>
                            <div className="fin-pagn-btns">
                                <button className="fin-pagn-nav" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={`fin-pagn-num ${currentPage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                                ))}
                                <button className="fin-pagn-nav" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ════════ EXPENSES SECTION ════════ */}
            {activeTab === 'expenses' && (
                <div className="fin-section-card">
                    <div className="fin-table-header">
                        <div>
                            <h3 className="fin-section-title">College Expenses</h3>
                            <p className="fin-section-subtitle">Total: <strong>${totalExpenses.toLocaleString()}</strong></p>
                        </div>
                        <div className="fin-table-controls">
                            <button className="fin-add-btn" onClick={openAddExpense} title="Add expense"><Plus size={18} /></button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="fin-empty">Loading expenses…</div>
                    ) : expenses.length > 0 ? (
                        <>
                            <div className="fin-expense-grid">
                                {expenses.map(exp => (
                                    <ExpenseCard key={exp.id} expense={exp}
                                        onEdit={() => openEditExpense(exp)}
                                        onDelete={() => deleteExpense(exp.id)} />
                                ))}
                            </div>

                            {/* Breakdown bars */}
                            <div className="fin-expense-summary">
                                <h4 className="fin-summary-title">Expense Breakdown</h4>
                                {expenses.map(exp => {
                                    const pct = totalExpenses > 0 ? Math.round((exp.amount / totalExpenses) * 100) : 0;
                                    return (
                                        <div key={exp.id} className="fin-breakdown-row">
                                            <span className="fin-breakdown-label">{exp.category}</span>
                                            <div className="fin-breakdown-bar-bg">
                                                <div className="fin-breakdown-bar" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="fin-breakdown-pct">{pct}%</span>
                                            <span className="fin-breakdown-amt">${(exp.amount || 0).toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="fin-empty">
                            No expenses recorded.{' '}
                            <button className="fin-link-btn" onClick={openAddExpense}>Add the first one →</button>
                        </div>
                    )}
                </div>
            )}

            {/* ════════ FEE MODAL ════════ */}
            {showFeeModal && (
                <div className="fin-modal-overlay" onClick={() => setShowFeeModal(false)}>
                    <div className="fin-modal" onClick={e => e.stopPropagation()}>
                        <div className="fin-modal-header">
                            <h3>{editFee ? 'Edit Fee Record' : 'Add Fee Record'}</h3>
                            <button className="fin-modal-close" onClick={() => setShowFeeModal(false)}><X size={20} /></button>
                        </div>
                        <div className="fin-modal-body">
                            <div className="fin-form-group">
                                <label>Student *</label>
                                <select value={feeForm.studentUid} onChange={e => setFeeForm(p => ({ ...p, studentUid: e.target.value }))}>
                                    <option value="">— Select student —</option>
                                    {students.map(s => (
                                        <option key={s.firebaseUid} value={s.firebaseUid}>
                                            {s.fullName} {s.rollNumber ? `(${s.rollNumber})` : `(${s.email})`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="fin-form-row">
                                <div className="fin-form-group">
                                    <label>Academic Year</label>
                                    <input placeholder="e.g. 2025-26" value={feeForm.academicYear} onChange={e => setFeeForm(p => ({ ...p, academicYear: e.target.value }))} />
                                </div>
                                <div className="fin-form-group">
                                    <label>Semester</label>
                                    <input type="number" placeholder="e.g. 4" value={feeForm.semester} onChange={e => setFeeForm(p => ({ ...p, semester: e.target.value }))} />
                                </div>
                                <div className="fin-form-group">
                                    <label>Status</label>
                                    <select value={feeForm.paymentStatus} onChange={e => setFeeForm(p => ({ ...p, paymentStatus: e.target.value }))}>
                                        <option>Pending</option>
                                        <option>Paid</option>
                                        <option>Overdue</option>
                                    </select>
                                </div>
                            </div>
                            <div className="fin-form-row">
                                <div className="fin-form-group">
                                    <label>Tuition Fee (₹)</label>
                                    <input type="number" placeholder="0" value={feeForm.tuitionFee} onChange={e => setFeeForm(p => ({ ...p, tuitionFee: e.target.value }))} />
                                </div>
                                <div className="fin-form-group">
                                    <label>Activities Fee (₹)</label>
                                    <input type="number" placeholder="0" value={feeForm.activitiesFee} onChange={e => setFeeForm(p => ({ ...p, activitiesFee: e.target.value }))} />
                                </div>
                                <div className="fin-form-group">
                                    <label>Miscellaneous (₹)</label>
                                    <input type="number" placeholder="0" value={feeForm.miscellaneous} onChange={e => setFeeForm(p => ({ ...p, miscellaneous: e.target.value }))} />
                                </div>
                            </div>
                            <div className="fin-form-row">
                                <div className="fin-form-group">
                                    <label>Payment Date</label>
                                    <input type="date" value={feeForm.paymentDate} onChange={e => setFeeForm(p => ({ ...p, paymentDate: e.target.value }))} />
                                </div>
                            </div>
                            <div className="fin-form-group">
                                <label>Remarks</label>
                                <input placeholder="Optional notes" value={feeForm.remarks} onChange={e => setFeeForm(p => ({ ...p, remarks: e.target.value }))} />
                            </div>
                        </div>
                        <div className="fin-modal-footer">
                            <button className="fin-btn-outline" onClick={() => setShowFeeModal(false)}>Cancel</button>
                            <button className="fin-btn-primary" onClick={saveFee} disabled={!feeForm.studentUid}>
                                {editFee ? 'Update' : 'Add Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ EXPENSE MODAL ════════ */}
            {showExpenseModal && (
                <div className="fin-modal-overlay" onClick={() => setShowExpenseModal(false)}>
                    <div className="fin-modal" onClick={e => e.stopPropagation()}>
                        <div className="fin-modal-header">
                            <h3>{editExpense ? 'Edit Expense' : 'Add Expense'}</h3>
                            <button className="fin-modal-close" onClick={() => setShowExpenseModal(false)}><X size={20} /></button>
                        </div>
                        <div className="fin-modal-body">
                            <div className="fin-form-row">
                                <div className="fin-form-group">
                                    <label>Category *</label>
                                    <input placeholder="e.g. Staff Salaries" value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))} />
                                </div>
                                <div className="fin-form-group">
                                    <label>Type</label>
                                    <select value={expForm.expenseType} onChange={e => setExpForm(p => ({ ...p, expenseType: e.target.value }))}>
                                        <option value="">— Select —</option>
                                        {['Salaries', 'Infrastructure', 'Utilities', 'Equipment', 'Events', 'Library', 'Other'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="fin-form-group">
                                <label>Description</label>
                                <input placeholder="Brief description" value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} />
                            </div>
                            <div className="fin-form-row">
                                <div className="fin-form-group">
                                    <label>Amount (₹) *</label>
                                    <input type="number" placeholder="0" value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} />
                                </div>
                                <div className="fin-form-group">
                                    <label>Date</label>
                                    <input type="date" value={expForm.expenseDate} onChange={e => setExpForm(p => ({ ...p, expenseDate: e.target.value }))} />
                                </div>
                                <div className="fin-form-group">
                                    <label>Academic Year</label>
                                    <input placeholder="2025-26" value={expForm.academicYear} onChange={e => setExpForm(p => ({ ...p, academicYear: e.target.value }))} />
                                </div>
                            </div>
                            <div className="fin-form-group">
                                <label>Recorded By</label>
                                <input placeholder="Name of admin or finance officer" value={expForm.recordedBy} onChange={e => setExpForm(p => ({ ...p, recordedBy: e.target.value }))} />
                            </div>
                        </div>
                        <div className="fin-modal-footer">
                            <button className="fin-btn-outline" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                            <button className="fin-btn-primary" onClick={saveExpense} disabled={!expForm.category || !expForm.amount}>
                                {editExpense ? 'Update' : 'Add Expense'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────── STAT CARD ─────────────────────── */
const StatCard = ({ label, value, loading }) => (
    <div className="fin-stat-card">
        <div className="fin-stat-trend-badge" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            <TrendingUp size={12} /><span>Live</span>
        </div>
        <p className="fin-stat-value">{loading ? '—' : value}</p>
        <p className="fin-stat-label">{label}</p>
    </div>
);

/* ─────────────────────── EXPENSE CARD ─────────────────────── */
const ExpenseCard = ({ expense, onEdit, onDelete }) => {
    const color = TYPE_COLORS[expense.expenseType] || '#64748b';
    return (
        <div className="fin-expense-card">
            <div className="fin-expense-card-top">
                <div className="fin-expense-icon" style={{ backgroundColor: `${color}20`, color }}>
                    <Building2 size={20} />
                </div>
                <div className="fin-expense-actions">
                    <button className="fin-icon-btn" onClick={onEdit}><Edit size={15} /></button>
                    <button className="fin-icon-btn fin-icon-btn--delete" onClick={onDelete}><Trash2 size={15} /></button>
                </div>
            </div>
            <p className="fin-expense-category">{expense.category}</p>
            <p className="fin-expense-desc">{expense.description || <em style={{ opacity: 0.5 }}>No description</em>}</p>
            <div className="fin-expense-footer">
                <span className="fin-expense-amount">₹{(expense.amount || 0).toLocaleString()}</span>
                {expense.expenseType && (
                    <span className="fin-expense-type" style={{ backgroundColor: `${color}15`, color }}>{expense.expenseType}</span>
                )}
            </div>
            <p className="fin-expense-date">
                {expense.expenseDate
                    ? new Date(expense.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
            </p>
        </div>
    );
};

export default AdminFinance;
