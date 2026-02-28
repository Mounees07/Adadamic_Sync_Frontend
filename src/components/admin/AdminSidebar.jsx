import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    UserCheck,
    DollarSign,
    FileText,
    Calendar,
    BookOpen,
    MessageCircle,
    UserCircle,
    Settings,
    LogOut,
    Bird
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const menuItems = [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/users', icon: Users, label: 'User Management' },
        { to: '/admin/students', icon: Users, label: 'Students' },
        { to: '/admin/attendance', icon: UserCheck, label: 'Attendance' },
        { to: '/admin/finance', icon: DollarSign, label: 'Finance' },
        { to: '/admin/notice', icon: FileText, label: 'Notice' },
        { to: '/admin/calendar', icon: Calendar, label: 'Calendar' },
        { to: '/admin/library', icon: BookOpen, label: 'Library' },
        { to: '/admin/message', icon: MessageCircle, label: 'Message' },
    ];

    const otherItems = [
        { to: '/admin/profile', icon: UserCircle, label: 'Profile' },
        { to: '/admin/settings', icon: Settings, label: 'Setting' },
    ];

    const NavItem = ({ to, icon: Icon, label, onClick }) => (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-4 px-6 py-3.5 mx-4 rounded-2xl text-[15px] font-bold transition-all duration-200 group ${isActive
                    ? 'bg-[#E0F2FE] text-[#0284C7] shadow-sm'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                }`
            }
        >
            <Icon size={22} strokeWidth={2} />
            <span className="tracking-wide">{label}</span>
        </NavLink>
    );

    return (
        <aside className="w-[280px] bg-white h-screen flex flex-col border-r border-gray-100 flex-shrink-0 sticky top-0 z-50">
            {/* Logo */}
            <div className="h-24 flex items-center px-8">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-900 text-white p-2 rounded-xl">
                        <Bird size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-gray-800 tracking-tight leading-none">SchoolHub</span>
                    </div>
                    <span className="bg-[#FCD34D] text-[#78350F] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ml-2 self-start mt-1">V 1.0</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                <div className="px-8 mb-4 text-xs font-bold text-gray-300 uppercase tracking-widest">Menu</div>
                <div className="space-y-1 mb-8">
                    {menuItems.map((item) => (
                        <NavItem key={item.to} {...item} />
                    ))}
                </div>

                <div className="px-8 mb-4 text-xs font-bold text-gray-300 uppercase tracking-widest">Other</div>
                <div className="space-y-1">
                    {otherItems.map((item) => (
                        <NavItem key={item.to} {...item} />
                    ))}
                    <button
                        onClick={handleLogout}
                        className="w-[calc(100%-32px)] flex items-center gap-4 px-6 py-3.5 mx-4 rounded-2xl text-[15px] font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
                    >
                        <LogOut size={22} strokeWidth={2} />
                        <span className="tracking-wide">Log out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
