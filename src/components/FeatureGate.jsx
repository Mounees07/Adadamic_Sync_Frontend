import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { ShieldOff } from 'lucide-react';

/**
 * FeatureGate — wraps any page/section and shows a "disabled" banner
 * when the matching admin feature toggle is OFF.
 *
 * Props:
 *  featureKey  — e.g. 'feature.leave.enabled'
 *  title       — human-readable feature name shown in the banner
 *  children    — content to show when the feature IS enabled
 */
const FeatureGate = ({ featureKey, title, children }) => {
    const { getBool, settingsLoaded } = useSettings();

    // While settings are loading, render children (avoids flash of disabled state)
    if (!settingsLoaded) return children;

    if (!getBool(featureKey, true)) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                gap: '20px',
                padding: '40px',
                textAlign: 'center'
            }}>
                <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '20px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <ShieldOff size={36} color="#ef4444" />
                </div>
                <div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '8px'
                    }}>
                        {title || 'This Feature'} is Disabled
                    </h2>
                    <p style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.95rem',
                        maxWidth: '400px',
                        lineHeight: 1.6
                    }}>
                        This module has been temporarily disabled by the administrator.
                        Please contact your admin to re-enable it.
                    </p>
                </div>
                <div style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px dashed rgba(239,68,68,0.3)',
                    fontSize: '0.8rem',
                    color: '#ef4444',
                    fontWeight: 600
                }}>
                    🔒 Feature key: <code style={{ fontFamily: 'monospace' }}>{featureKey}</code>
                </div>
            </div>
        );
    }

    return children;
};

export default FeatureGate;
