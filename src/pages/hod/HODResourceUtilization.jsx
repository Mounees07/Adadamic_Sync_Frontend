import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    ArrowLeft, Download, Plus, Pencil, Trash2, X,
    FlaskConical, BarChart2, MonitorPlay, Users,
    Laptop, Wrench, AlertTriangle, CheckCircle, Loader2, RefreshCw
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import './HODResourceUtilization.css';

const STATUS_COLORS = { ACTIVE: '#10B981', MAINTENANCE: '#F59E0B', OFFLINE: '#EF4444' };
const STATUS_LABELS = { ACTIVE: 'Active',   MAINTENANCE: 'Maintenance', OFFLINE: 'Offline'  };
const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B'];

const EMPTY_FORM = {
    name: '', block: '', resourceType: 'LAB', capacity: '',
    systemCount: '', systemsUnderMaintenance: '', occupancyPercent: '',
    status: 'ACTIVE', notes: '', expectedReturnDate: ''
};

// ─── Reusable Modal ───────────────────────────────────────────────────────────
const ResourceModal = ({ mode, resource, onClose, onSave, saving }) => {
    const [form, setForm] = useState(mode === 'edit' && resource ? { ...resource } : { ...EMPTY_FORM });

    const handle = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const submit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{mode === 'edit' ? '✏️ Edit Resource' : '➕ Add New Resource'}</h2>
                    <button className="modal-close-btn" onClick={onClose}><X size={18}/></button>
                </div>
                <form onSubmit={submit} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Name *</label>
                            <input name="name" value={form.name} onChange={handle} required placeholder="e.g., CS Lab 1"/>
                        </div>
                        <div className="form-group">
                            <label>Block / Location</label>
                            <input name="block" value={form.block || ''} onChange={handle} placeholder="e.g., Block A"/>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Type *</label>
                            <select name="resourceType" value={form.resourceType} onChange={handle} required>
                                <option value="LAB">Lab</option>
                                <option value="CLASSROOM">Classroom</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status *</label>
                            <select name="status" value={form.status} onChange={handle} required>
                                <option value="ACTIVE">Active</option>
                                <option value="MAINTENANCE">Under Maintenance</option>
                                <option value="OFFLINE">Offline</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Seating Capacity</label>
                            <input type="number" name="capacity" value={form.capacity || ''} onChange={handle} min="0" placeholder="e.g., 60"/>
                        </div>
                        <div className="form-group">
                            <label>Occupancy % (current)</label>
                            <input type="number" name="occupancyPercent" value={form.occupancyPercent || ''} onChange={handle} min="0" max="100" step="0.1" placeholder="e.g., 72.5"/>
                        </div>
                    </div>
                    {form.resourceType === 'LAB' && (
                        <div className="form-row">
                            <div className="form-group">
                                <label>System Count (PCs/Workstations)</label>
                                <input type="number" name="systemCount" value={form.systemCount || ''} onChange={handle} min="0" placeholder="e.g., 40"/>
                            </div>
                            <div className="form-group">
                                <label>Systems Under Maintenance</label>
                                <input type="number" name="systemsUnderMaintenance" value={form.systemsUnderMaintenance || ''} onChange={handle} min="0" placeholder="e.g., 3"/>
                            </div>
                        </div>
                    )}
                    {(form.status === 'MAINTENANCE' || form.status === 'OFFLINE') && (
                        <div className="form-row">
                            <div className="form-group">
                                <label>Expected Return Date</label>
                                <input type="date" name="expectedReturnDate" value={form.expectedReturnDate || ''} onChange={handle}/>
                            </div>
                            <div className="form-group">
                                <label>Notes / Reason</label>
                                <input name="notes" value={form.notes || ''} onChange={handle} placeholder="e.g., Projector replacement"/>
                            </div>
                        </div>
                    )}
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={16} className="spin"/> : <CheckCircle size={16}/>}
                            {saving ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Add Resource')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ resource, onClose, onConfirm, deleting }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h2>🗑️ Delete Resource</h2>
                <button className="modal-close-btn" onClick={onClose}><X size={18}/></button>
            </div>
            <div style={{ padding: '20px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{resource?.name}</strong>? This action cannot be undone.
            </div>
            <div className="modal-footer">
                <button className="btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn-danger" onClick={onConfirm} disabled={deleting}>
                    {deleting ? <Loader2 size={16} className="spin"/> : <Trash2 size={16}/>}
                    {deleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const HODResourceUtilization = () => {
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();

    const [dept, setDept] = useState(null);
    const [resources, setResources] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Filter state
    const [filterType, setFilterType]   = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [search, setSearch] = useState('');

    // Modal state
    const [showAdd, setShowAdd]   = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);

    // ── Fetch Department ──────────────────────────────────────────────────────
    const resolveDept = useCallback(async () => {
        if (!currentUser) return null;
        let d = userData?.department;
        if (!d) {
            const res = await api.get(`/department/by-hod/${currentUser.uid}`);
            d = res.data.department;
        }
        return d;
    }, [currentUser, userData]);

    // ── Load all data ─────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const d = await resolveDept();
            if (!d) { setLoading(false); return; }
            setDept(d);
            const [resRes, statsRes] = await Promise.all([
                api.get(`/department/resources/${encodeURIComponent(d)}`),
                api.get(`/department/resources/${encodeURIComponent(d)}/stats`)
            ]);
            setResources(resRes.data || []);
            setStats(statsRes.data || {});
        } catch (err) {
            console.error('Failed to load resources', err);
            const ed = err?.response?.data;
            setError(typeof ed === 'object' ? (ed.message || JSON.stringify(ed)) : (ed || err.message));
        } finally {
            setLoading(false);
        }
    }, [resolveDept]);

    useEffect(() => { loadData(); }, [loadData]);

    // ── CRUD handlers ─────────────────────────────────────────────────────────
    const handleSave = async (form) => {
        setSaving(true);
        try {
            const payload = { ...form, department: dept,
                capacity: form.capacity !== '' ? Number(form.capacity) : null,
                systemCount: form.systemCount !== '' ? Number(form.systemCount) : 0,
                systemsUnderMaintenance: form.systemsUnderMaintenance !== '' ? Number(form.systemsUnderMaintenance) : 0,
                occupancyPercent: form.occupancyPercent !== '' ? Number(form.occupancyPercent) : 0,
            };
            if (editItem) {
                await api.put(`/department/resources/${editItem.id}`, payload);
            } else {
                await api.post('/department/resources', payload);
            }
            setShowAdd(false);
            setEditItem(null);
            await loadData();
        } catch (err) {
            alert('Failed to save: ' + (err?.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;
        setDeleting(true);
        try {
            await api.delete(`/department/resources/${deleteItem.id}`);
            setDeleteItem(null);
            await loadData();
        } catch (err) {
            alert('Failed to delete: ' + (err?.response?.data?.message || err.message));
        } finally {
            setDeleting(false);
        }
    };

    // ── Filtered resources ────────────────────────────────────────────────────
    const filtered = resources.filter(r => {
        const matchType   = filterType   === 'ALL' || r.resourceType === filterType;
        const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
        const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
                            (r.block && r.block.toLowerCase().includes(search.toLowerCase()));
        return matchType && matchStatus && matchSearch;
    });

    // ── Chart data ────────────────────────────────────────────────────────────
    const pieData = [
        { name: 'Students', value: stats.studentsOccPct || 0 },
        { name: 'Faculty',  value: stats.facultyOccPct  || 0 },
        { name: 'Others',   value: stats.othersOccPct   || 0 },
    ];

    const barChartData = resources
        .filter(r => r.occupancyPercent != null)
        .slice(0, 10)
        .map(r => ({ name: r.name.length > 10 ? r.name.slice(0, 10) + '…' : r.name,
                     occupancy: r.occupancyPercent,
                     type: r.resourceType }));

    // ─────────────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="resource-utilization-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
            <Loader2 size={24} className="spin" /><span style={{ color: 'var(--text-muted)' }}>Loading resources...</span>
        </div>
    );

    if (error) return (
        <div className="resource-utilization-container">
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '24px', color: '#EF4444', fontSize: '14px' }}>
                <strong>Failed to load:</strong> {error}
            </div>
        </div>
    );

    return (
        <div className="resource-utilization-container">
            {/* Breadcrumb */}
            <div className="resource-breadcrumb">
                <span onClick={() => navigate('/department-analytics')} className="link-back">
                    <ArrowLeft size={14} className="inline-icon"/> Reports
                </span>
                <span className="separator">&gt;</span>
                <span className="current">Resource Utilization</span>
            </div>

            {/* Header */}
            <header className="resource-header">
                <div className="header-titles">
                    <h1>Resource Utilization Overview</h1>
                    <p>Manage and track labs &amp; classrooms — capacity, maintenance, and occupancy.</p>
                    {dept && <span className="dept-tag">Department: <strong>{dept}</strong></span>}
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={loadData}><RefreshCw size={16}/> Refresh</button>
                    <button className="btn-primary" onClick={() => setShowAdd(true)}>
                        <Plus size={16}/> Add Resource
                    </button>
                    <button className="btn-secondary" onClick={() => {
                        const headers = ['Name', 'Type', 'Block', 'Capacity', 'Systems', 'Sys. Maint.', 'Occupancy %', 'Status', 'Notes'];
                        const rows = filtered.map(r => [
                            r.name, r.resourceType, r.block || '', r.capacity ?? '', 
                            r.systemCount ?? '', r.systemsUnderMaintenance ?? '',
                            r.occupancyPercent ?? '', r.status, r.notes || ''
                        ]);
                        const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = `resources_${dept || 'export'}.csv`; a.click();
                        URL.revokeObjectURL(url);
                    }}><Download size={16}/> Export</button>
                </div>
            </header>

            {/* KPI Cards — 4 columns, 2 rows */}
            <div className="kpi-cards-grid-resource">
                <KpiCard title="Total Labs"        value={stats.labCount ?? 0}         icon={<FlaskConical size={18}/>}  sub={`Avg ${stats.avgLabOccupancy ?? 0}% occupancy`} color="blue"/>
                <KpiCard title="Total Classrooms"  value={stats.classroomCount ?? 0}    icon={<MonitorPlay size={18}/>}   sub={`Avg ${stats.avgClassOccupancy ?? 0}% occupancy`} color="purple"/>
                <KpiCard title="Under Maintenance" value={stats.maintenanceCount ?? 0}  icon={<Wrench size={18}/>}        sub="Rooms/Labs in maintenance" color="orange" danger={stats.maintenanceCount > 0}/>
                <KpiCard title="Offline"           value={stats.offlineCount ?? 0}      icon={<AlertTriangle size={18}/>} sub="Rooms/Labs offline"        color="red"    danger={stats.offlineCount > 0}/>
                <KpiCard title="Total Lab Systems" value={stats.totalSystems ?? 0}      icon={<Laptop size={18}/>}        sub={`${stats.totalSystemsMaintenance ?? 0} under maintenance`} color="cyan"/>
                <KpiCard title="Lab Capacity"      value={stats.totalLabCapacity ?? 0}  icon={<BarChart2 size={18}/>}     sub="Total seats across labs"   color="green"/>
                <KpiCard title="Class Capacity"    value={stats.totalClassCapacity ?? 0} icon={<Users size={18}/>}        sub="Total seats across classrooms" color="indigo"/>
                <KpiCard title="Overall Avg Occ."  value={`${stats.overallAvgOccupancy ?? 0}%`} icon={<BarChart2 size={18}/>} sub="Across all resources" color="teal"/>
            </div>

            {/* Charts Row */}
            {resources.length > 0 && (
                <div className="charts-row">
                    {/* Occupancy Bar Chart */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h2>Resource Occupancy (%)</h2>
                            <span className="badge-light">Top 10</span>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)"/>
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} angle={-30} textAnchor="end"/>
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[0,100]}/>
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}/>
                                <Bar dataKey="occupancy" radius={[4,4,0,0]}>
                                    {barChartData.map((e, i) => (
                                        <Cell key={i} fill={e.type === 'LAB' ? '#2563EB' : '#8B5CF6'}/>
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="chart-legend">
                            <span><span className="dot" style={{background:'#2563EB'}}/> Labs</span>
                            <span><span className="dot" style={{background:'#8B5CF6'}}/> Classrooms</span>
                        </div>
                    </div>

                    {/* Who Uses Labs Pie */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h2>Lab Usage Breakdown</h2>
                            <span className="badge-light">This semester</span>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]}/>)}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                                         formatter={(v) => `${v}%`}/>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="chart-legend">
                            {pieData.map((d, i) => (
                                <span key={i}><span className="dot" style={{background:PIE_COLORS[i]}}/> {d.name} ({d.value}%)</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Resource Table with Filters */}
            <div className="resource-table-card">
                <div className="table-card-header">
                    <h2>All Resources <span className="count-badge">{filtered.length}</span></h2>
                    <div className="table-filters">
                        <input className="search-input" placeholder="Search name or block…"
                               value={search} onChange={e => setSearch(e.target.value)}/>
                        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                            <option value="ALL">All Types</option>
                            <option value="LAB">Labs</option>
                            <option value="CLASSROOM">Classrooms</option>
                        </select>
                        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="OFFLINE">Offline</option>
                        </select>
                    </div>
                </div>

                <div className="table-scroll">
                    <table className="resource-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Block</th>
                                <th>Capacity</th>
                                <th>Systems</th>
                                <th>Sys. Maint.</th>
                                <th>Occupancy</th>
                                <th>Status</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="10" className="empty-td">
                                    {resources.length === 0
                                        ? 'No resources added yet. Click "Add Resource" to get started.'
                                        : 'No resources match the current filters.'}
                                </td></tr>
                            ) : filtered.map(r => (
                                <tr key={r.id}>
                                    <td><strong>{r.name}</strong></td>
                                    <td>
                                        <span className={`type-badge ${r.resourceType === 'LAB' ? 'type-lab' : 'type-class'}`}>
                                            {r.resourceType === 'LAB' ? '🔬 Lab' : '🏫 Classroom'}
                                        </span>
                                    </td>
                                    <td>{r.block || '—'}</td>
                                    <td>{r.capacity ?? '—'}</td>
                                    <td>{r.resourceType === 'LAB' ? (r.systemCount ?? '—') : '—'}</td>
                                    <td>
                                        {r.resourceType === 'LAB'
                                            ? <span style={{ color: r.systemsUnderMaintenance > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
                                                {r.systemsUnderMaintenance ?? 0}
                                              </span>
                                            : '—'}
                                    </td>
                                    <td>
                                        <div className="occ-cell">
                                            <div className="mini-bar-bg">
                                                <div className="mini-bar-fill"
                                                     style={{ width: `${r.occupancyPercent ?? 0}%`,
                                                              background: (r.occupancyPercent ?? 0) > 85 ? '#EF4444'
                                                                        : (r.occupancyPercent ?? 0) > 65 ? '#F59E0B' : '#10B981' }}/>
                                            </div>
                                            <span className="occ-pct">{r.occupancyPercent ?? 0}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="status-pill" style={{ background: STATUS_COLORS[r.status] + '22', color: STATUS_COLORS[r.status] }}>
                                            {STATUS_LABELS[r.status] || r.status}
                                        </span>
                                    </td>
                                    <td className="notes-td">{r.notes ? <span title={r.notes}>{r.notes.slice(0,30)}{r.notes.length>30?'…':''}</span> : '—'}</td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="icon-btn edit-btn" title="Edit" onClick={() => setEditItem(r)}>
                                                <Pencil size={14}/>
                                            </button>
                                            <button className="icon-btn del-btn" title="Delete" onClick={() => setDeleteItem(r)}>
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Maintenance Summary Footer */}
                {resources.length > 0 && (
                    <div className="table-footer-summary">
                        <span>📊 {stats.labCount ?? 0} Labs | {stats.classroomCount ?? 0} Classrooms | {stats.maintenanceCount ?? 0} Under Maintenance | {stats.offlineCount ?? 0} Offline</span>
                    </div>
                )}
            </div>

            {/* Modals */}
            {(showAdd || editItem) && (
                <ResourceModal
                    mode={editItem ? 'edit' : 'add'}
                    resource={editItem}
                    onClose={() => { setShowAdd(false); setEditItem(null); }}
                    onSave={handleSave}
                    saving={saving}
                />
            )}
            {deleteItem && (
                <DeleteModal
                    resource={deleteItem}
                    onClose={() => setDeleteItem(null)}
                    onConfirm={handleDelete}
                    deleting={deleting}
                />
            )}
        </div>
    );
};

// ─── KPI Card Component ───────────────────────────────────────────────────────
const KpiCard = ({ title, value, icon, sub, color, danger }) => (
    <div className={`kpi-card-resource ${danger ? 'kpi-danger' : ''}`}>
        <div className="kpi-card-header">
            <span className="kpi-title">{title}</span>
            <span className={`kpi-icon-wrap kpi-icon-${color}`}>{icon}</span>
        </div>
        <div className="kpi-main">
            <span className={`kpi-value ${danger ? 'kpi-value-danger' : ''}`}>{value}</span>
        </div>
        <div className="kpi-subtitle">{sub}</div>
    </div>
);

export default HODResourceUtilization;
