import React, { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import TopBar from './TopBar';

const AdminProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (!loading) {
      setIsVerifying(false);
    }
  }, [loading]);

  if (isVerifying || loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  if (user?.role !== 'admin') {
    // Hidden so non-admins don't even know it exists
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <TopBar userProfile={{ name: user?.full_name }} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
            <p className="text-gray-500 dark:text-gray-400">Page not found</p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminProtectedRoute;
