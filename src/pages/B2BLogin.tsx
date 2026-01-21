import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Mail, Lock, User, Phone, Building, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const backgroundImages = [
  '/whatsapp_image_2026-01-20_at_04.22.59 copy.jpeg',
  '/whatsapp_image_2026-01-20_at_04.01.41_(2).jpeg',
  '/whatsapp_image_2026-01-20_at_04.01.41_(1).jpeg',
  '/whatsapp_image_2026-01-20_at_04.01.41.jpeg',
  '/whatsapp_image_2026-01-20_at_04.01.36.jpeg',
];

export default function B2BLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    agentName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyName: '',
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const isWithinAllowedHours = () => {
    const hours = currentTime.getHours();
    return hours >= 9 && hours < 21;
  };

  const loginAllowed = isWithinAllowedHours();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!loginAllowed) {
      alert('B2B Agent Portal is only accessible between 9:00 AM and 9:00 PM. Please try again during allowed hours.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('b2b_agents')
        .select('*')
        .eq('email', loginData.email)
        .eq('password', loginData.password)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        alert('Invalid email or password');
        return;
      }

      if (data.status === 'pending') {
        alert('Your account is pending approval. Please wait for admin approval.');
        return;
      }

      if (data.status === 'rejected') {
        alert('Your account has been rejected. Please contact admin.');
        return;
      }

      sessionStorage.setItem('b2bAgentId', data.id);
      sessionStorage.setItem('b2bAgentName', data.agent_name);
      navigate('/b2b/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (registerData.password !== registerData.confirmPassword) {
      alert('Passwords do not match');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('b2b_agents').insert({
        agent_name: registerData.agentName,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone,
        company_name: registerData.companyName,
        status: 'pending',
        commission_percentage: 10,
      });

      if (error) {
        if (error.code === '23505') {
          alert('Email already exists. Please use a different email or login.');
        } else {
          throw error;
        }
        return;
      }

      alert('Registration successful! Your account is pending admin approval. You will be notified once approved.');
      setIsRegistering(false);
      setRegisterData({
        agentName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        companyName: '',
      });
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {backgroundImages.map((image, index) => (
            <div
              key={image}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image}
                alt="Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 to-blue-900/80"></div>
            </div>
          ))}
        </div>

        <div className="max-w-md w-full relative z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-teal-200 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-full mb-4">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {isRegistering ? 'B2B Agent Registration' : 'B2B Agent Portal'}
            </h1>
            <p className="text-teal-200 mb-3">
              {isRegistering ? 'Create your agent account' : 'Login to manage bookings'}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-800 bg-opacity-50 rounded-lg text-teal-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>Access Hours: 9:00 AM - 9:00 PM</span>
            </div>
          </div>

          <div className="bg-white shadow-2xl rounded-2xl p-8">
            {!loginAllowed && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Access Restricted</p>
                  <p className="text-sm text-red-800 mt-1">
                    B2B Agent Portal is only accessible between 9:00 AM and 9:00 PM.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-red-700">
                    <Clock className="w-4 h-4" />
                    <span>Current Time: {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  </div>
                </div>
              </div>
            )}

            {!isRegistering ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!loginAllowed}
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    disabled={!loginAllowed}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !loginAllowed}
                  className="w-full px-6 py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Logging in...' : loginAllowed ? 'Login' : 'Access Restricted'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Don't have an account? Register here
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    Agent Name
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.agentName}
                    onChange={(e) => setRegisterData({ ...registerData, agentName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Building className="w-4 h-4" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.companyName}
                    onChange={(e) => setRegisterData({ ...registerData, companyName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    placeholder="Enter password (min 6 characters)"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Already have an account? Login here
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
  );
}
