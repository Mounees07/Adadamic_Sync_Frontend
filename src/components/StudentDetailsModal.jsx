import React, { useState, useEffect } from 'react';
import { X, Save, User, BookOpen,  ClipboardList, MapPin, Briefcase, GraduationCap, Calendar } from 'lucide-react';
import './StudentDetailsModal.css';

// Component definitions moved outside to prevent re-rendering issues
const InputField = ({ label, name, type = "text", required = false, formData, onChange }) => (
    <div className="sdm-form-group">
        <label className="sdm-label">{label}</label>
        <input
            type={type}
            name={name}
            value={formData[name] || ''}
            onChange={onChange}
            required={required}
            className="sdm-input"
        />
    </div>
);

const Section = ({ title, icon: Icon, children }) => (
    <div className="sdm-section">
        <div className="sdm-section-header">
            <div className="sdm-section-icon">
                <Icon size={20} />
            </div>
            <h3 className="sdm-section-title">{title}</h3>
        </div>
        <div className="sdm-grid">
            {children}
        </div>
    </div>
);

const StudentDetailsModal = ({ student, mode, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('Personal');
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (student && mode === 'edit') {
            setFormData(student);
        } else {
            setFormData({
                role: 'STUDENT',
                fullName: '',
                email: '',
                password: 'password123',
                // Initialize default values if needed
            });
        }
    }, [student, mode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const tabs = [
        { id: 'Personal', label: 'Personal', icon: User },
        { id: 'Academic', label: 'Academic', icon: BookOpen },
        { id: 'Admission', label: 'Admission', icon: ClipboardList },
        { id: 'Address', label: 'Address', icon: MapPin },
        { id: 'Hostel', label: 'Hostel', icon: Briefcase },
        { id: 'School', label: 'School', icon: GraduationCap },
        { id: 'Institute', label: 'Institute', icon: Calendar },
    ];

    return (
        <div className="sdm-overlay">
            <div className="sdm-content">
                <div className="sdm-header">
                    <h2 className="sdm-title">{mode === 'add' ? 'Add New Student' : 'Edit Student Details'}</h2>
                    <button onClick={onClose} className="sdm-close-btn">
                        <X size={24} />
                    </button>
                </div>

                <div className="sdm-tabs-container">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`sdm-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="sdm-body">
                    <form id="student-form" onSubmit={handleSubmit}>

                        {activeTab === 'Personal' && (
                            <Section title="Personal Details" icon={User}>
                                <InputField label="Full Name" name="fullName" required formData={formData} onChange={handleChange} />
                                <InputField label="Email" name="email" type="email" required formData={formData} onChange={handleChange} />
                                {mode === 'add' && <InputField label="Password" name="password" type="password" required formData={formData} onChange={handleChange} />}
                                <InputField label="Mobile Number" name="mobileNumber" formData={formData} onChange={handleChange} />
                                <InputField label="Date of Birth" name="dob" type="date" formData={formData} onChange={handleChange} />
                                <InputField label="Gender" name="gender" formData={formData} onChange={handleChange} />
                                <InputField label="Blood Group" name="bloodGroup" formData={formData} onChange={handleChange} />
                                <InputField label="Aadhar No" name="aadharNo" formData={formData} onChange={handleChange} />
                                <InputField label="Community" name="community" formData={formData} onChange={handleChange} />
                                <InputField label="Religion" name="religion" formData={formData} onChange={handleChange} />
                                <InputField label="Nationality" name="nationality" formData={formData} onChange={handleChange} />
                                <InputField label="Mother Tongue" name="motherTongue" formData={formData} onChange={handleChange} />
                                <InputField label="Father Name" name="fatherName" formData={formData} onChange={handleChange} />
                                <InputField label="Mother Name" name="motherName" formData={formData} onChange={handleChange} />
                                <InputField label="Guardian Name" name="guardianName" formData={formData} onChange={handleChange} />
                                <InputField label="Parent Occupation" name="parentOccupation" formData={formData} onChange={handleChange} />
                                <InputField label="Parent Income" name="parentIncome" formData={formData} onChange={handleChange} />
                            </Section>
                        )}

                        {activeTab === 'Academic' && (
                            <Section title="Academic Details" icon={BookOpen}>
                                <InputField label="Roll Number" name="rollNumber" formData={formData} onChange={handleChange} />
                                <InputField label="Register No" name="registerNo" formData={formData} onChange={handleChange} />
                                <InputField label="Enrollment No" name="enrollmentNo" formData={formData} onChange={handleChange} />
                                <InputField label="Department" name="department" formData={formData} onChange={handleChange} />
                                <InputField label="Course Name" name="courseName" formData={formData} onChange={handleChange} />
                                <InputField label="Semester" name="semester" type="number" formData={formData} onChange={handleChange} />
                                <InputField label="Section" name="section" formData={formData} onChange={handleChange} />
                                <InputField label="Batch" name="batch" formData={formData} onChange={handleChange} />
                                <InputField label="Student Status" name="studentStatus" formData={formData} onChange={handleChange} />
                                <InputField label="Regulation" name="regulation" formData={formData} onChange={handleChange} />
                                <InputField label="Current Year" name="currentYear" formData={formData} onChange={handleChange} />
                                <InputField label="Year of Completion" name="yearOfCompletion" formData={formData} onChange={handleChange} />
                            </Section>
                        )}

                        {activeTab === 'Admission' && (
                            <Section title="Admission Details" icon={ClipboardList}>
                                <InputField label="Admission No" name="admissionNo" formData={formData} onChange={handleChange} />
                                <InputField label="Admission Year" name="admissionYear" formData={formData} onChange={handleChange} />
                                <InputField label="DTE Register No" name="dteRegisterNo" formData={formData} onChange={handleChange} />
                                <InputField label="DTE Admission No" name="dteAdmissionNo" formData={formData} onChange={handleChange} />
                                <InputField label="Entrance Marks Min" name="entranceMarksMin" formData={formData} onChange={handleChange} />
                                <InputField label="Entrance Marks Max" name="entranceMarksMax" formData={formData} onChange={handleChange} />
                            </Section>
                        )}

                        {activeTab === 'Address' && (
                            <Section title="Address & Contact" icon={MapPin}>
                                <div className="sdm-form-group sdm-full-width">
                                    <label className="sdm-label">Permanent Address</label>
                                    <textarea name="permanentAddress" value={formData.permanentAddress || ''} onChange={handleChange} className="sdm-textarea" rows="3"></textarea>
                                </div>
                                <div className="sdm-form-group sdm-full-width">
                                    <label className="sdm-label">Present Address</label>
                                    <textarea name="address" value={formData.address || ''} onChange={handleChange} className="sdm-textarea" rows="3"></textarea>
                                </div>
                                <InputField label="Parent Contact" name="parentContact" formData={formData} onChange={handleChange} />
                                <InputField label="Parent Email" name="parentEmailId" formData={formData} onChange={handleChange} />
                                <InputField label="Official Email" name="officialEmailId" formData={formData} onChange={handleChange} />
                            </Section>
                        )}

                        {activeTab === 'Hostel' && (
                            <Section title="Hostel Details" icon={Briefcase}>
                                <InputField label="Hosteller/Dayscholar" name="hostellerDayScholar" formData={formData} onChange={handleChange} />
                                <InputField label="Hostel Name" name="hostelName" formData={formData} onChange={handleChange} />
                                <InputField label="Room No" name="hostelRoomNo" formData={formData} onChange={handleChange} />
                                <InputField label="Room Type" name="hostelRoomType" formData={formData} onChange={handleChange} />
                                <InputField label="Warden Name" name="wardenName" formData={formData} onChange={handleChange} />
                            </Section>
                        )}

                        {activeTab === 'School' && (
                            <Section title="School Details" icon={GraduationCap}>
                                <InputField label="School Name" name="schoolName" formData={formData} onChange={handleChange} />
                                <InputField label="School Qualification" name="schoolQualification" formData={formData} onChange={handleChange} />
                                <InputField label="Year of Pass" name="schoolYearOfPass" formData={formData} onChange={handleChange} />
                                <InputField label="Physics Marks" name="schoolMarkPctPhysics" formData={formData} onChange={handleChange} />
                                <InputField label="Chemistry Marks" name="schoolMarkPctChemistry" formData={formData} onChange={handleChange} />
                                <InputField label="Maths Marks" name="schoolMarkPctMathematics" formData={formData} onChange={handleChange} />
                                <InputField label="CutOff (200)" name="schoolCutOff200" formData={formData} onChange={handleChange} />
                            </Section>
                        )}

                        {activeTab === 'Institute' && (
                            <Section title="Institute Details" icon={Calendar}>
                                <InputField label="TC No" name="bitTCNo" formData={formData} onChange={handleChange} />
                                <InputField label="TC Date" name="bitTCDate" formData={formData} onChange={handleChange} />
                                <InputField label="Final CGPA" name="cgpa" formData={formData} onChange={handleChange} />
                                <InputField label="Final Classification" name="finalClassification" formData={formData} onChange={handleChange} />
                            </Section>
                        )}

                    </form>
                </div>

                <div className="sdm-footer">
                    <button type="button" onClick={onClose} className="sdm-btn-cancel">Cancel</button>
                    <button type="submit" form="student-form" className="sdm-btn-save">
                        <Save size={18} />
                        Save Student
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentDetailsModal;
