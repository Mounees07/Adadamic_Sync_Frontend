
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import {
    User, Mail, Phone, MapPin, Calendar, BookOpen,
    ShieldCheck, ClipboardList, Edit2, Save, X, Briefcase, GraduationCap
} from 'lucide-react';
import axios from 'axios';

const MyProfile = () => {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState('Personal');

    useEffect(() => {
        console.log("MyProfile Component Mounted - Version 2.0");
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const token = await currentUser?.getIdToken();
            const response = await axios.get('http://localhost:8080/api/users/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Profile Data Fetched:", response.data);
            setProfile(response.data);
            setFormData(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError("Failed to load profile data.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(profile); // Revert changes
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const token = await currentUser?.getIdToken();
            // Using the UID from the profile data logic
            // Typically PUT /api/users/{uid}
            await axios.put(`http://localhost:8080/api/users/${profile.firebaseUid}`, {
                mobileNumber: formData.mobileNumber,
                address: formData.address,
                parentContact: formData.parentContact
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setProfile(prev => ({ ...prev, ...formData }));
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (err) {
            console.error("Error updating profile:", err);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !profile) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-xl font-semibold text-gray-500">Loading Profile...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen text-red-500">
                    {error}
                </div>
            </DashboardLayout>
        );
    }

    const SectionCard = ({ title, icon: Icon, iconColor, children }) => (
        <div className="rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 mb-6 overflow-hidden bg-white dark:bg-[#1e1e1e]"
            style={{ background: 'var(--bg-card)' }}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/10 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm ${iconColor}`}>
                    <Icon size={18} />
                </div>
                <h3 className="text-lg font-bold tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>
                    {title}
                </h3>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );

    const InfoRow = ({ label, value, name, editable = false }) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(128,128,128,0.1)' }}>
            <div style={{ width: '33%', minWidth: '130px', flexShrink: 0, fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', marginRight: '12px' }}>
                <span style={{ textAlign: 'right', wordBreak: 'break-word', lineHeight: '1.5' }}>{label}</span>
                <span style={{ userSelect: 'none', marginLeft: '8px', lineHeight: '1.5' }}>:</span>
            </div>
            <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: '1.5' }}>
                {editable && isEditing ? (
                    <input
                        type="text"
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleChange}
                        className="w-full px-2 py-1 rounded border text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-transparent"
                        style={{
                            borderColor: 'var(--glass-border)',
                            color: 'var(--text-primary)'
                        }}
                    />
                ) : (
                    value || '-'
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            {/* Header Section */}
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', margin: 0 }}>My Profile</h1>
                    <p style={{ color: '#6b7280', margin: 0 }}>Manage your personal and academic information</p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {isEditing ? (
                        <>
                            <button onClick={handleCancel}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, transition: 'all 0.2s', background: 'transparent', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer' }}>
                                <X size={18} /> Cancel
                            </button>
                            <button onClick={handleSave}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, color: 'white', background: 'var(--primary)', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)', border: 'none', cursor: 'pointer' }}>
                                <Save size={18} /> Save Changes
                            </button>
                        </>
                    ) : (
                        <button onClick={handleEdit}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, transition: 'all 0.2s', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                            <Edit2 size={18} /> Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Side: Identity Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div style={{
                        borderRadius: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(229, 231, 235, 0.5)',
                        background: 'var(--bg-card)',
                        marginBottom: '1.5rem'
                    }}>
                        {/* Gradient Background */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '8rem',
                            background: 'linear-gradient(to right, #2563eb, #4f46e5)', opacity: 0.9, zIndex: 0
                        }}></div>

                        {/* Profile Image */}
                        <div style={{ position: 'relative', zIndex: 10, marginTop: '4rem', marginBottom: '1rem' }}>
                            <div style={{ width: '8rem', height: '8rem', borderRadius: '9999px', padding: '0.375rem', background: 'white', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', margin: '0 auto' }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '9999px', overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {profile.profilePictureUrl ? (
                                        <img src={profile.profilePictureUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={48} style={{ color: '#9ca3af' }} />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Name and Role */}
                        <div style={{ position: 'relative', zIndex: 10, width: '100%', paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)', margin: 0 }}>{profile.fullName}</h2>
                            <p style={{ fontWeight: 500, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.5rem' }}>{profile.role}</p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', fontSize: '0.875rem', fontWeight: 600, margin: '0 auto', width: 'fit-content', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                                <ShieldCheck size={16} />
                                <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{profile.rollNumber || 'No ID'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Account Status Card */}
                    <div style={{ padding: '1.5rem', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(229, 231, 235, 0.5)', background: 'var(--bg-card)' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                            <ClipboardList size={20} className="text-emerald-500" />
                            Account Status
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px dashed #e5e7eb', width: '100%' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Status</span>
                                <span style={{ color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px dashed #e5e7eb', width: '100%' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Last Login</span>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Just Now</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', width: '100%' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Role Access</span>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{profile.role}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Details Sections */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs Navigation */}
                    {/* Tabs Navigation */}
                    <div className="no-scrollbar" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px',
                        backgroundColor: '#fff',
                        borderRadius: '9999px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        marginBottom: '32px',
                        overflowX: 'auto',
                        scrollbarWidth: 'none'
                    }}>
                        {[
                            { id: 'Personal', label: 'Personal' },
                            { id: 'Academic', label: 'Academic' },
                            { id: 'Admission', label: 'Admission' },
                            { id: 'Address', label: 'Address' },
                            { id: 'Hostel', label: 'Hostel' },
                            { id: 'School', label: 'School' },
                            { id: 'Institute', label: 'Institute' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    flex: '1',
                                    whiteSpace: 'nowrap',
                                    minWidth: 'fit-content',
                                    padding: '8px 20px',
                                    borderRadius: '9999px',
                                    fontSize: '0.875rem',
                                    fontWeight: activeTab === tab.id ? '600' : '500',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: activeTab === tab.id ? '#f3f4f6' : 'transparent',
                                    color: activeTab === tab.id ? '#111827' : '#6b7280',
                                    boxShadow: activeTab === tab.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                    outline: 'none'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* PERSONAL DETAILS */}
                    {activeTab === 'Personal' && (
                        <div className="animate-fade-in">
                            <SectionCard title="PERSONAL DETAILS" icon={User} iconColor="text-blue-500">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <InfoRow label="Batch" value={profile.batch} />
                                    <InfoRow label="Date of Admission" value={profile.admissionYear} />
                                    <InfoRow label="Student Name" value={profile.fullName} />
                                    <InfoRow label="Gender" value={profile.gender} />
                                    <InfoRow label="Date of Birth" value={profile.dob} />
                                    <InfoRow label="Community" value={profile.community} />
                                    <InfoRow label="Guardian Name" value={profile.guardianName} />
                                    <InfoRow label="Religion" value={profile.religion} />
                                    <InfoRow label="Nationality" value={profile.nationality} />
                                    <InfoRow label="Mother Tongue" value={profile.motherTongue} />
                                    <InfoRow label="Blood Group" value={profile.bloodGroup} />
                                    <InfoRow label="Student ID" value={profile.id} />
                                    <InfoRow label="Aadhar No" value={profile.aadharNo} />
                                    <InfoRow label="Enrollment No" value={profile.enrollmentNo} />
                                    <InfoRow label="Register No" value={profile.registerNo} />
                                    <InfoRow label="DTE UMIS Reg. No." value={profile.dteUmisRegNo} />
                                    <InfoRow label="Application No" value={profile.applicationNo} />
                                    <InfoRow label="Admission No" value={profile.admissionNo} />
                                    <InfoRow label="Father Name" value={profile.fatherName} />
                                    <InfoRow label="Mother Name" value={profile.motherName} />

                                    <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800" style={{ gridColumn: '1 / -1' }}>
                                        <h4 className="font-semibold text-sm mb-3 text-blue-600 dark:text-blue-400 uppercase tracking-wider">Parent Occupation</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                            <InfoRow label="Occupation" value={profile.parentOccupation} />
                                            <InfoRow label="Place of Work" value={profile.parentPlaceOfWork} />
                                            <InfoRow label="Designation" value={profile.parentDesignation} />
                                            <InfoRow label="Parent Income" value={profile.parentIncome} />
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* ACADEMIC DETAILS */}
                    {activeTab === 'Academic' && (
                        <div className="animate-fade-in">
                            <SectionCard title="ACADEMIC DETAILS" icon={BookOpen} iconColor="text-indigo-500">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <InfoRow label="Branch Code" value={profile.branchCode} />
                                    <InfoRow label="Degree Level" value={profile.degreeLevel} />
                                    <InfoRow label="Course Code" value={profile.courseCode} />
                                    <InfoRow label="Course Name" value={profile.courseName} />
                                    <InfoRow label="Branch Name" value={profile.branchName} />
                                    <InfoRow label="Department" value={profile.department} />
                                    <InfoRow label="Branch Type" value={profile.branchType} />
                                    <InfoRow label="Regulation" value={profile.regulation} />
                                    <InfoRow label="University" value={profile.university} />
                                    <InfoRow label="Year" value={profile.currentYear} />
                                    <InfoRow label="Semester" value={profile.semester} />
                                    <InfoRow label="Year of Admission" value={profile.admissionYear} />
                                    <InfoRow label="Year of Completion" value={profile.yearOfCompletion} />
                                    <InfoRow label="Section" value={profile.section} />
                                    <InfoRow label="Student Category" value={profile.studentCategory} />
                                    <InfoRow label="Seat Category" value={profile.seatCategory} />
                                    <InfoRow label="Quota" value={profile.quota} />
                                    <InfoRow label="Student Status" value={profile.studentStatus} />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* ADMISSION PAYMENT DETAILS */}
                    {activeTab === 'Admission' && (
                        <div className="animate-fade-in">
                            <SectionCard title="ADMISSION PAYMENT DETAILS" icon={ClipboardList} iconColor="text-green-500">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <InfoRow label="DTE Register No" value={profile.dteRegisterNo} />
                                    <InfoRow label="DTE Admission No" value={profile.dteAdmissionNo} />
                                    <InfoRow label="DTE General Rank" value={profile.dteGeneralRank} />
                                    <InfoRow label="DTE Community Rank" value={profile.dteCommunityRank} />
                                    <InfoRow label="Entrance Marks Min" value={profile.entranceMarksMin} />
                                    <InfoRow label="Entrance Marks Max" value={profile.entranceMarksMax} />
                                    <InfoRow label="Entrance Register No" value={profile.entranceRegisterNo} />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* ADDRESS & INSURANCE */}
                    {activeTab === 'Address' && (
                        <div className="animate-fade-in">
                            <SectionCard title="ADDRESS FOR COMMUNICATION" icon={MapPin} iconColor="text-purple-500">
                                {/* Insurance Sub-section */}
                                <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                                    <h4 className="font-semibold text-sm mb-3 text-purple-600 dark:text-purple-400 uppercase tracking-wider">Insurance Details</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        <div className="space-y-3">
                                            <InfoRow label="Nominee Name" value={profile.nomineeName} />
                                            <InfoRow label="Nominee Age" value={profile.nomineeAge} />
                                        </div>
                                        <div className="space-y-3">
                                            <InfoRow label="Nominee Relationship" value={profile.nomineeRelationship} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <InfoRow
                                        label="Permanent Address"
                                        value={profile.permanentAddress}
                                        name="permanentAddress"
                                        editable={true}
                                    />
                                    <InfoRow
                                        label="Present Address"
                                        value={profile.address}
                                        name="address"
                                        editable={true}
                                    />
                                    <InfoRow
                                        label="Parent Mobile No"
                                        value={profile.parentContact}
                                        name="parentContact"
                                        editable={true}
                                    />
                                    <InfoRow label="Student Email ID" value={profile.email} />
                                    <InfoRow
                                        label="Student Mobile No"
                                        value={profile.mobileNumber}
                                        name="mobileNumber"
                                        editable={true}
                                    />
                                    <InfoRow
                                        label="Parent Email ID"
                                        value={profile.parentEmailId}
                                        name="parentEmailId"
                                        editable={true}
                                    />
                                    <InfoRow
                                        label="Official Email ID"
                                        value={profile.officialEmailId}
                                        name="officialEmailId"
                                        editable={true}
                                    />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* CLASS ADVISOR/HOSTEL DETAILS */}
                    {activeTab === 'Hostel' && (
                        <div className="animate-fade-in">
                            <SectionCard title="CLASS ADVISOR/HOSTEL DETAILS" icon={Briefcase} iconColor="text-orange-500">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div className="space-y-3">
                                        <InfoRow label="Hosteller/Dayscholar" value={profile.hostellerDayScholar} />
                                        <InfoRow label="Hostel Name" value={profile.hostelName} />
                                        <InfoRow label="Hostel Room Type" value={profile.hostelRoomType} />
                                        <InfoRow label="Warden Name" value={profile.wardenName} />
                                        <InfoRow label="H-Discontinued Date" value={profile.hostelDiscontinuedDate} />
                                        <InfoRow label="Class Advisor" value={profile.classAdvisorName} />
                                    </div>
                                    <div className="space-y-3">
                                        <InfoRow label="Hostel Room Capacity" value={profile.hostelRoomCapacity} />
                                        <InfoRow label="Hostel Floor No" value={profile.hostelFloorNo} />
                                        <InfoRow label="Hostel Room No" value={profile.hostelRoomNo} />
                                        <InfoRow label="Warden Alter (if Any)" value={profile.wardenAlter} />
                                        <InfoRow label="H-Note" value={profile.hostelNote} />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* SCHOOL DETAILS (Combined) */}
                    {activeTab === 'School' && (
                        <div className="animate-fade-in space-y-6">
                            <SectionCard title="SCHOOL MARKS DETAILS" icon={GraduationCap} iconColor="text-pink-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4 mb-6">
                                    <div className="space-y-3">
                                        <InfoRow label="School Qualification" value={profile.schoolQualification} />
                                        <InfoRow label="School Study State" value={profile.schoolStudyState} />
                                    </div>
                                    <div className="space-y-3">
                                        <InfoRow label="School Year of Pass" value={profile.schoolYearOfPass} />
                                        <InfoRow label="School No of Attempts" value={profile.schoolNoOfAttempts} />
                                        <InfoRow label="School Classification" value={profile.schoolClassification} />
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
                                            <tr>
                                                <th className="px-4 py-3" style={{ width: '40%', textAlign: 'left' }}>School Subject</th>
                                                <th className="px-4 py-3 text-center" style={{ width: '20%' }}>Min</th>
                                                <th className="px-4 py-3 text-center" style={{ width: '20%' }}>Max</th>
                                                <th className="px-4 py-3 text-center" style={{ width: '20%' }}>%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {['Physics', 'Chemistry', 'Mathematics', 'PCM', 'Computer Science', 'Biology'].map((subj) => (
                                                <tr key={subj} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-200">{profile[`schoolMarkMin${subj.replace(/\s/g, '')}`] || '-'}</td>
                                                    <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">{profile[`schoolMarkMin${subj.replace(/\s/g, '')}`] || '-'}</td>
                                                    <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">{profile[`schoolMarkMax${subj.replace(/\s/g, '')}`] || '-'}</td>
                                                    <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400 font-semibold">{profile[`schoolMarkPct${subj.replace(/\s/g, '')}`] || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Cut Off Marks (200): </span>
                                        <span className="text-sm font-bold text-blue-900 dark:text-blue-100 ml-2">{profile.schoolCutOff200 || '-'}</span>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="SCHOOL CERTIFICATE DETAILS" icon={BookOpen} iconColor="text-teal-500">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div className="space-y-3">
                                        <InfoRow label="School Reg No1" value={profile.schoolRegNo1} />
                                        <InfoRow label="School Reg No2" value={profile.schoolRegNo2} />
                                        <InfoRow label="School Reg No3" value={profile.schoolRegNo3} />
                                        <InfoRow label="School Reg No4" value={profile.schoolRegNo4} />
                                    </div>
                                    <div className="space-y-3">
                                        <InfoRow label="School Certificate No1" value={profile.schoolCertNo1} />
                                        <InfoRow label="School Certificate No2" value={profile.schoolCertNo2} />
                                        <InfoRow label="School Certificate No3" value={profile.schoolCertNo3} />
                                        <InfoRow label="School Certificate No4" value={profile.schoolCertNo4} />
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
                                    <div className="space-y-3">
                                        <InfoRow label="School Total Marks1" value={profile.schoolTotalMarks1} />
                                        <InfoRow label="School Total Marks3" value={profile.schoolTotalMarks3} />
                                    </div>
                                    <div className="space-y-3">
                                        <InfoRow label="School Total Marks2" value={profile.schoolTotalMarks2} />
                                        <InfoRow label="School Total Marks4" value={profile.schoolTotalMarks4} />
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="SCHOOL TC DETAILS" icon={Calendar} iconColor="text-yellow-500">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div className="space-y-3">
                                        <InfoRow label="School Name" value={profile.schoolName} />
                                        <InfoRow label="School TC Name" value={profile.schoolTCName} />
                                        <InfoRow label="School TC No" value={profile.schoolTCNo} />
                                        <InfoRow label="School TC Date" value={profile.schoolTCDate} />
                                        <InfoRow label="School TC Class" value={profile.schoolTCClass} />
                                        <InfoRow label="Board of School" value={profile.boardOfSchool} />
                                    </div>
                                    <div className="space-y-3">
                                        <InfoRow label="Cut off Marks in 300(Cut off Marks in 200+Entrance Marks)" value={profile.schoolCutOff300} />
                                        <InfoRow label="Marks Note1" value={profile.marksNote1} />
                                        <InfoRow label="Marks Note2" value={profile.marksNote2} />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* BIT ACADEMIC DETAILS */}
                    {activeTab === 'Institute' && (
                        <div className="animate-fade-in">
                            <SectionCard title="BIT ACADEMIC DETAILS" icon={Activity} iconColor="text-red-500">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div className="space-y-3">
                                        <InfoRow label="TC Last Class Date" value={profile.tcLastClassDate} />
                                        <InfoRow label="TC Promotion To Next Higher Class" value={profile.tcPromotion} />
                                        <InfoRow label="TC Reason For Leaving" value={profile.tcReasonLeaving} />
                                        <InfoRow label="TC Conduct And Character" value={profile.tcConduct} />
                                        <InfoRow label="TC No" value={profile.bitTCNo} />
                                        <InfoRow label="TC Date" value={profile.bitTCDate} />
                                        <InfoRow label="Duplicate TC Issued" value={profile.duplicateTCIssued} />
                                        <InfoRow label="Duplicate TC Description" value={profile.duplicateTCDescription} />
                                    </div>
                                    <div className="space-y-3">
                                        <InfoRow label="Final Total Marks Min" value={profile.finalTotalMarksMin} />
                                        <InfoRow label="Final Total Marks Max" value={profile.finalTotalMarksMax} />
                                        <InfoRow label="Final Total Marks %" value={profile.finalTotalMarksPct} />
                                        <InfoRow label="Final Classification" value={profile.finalClassification} />
                                        <InfoRow label="Final Year of Pass" value={profile.finalYearOfPass} />
                                        <InfoRow label="University Rank" value={profile.universityRank} />
                                        <InfoRow label="University Rank1" value={profile.universityRank1} />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default MyProfile;
