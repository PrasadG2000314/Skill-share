import { createContext, useState, useEffect } from 'react';
import { api, authApi, userApi } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Ensure token is properly set in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token and get user data
          const response = await authApi.getCurrentUser();
          setCurrentUser(response.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth validation error:', error);
        // Handle invalid token
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
  
    initializeAuth();
  }, []);
  
  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password });
      
      // The backend returns accessToken instead of jwt
      const { accessToken, userId } = response.data;
      localStorage.setItem('token', accessToken);
      
      // Immediately set the token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Get user details with a separate request
      const userResponse = await authApi.getCurrentUser();
      const user = userResponse.data;
      
      // Update context state
      setCurrentUser(user);
      setIsAuthenticated(true);
      debugAuthStatus();

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Invalid credentials. Please try again.'
      };
    }
  };

  const debugAuthStatus = () => {
    console.log('Token in localStorage:', localStorage.getItem('token'));
    console.log('Auth header:', api.defaults.headers.common['Authorization']);
  };
  const register = async (name, email, password, profileData = {}) => {
    try {
      // Combine basic user data with profile data
      const userData = {
        name,
        email,
        password,
        ...profileData
      };
      
      // Call the register endpoint
      await authApi.register(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = () => {
    try {
      authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clean up local state
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const updateAuthUser = (userData) => {
    setCurrentUser(userData);
  };

  const updateUserData = async (userData) => {
    try {
      const response = await userApi.updateUser(userData);
      setCurrentUser(response.data);
      console.log('Updated user:', response.data);
      return { success: true, user: response.data };
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update user data. Please try again.'
      };
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        isAuthenticated, 
        loading, 
        login, 
        register,
        logout,
        updateAuthUser,
        updateUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
