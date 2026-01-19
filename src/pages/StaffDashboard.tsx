import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, LogIn, LogOut, User } from 'lucide-react';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [staffUser, setStaffUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('staffUser');
    if (!userData) {
      navigate('/staff/login');
      return;
    }
    setStaffUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('staffUser');
    navigate('/staff/login');
  };

  if (!staffUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {staffUser.full_name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/staff/new-booking')}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-8 text-left group"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Calendar className="w-8 h-8 text-blue-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">New Booking</h2>
            <p className="text-gray-600">Create a new guest reservation</p>
          </button>

          <button
            onClick={() => navigate('/staff/check-in')}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-8 text-left group"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <LogIn className="w-8 h-8 text-green-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Guest Check-in</h2>
            <p className="text-gray-600">Process guest check-in</p>
          </button>

          <button
            onClick={() => navigate('/staff/profile')}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-8 text-left group"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
              <User className="w-8 h-8 text-gray-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h2>
            <p className="text-gray-600">View and update your profile</p>
          </button>
        </div>
      </main>
    </div>
  );
}
