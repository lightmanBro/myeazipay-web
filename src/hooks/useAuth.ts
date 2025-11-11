export function useAuth() {
  const isAuthenticated = !!localStorage.getItem('token');

  const login = (token: string) => {
    localStorage.setItem('token', token);
  };

  const logout = () => {
    localStorage.removeItem('token');
  };

  return {
    isAuthenticated,
    login,
    logout,
  };
}

