import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    ClipboardList,
    UserCheck,
    Bell,
    Settings,
    GraduationCap,
    Users,
    FileText,
    ShieldCheck,
    TrendingUp,
    ClipboardCheck,
    Briefcase,
    User,
    LogOut,
    DollarSign
} 
from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './FloatingSidebar.css';

const FloatingSidebar = ({ isOpen, setIsOpen }) => {
    const { userData } = useAuth();

    const studentLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Overview' },
        { to: '/student/academic', icon: <BookOpen size={22} />, label: 'Academic' },
        { to: '/attendance', icon: <UserCheck size={22} />, label: 'Attendance' },
        { to: '/student/fees', icon: <DollarSign size={22} />, label: 'Payments' },
        { to: '/student/leaves', icon: <FileText size={22} />, label: 'Leave Status' },
        { to: '/academic-calendar', icon: <Calendar size={22} />, label: 'Academic Calendar' },
    ];

    const teacherLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
        { to: '/teacher/courses', icon: <BookOpen size={22} />, label: 'My Courses' },
        { to: '/mentees', icon: <Users size={22} />, label: 'My Mentees' },
        { to: '/teacher/marking-attendance', icon: <UserCheck size={22} />, label: 'Attendance' },
        { to: '/grading', icon: <ClipboardList size={22} />, label: 'Grading' },
        { to: '/schedule', icon: <Calendar size={22} />, label: 'Schedule' },
    ];

    const mentorLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
        { to: '/teacher/courses', icon: <BookOpen size={22} />, label: 'My Courses' },
        { to: '/mentees', icon: <Users size={22} />, label: 'Mentees' },
        { to: '/mentor/leaves', icon: <ClipboardList size={22} />, label: 'Student Leaves' },
        { to: '/faculty-leaves', icon: <FileText size={22} />, label: 'My Leave' },
        { to: '/meetings', icon: <Calendar size={22} />, label: 'Meetings' },
        { to: '/schedule', icon: <Calendar size={22} />, label: 'Schedule' },
    ];

    const hodLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
        { to: '/department-analytics', icon: <TrendingUp size={22} />, label: 'Analytics' },
        { to: '/mentorship-management', icon: <UserCheck size={22} />, label: 'Mentorship' },
        { to: '/hod/faculty-leaves', icon: <ClipboardList size={22} />, label: 'Leave Approvals' },
        { to: '/faculty-leaves', icon: <FileText size={22} />, label: 'My Leave' },
        { to: '/hod/schedule-upload', icon: <Calendar size={22} />, label: 'Timetable' },
    ];

    const adminLinks = [
        { to: '/admin/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
        { to: '/admin/students', icon: <GraduationCap size={22} />, label: 'Students' },
        { to: '/admin/users', icon: <Users size={22} />, label: 'User Management' },
        { to: '/admin/finance', icon: <DollarSign size={22} />, label: 'Finance' },
        { to: '/admin/faculty-leaves', icon: <ClipboardList size={22} />, label: 'Faculty Leaves' },
        { to: '/calendar', icon: <Calendar size={22} />, label: 'Calendar' },
        { to: '/admin/courses', icon: <BookOpen size={22} />, label: 'Courses' },
        { to: '/admin/reports', icon: <FileText size={22} />, label: 'Reports' },
        { to: '/admin/settings', icon: <Settings size={22} />, label: 'Settings' },
    ];

    const placementCoordinatorLinks = [
        { to: '/placement-coordinator/dashboard', icon: <LayoutDashboard size={22} />, label: 'Overview' },
        { to: '/placement-coordinator/students', icon: <GraduationCap size={22} />, label: 'Students' },
        { to: '/placement-coordinator/drives', icon: <Briefcase size={22} />, label: 'Drives' },
        { to: '/placement-coordinator/analytics', icon: <TrendingUp size={22} />, label: 'Analytics' },
    ];
 
    const coeLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
        { to: '/coe/schedule-exams', icon: <Calendar size={22} />, label: 'Exams' },
        { to: '/coe/seating-allocation', icon: <Users size={22} />, label: 'Seating' },
        { to: '/coe/publish-results', icon: <ClipboardCheck size={22} />, label: 'Results' },
    ];

    const securityLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
        { to: '/gate/visitor-log', icon: <ClipboardList size={22} />, label: 'Visitors' },
        { to: '/gate/student-entry', icon: <UserCheck size={22} />, label: 'Entry' },
    ];

    const getLinksByRole = (role) => {
        switch (role) {
            case 'STUDENT': return studentLinks;
            case 'TEACHER': return teacherLinks;
            case 'MENTOR': return mentorLinks;
            case 'HOD': return hodLinks;
            case 'ADMIN': return adminLinks;
            case 'PLACEMENT_COORDINATOR': return placementCoordinatorLinks;
            case 'COE': return coeLinks;
            case 'GATE_SECURITY': return securityLinks;
            default: return studentLinks;
        }
    };

    const links = getLinksByRole(userData?.role);

    return (
        <aside className={`floating-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="nav-icons-container">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsOpen && setIsOpen(false)}
                        className={({ isActive }) => `f-nav-link ${isActive ? 'active' : ''}`}
                    >
                        {link.icon}
                        <div className="f-tooltip">
                            {link.label}
                        </div>
                    </NavLink>
                ))}
            </div>

            <div className="sidebar-bottom">
                
                {/* Profile Icon for Mobile/Tablet */}
                <NavLink
                    to="/my-profile"
                    onClick={() => setIsOpen && setIsOpen(false)}
                    className={({ isActive }) => `f-nav-link sidebar-profile-nav ${isActive ? 'active' : ''}`}
                >
                    {userData?.profilePictureUrl ? (
                         <img src={userData.profilePictureUrl} alt="avatar" style={{width: 24, height: 24, borderRadius: '50%', objectFit: 'cover'}} />
                    ) : (
                         <User size={22} />
                    )}
                    <div className="f-tooltip">Profile</div>
                </NavLink>

                <div
                    className="logout-btn-pill"
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = '/login';
                    }}
                >
                    <LogOut size={22} />
                    <div className="f-tooltip">Logout</div>
                </div>
            </div>
        </aside>
    );
};

export default FloatingSidebar;
