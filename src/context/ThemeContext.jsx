import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Default to 'system' if no preference acts as a sane default, or strictly 'dark' if preferred
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('app-theme');
        return savedTheme || 'system';
    });

    const [resolvedTheme, setResolvedTheme] = useState('dark');

    useEffect(() => {
        const handleResize = () => {
            const root = document.documentElement;
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            const newResolvedTheme = theme === 'system' ? systemTheme : theme;

            setResolvedTheme(newResolvedTheme);

            if (newResolvedTheme === 'light') {
                root.setAttribute('data-theme', 'light');
            } else {
                root.setAttribute('data-theme', 'dark');
            }
        };

        handleResize(); // Initial check

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => {
            if (theme === 'system') {
                handleResize();
            }
        };

        mediaQuery.addEventListener('change', listener);

        // Save preference
        localStorage.setItem('app-theme', theme);

        return () => mediaQuery.removeEventListener('change', listener);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => {
            if (prev === 'system') {
                return resolvedTheme === 'dark' ? 'light' : 'dark';
            }
            return prev === 'dark' ? 'light' : 'dark';
        });
    };

    const value = {
        theme,
        setTheme,
        toggleTheme,
        resolvedTheme,
        isDark: resolvedTheme === 'dark'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
