import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Calendar, Users, CheckCircle } from 'lucide-react';
import type { Guest } from '../types/database';

export default function CheckInSearch() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('phone', phone)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuests(data || []);
    } catch (error) {
      console.error('Error searching guests:', error);
      alert('Failed to search bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = (guestId: string) => {
    navigate(`/checkin/id/${guestId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'checked-in':
        return 'bg-green-100 text-green-800';
      case 'checked-out':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Guest Check-In</h1>
          <p className="text-gray-600">Search for your booking using phone number</p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {searched && guests.length === 0 && !loading && (
          <div className="bg-white shadow-xl rounded-2xl p-12 text-center">
            <p className="text-xl text-gray-600">No bookings found for this phone number</p>
            <p className="text-gray-500 mt-2">Please check the number and try again</p>
          </div>
        )}

        {guests.length > 0 && (
          <div className="space-y-4">
            {guests.map((guest) => (
              <div
                key={guest.id}
                className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{guest.guest_name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          guest.booking_status
                        )}`}
                      >
                        {guest.booking_status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Conf: {guest.confirmation_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(guest.check_in_date).toLocaleDateString()} -{' '}
                          {new Date(guest.check_out_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{guest.number_of_packs} Pack(s)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {guest.booking_status === 'confirmed' && (
                      <button
                        onClick={() => handleCheckIn(guest.id)}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Start Check-In
                      </button>
                    )}
                    {guest.booking_status === 'checked-in' && (
                      <button
                        onClick={() => navigate(`/dashboard/${guest.id}`)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        View Dashboard
                      </button>
                    )}
                    {guest.booking_status === 'checked-out' && (
                      <span className="text-gray-500 font-medium">Completed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
