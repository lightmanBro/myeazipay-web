import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateWalletPage from './pages/CreateWalletPage';
import SendFundsPage from './pages/SendFundsPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import { useNotification } from './hooks/useNotification';
import { setGlobalNotification } from './utils/notifications';

function App() {
  const { showNotification, NotificationContainer } = useNotification();
  
  // Set global notification function for use in Apollo Client
  setGlobalNotification(showNotification);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <NotificationContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/create-wallet"
          element={
            <PrivateRoute>
              <CreateWalletPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/send-funds"
          element={
            <PrivateRoute>
              <SendFundsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <PrivateRoute>
              <TransactionHistoryPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;

