import React from 'react';

/**
 * ErrorBoundary — catches unhandled errors in child component trees
 * and shows a graceful fallback instead of a white screen-of-death.
 *
 * Scalability / Resilience: Without this, a single buggy component
 * (e.g. a dashboard card that receives unexpected API data) crashes
 * the ENTIRE page. With this, only the failing subtree is replaced
 * by the fallback UI; everything else continues working.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // In production you'd send this to an error monitoring service (e.g. Sentry)
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 24px',
                    textAlign: 'center',
                    color: 'var(--text-primary, #1e293b)',
                    minHeight: '200px',
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px' }}>
                        Something went wrong
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
                        {this.props.message || 'This section failed to load. Other parts of the app are still working.'}
                    </p>
                    <button
                        onClick={this.handleReset}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--accent, #6366f1)',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
