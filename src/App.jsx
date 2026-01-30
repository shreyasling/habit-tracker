import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ProductivityTracker from './modules/ProductivityTracker';
import TomorrowPlans from './modules/TomorrowPlans';
import Finance from './modules/Finance';
import LoginScreen from './components/Auth/LoginScreen';
import { onAuthChange, logOut } from './firebase/authService';
import { toastInfo, toastError } from './components/Toast/Toast';
import './App.css';

function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logOut();
      toastInfo('Signed out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toastError('Failed to sign out. Please try again.');
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Home / Dashboard */}
        <Route
          path="/"
          element={<Home user={user} onLogout={handleLogout} />}
        />

        {/* Productivity Tracker Module */}
        <Route
          path="/productivity-tracker"
          element={<ProductivityTracker user={user} />}
        />

        {/* Tomorrow's Plans Module */}
        <Route
          path="/tomorrow-plans"
          element={<TomorrowPlans user={user} />}
        />

        {/* Finance Module */}
        <Route
          path="/finance/*"
          element={<Finance user={user} />}
        />

        {/* Catch all - redirect to home */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
