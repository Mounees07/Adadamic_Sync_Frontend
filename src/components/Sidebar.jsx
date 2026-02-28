import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Calendar as CalendarIcon,
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
    User,
    Bird,
    DollarSign,
    MessageCircle,
    LogOut,
    Home
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const homeRoute = userData?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
    const isOnHome = location.pathname === homeRoute;

    const studentLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Overview' },
        { to: '/student/academic', icon: <BookOpen size={22} />, label: 'Academic' },
        { to: '/student/leaves', icon: <FileText size={22} />, label: 'Leave Status' },
        { to: '/attendance', icon: <UserCheck size={22} />, label: 'Attendance' },
        { to: '/academic-calendar', icon: <CalendarIcon size={22} />, label: 'Academic Calendar' },
    ];

    const teacherLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Overview' },
        { to: '/teacher/courses', icon: <BookOpen size={22} />, label: 'My Courses' },
        { to: '/mentees', icon: <Users size={22} />, label: 'My Mentees' },
        { to: '/teacher/marking-attendance', icon: <UserCheck size={22} />, label: 'Attendance' },
        { to: '/grading', icon: <ClipboardList size={22} />, label: 'Grading' },
        { to: '/study-materials', icon: <FileText size={22} />, label: 'Materials' },
        { to: '/meetings', icon: <CalendarIcon size={22} />, label: 'Meetings' },
        { to: '/schedule', icon: <CalendarIcon size={22} />, label: 'Schedule' },
    ];

    const mentorLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Overview' },
        { to: '/mentees', icon: <Users size={22} />, label: 'My Mentees' },
        { to: '/mentor/leaves', icon: <ClipboardList size={22} />, label: 'Leave Approvals' },
        { to: '/mentor/attendance', icon: <UserCheck size={22} />, label: 'Mentee Attendance' },
        { to: '/performance-reports', icon: <TrendingUp size={22} />, label: 'Performance' },
        { to: '/meetings', icon: <CalendarIcon size={22} />, label: 'Meetings' },
        { to: '/teacher/courses', icon: <BookOpen size={22} />, label: 'My Courses' },
        { to: '/schedule', icon: <CalendarIcon size={22} />, label: 'Schedule' },
    ];

    const hodLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Department' },
        { to: '/mentorship-management', icon: <UserCheck size={22} />, label: 'Mentorship' },
        { to: '/faculty-management', icon: <Users size={22} />, label: 'Faculty' },
        { to: '/students-directory', icon: <GraduationCap size={22} />, label: 'Students' },
        { to: '/curriculum', icon: <BookOpen size={22} />, label: 'Curriculum' },
        { to: '/department-analytics', icon: <TrendingUp size={22} />, label: 'Analytics' },
        { to: '/hod/schedule-upload', icon: <CalendarIcon size={22} />, label: 'Class Timetable' },
        { to: '/schedule', icon: <CalendarIcon size={22} />, label: 'View Schedule' },
        { to: '/hod/meetings', icon: <CalendarIcon size={22} />, label: 'Faculty Meetings' },
        { to: '/announcements', icon: <Bell size={22} />, label: 'Notices' },
    ];

    const principalLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Institution' },
        { to: '/hr-management', icon: <Users size={22} />, label: 'HR Management' },
        { to: '/campus-analytics', icon: <TrendingUp size={22} />, label: 'Campus Broad' },
        { to: '/compliance', icon: <ShieldCheck size={22} />, label: 'Compliance' },
        { to: '/executive-reports', icon: <FileText size={22} />, label: 'Reports' },
    ];

    const adminLinks = [
        { to: '/admin/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
        { to: '/admin/students', icon: <GraduationCap size={22} />, label: 'Students' },
        { to: '/admin/teachers', icon: <Users size={22} />, label: 'Faculty' },
        { to: '/admin/users', icon: <Users size={22} />, label: 'User Management' },
        { to: '/calendar', icon: <CalendarIcon size={22} />, label: 'Calendar' },
        { to: '/admin/courses', icon: <BookOpen size={22} />, label: 'Course Management' },
        { to: '/admin/reports', icon: <FileText size={22} />, label: 'Reports' },
        { to: '/admin/settings', icon: <Settings size={22} />, label: 'System Settings' },
    ];

    const coeLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Overview' },
        { to: '/coe/schedule-exams', icon: <CalendarIcon size={22} />, label: 'Exam Schedule' },
        { to: '/coe/seating-allocation', icon: <Users size={22} />, label: 'Seating Allocation' },
        { to: '/coe/publish-results', icon: <ClipboardCheck size={22} />, label: 'Publish Results' },
    ];

    const gateSecurityLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Overview' },
        { to: '/gate/visitor-log', icon: <ClipboardList size={22} />, label: 'Visitor Log' },
        { to: '/gate/student-entry', icon: <UserCheck size={22} />, label: 'Student Entry' },
    ];

    const getLinksByRole = (role) => {
        switch (role) {
            case 'STUDENT': return studentLinks;
            case 'TEACHER': return teacherLinks;
            case 'MENTOR': return mentorLinks;
            case 'HOD': return hodLinks;
            case 'PRINCIPAL': return principalLinks;
            case 'ADMIN': return adminLinks;
            case 'COE': return coeLinks;
            case 'GATE_SECURITY': return gateSecurityLinks;
            default: return [];
        }
    };

    const links = getLinksByRole(userData?.role);

    return (
        <aside className="fixed left-6 top-6 bottom-6 w-20 bg-white dark:bg-[#1e1e1e] rounded-[32px] shadow-2xl flex flex-col items-center py-8 z-50 transition-all duration-300 border border-white/20 dark:border-gray-800">
            {/* Logo Icon */}
            <div className="mb-10">
                <div className="w-12 h-12 bg-[#6366F1] rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white transform hover:scale-105 transition-transform duration-200 cursor-pointer" onClick={() => window.location.href = '/'}>
                    <GraduationCap size={28} />
                </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex-1 w-full px-2 flex flex-col items-center gap-6 overflow-y-auto no-scrollbar">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => `
                            relative group flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
                            ${isActive
                                ? 'bg-[#EEF2FF] text-[#6366F1] shadow-md dark:bg-indigo-500/20 dark:text-indigo-400'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-gray-800'}
                        `}
                    >
                        {link.icon}

                        {/* Hover Tooltip */}
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 transform translate-x-[-10px] group-hover:translate-x-0 z-[60] shadow-xl">
                            {link.label}
                            {/* Little arrow pointing left */}
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                        </div>
                    </NavLink>
                ))}
            </div>

            {/* Bottom Section (Settings/Logout) */}
            <div className="mt-auto w-full px-2 flex flex-col items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">

                {/* Home / Back button — shown on all non-dashboard pages */}
                {!isOnHome && (
                    <button
                        onClick={() => navigate(homeRoute)}
                        title="Back to Dashboard"
                        className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-all duration-200 cursor-pointer"
                    >
                        <Home size={20} />
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 z-[60] shadow-xl">
                            Back to Dashboard
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                        </div>
                    </button>
                )}

                {userData?.role === 'STUDENT' && (
                    <NavLink to="/profile" className={({ isActive }) => `
                        relative group flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-all duration-200
                        ${isActive ? 'text-[#6366F1] bg-indigo-50 dark:text-indigo-400' : ''}
                    `}>
                        <User size={20} />
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 z-[60] shadow-xl">
                            Profile
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                        </div>
                    </NavLink>
                )}

                <div
                    onClick={() => window.location.href = '/login'}
                    className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200 cursor-pointer"
                >
                    <LogOut size={20} />
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 z-[60] shadow-xl">
                        Logout
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
