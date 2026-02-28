import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

const SettingsContext = createContext({});

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        allowRegistration: true,
        emailNotifications: true,
        'report.export.enabled': true,
        'feature.leave.enabled': true,
        'feature.result.enabled': true,
        'feature.messaging.enabled': true,
        'feature.analytics.enabled': true,
        maintenanceMode: false,
    });
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    useEffect(() => {
        const fetchPublicSettings = async () => {
            try {
                const res = await api.get('/admin/settings/public/features');
                if (res.data) {
                    const coerced = {};
                    for (const [key, value] of Object.entries(res.data)) {
                        // Convert "true"/"false" strings to actual booleans
                        if (value === 'true') coerced[key] = true;
                        else if (value === 'false') coerced[key] = false;
                        else coerced[key] = value;
                    }
                    setSettings(prev => ({ ...prev, ...coerced }));
                }
            } catch (err) {
                console.warn('Could not load public settings, using defaults:', err.message);
            } finally {
                setSettingsLoaded(true);
            }
        };
        fetchPublicSettings();
    }, []);

    const getBool = (key, fallback = true) => {
        const val = settings[key];
        if (val === undefined) return fallback;
        return Boolean(val);
    };

    return (
        <SettingsContext.Provider value={{ settings, settingsLoaded, getBool }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
