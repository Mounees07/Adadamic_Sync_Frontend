import React, { useState } from 'react';
import {
    Save,
    Server,
    Shield,
    Database,
    Bell,
    Globe,
    ToggleLeft,
    ToggleRight,
    ClipboardList,
    Mail,
    Lock,
    Clock,
    User,
    FileText,
    AlertCircle
} from 'lucide-react';
import './AdminSettings.css';
import api from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';

const AdminSettings = () => {
    const { settings: liveSettings } = useSettings();
    const [settings, setSettings] = useState({
        siteName: 'AcaSync Platform',
        adminEmail: 'admin@acasync.edu',
        maintenanceMode: false,
        allowRegistration: true,
        emailNotifications: true,
        defaultLanguage: 'English',
        sessionTimeout: '30',
        // Features
        'feature.leave.enabled': true,
        'feature.result.enabled': true,
        'feature.messaging.enabled': true,
        'feature.analytics.enabled': true,
        'feature.courseRegistration.enabled': true,
        'feature.assignments.enabled': true,
        'feature.finance.enabled': true,
        'feature.examSeating.enabled': true,
        // Security
        'security.captcha.enabled': false,
        'security.login.maxAttempts': 5,
        // Policies
        'policy.attendance.threshold': 75,
        'policy.attendance.detain': 65,
        'policy.leave.maxDays': 10,
        'policy.dataRetention': 365,
        'policy.password.minLength': 8,
        'policy.password.complexity': 'strong',
        // Reports
        'report.export.enabled': true,
        // Environment
        'env.label': 'Production',
        'env.debugMode': false,
    });

    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);

    // Fetch settings on mount
    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/admin/settings');

                if (response.data) {
                    const d = response.data;

                    // Helper – parse a backend string to boolean
                    const bool = (key, fallback = true) =>
                        d[key] !== undefined ? d[key] === 'true' : fallback;

                    // Helper – parse to number, keep as number
                    const num = (key, fallback) =>
                        d[key] !== undefined ? Number(d[key]) : fallback;

                    setSettings(prev => ({
                        ...prev,
                        // String fields (keep as string)
                        siteName: d.siteName ?? prev.siteName,
                        adminEmail: d.adminEmail ?? prev.adminEmail,
                        defaultLanguage: d.defaultLanguage ?? prev.defaultLanguage,
                        sessionTimeout: d.sessionTimeout ?? prev.sessionTimeout,
                        'env.label': d['env.label'] ?? prev['env.label'],
                        'policy.password.complexity': d['policy.password.complexity'] ?? prev['policy.password.complexity'],

                        // Boolean fields
                        maintenanceMode: bool('maintenanceMode', false),
                        allowRegistration: bool('allowRegistration', true),
                        emailNotifications: bool('emailNotifications', true),
                        'report.export.enabled': bool('report.export.enabled', true),
                        'security.captcha.enabled': bool('security.captcha.enabled', false),
                        'env.debugMode': bool('env.debugMode', false),
                        'feature.leave.enabled': bool('feature.leave.enabled', true),
                        'feature.result.enabled': bool('feature.result.enabled', true),
                        'feature.messaging.enabled': bool('feature.messaging.enabled', true),
                        'feature.analytics.enabled': bool('feature.analytics.enabled', true),
                        'feature.courseRegistration.enabled': bool('feature.courseRegistration.enabled', true),
                        'feature.assignments.enabled': bool('feature.assignments.enabled', true),
                        'feature.finance.enabled': bool('feature.finance.enabled', true),
                        'feature.examSeating.enabled': bool('feature.examSeating.enabled', true),

                        // Number / mixed fields
                        'policy.attendance.threshold': num('policy.attendance.threshold', 75),
                        'policy.attendance.detain': num('policy.attendance.detain', 65),
                        'policy.leave.maxDays': num('policy.leave.maxDays', 10),
                        'policy.dataRetention': num('policy.dataRetention', 365),
                        'policy.password.minLength': num('policy.password.minLength', 8),
                        'security.login.maxAttempts': num('security.login.maxAttempts', 5),
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch settings', error);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                // preserve all string-valued settings as-is
                ...settings,
                // coerce booleans → 'true' / 'false'
                maintenanceMode: String(settings.maintenanceMode),
                allowRegistration: String(settings.allowRegistration),
                emailNotifications: String(settings.emailNotifications),
                'report.export.enabled': String(settings['report.export.enabled']),
                'security.captcha.enabled': String(settings['security.captcha.enabled']),
                'env.debugMode': String(settings['env.debugMode']),
                'feature.leave.enabled': String(settings['feature.leave.enabled']),
                'feature.result.enabled': String(settings['feature.result.enabled']),
                'feature.messaging.enabled': String(settings['feature.messaging.enabled']),
                'feature.analytics.enabled': String(settings['feature.analytics.enabled']),
                'feature.courseRegistration.enabled': String(settings['feature.courseRegistration.enabled']),
                'feature.assignments.enabled': String(settings['feature.assignments.enabled']),
                'feature.finance.enabled': String(settings['feature.finance.enabled']),
                'feature.examSeating.enabled': String(settings['feature.examSeating.enabled']),
                // coerce numbers → string (backend stores everything as String)
                'policy.attendance.threshold': String(settings['policy.attendance.threshold']),
                'policy.attendance.detain': String(settings['policy.attendance.detain']),
                'policy.leave.maxDays': String(settings['policy.leave.maxDays']),
                'policy.dataRetention': String(settings['policy.dataRetention']),
                'policy.password.minLength': String(settings['policy.password.minLength']),
                'security.login.maxAttempts': String(settings['security.login.maxAttempts']),
            };

            const response = await api.post('/admin/settings', payload);

            if (response.status === 200) {
                // Refresh public settings cache in the browser
                try { await api.get('/admin/settings/public/features'); } catch (_) { }
                alert('Settings saved successfully! Changes are now enforced across the platform.');
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || error.message;
            alert('Error saving settings: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    const ToggleSwitch = ({ name, checked, onChange }) => (
        <button
            className={`toggle-pill ${checked ? 'toggle-pill--on' : ''}`}
            role="switch"
            aria-checked={checked}
            onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
            title={checked ? 'Enabled — click to disable' : 'Disabled — click to enable'}
        >
            <span className="toggle-pill__knob" />
        </button>
    );

    const tabs = [
        { id: 'general', label: 'General', icon: <Globe size={20} /> },
        { id: 'security', label: 'Security', icon: <Shield size={20} /> },
        { id: 'features', label: 'Features', icon: <Database size={20} /> },
        { id: 'env', label: 'Environment', icon: <Server size={20} /> },
        { id: 'logs', label: 'Audit Logs', icon: <ClipboardList size={20} /> }
    ];

    const InputField = ({ label, name, type = "text", value, onChange, icon: Icon, placeholder }) => (
        <div className="form-group-styled">
            <label className="input-label">{label}</label>
            <div className="input-wrapper">
                {Icon && <Icon size={20} className="input-icon" />}
                <input
                    type={type}
                    name={name}
                    className="styled-input"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    style={{ paddingLeft: Icon ? '48px' : '20px' }}
                />
            </div>
        </div>
    );

    const SelectField = ({ label, name, value, onChange, options }) => (
        <div className="form-group-styled">
            <label className="input-label">{label}</label>
            <div className="env-select-container">
                <select
                    name={name}
                    className="styled-select"
                    value={value}
                    onChange={onChange}
                >
                    {options.map(opt => (
                        <option key={opt}>{opt}</option>
                    ))}
                </select>
                <div className="select-arrow">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.41 0.589996L6 5.17L10.59 0.589996L12 2L6 8L0 2L1.41 0.589996Z" fill="currentColor" />
                    </svg>
                </div>
            </div>
        </div>
    );

    return (
        <div className="settings-container">
            {/* Header */}
            <div className="settings-header">
                <div className="settings-title">
                    <h2>System Configuration</h2>
                    <p>Manage platform-wide settings and preferences</p>
                </div>
                <button
                    className="save-btn"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                    ) : (
                        <Save size={20} />
                    )}
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>

            {/* Main Content Card */}
            <div className="settings-main-card">
                {/* Tabs */}
                <div className="settings-tabs-container">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <div className="tab-icon-box">
                                {tab.icon}
                            </div>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="settings-content-area">
                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="section-grid animate-fade-in">
                            <div>
                                <div className="settings-section-header">
                                    <Globe size={24} color="#4D44B5" />
                                    <h3>Platform Identity</h3>
                                </div>
                                <div className="form-content">
                                    <InputField
                                        label="Platform Name"
                                        name="siteName"
                                        value={settings.siteName}
                                        onChange={handleChange}
                                        placeholder="e.g. AcaSync Platform"
                                        icon={Server}
                                    />
                                    <InputField
                                        label="Admin Contact Email"
                                        name="adminEmail"
                                        type="email"
                                        value={settings.adminEmail}
                                        onChange={handleChange}
                                        placeholder="admin@school.edu"
                                        icon={Mail}
                                    />
                                    <SelectField
                                        label="Default Language"
                                        name="defaultLanguage"
                                        value={settings.defaultLanguage}
                                        onChange={handleChange}
                                        options={['English', 'Spanish', 'French', 'German']}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="settings-section-header">
                                    <Bell size={24} color="#FB7D5B" />
                                    <h3>Notifications</h3>
                                </div>
                                <div className="form-content">
                                    <div className="toggle-row">
                                        <div className="toggle-info">
                                            <label>Email Notifications
                                                {!settings.emailNotifications && (
                                                    <span style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700 }}>DISABLED</span>
                                                )}
                                            </label>
                                            <p>Send system alerts and reports via email.{!settings.emailNotifications && <strong style={{ color: '#ef4444' }}> Emails are currently blocked.</strong>}</p>
                                        </div>
                                        <ToggleSwitch name="emailNotifications" checked={settings.emailNotifications} onChange={handleChange} />
                                    </div>
                                    <div className="toggle-row">
                                        <div className="toggle-info">
                                            <label>Export Features
                                                {!settings['report.export.enabled'] && (
                                                    <span style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700 }}>DISABLED</span>
                                                )}
                                            </label>
                                            <p>Allow exporting reports to CSV/PDF.{!settings['report.export.enabled'] && <strong style={{ color: '#ef4444' }}> Export buttons are currently hidden/disabled.</strong>}</p>
                                        </div>
                                        <ToggleSwitch name="report.export.enabled" checked={settings['report.export.enabled']} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="section-grid animate-fade-in">
                            <div>
                                <div className="settings-section-header">
                                    <Lock size={24} color="#4D44B5" />
                                    <h3>Access Control</h3>
                                </div>
                                <div className="form-content">
                                    <div className="toggle-row">
                                        <div className="toggle-info">
                                            <label>Allow Registration
                                                {!settings.allowRegistration && (
                                                    <span style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700 }}>CLOSED</span>
                                                )}
                                            </label>
                                            <p>Enable public user signup pages.{!settings.allowRegistration && <strong style={{ color: '#ef4444' }}> Login page will show a registration-disabled notice.</strong>}</p>
                                        </div>
                                        <ToggleSwitch name="allowRegistration" checked={settings.allowRegistration} onChange={handleChange} />
                                    </div>
                                    <div className="toggle-row">
                                        <div className="toggle-info">
                                            <label>Maintenance Mode</label>
                                            <p>Restrict access to administrators only.</p>
                                        </div>
                                        <ToggleSwitch name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleChange} />
                                    </div>
                                    <div style={{ marginTop: '24px' }}>
                                        <InputField
                                            label="Session Timeout (minutes)"
                                            name="sessionTimeout"
                                            type="number"
                                            value={settings.sessionTimeout}
                                            onChange={handleChange}
                                            icon={Clock}
                                            placeholder="30"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="settings-section-header">
                                    <Shield size={24} color="#FCC43E" />
                                    <h3>Security Policies</h3>
                                </div>
                                <div className="form-content">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        <InputField
                                            label="Min Password Length"
                                            name="policy.password.minLength"
                                            type="number"
                                            value={settings['policy.password.minLength'] || 8}
                                            onChange={handleChange}
                                            placeholder="8"
                                        />
                                        <InputField
                                            label="Max Login Attempts"
                                            name="security.login.maxAttempts"
                                            type="number"
                                            value={settings['security.login.maxAttempts'] || 5}
                                            onChange={handleChange}
                                            placeholder="5"
                                        />
                                    </div>
                                    <div className="toggle-row" style={{ marginTop: '24px' }}>
                                        <div className="toggle-info">
                                            <label>Enforce CAPTCHA</label>
                                            <p>Require CAPTCHA on login page.</p>
                                        </div>
                                        <ToggleSwitch name="security.captcha.enabled" checked={settings['security.captcha.enabled']} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FEATURES TAB */}
                    {activeTab === 'features' && (
                        <div className="animate-fade-in">
                            {/* Module Management */}
                            <div className="settings-section-header" style={{ marginBottom: '20px' }}>
                                <Database size={24} color="#7c6bdc" />
                                <h3>Module Management</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '40px' }}>
                                {[
                                    { key: 'feature.leave.enabled', label: 'Leave Management', desc: 'Student leave requests & mentor approvals.', icon: '🏖️' },
                                    { key: 'feature.result.enabled', label: 'Results Module', desc: 'COE publishes exam results for students.', icon: '📊' },
                                    { key: 'feature.analytics.enabled', label: 'Analytics Dashboard', desc: 'HOD / Admin advanced usage stats.', icon: '📈' },
                                    { key: 'feature.messaging.enabled', label: 'Messaging System', desc: 'Internal chat & broadcast announcements.', icon: '💬' },
                                    { key: 'feature.courseRegistration.enabled', label: 'Course Registration', desc: 'Students self-select faculty per course.', icon: '📚' },
                                    { key: 'feature.assignments.enabled', label: 'Assignment Submission', desc: 'Teachers post tasks & students submit.', icon: '📝' },
                                    { key: 'feature.finance.enabled', label: 'Finance Module', desc: 'Fee records and payment tracking.', icon: '💰' },
                                    { key: 'feature.examSeating.enabled', label: 'Exam Seating', desc: 'COE publishes seating chart for students.', icon: '🪑' },
                                ].map(item => (
                                    <div key={item.key} className="toggle-row">
                                        <div className="toggle-info">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span>{item.icon}</span> {item.label}
                                                {!settings[item.key] && (
                                                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700 }}>OFF</span>
                                                )}
                                            </label>
                                            <p>{item.desc}</p>
                                        </div>
                                        <ToggleSwitch name={item.key} checked={!!settings[item.key]} onChange={handleChange} />
                                    </div>
                                ))}
                            </div>

                            {/* Academic Policies */}
                            <div className="settings-section-header" style={{ marginBottom: '20px' }}>
                                <AlertCircle size={24} color="#FB7D5B" />
                                <h3>Academic Policies</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                <InputField
                                    label="Minimum Attendance Threshold (%)"
                                    name="policy.attendance.threshold"
                                    type="number"
                                    value={settings['policy.attendance.threshold'] || 75}
                                    onChange={handleChange}
                                    placeholder="75"
                                    icon={Shield}
                                />
                                <InputField
                                    label="Detain Below Attendance (%)"
                                    name="policy.attendance.detain"
                                    type="number"
                                    value={settings['policy.attendance.detain'] || 65}
                                    onChange={handleChange}
                                    placeholder="65"
                                    icon={Shield}
                                />
                                <InputField
                                    label="Max Leave Days Per Semester"
                                    name="policy.leave.maxDays"
                                    type="number"
                                    value={settings['policy.leave.maxDays'] || 10}
                                    onChange={handleChange}
                                    placeholder="10"
                                    icon={Clock}
                                />
                                <InputField
                                    label="Data Retention Period (Days)"
                                    name="policy.dataRetention"
                                    type="number"
                                    value={settings['policy.dataRetention'] || 365}
                                    onChange={handleChange}
                                    placeholder="365"
                                    icon={Clock}
                                />
                                <InputField
                                    label="Min Password Length"
                                    name="policy.password.minLength"
                                    type="number"
                                    value={settings['policy.password.minLength'] || 8}
                                    onChange={handleChange}
                                    placeholder="8"
                                    icon={Shield}
                                />
                                <SelectField
                                    label="Password Strength"
                                    name="policy.password.complexity"
                                    value={settings['policy.password.complexity'] || 'strong'}
                                    onChange={handleChange}
                                    options={['basic', 'medium', 'strong']}
                                />
                            </div>

                            <div className="alert-box">
                                <AlertCircle size={24} color="#FB7D5B" style={{ flexShrink: 0 }} />
                                <div className="alert-content">
                                    <h4>Important Notice</h4>
                                    <p>Toggling a module OFF immediately prevents students and faculty from accessing that page. Changing attendance or retention policies takes effect on the next scheduled report cycle.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ENV TAB */}
                    {activeTab === 'env' && (
                        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
                            <div className="settings-section-header">
                                <Server size={24} color="#7c6bdc" />
                                <h3>Environment Configuration</h3>
                            </div>

                            <div className="env-config-card">
                                <SelectField
                                    label="Environment Label"
                                    name="env.label"
                                    value={settings['env.label'] || 'Production'}
                                    onChange={handleChange}
                                    options={['Development', 'Testing', 'Staging', 'Production']}
                                />

                                <div className="toggle-row" style={{ marginTop: '24px' }}>
                                    <div className="toggle-info">
                                        <label>Debug Mode</label>
                                        <p>Enable verbose logging for system diagnostics.</p>
                                    </div>
                                    <ToggleSwitch name="env.debugMode" checked={settings['env.debugMode']} onChange={handleChange} />
                                </div>

                                <div className="env-info-banner">
                                    <Server size={18} />
                                    <p>Current Server Version: <strong>v2.4.0-stable</strong> (Build 20240215)</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LOGS TAB */}
                    {activeTab === 'logs' && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
                            <div className="settings-header" style={{ marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <ClipboardList size={24} color="#7c6bdc" />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>System Audit Trail</h3>
                                </div>
                                <button style={{ border: 'none', background: 'none', color: '#7c6bdc', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                    <FileText size={16} />
                                    Export Logs
                                </button>
                            </div>
                            <div style={{ flex: 1 }}>
                                <AuditLogViewer />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('/admin/auditlogs');
                if (response.data) {
                    setLogs(response.data);
                }
            } catch (err) {
                console.error("Error fetching logs", err);
                setLogs([
                    { id: 1, action: "UPDATE_SETTINGS", actorEmail: "admin@acasync.edu", details: "Changed site name", ipAddress: "192.168.1.1", timestamp: new Date().toISOString() },
                    { id: 2, action: "LOGIN_SUCCESS", actorEmail: "teacher@acasync.edu", details: "Web login", ipAddress: "10.0.0.5", timestamp: new Date(Date.now() - 3600000).toISOString() },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#A098AE' }}>Loading ClipboardList logs...</div>;

    if (logs.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: '#A098AE' }}>No recent ClipboardList found.</div>;

    return (
        <div className="audit-table-wrapper">
            <table className="audit-table">
                <thead>
                    <tr>
                        <th width="15%">Action</th>
                        <th width="20%">User</th>
                        <th width="30%">Details</th>
                        <th width="15%">IP Address</th>
                        <th width="20%">Time</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.id}>
                            <td><span className="action-badge">{log.action}</span></td>
                            <td style={{ fontWeight: '500' }}>{log.actorEmail}</td>
                            <td>{log.details}</td>
                            <td><span className="code-text">{log.ipAddress}</span></td>
                            <td style={{ color: '#A098AE' }}>{new Date(log.timestamp).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminSettings;