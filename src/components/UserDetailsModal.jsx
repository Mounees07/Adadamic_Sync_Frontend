import React, { useState, useEffect } from 'react';
import { X, Save, User, Briefcase, MapPin, Shield } from 'lucide-react';
import '../components/StudentDetailsModal.css';

const InputField = ({ label, name, type = "text", required = false, formData, onChange, readOnly = false }) => (
    <div className="sdm-form-group">
        <label className="sdm-label">{label}</label>
        <input
            type={type}
            name={name}
            value={formData[name] || ''}
            onChange={onChange}
            required={required}
            readOnly={readOnly}
            className="sdm-input"
            style={readOnly ? { backgroundColor: '#F8F9FF', opacity: 0.8 } : {}}
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

const UserDetailsModal = ({ user, mode, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('Personal');
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (user && mode === 'edit') {
            setFormData(user);
        } else {
            setFormData({
                role: 'TEACHER',
                fullName: '',
                email: '',
                password: 'password123',
            });
        }
    }, [user, mode]);

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
        { id: 'Professional', label: 'Professional', icon: Briefcase },
        { id: 'Security', label: 'Security & Access', icon: Shield },
        { id: 'Address', label: 'Address', icon: MapPin },
    ];

    return (
        <div className="sdm-overlay">
            <div className="sdm-content">
                <div className="sdm-header">
                    <h2 className="sdm-title">{mode === 'add' ? 'Add New User' : 'Edit User Details'}</h2>
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
                    <form id="user-form" onSubmit={handleSubmit}>

                        {activeTab === 'Personal' && (
                            <Section title="Personal Details" icon={User}>
                                <InputField label="Full Name" name="fullName" required formData={formData} onChange={handleChange} />
                                <InputField label="Email" name="email" type="email" required formData={formData} onChange={handleChange} />
                                <InputField label="Mobile Number" name="mobileNumber" formData={formData} onChange={handleChange} />
                                <InputField label="Date of Birth" name="dob" type="date" formData={formData} onChange={handleChange} />
                                <InputField label="Gender" name="gender" formData={formData} onChange={handleChange} />
                                <InputField label="Blood Group" name="bloodGroup" formData={formData} onChange={handleChange} />
                            </Section>
                        )}

                        {activeTab === 'Professional' && (
                            <Section title="Professional Details" icon={Briefcase}>
                                <InputField label="Employee/ID Number" name="rollNumber" formData={formData} onChange={handleChange} />
                                <InputField label="Department" name="department" formData={formData} onChange={handleChange} />
                                <InputField label="Designation" name="parentDesignation" formData={formData} onChange={handleChange} />
                                <InputField label="Official Email" name="officialEmailId" formData={formData} onChange={handleChange} />
                                <InputField label="Date of Joining" name="admissionYear" formData={formData} onChange={handleChange} />
                            </Section>
                        )}

                        {activeTab === 'Security' && (
                            <Section title="System Access" icon={Shield}>
                                <div className="sdm-form-group">
                                    <label className="sdm-label">Account Role</label>
                                    <select
                                        name="role"
                                        value={formData.role || 'TEACHER'}
                                        onChange={handleChange}
                                        className="sdm-input"
                                        style={{ appearance: 'auto' }}
                                    >
                                        {['STUDENT', 'TEACHER', 'MENTOR', 'HOD', 'ADMIN', 'COE', 'PRINCIPAL', 'GATE_SECURITY'].map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                                {mode === 'add' && <InputField label="Temporary Password" name="password" type="password" required formData={formData} onChange={handleChange} />}
                                {mode === 'edit' && <InputField label="User ID (Read Only)" name="firebaseUid" readOnly formData={formData} onChange={handleChange} />}
                            </Section>
                        )}

                        {activeTab === 'Address' && (
                            <Section title="Address Details" icon={MapPin}>
                                <div className="sdm-form-group sdm-full-width">
                                    <label className="sdm-label">Permanent Address</label>
                                    <textarea name="permanentAddress" value={formData.permanentAddress || ''} onChange={handleChange} className="sdm-textarea" rows="3"></textarea>
                                </div>
                                <div className="sdm-form-group sdm-full-width">
                                    <label className="sdm-label">Present Address</label>
                                    <textarea name="address" value={formData.address || ''} onChange={handleChange} className="sdm-textarea" rows="3"></textarea>
                                </div>
                            </Section>
                        )}

                    </form>
                </div>

                <div className="sdm-footer">
                    <button type="button" onClick={onClose} className="sdm-btn-cancel">Cancel</button>
                    <button type="submit" form="user-form" className="sdm-btn-save">
                        <Save size={18} />
                        Save User
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
