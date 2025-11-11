import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery, gql } from '@apollo/client';
import styles from './Navbar.module.css';

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
    }
  }
`;

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data } = useQuery(ME_QUERY, { 
    skip: !isAuthenticated,
    errorPolicy: 'all'
  });
  const user = data?.me;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U';

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navbarContainer}>
        {/* Logo */}
        <Link to="/dashboard" className={styles.logo}>
          <div className={styles.logoIcon}></div>
          <span>WALLET</span>
        </Link>

        {/* Navigation Menu - Desktop */}
        <nav className={styles.navMenu}>
          <Link 
            to="/dashboard" 
            className={`${styles.navLink} ${isActive('/dashboard') ? styles.active : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/create-wallet" 
            className={`${styles.navLink} ${isActive('/create-wallet') ? styles.active : ''}`}
          >
            Create Wallet
          </Link>
          <Link 
            to="/send-funds" 
            className={`${styles.navLink} ${isActive('/send-funds') ? styles.active : ''}`}
          >
            Send Funds
          </Link>
          <Link 
            to="/transactions" 
            className={`${styles.navLink} ${isActive('/transactions') ? styles.active : ''}`}
          >
            Transactions
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <nav className={styles.mobileMenu}>
            <Link 
              to="/dashboard" 
              className={`${styles.mobileNavLink} ${isActive('/dashboard') ? styles.active : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/create-wallet" 
              className={`${styles.mobileNavLink} ${isActive('/create-wallet') ? styles.active : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Wallet
            </Link>
            <Link 
              to="/send-funds" 
              className={`${styles.mobileNavLink} ${isActive('/send-funds') ? styles.active : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Send Funds
            </Link>
            <Link 
              to="/transactions" 
              className={`${styles.mobileNavLink} ${isActive('/transactions') ? styles.active : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Transactions
            </Link>
          </nav>
        )}

        {/* Spacer */}
        <div className={styles.spacer}></div>

        {/* User Profile and Actions */}
        <div className={styles.userSection}>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>{userInitials}</div>
            <span className={styles.userName}>{user?.email?.split('@')[0] || 'User'}</span>
          </div>

          <button
            onClick={handleLogout}
            className={styles.iconButton}
            aria-label="Logout"
          >
            <svg
              className={styles.icon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
