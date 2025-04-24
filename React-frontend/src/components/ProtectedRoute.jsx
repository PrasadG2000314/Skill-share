import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);
    const location = useLocation();
  
    // If still checking auth status, show a loader
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      );
    }
  
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
  
    // If authenticated, render the protected component
    return children;
  };

export default ProtectedRoute;
