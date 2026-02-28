import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    googleProvider,
    auth,
    sendPasswordResetEmail
} from '../firebase/firebase';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loginWithGoogle = async () => {
        setError("");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const loginWithEmail = async (email, password) => {
        setError("");
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            // Force immediate user data refresh after login
            if (result.user) {
                try {
                    const response = await api.get(`/users/${result.user.uid}`);
                    setUserData(response.data);
                    console.log("✅ User data refreshed after login:", response.data);
                } catch (err) {
                    console.error("Failed to fetch user data after login:", err);
                }
            }
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const signupWithEmail = async (email, password, fullName, role = 'STUDENT') => {
        setError("");
        try {
            let userCredential;
            try {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } catch (createError) {
                if (createError.code === 'auth/email-already-in-use') {
                    // If user exists in Firebase, try logging in to get the token and update DB
                    userCredential = await signInWithEmailAndPassword(auth, email, password);
                } else {
                    throw createError;
                }
            }

            const token = await userCredential.user.getIdToken();
            const regData = {
                firebaseUid: userCredential.user.uid,
                email: email,
                fullName: fullName,
                role: role
            };

            // Send registration data to backend (which now handles updates)
            const response = await api.post('/users/register', regData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setUserData(response.data);
            return userCredential;
        } catch (err) {
            console.error("Signup Error:", err);
            setError(err.message);
            throw err;
        }
    };

    const logout = () => {
        setError("");
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    // Fetch user details from backend using our interceptor-enabled api
                    const response = await api.get(`/users/${user.uid}`);
                    setUserData(response.data);
                } catch (err) {
                    console.error("User not found in database, might need registration", err);
                    // Auto-registration for Google users if not in DB
                    if (user.providerData[0].providerId === 'google.com') {
                        try {
                            // NOTE: Google login defaults to STUDENT. 
                            // If a different role is needed, the user must use the specific Role Sign-up form first.
                            const regRes = await api.post('/users/register', {
                                firebaseUid: user.uid,
                                email: user.email,
                                fullName: user.displayName,
                                profilePictureUrl: user.photoURL,
                                role: 'STUDENT'
                            });
                            setUserData(regRes.data);
                        } catch (regErr) {
                            console.error("Google auto-registration failed", regErr);
                        }
                    }
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const resetPassword = (email) => {
        return sendPasswordResetEmail(auth, email);
    };

    const [systemSettings, setSystemSettings] = useState({});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch public features without auth first, or use a public endpoint
                const res = await api.get('/admin/settings/public/features');
                // Wait, I created it at /api/admin/settings/public/features ??
                // Controller mapping is @RequestMapping("/api/admin/settings")
                // Method mapping is @GetMapping("/public/features")
                // So URL is /api/admin/settings/public/features
                setSystemSettings(res.data);
            } catch (err) {
                console.error("Failed to fetch system settings", err);
                // Fallback to defaults if fetch fails
                setSystemSettings({
                    'feature.leave.enabled': 'true',
                    'feature.result.enabled': 'true',
                    'feature.analytics.enabled': 'true',
                    'feature.messaging.enabled': 'true'
                });
            }
        };
        fetchSettings();
    }, []);

    const value = {
        currentUser,
        userData,
        loading,
        error,
        systemSettings, // Expose settings
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
