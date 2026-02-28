import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Users } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const TeacherCourses = () => {
    const { currentUser } = useAuth();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSections = async () => {
            if (currentUser) {
                try {
                    const response = await api.get(`/courses/sections/faculty/${currentUser.uid}`);
                    setSections(response.data);
                } catch (error) {
                    console.error("Failed to fetch sections", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchSections();
    }, [currentUser]);

    if (loading) return <div className="p-8">Loading courses...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Classes</h1>
                <button className="btn btn-primary">
                    <Plus size={18} /> Create New Class
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-white/5 rounded-xl border border-white/10">
                        <BookOpen size={48} className="mx-auto mb-4 text-gray-500" />
                        <h3 className="text-lg font-semibold">No Classes Assigned</h3>
                        <p className="text-gray-400">You haven't been assigned any course sections yet.</p>
                    </div>
                ) : (
                    sections.map(section => (
                        <div key={section.id} className="glass-card p-6 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-sm text-primary font-bold uppercase">{section.course.code}</span>
                                    <h3 className="text-xl font-bold">{section.course.name}</h3>
                                </div>
                                <span className="text-xs bg-white/10 px-2 py-1 rounded">{section.semester} {section.year}</span>
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-2">{section.course.description}</p>
                            <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Users size={16} />
                                    <span>Students Enrolled</span>
                                </div>
                                <button className="text-primary hover:underline text-sm font-semibold">Manage</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TeacherCourses;
