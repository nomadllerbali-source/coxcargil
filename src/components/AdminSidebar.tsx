import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  DollarSign,
  Bell,
  Home,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  FileText,
  Percent,
  Tag,
  Image,
  UserCog
} from 'lucide-react';
import { useState } from 'react';

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      sessionStorage.removeItem('adminAuthenticated');
      navigate('/admin/login');
    }
  };

  const navItems = [
    {
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      path: '/admin/property-types',
      icon: Home,
      label: 'Property Types',
    },
    {
      path: '/admin/payments',
      icon: DollarSign,
      label: 'Payments',
    },
    {
      path: '/admin/service-requests',
      icon: Bell,
      label: 'Service Requests',
    },
    {
      path: '/admin/payment-config',
      icon: Settings,
      label: 'Payment Config',
    },
    {
      path: '/admin/b2b-management',
      icon: Building2,
      label: 'B2B Agents',
    },
    {
      path: '/admin/b2b-booking-requests',
      icon: FileText,
      label: 'Booking Requests',
    },
    {
      path: '/admin/agent-commissions',
      icon: Percent,
      label: 'Agent Commissions',
    },
    {
      path: '/admin/special-offers',
      icon: Tag,
      label: 'Special Offers',
    },
    {
      path: '/admin/homepage',
      icon: Image,
      label: 'Homepage Settings',
    },
    {
      path: '/admin/staff-management',
      icon: UserCog,
      label: 'Staff Management',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-full bg-gray-900 text-white w-64 transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        />
      )}
    </>
  );
}
