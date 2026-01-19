import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';

    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
