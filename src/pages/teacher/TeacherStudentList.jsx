import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Mail, Award, Clock } from 'lucide-react';
import api from '../../utils/api';
import './TeacherCourseCatalog.css';

const TeacherStudentList = () => {
    const { sectionId } = useParams();
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sectionDetails, setSectionDetails] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(`/courses/sections/${sectionId}/enrollments`);
                // Filter to only show users with STUDENT role to avoid displaying the faculty themselves if they are enrolled
                const filtered = response.data.filter(e => e.student && e.student.role === 'STUDENT');
                setEnrollments(filtered);

                if (response.data.length > 0) {
                    setSectionDetails(response.data[0].section);
                }
            } catch (error) {
                console.error("Failed to fetch students", error);
            } finally {
                setLoading(false);
            }
        };

        if (sectionId) {
            fetchData();
        }
    }, [sectionId]);

    const handleBack = () => {
        navigate('/manage-courses');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-medium tracking-wide">Fetching Class Roster...</p>
            </div>
        </div>
    );

    return (
        <div className="teacher-catalog-container min-h-screen pb-20">
            <header className="catalog-header mb-8 px-4">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-all bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl border border-white/10 group w-fit"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium text-sm">Return to My Classes</span>
                </button>

                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                    <div className="header-title">
                        <div className="flex items-start gap-5 mb-4">
                            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 ring-1 ring-indigo-500/20 shadow-2xl shadow-indigo-500/10 shrink-0">
                                <Users size={32} />
                            </div>
                            <div className="overflow-hidden">
                                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-2 truncate">
                                    {sectionDetails ? `${sectionDetails.course.code} - ${sectionDetails.course.name}` : 'Class Roster'}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 text-gray-400">
                                    <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                        {sectionDetails?.semester} {sectionDetails?.year}
                                    </span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/10 hidden sm:block"></span>
                                    <span className="flex items-center gap-2 text-sm font-medium">
                                        Total Active Students: <b className="text-white text-lg">{enrollments.length}</b>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="mx-4 glass-card p-0 overflow-hidden border border-white/10 rounded-3xl shadow-2xl bg-slate-900/40 backdrop-blur-3xl">
                {enrollments.length === 0 ? (
                    <div className="p-24 text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-white/10 shadow-inner">
                            <Users size={48} className="text-gray-600" />
                        </div>
                        <h3 className="text-3xl font-extrabold text-white mb-4">Empty Roster</h3>
                        <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
                            No students are currently enrolled in this section using the STUDENT role.
                            If you expect students here, please verify their account roles.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-white/[0.04] border-b border-white/10 uppercase font-black text-[10px] tracking-[0.25em] text-gray-500">
                                    <th className="px-8 py-6 w-[35%]">Student Profile</th>
                                    <th className="px-8 py-6">Academic Credentials</th>
                                    <th className="px-8 py-6">Contact Information</th>
                                    <th className="px-8 py-6 text-right">Enrollment Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {enrollments.map((enrollment) => (
                                    <tr key={enrollment.id} className="hover:bg-white/[0.04] transition-all group scroll-mt-20">
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="relative shrink-0">
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-black text-white shadow-2xl group-hover:rotate-6 transition-all duration-500 border border-white/10">
                                                        {enrollment.student.fullName?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-slate-900"></div>
                                                </div>
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <span className="font-black text-white text-lg group-hover:text-indigo-400 transition-colors uppercase tracking-tight block truncate">
                                                        {enrollment.student.fullName}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-500/20">
                                                            ID: {enrollment.student.id}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex flex-col gap-2.5">
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                        <Award size={14} className="text-emerald-500" />
                                                    </div>
                                                    <span className="font-black text-xs uppercase tracking-wide">{enrollment.student.department || 'GENERAL'}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-[10px] font-mono font-bold text-gray-500 border border-white/5 px-2.5 py-1 rounded bg-white/[0.02]">
                                                        ROLL: {enrollment.student.rollNumber || 'TBD'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <a
                                                href={`mailto:${enrollment.student.email}`}
                                                className="inline-flex items-center gap-3 text-gray-400 hover:text-white transition-all bg-white/5 hover:bg-white/[0.08] p-3 rounded-2xl border border-white/5 hover:border-indigo-500/30 group/mail max-w-[240px]"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover/mail:bg-indigo-500 group-hover/mail:text-white transition-all">
                                                    <Mail size={16} className="transition-transform group-hover/mail:rotate-12" />
                                                </div>
                                                <span className="font-bold text-xs truncate">{enrollment.student.email}</span>
                                            </a>
                                        </td>
                                        <td className="px-8 py-8 text-right">
                                            <div className="flex flex-col items-end gap-1.5">
                                                <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black tracking-widest uppercase">
                                                    <Clock size={12} className="text-indigo-500" />
                                                    <span>Enrolled</span>
                                                </div>
                                                <span className="text-white font-black text-xs bg-white/5 px-2 py-1 rounded">
                                                    {new Date(enrollment.enrollmentDate).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: '2-digit',
                                                        year: 'numeric'
                                                    }).toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}} />
        </div>
    );
};

export default TeacherStudentList;
