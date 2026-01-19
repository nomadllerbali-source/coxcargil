import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CheckInSearch from './CheckInSearch';

export default function StaffCheckIn() {
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('staffUser');
    if (!userData) {
      navigate('/staff/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="py-8">
        <CheckInSearch />
      </div>
    </div>
  );
}
