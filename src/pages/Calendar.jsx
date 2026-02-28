import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MoreHorizontal, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../utils/api';
import './Calendar.css';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    // Agenda Items: List for the top right "Agenda" (Broad events)
    const [agendaList, setAgendaList] = useState([]);
    // Daily Schedule: Time-slotted details for the selected day (Bottom right)
    const [dailySchedule, setDailySchedule] = useState([]);

    const [view, setView] = useState('Month');

    const currentYear = currentDate.getFullYear();
    const currentMonthIndex = currentDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[currentMonthIndex];

    const daysInCurrentMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push('');
    }
    for (let i = 1; i <= daysInCurrentMonth; i++) {
        calendarDays.push(i);
    }
    while (calendarDays.length % 7 !== 0) {
        calendarDays.push('');
    }

    useEffect(() => {
        fetchDailySchedule(selectedDate);
    }, [selectedDate]);

    const fetchDailySchedule = async (date) => {
        try {
            const dateStr = date.toLocaleDateString("en-CA");
            const res = await api.get(`/agenda?date=${dateStr}`);
            setDailySchedule(res.data);
        } catch (err) {
            console.error("Failed to fetch agenda", err);
        }
    };

    const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonthIndex - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonthIndex + 1, 1));

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAgenda, setNewAgenda] = useState({
        title: '',
        type: 'Lecture',
        date: '',
        time: '',
        colorClass: 'purple'
    });

    const handleAddAgenda = async (e) => {
        e.preventDefault();
        try {
            if (newAgenda.id) {
                // Update existing
                await api.put(`/agenda/${newAgenda.id}`, newAgenda);
            } else {
                // Create new
                await api.post('/agenda', newAgenda);
            }
            setIsModalOpen(false);
            setNewAgenda({ title: '', type: 'Lecture', date: '', time: '', colorClass: 'purple' });
            // Refresh data
            fetchDailySchedule(selectedDate);
        } catch (error) {
            console.error("Failed to save agenda item", error);
        }
    };

    const handleEditAgenda = (item) => {
        setNewAgenda({
            id: item.id,
            title: item.title,
            type: item.type,
            date: item.date, // Ensure format is YYYY-MM-DD
            time: item.time,
            colorClass: item.colorClass
        });
        setIsModalOpen(true);
    };

    const handleDeleteAgenda = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await api.delete(`/agenda/${id}`);
                fetchDailySchedule(selectedDate);
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    const openModal = () => {
        // Pre-fill date with selected date
        const dateStr = selectedDate.toLocaleDateString('en-CA');
        setNewAgenda({ ...newAgenda, date: dateStr });
        setIsModalOpen(true);
    };

    const handleDayClick = (day) => {
        if (day !== '') {
            const newDate = new Date(currentYear, currentMonthIndex, day);
            setSelectedDate(newDate);
        }
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && currentMonthIndex === today.getMonth() && currentYear === today.getFullYear();
    };

    const isSelected = (day) => {
        return day === selectedDate.getDate() && currentMonthIndex === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
    };

    // Placeholder events for the visual grid
    const gridEvents = {};

    return (
        <div className="calendar-page">
            <div className="calendar-layout">
                {/* Main Calendar Grid */}
                <div className="calendar-main">
                    {/* Calendar Top Controls */}
                    <div className="calendar-header">
                        {/* View Switcher */}
                        <div className="view-switcher">
                            {['Month', 'Week', 'Day'].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`view-btn ${view === v ? 'active' : ''}`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>

                        {/* Date Title */}
                        <div className="month-title">
                            {currentMonth} {currentYear}
                        </div>

                        {/* Navigation */}
                        <div className="nav-controls">
                            <span className="today-btn" onClick={() => setCurrentDate(new Date())}>Today</span>
                            <div className="nav-arrows" style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={prevMonth} className="nav-btn">
                                    <ChevronLeft size={20} />
                                </button>
                                <button onClick={nextMonth} className="nav-btn">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Days Header */}
                    <div className="grid-header">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                            <div key={day} className="day-label">{day}</div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="calendar-grid">
                        {calendarDays.map((day, i) => {
                            const isGridEvent = gridEvents[day];
                            return (
                                <div
                                    key={i}
                                    onClick={() => handleDayClick(day)}
                                    className={`day-cell ${day !== '' && isSelected(day) ? 'selected' : ''}`}
                                >
                                    {day !== '' && (
                                        <>
                                            <span className={`day-number ${isToday(day) ? 'today' : ''}`}>
                                                {day}
                                            </span>

                                            <div className="event-stack">
                                                {isGridEvent?.map((evt, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`mini-event event-${evt.color}`}
                                                    >
                                                        {evt.title}
                                                    </div>
                                                ))}
                                                {isGridEvent && isGridEvent.length > 2 && (
                                                    <span className="more-evts">
                                                        {isGridEvent.length - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right Sidebar Column */}
                <div className="calendar-sidebar">

                    {/* Agenda Widget (Top Right) */}
                    <div className="sidebar-widget">
                        <div className="widget-header">
                            <h3 className="widget-title">Agenda</h3>
                            <button className="widget-action-btn">
                                <MoreHorizontal size={24} />
                            </button>
                        </div>

                        <div className="agenda-items">
                            {agendaList.map((item, idx) => (
                                <div key={idx} className={`agenda-pill ${idx === 0 ? 'bg-highlight' : 'bg-light'}`}>
                                    <div className={`pill-marker marker-${item.color}`}></div>
                                    <span className="pill-text">{item.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Daily Schedule Widget (Bottom Right) */}
                    <div className="sidebar-widget" style={{ flex: 1 }}>
                        <div className="widget-header">
                            <div>
                                <h3 className="widget-title">
                                    {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </h3>
                                {/* <p className="widget-title-sm">Schedule</p> */}
                            </div>
                            <button className="add-plus-btn" onClick={openModal} title="Add Event">
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="daily-list">
                            {dailySchedule.length > 0 ? (
                                dailySchedule.map((item, idx) => (
                                    <div key={idx} className="schedule-item">
                                        {/* Time Column */}
                                        <div className="time-col">
                                            <span className="time-text">{item.time}</span>
                                        </div>

                                        {/* Card */}
                                        <div className={`event-card event-${item.colorClass || 'purple'}`} style={{ position: 'relative' }}>
                                            <div className="event-header">
                                                <h4 className="event-title">{item.title}</h4>
                                                <span className="event-time-badge">{item.time}</span>
                                            </div>
                                            <span className="event-type">{item.type}</span>

                                            <div className="event-actions" style={{
                                                position: 'absolute',
                                                bottom: '8px',
                                                right: '8px',
                                                display: 'flex',
                                                gap: '4px'
                                            }}>
                                                <button onClick={(e) => { e.stopPropagation(); handleEditAgenda(item); }} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }} title="Edit">
                                                    <Edit2 size={12} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteAgenda(item.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, color: 'red' }} title="Delete">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-schedule">
                                    <Clock size={32} style={{ opacity: 0.2 }} />
                                    <p style={{ fontWeight: 600 }}>No events for this day</p>
                                    <button className="add-event-btn" onClick={openModal}>
                                        + Add Event
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{newAgenda.id ? 'Edit Event' : 'Add New Event'}</h3>
                        <form onSubmit={handleAddAgenda}>
                            <div className="form-group">
                                <label>Event Title</label>
                                <input
                                    type="text"
                                    value={newAgenda.title}
                                    onChange={(e) => setNewAgenda({ ...newAgenda, title: e.target.value })}
                                    required
                                    placeholder="e.g. Science Fair Setup"
                                />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={newAgenda.date}
                                    onChange={(e) => setNewAgenda({ ...newAgenda, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Time</label>
                                <input
                                    type="time"
                                    value={newAgenda.time}
                                    onChange={(e) => setNewAgenda({ ...newAgenda, time: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={newAgenda.type}
                                    onChange={(e) => setNewAgenda({ ...newAgenda, type: e.target.value })}
                                >
                                    <option value="Lecture">Lecture</option>
                                    <option value="Meeting">Meeting</option>
                                    <option value="Exam">Exam</option>
                                    <option value="Event">Event</option>
                                    <option value="Holiday">Holiday</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Color Tag</label>
                                <select
                                    value={newAgenda.colorClass}
                                    onChange={(e) => setNewAgenda({ ...newAgenda, colorClass: e.target.value })}
                                >
                                    <option value="purple">Purple</option>
                                    <option value="pink">Pink</option>
                                    <option value="blue">Blue</option>
                                    <option value="orange">Orange</option>
                                    <option value="yellow">Yellow</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">{newAgenda.id ? 'Update Event' : 'Add Event'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
