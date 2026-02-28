
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { Search, Bell, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../pages/admin/Admin.css';

const AdminLayout = () => {
    const { userData } = useAuth();

    return (
        <div className="flex h-screen bg-[#F3F4F6] font-[Outfit]">
            {/* Sidebar */}
            <AdminSidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Header */}
                <header className="h-20 flex items-center justify-between px-8 bg-[#F3F4F6] sticky top-0 z-40">
                    {/* Search */}
                    <div className="relative w-96">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="text-gray-400" size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-full text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-100 placeholder-gray-400 transition-all"
                        />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <button className="p-3 bg-white rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm relative group">
                                <MessageCircle size={20} />
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                            </button>
                            <button className="p-3 bg-white rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm relative group">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-400 rounded-full animate-ping"></span>
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                        </div>

                        <div className="h-8 w-[1px] bg-gray-300 mx-2"></div>

                        <div className="flex items-center gap-4 pl-2 cursor-pointer group">
                            <div className="text-right hidden md:block">
                                <h4 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Linda Adora</h4>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Admin</p>
                            </div>
                            <div className="w-12 h-12 rounded-full p-0.5 bg-white shadow-sm group-hover:shadow-md transition-all">
                                <img
                                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                    alt="Admin"
                                    className="w-full h-full object-cover rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto p-8 pt-0 no-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
