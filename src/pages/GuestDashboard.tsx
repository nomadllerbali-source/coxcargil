import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Home,
  Calendar,
  Clock,
  Phone,
  Wifi,
  BedDouble,
  UtensilsCrossed,
  Wrench,
  MessageSquare,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { Guest, PropertySettings, ServiceRequest, ServiceCategory } from '../types/database';

export default function GuestDashboard() {
  const { guestId } = useParams();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [propertySettings, setPropertySettings] = useState<PropertySettings | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    service_category: '' as ServiceCategory,
    request_details: '',
  });

  useEffect(() => {
    fetchData();
  }, [guestId]);

  const fetchData = async () => {
    try {
      const [guestRes, settingsRes, requestsRes] = await Promise.all([
        supabase.from('guests').select('*').eq('id', guestId).maybeSingle(),
        supabase.from('property_settings').select('*').limit(1).maybeSingle(),
        supabase
          .from('service_requests')
          .select('*')
          .eq('guest_id', guestId)
          .order('requested_at', { ascending: false }),
      ]);

      if (guestRes.error) throw guestRes.error;
      if (settingsRes.error) throw settingsRes.error;
      if (requestsRes.error) throw requestsRes.error;

      setGuest(guestRes.data);
      setPropertySettings(settingsRes.data);
      setServiceRequests(requestsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRequest = async (category: ServiceCategory, details: string) => {
    try {
      const { error } = await supabase.from('service_requests').insert([
        {
          guest_id: guestId,
          service_category: category,
          request_details: details,
          priority: 'medium',
          status: 'received',
        },
      ]);

      if (error) throw error;
      fetchData();
      alert('Service request submitted successfully!');
    } catch (error) {
      console.error('Error creating service request:', error);
      alert('Failed to submit service request. Please try again.');
    }
  };

  const handleCustomRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.service_category || !newRequest.request_details) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase.from('service_requests').insert([
        {
          guest_id: guestId,
          service_category: newRequest.service_category,
          request_details: newRequest.request_details,
          priority: 'medium',
          status: 'received',
        },
      ]);

      if (error) throw error;
      setNewRequest({ service_category: '' as ServiceCategory, request_details: '' });
      setShowRequestForm(false);
      fetchData();
      alert('Service request submitted successfully!');
    } catch (error) {
      console.error('Error creating service request:', error);
      alert('Failed to submit service request. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCategoryIcon = (category: ServiceCategory) => {
    switch (category) {
      case 'housekeeping':
        return <BedDouble className="w-5 h-5" />;
      case 'room_service':
        return <UtensilsCrossed className="w-5 h-5" />;
      case 'maintenance':
        return <Wrench className="w-5 h-5" />;
      case 'concierge':
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getDaysRemaining = () => {
    if (!guest) return 0;
    const checkOut = new Date(guest.check_out_date);
    const today = new Date();
    const diff = checkOut.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Booking not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-8">
            <h1 className="text-3xl font-bold mb-2">Welcome, {guest.guest_name}!</h1>
            <p className="text-blue-100">We hope you enjoy your stay at our resort</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Home className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Booking</p>
                  <p className="font-semibold text-gray-900">{guest.confirmation_number}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Calendar className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Check-out Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(guest.check_out_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Days Remaining</p>
                  <p className="font-semibold text-gray-900">{getDaysRemaining()} days</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <UtensilsCrossed className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Meal Plan</p>
                  <p className="font-semibold text-gray-900 capitalize">{guest.meal_preference}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {propertySettings?.emergency_contact && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <Phone className="w-6 h-6 text-red-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Emergency Contact</p>
                    <p className="text-gray-700">{propertySettings.emergency_contact}</p>
                  </div>
                </div>
              )}

              {propertySettings?.wifi_details && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Wifi className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">WiFi Details</p>
                    <p className="text-gray-700 whitespace-pre-line text-sm">
                      {propertySettings.wifi_details}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Service Requests</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleQuickRequest('housekeeping', 'Room cleaning requested')}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition border-2 border-transparent hover:border-blue-300"
            >
              <BedDouble className="w-8 h-8 text-blue-600" />
              <span className="font-semibold text-gray-900">Housekeeping</span>
            </button>

            <button
              onClick={() => handleQuickRequest('room_service', 'Room service requested')}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition border-2 border-transparent hover:border-green-300"
            >
              <UtensilsCrossed className="w-8 h-8 text-green-600" />
              <span className="font-semibold text-gray-900">Room Service</span>
            </button>

            <button
              onClick={() => handleQuickRequest('maintenance', 'Maintenance required')}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg hover:from-red-100 hover:to-red-200 transition border-2 border-transparent hover:border-red-300"
            >
              <Wrench className="w-8 h-8 text-red-600" />
              <span className="font-semibold text-gray-900">Maintenance</span>
            </button>

            <button
              onClick={() => setShowRequestForm(true)}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition border-2 border-transparent hover:border-purple-300"
            >
              <Plus className="w-8 h-8 text-purple-600" />
              <span className="font-semibold text-gray-900">Custom Request</span>
            </button>
          </div>

          {showRequestForm && (
            <form onSubmit={handleCustomRequest} className="mt-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Service Request</h3>
              <div className="space-y-4">
                <select
                  value={newRequest.service_category}
                  onChange={(e) =>
                    setNewRequest({
                      ...newRequest,
                      service_category: e.target.value as ServiceCategory,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="room_service">Room Service</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="concierge">Concierge</option>
                </select>

                <textarea
                  value={newRequest.request_details}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, request_details: e.target.value })
                  }
                  placeholder="Describe your request..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Request History</h2>

          {serviceRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>No service requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {serviceRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                >
                  <div className="flex-shrink-0 p-3 bg-gray-100 rounded-lg">
                    {getCategoryIcon(request.service_category)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {request.service_category.replace('_', ' ')}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{request.request_details}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(request.requested_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex-shrink-0">{getStatusIcon(request.status)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
