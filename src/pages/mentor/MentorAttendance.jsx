import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Loader, Calendar, UserCheck } from 'lucide-react';
import '../student/StudentAttendance.css'; // Reusing styles

const MentorAttendance = () => {
    const { currentUser } = useAuth();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default today
    const [attendanceList, setAttendanceList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAttendance();
    }, [currentUser, date]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/attendance/mentor/${currentUser.uid}?date=${date}`);
            setAttendanceList(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="attendance-page">
            <div className="attendance-header">
                <h1>Mentee Attendance</h1>
                <div className="date-picker">
                    <input
                        type="date"
                        className="form-input"
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #333', color: 'white', padding: '8px' }}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
            </div>

            <div className="history-list glass-card">
                <h2>Attendance for {date}</h2>
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}><Loader className="animate-spin" /></div>
                ) : attendanceList.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <UserCheck size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>No attendance records found for this date.</p>
                        <p style={{ fontSize: '0.8rem' }}>Mentees who haven't marked attendance will not show up here.</p>
                    </div>
                ) : (
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Email</th>
                                <th>Check-In Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceList.map(record => (
                                <tr key={record.id}>
                                    <td style={{ fontWeight: 500, color: 'white' }}>{record.student.fullName}</td>
                                    <td>{record.student.email}</td>
                                    <td>{record.checkInTime}</td>
                                    <td>
                                        <span className={`status-badge ${record.status === 'LATE' ? 'status-late' : 'status-present'}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MentorAttendance;
