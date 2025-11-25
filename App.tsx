import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { User } from './types';
import { MOCK_USER } from './services/mockService';
import Login from './pages/Login';
import Home from './pages/Home';
import SelectType from './pages/SelectType';
import DataUpload from './pages/DataUpload';
import ReportPreview from './pages/ReportPreview';
import History from './pages/History';
import Settings from './pages/Settings';
import { Layout } from './components/Layout';

// Auth Context
interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check local storage for persistent login simulation
    const savedUser = localStorage.getItem('baohantong_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = () => {
    setUser(MOCK_USER);
    localStorage.setItem('baohantong_user', JSON.stringify(MOCK_USER));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('baohantong_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/app/home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="create/select" element={<SelectType />} />
            <Route path="create/upload/:typeId" element={<DataUpload />} />
            <Route path="create/preview/:reportId" element={<ReportPreview />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;