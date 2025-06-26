import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Set up axios interceptor for auth token
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        // Response interceptor to handle token expiration
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401 && token) {
                    // Token expired, try to refresh
                    try {
                        await refreshToken();
                    } catch (refreshError) {
                        logout();
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    // Check if user is already logged in on app load
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const response = await axios.get('/api/auth/me');
                    setUser(response.data.user);
                } catch (error) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    delete axios.defaults.headers.common['Authorization'];
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const register = async (userData) => {
        try {
            setError(null);
            const response = await axios.post('/api/auth/register', userData);

            const { access_token, refresh_token, user } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

            setUser(user);
            return { success: true, user };
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Registration failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await axios.post('/api/auth/login', { email, password });

            const { access_token, refresh_token, user } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

            setUser(user);
            return { success: true, user };
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const refreshToken = async () => {
        try {
            const refresh_token = localStorage.getItem('refresh_token');
            if (!refresh_token) {
                throw new Error('No refresh token');
            }

            const response = await axios.post('/api/auth/refresh', {}, {
                headers: { Authorization: `Bearer ${refresh_token}` }
            });

            const { access_token, user } = response.data;
            localStorage.setItem('access_token', access_token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

            setUser(user);
            return access_token;
        } catch (error) {
            logout();
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setError(null);
    };

    const clearError = () => {
        setError(null);
    };

    const getAuthToken = () => {
        return localStorage.getItem('access_token');
    };

    const googleAuth = async (credential) => {
        try {
            setError(null);
            const response = await axios.post('/api/auth/google', { credential });

            const { access_token, refresh_token, user } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

            setUser(user);
            return { success: true, user };
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Google authentication failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const value = {
        user,
        loading,
        error,
        register,
        login,
        logout,
        clearError,
        getAuthToken,
        googleAuth,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};