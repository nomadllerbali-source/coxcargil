import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  MessageCircle,
  Calendar,
  User,
  Home,
  DollarSign,
  Phone,
  MapPin,
  Edit3,
} from 'lucide-react';
import EditB2BBookingModal from '../components/EditB2BBookingModal';
import type { PropertyType } from '../types/database';

interface BookingRequest {
  id: string;
  agent_id: string;
  guest_name: string;
  guest_phone: string;
  guest_city: string;
  number_of_adults: number;
  number_of_kids: number;
  check_in_date: string;
  check_out_date: string;
  property_type_id: string;
  number_of_rooms: number;
  total_cost: number;
  agent_rate: number;
  advance_amount: number;
  status: string;
  confirmation_number: string;
  payment_screenshot_url?: string;
  admin_notes?: string;
  created_at: string;
  property_types?: PropertyType;
}

export default function B2BMyBookings() {
  const navigate = useNavigate();
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [copiedConfirmation, setCopiedConfirmation] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [editingBooking, setEditingBooking] = useState<BookingRequest | null>(null);

  useEffect(() => {
    const agentId = sessionStorage.getItem('b2bAgentId');
    const name = sessionStorage.getItem('b2bAgentName');

    if (!agentId) {
      navigate('/b2b');
      return;
    }

    setAgentName(name || 'Agent');
    fetchBookingRequests(agentId);
  }, [navigate]);

  const fetchBookingRequests = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('b2b_booking_requests')
        .select('*, property_types(property_name, cost)')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookingRequests(data || []);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRequests = () => {
    return bookingRequests.filter((req) => req.status === activeTab);
  };

  const handleCopyConfirmation = async (confirmationNumber: string) => {
    try {
      await navigator.clipboard.writeText(confirmationNumber);
      setCopiedConfirmation(confirmationNumber);
      setTimeout(() => setCopiedConfirmation(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy confirmation number');
    }
  };

  const handleShareWhatsApp = (request: BookingRequest) => {
    const checkInLink = `${window.location.origin}/check-in?confirmation=${request.confirmation_number}`;

    const message =
      `🎉 *Booking Confirmed!*\n\n` +
      `*Confirmation Number:* ${request.confirmation_number}\n` +
      `*Guest Name:* ${request.guest_name}\n` +
      `*Property:* ${request.property_types?.property_name}\n` +
      `*Check-in:* ${new Date(request.check_in_date).toLocaleDateString()}\n` +
      `*Check-out:* ${new Date(request.check_out_date).toLocaleDateString()}\n` +
      `*Rooms:* ${request.number_of_rooms}\n` +
      `*Adults:* ${request.number_of_adults} | *Kids:* ${request.number_of_kids}\n\n` +
      `*Complete Your Check-in:*\n${checkInLink}\n\n` +
      `Please complete your check-in using the link above before arrival.`;

    const whatsappUrl = `https://wa.me/${request.guest_phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            APPROVED
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
            <XCircle className="w-3 h-3" />
            REJECTED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" />
            PENDING
          </span>
        );
    }
  };

  const pendingCount = bookingRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = bookingRequests.filter((r) => r.status === 'approved').length;
  const rejectedCount = bookingRequests.filter((r) => r.status === 'rejected').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              onClick={() => setActiveTab('pending')}
              className={`bg-white p-6 rounded-lg shadow cursor-pointer transition ${
                activeTab === 'pending' ? 'ring-2 ring-yellow-500' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-10 h-10 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('approved')}
              className={`bg-white p-6 rounded-lg shadow cursor-pointer transition ${
                activeTab === 'approved' ? 'ring-2 ring-green-500' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Approved Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('rejected')}
              className={`bg-white p-6 rounded-lg shadow cursor-pointer transition ${
                activeTab === 'rejected' ? 'ring-2 ring-red-500' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <XCircle className="w-10 h-10 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Rejected Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Requests
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {getFilteredRequests().length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p>No {activeTab} requests found</p>
                </div>
              ) : (
                getFilteredRequests().map((request) => (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {request.confirmation_number}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <button
                            onClick={() => setEditingBooking(request)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                        {request.status === 'approved' && (
                          <>
                            <button
                              onClick={() => handleCopyConfirmation(request.confirmation_number)}
                              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                            >
                              {copiedConfirmation === request.confirmation_number ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  Copy Number
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleShareWhatsApp(request)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Send via WhatsApp
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Guest Name</p>
                          <p className="font-semibold text-gray-900">{request.guest_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Contact</p>
                          <p className="font-semibold text-gray-900">{request.guest_phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">City</p>
                          <p className="font-semibold text-gray-900">{request.guest_city}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Home className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Property</p>
                          <p className="font-semibold text-gray-900">
                            {request.property_types?.property_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Check-in</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(request.check_in_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Check-out</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(request.check_out_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Rooms</p>
                        <p className="text-lg font-bold text-gray-900">{request.number_of_rooms}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Adults / Kids</p>
                        <p className="text-lg font-bold text-gray-900">
                          {request.number_of_adults} / {request.number_of_kids}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Agent Rate</p>
                        <p className="text-lg font-bold text-teal-600">
                          ₹{request.agent_rate.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Advance Paid</p>
                        <p className="text-lg font-bold text-green-600">
                          ₹{request.advance_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {request.admin_notes && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Admin Notes:</p>
                        <p className="text-sm text-blue-800">{request.admin_notes}</p>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      Requested on: {new Date(request.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      {editingBooking && (
        <EditB2BBookingModal
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onUpdate={() => {
            const agentId = sessionStorage.getItem('b2bAgentId');
            if (agentId) {
              fetchBookingRequests(agentId);
            }
          }}
        />
      )}
    </div>
  );
}
