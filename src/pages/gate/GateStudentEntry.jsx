import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import {
    Search, UserCheck, AlertCircle, Clock, CheckCircle,
    Calendar, ChevronLeft, ChevronRight, Users, LogOut, LogIn, RefreshCw, X
} from 'lucide-react';
import './GateStudentEntry.css';

/* ─────────────────── helpers ─────────────────── */
const fmt = (dateStr) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtTime = (dtStr) =>
    new Date(dtStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const dateToISO = (d) => d.toISOString().split('T')[0];

const leaveStatus = (l) => {
    if (l.actualExitTime && !l.actualReturnTime) return 'out';
    if (l.actualExitTime && l.actualReturnTime) return 'returned';
    return 'pending';
};

const STATUS_META = {
    out: { label: 'OUTSIDE CAMPUS', color: '#ef4444', bg: 'rgba(239,68,68,0.13)', border: 'rgba(239,68,68,0.3)', pulse: true },
    returned: { label: 'RETURNED', color: '#10b981', bg: 'rgba(16,185,129,0.13)', border: 'rgba(16,185,129,0.3)', pulse: false },
    pending: { label: 'NOT YET EXITED', color: '#818cf8', bg: 'rgba(129,140,248,0.13)', border: 'rgba(129,140,248,0.3)', pulse: false },
};

/* ── StatusChip ── */
const StatusChip = ({ status }) => {
    const m = STATUS_META[status];
    return (
        <span className="ge-chip" style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
            <span style={{
                width: 7, height: 7, borderRadius: '50%', background: m.color,
                display: 'inline-block', flexShrink: 0,
                animation: m.pulse ? 'ge-pulse 1.3s infinite' : 'none'
            }} />
            {m.label}
        </span>
    );
};

/* ══════════════════ MAIN COMPONENT ══════════════════ */
const GateStudentEntry = () => {

    // ── calendar date state ──
    const [selectedDate, setSelectedDate] = useState(dateToISO(new Date()));

    // ── search query state ──
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // ── action state ──
    const [actionError, setActionError] = useState(null);

    // ── status filter ──
    const [statusFilter, setStatusFilter] = useState('all');

    // debounce timer ref
    const debounceRef = useRef(null);

    const hasQuery = query.trim().length > 0;

    /* ── debounced search ── */
    const doSearch = useCallback(async (q) => {
        if (!q.trim()) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        setSearchError(null);
        setActionError(null);
        try {
            const res = await api.get(`/leaves/security/search?query=${encodeURIComponent(q.trim())}`);
            setSearchResults(res.data);
        } catch {
            setSearchError('Search failed. Please try again.');
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (!hasQuery) {
            setSearchResults([]);
            setSearchError(null);
            return;
        }
        debounceRef.current = setTimeout(() => doSearch(query), 380);
        return () => clearTimeout(debounceRef.current);
    }, [query, hasQuery, doSearch]);

    /* ── mark exit / return ── */
    const handleAction = async (leaveId, action) => {
        setActionError(null);
        try {
            await api.post(`/leaves/security/${leaveId}/action?action=${action}`);
            // re-fetch search results to refresh statuses
            await doSearch(query);
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to update. Please retry.');
        }
    };

    /* ── date navigation ── */
    const shiftDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(dateToISO(d));
    };

    /* ── derived filtered list ── */
    const filtered = searchResults.filter(l =>
        statusFilter === 'all' || leaveStatus(l) === statusFilter
    );

    const counts = {
        all: searchResults.length,
        out: searchResults.filter(l => leaveStatus(l) === 'out').length,
        pending: searchResults.filter(l => leaveStatus(l) === 'pending').length,
        returned: searchResults.filter(l => leaveStatus(l) === 'returned').length,
    };

    const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const isToday = selectedDate === dateToISO(new Date());

    /* ════════════════ RENDER ════════════════ */
    return (
        <div className="ge-wrap">

            {/* ── Page Title ── */}
            <div className="ge-head">
                <h1>Gate Security Control</h1>
                <p>Search students by roll number or name to view and manage their leave</p>
            </div>

            {/* ── Main Card ── */}
            <div className="ge-card">

                {/* ── Top Bar ── */}
                <div className="ge-topbar">

                    {/* Date navigation (context indicator) */}
                    <div className="ge-date-area">
                        <button className="ge-icon-btn" onClick={() => shiftDate(-1)} title="Previous Day">
                            <ChevronLeft size={18} />
                        </button>
                        <div className="ge-date-picker-wrap">
                            <Calendar size={15} className="ge-date-cal-icon" />
                            <input
                                type="date"
                                className="ge-date-input"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                        <div className="ge-date-label-wrap">
                            <span className="ge-date-label">{displayDate}</span>
                            {isToday && <span className="ge-today-badge">Today</span>}
                        </div>
                        <button className="ge-icon-btn" onClick={() => shiftDate(1)} title="Next Day">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Search box */}
                    <div className="ge-search-area">
                        {searchLoading
                            ? <div className="ge-search-spinner" />
                            : <Search size={16} className="ge-search-icon" />
                        }
                        <input
                            type="text"
                            className="ge-search-input"
                            placeholder="Search by roll number or student name…"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setStatusFilter('all'); }}
                            autoFocus
                        />
                        {query && (
                            <button className="ge-clear-btn" onClick={() => { setQuery(''); setStatusFilter('all'); }} title="Clear">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Status Filter Chips — only shown when results exist ── */}
                {hasQuery && (
                    <div className="ge-filter-row">
                        {[
                            { key: 'all', label: 'All', icon: <Users size={13} />, color: '#818cf8' },
                            { key: 'out', label: 'Outside Campus', icon: <LogOut size={13} />, color: '#ef4444' },
                            { key: 'pending', label: 'Not Exited', icon: <Clock size={13} />, color: '#818cf8' },
                            { key: 'returned', label: 'Returned', icon: <CheckCircle size={13} />, color: '#10b981' },
                        ].map(({ key, label, icon, color }) => (
                            <button
                                key={key}
                                className={`ge-filter-chip ${statusFilter === key ? 'active' : ''}`}
                                style={statusFilter === key ? { color, borderColor: color, background: `${color}18` } : {}}
                                onClick={() => setStatusFilter(key)}
                            >
                                {icon}
                                {label}
                                <span className="ge-count">{counts[key] ?? 0}</span>
                            </button>
                        ))}

                        <span className="ge-result-count">
                            {filtered.length > 0
                                ? <>Found <strong>{filtered.length}</strong> leave{filtered.length !== 1 ? 's' : ''}</>
                                : 'No results'}
                        </span>
                    </div>
                )}

                {/* ── Errors ── */}
                {(searchError || actionError) && (
                    <div className="ge-banner ge-banner-error">
                        <AlertCircle size={16} /> {searchError || actionError}
                    </div>
                )}

                {/* ── Loading ── */}
                {searchLoading && (
                    <div className="ge-loading">
                        <div className="ge-spinner" />
                        <span>Searching…</span>
                    </div>
                )}

                {/* ── NULL / PROMPT — nothing typed ── */}
                {!hasQuery && (
                    <div className="ge-null-state">
                        <div className="ge-null-icon">
                            <Search size={34} />
                        </div>
                        <h3>Search a Student</h3>
                        <p>Type a <strong>roll number</strong> (e.g. 21CS001) or a <strong>student name</strong> to find their approved leave details and update gate entry / exit.</p>
                    </div>
                )}

                {/* ── NO MATCH ── */}
                {!searchLoading && hasQuery && filtered.length === 0 && !searchError && (
                    <div className="ge-empty">
                        <AlertCircle size={40} className="ge-empty-icon" />
                        <h3>No Leave Found</h3>
                        <p>No approved leave records match <strong>"{query}"</strong>.</p>
                        <p className="ge-empty-hint">
                            {statusFilter !== 'all'
                                ? `Try removing the status filter, or check a different date.`
                                : `Check the roll number / name, or try a different date.`}
                        </p>
                    </div>
                )}

                {/* ── Results List ── */}
                {!searchLoading && filtered.length > 0 && (
                    <div className="ge-list">
                        {filtered.map(leave => {
                            const s = leaveStatus(leave);
                            return (
                                <div key={leave.id} className={`ge-row ge-row-${s}`}>

                                    {/* Avatar */}
                                    <div className="ge-row-avatar">
                                        {leave.student?.profilePictureUrl
                                            ? <img src={leave.student.profilePictureUrl} alt="Profile" className="ge-avatar-img" />
                                            : <div className="ge-avatar-ph"><UserCheck size={20} /></div>
                                        }
                                    </div>

                                    {/* Identity */}
                                    <div className="ge-row-identity">
                                        <span className="ge-row-name">{leave.student?.fullName}</span>
                                        <span className="ge-row-roll">
                                            {/* @JsonUnwrapped: rollNumber is directly on student object */}
                                            {leave.student?.rollNumber
                                                || leave.student?.studentDetails?.rollNumber
                                                || leave.student?.username
                                                || '—'}
                                        </span>
                                        <span className="ge-row-dept">
                                            {leave.student?.department || leave.student?.studentDetails?.department}
                                            {(leave.student?.section || leave.student?.studentDetails?.section)
                                                ? ` · ${leave.student?.section || leave.student?.studentDetails?.section}`
                                                : ''}
                                        </span>
                                        <StatusChip status={s} />
                                    </div>

                                    {/* Leave info */}
                                    <div className="ge-row-info">
                                        <div className="ge-info-pair">
                                            <span className="ge-info-label">Type</span>
                                            <span className="ge-info-val">{leave.leaveType}</span>
                                        </div>
                                        <div className="ge-info-pair">
                                            <span className="ge-info-label">Duration</span>
                                            <span className="ge-info-val">{fmt(leave.fromDate)} → {fmt(leave.toDate)}</span>
                                        </div>
                                        <div className="ge-info-pair">
                                            <span className="ge-info-label">Reason</span>
                                            <span className="ge-info-val ge-reason">{leave.reason}</span>
                                        </div>
                                    </div>

                                    {/* Times */}
                                    <div className="ge-row-times">
                                        {leave.fromTime && (
                                            <div className="ge-info-pair">
                                                <span className="ge-info-label">Planned Out</span>
                                                <span className="ge-info-val ge-t-planned">{leave.fromTime.slice(0, 5)}</span>
                                            </div>
                                        )}
                                        {leave.toTime && (
                                            <div className="ge-info-pair">
                                                <span className="ge-info-label">Planned In</span>
                                                <span className="ge-info-val ge-t-planned">{leave.toTime.slice(0, 5)}</span>
                                            </div>
                                        )}
                                        {leave.actualExitTime && (
                                            <div className="ge-info-pair">
                                                <span className="ge-info-label">Actual Exit</span>
                                                <span className="ge-info-val ge-t-exit">{fmtTime(leave.actualExitTime)}</span>
                                            </div>
                                        )}
                                        {leave.actualReturnTime && (
                                            <div className="ge-info-pair">
                                                <span className="ge-info-label">Actual Return</span>
                                                <span className="ge-info-val ge-t-return">{fmtTime(leave.actualReturnTime)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action */}
                                    <div className="ge-row-action">
                                        {s === 'pending' && (
                                            <button className="ge-action-btn ge-action-exit" onClick={() => handleAction(leave.id, 'EXIT')}>
                                                <LogOut size={14} /> Mark Exit
                                            </button>
                                        )}
                                        {s === 'out' && (
                                            <button className="ge-action-btn ge-action-return" onClick={() => handleAction(leave.id, 'RETURN')}>
                                                <LogIn size={14} /> Mark Return
                                            </button>
                                        )}
                                        {s === 'returned' && (
                                            <div className="ge-done">
                                                <CheckCircle size={16} /> Completed
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GateStudentEntry;
