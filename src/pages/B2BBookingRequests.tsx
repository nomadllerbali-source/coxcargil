import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  Phone,
  MapPin,
  Calendar,
  Home,
  DollarSign,
  MessageCircle,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import type { B2BBookingRequest, PropertyType, B2BAgent } from '../types/database';

interface BookingRequestWithDetails extends B2BBookingRequest {
  property_types?: PropertyType;
  b2b_agents?: B2BAgent;
}

export default function B2BBookingRequests() {
  const [requests, setRequests] = useState<BookingRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<BookingRequestWithDetails | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('b2b_booking_requests')
        .select('*, property_types(property_name, cost), b2b_agents(agent_name, company_name, whatsapp_number, phone, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (agentId: string, title: string, message: string, relatedId: string) => {
    try {
      await supabase.from('agent_notifications').insert({
        agent_id: agentId,
        notification_type: 'booking_status',
        title,
        message,
        related_id: relatedId,
        is_read: false,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const createGuestBooking = async (request: BookingRequestWithDetails) => {
    try {
      const checkInLink = `${window.location.origin}/check-in?confirmation=${request.confirmation_number}`;

      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .insert({
          guest_name: request.guest_name,
          country_code: '+91',
          phone: request.guest_phone,
          number_of_packs: request.number_of_adults,
          number_of_kids: request.number_of_kids,
          check_in_date: request.check_in_date,
          check_out_date: request.check_out_date,
          meal_preference: 'veg',
          food_remarks: `B2B Booking - City: ${request.guest_city}`,
          final_remarks: `Booked by B2B Agent (${request.b2b_agents?.agent_name})`,
          booking_status: 'confirmed',
          confirmation_number: request.confirmation_number || '',
          check_in_link: checkInLink,
          is_deleted: false,
        })
        .select()
        .single();

      if (guestError) throw guestError;

      const { error: roomError } = await supabase.from('booking_rooms').insert({
        guest_id: guestData.id,
        property_type_id: request.property_type_id,
        number_of_rooms: request.number_of_rooms,
      });

      if (roomError) throw roomError;

      const { error: paymentError } = await supabase.from('payments').insert({
        guest_id: guestData.id,
        total_amount: request.agent_rate,
        paid_amount: request.advance_amount,
        balance_due: request.agent_rate - request.advance_amount,
        payment_status: request.advance_amount >= request.agent_rate ? 'paid' : 'partial',
        payment_method: 'online_booking',
        payment_notes: `B2B Agent advance payment: ₹${request.advance_amount}`,
        refund_amount: 0,
      });

      if (paymentError) throw paymentError;

      return { guestId: guestData.id, checkInLink };
    } catch (error) {
      console.error('Error creating guest booking:', error);
      throw error;
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setLoading(true);
    try {
      const { guestId, checkInLink } = await createGuestBooking(selectedRequest);

      const { error } = await supabase
        .from('b2b_booking_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes,
          approved_at: new Date().toISOString(),
          approved_by: 'Admin',
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      await createNotification(
        selectedRequest.agent_id,
        'Booking Confirmed!',
        `Booking ${selectedRequest.confirmation_number} approved! Guest: ${selectedRequest.guest_name} | Check-in: ${new Date(selectedRequest.check_in_date).toLocaleDateString()} | Link: ${checkInLink}`,
        selectedRequest.id
      );

      const approvedRequest = { ...selectedRequest, admin_notes: adminNotes };

      handleSendWhatsAppToAgent(approvedRequest);

      alert('Booking request approved and notification sent via WhatsApp.');
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve booking request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('b2b_booking_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          approved_at: new Date().toISOString(),
          approved_by: 'Admin',
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      await createNotification(
        selectedRequest.agent_id,
        'Booking Request Rejected',
        `Your booking request ${selectedRequest.confirmation_number} has been rejected. Reason: ${adminNotes}`,
        selectedRequest.id
      );

      const rejectedRequest = { ...selectedRequest, admin_notes: adminNotes };

      handleSendWhatsAppRejectionToAgent(rejectedRequest);

      alert('Booking request rejected and notification sent via WhatsApp.');
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject booking request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsAppToAgent = (request: BookingRequestWithDetails) => {
    if (!request.b2b_agents?.whatsapp_number) {
      const agentContact = `Agent: ${request.b2b_agents?.agent_name}\n` +
        `Phone: ${request.b2b_agents?.phone}\n` +
        `Email: ${request.b2b_agents?.email}\n\n` +
        `The agent needs to add their WhatsApp number in their profile. ` +
        `Please contact them directly using the phone number or email above.`;

      alert(`WhatsApp number not available.\n\n${agentContact}`);
      return;
    }

    const checkInLink = `${window.location.origin}/check-in?confirmation=${request.confirmation_number}`;

    const message =
      `🎉 *Booking Request Approved!*\n\n` +
      `Dear ${request.b2b_agents?.agent_name},\n\n` +
      `Your booking request has been approved.\n\n` +
      `*Booking Details:*\n` +
      `*Confirmation Number:* ${request.confirmation_number}\n` +
      `*Guest Name:* ${request.guest_name}\n` +
      `*Property:* ${request.property_types?.property_name}\n` +
      `*Check-in:* ${new Date(request.check_in_date).toLocaleDateString()}\n` +
      `*Check-out:* ${new Date(request.check_out_date).toLocaleDateString()}\n` +
      `*Rooms:* ${request.number_of_rooms}\n` +
      `*Adults:* ${request.number_of_adults} | *Kids:* ${request.number_of_kids}\n` +
      `*Agent Rate:* ₹${request.agent_rate.toLocaleString()}\n` +
      `*Advance Paid:* ₹${request.advance_amount.toLocaleString()}\n\n` +
      `*Guest Check-in Link:*\n${checkInLink}\n\n` +
      `Please share this confirmation and check-in link with your guest.`;

    const whatsappUrl = `https://wa.me/${request.b2b_agents.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendWhatsAppRejectionToAgent = (request: BookingRequestWithDetails) => {
    if (!request.b2b_agents?.whatsapp_number) {
      const agentContact = `Agent: ${request.b2b_agents?.agent_name}\n` +
        `Phone: ${request.b2b_agents?.phone}\n` +
        `Email: ${request.b2b_agents?.email}\n\n` +
        `The agent needs to add their WhatsApp number in their profile. ` +
        `Please contact them directly using the phone number or email above.`;

      alert(`WhatsApp number not available.\n\n${agentContact}`);
      return;
    }

    const message =
      `❌ *Booking Request Rejected*\n\n` +
      `Dear ${request.b2b_agents?.agent_name},\n\n` +
      `We regret to inform you that your booking request has been rejected.\n\n` +
      `*Booking Details:*\n` +
      `*Confirmation Number:* ${request.confirmation_number}\n` +
      `*Guest Name:* ${request.guest_name}\n` +
      `*Property:* ${request.property_types?.property_name}\n` +
      `*Check-in:* ${new Date(request.check_in_date).toLocaleDateString()}\n` +
      `*Check-out:* ${new Date(request.check_out_date).toLocaleDateString()}\n` +
      `*Rooms:* ${request.number_of_rooms}\n\n` +
      `*Reason for Rejection:*\n${request.admin_notes || 'No reason provided'}\n\n` +
      `If you have any questions or would like to discuss this further, please contact us.`;

    const whatsappUrl = `https://wa.me/${request.b2b_agents.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getFilteredRequests = () => {
    if (filter === 'all') return requests;
    return requests.filter((req) => req.status === filter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPendingCount = () => requests.filter((r) => r.status === 'pending').length;
  const getApprovedCount = () => requests.filter((r) => r.status === 'approved').length;

  if (loading && requests.length === 0) {
    return (
      <>
        <AdminSidebar />
        <div className="lg:ml-64 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading booking requests...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSidebar />
      <div className="lg:ml-64 min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <Link to="/admin/b2b-management" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">B2B Booking Requests</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Clock className="w-10 h-10 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{getPendingCount()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Approved Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{getApprovedCount()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <DollarSign className="w-10 h-10 text-teal-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Booking Requests</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'all'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'pending'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilter('approved')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'approved'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => setFilter('rejected')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'rejected'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Rejected
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {getFilteredRequests().map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.confirmation_number}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{request.guest_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{request.guest_phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{request.guest_city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          <span>{request.property_types?.property_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(request.check_in_date).toLocaleDateString()} -{' '}
                            {new Date(request.check_out_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Agent Rate: ₹{request.agent_rate.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Agent:</strong> {request.b2b_agents?.agent_name} (
                        {request.b2b_agents?.company_name})
                        {!request.b2b_agents?.whatsapp_number && (request.status === 'approved' || request.status === 'rejected') && (
                          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            No WhatsApp
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-500">
                        <span>
                          Requested: {new Date(request.created_at).toLocaleDateString()} at{' '}
                          {new Date(request.created_at).toLocaleTimeString()}
                        </span>
                      </div>

                      {request.admin_notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Admin Notes:</strong> {request.admin_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {request.status === 'approved' && (
                        <button
                          onClick={() => handleSendWhatsAppToAgent(request)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Send to Agent
                        </button>
                      )}
                      {request.status === 'rejected' && (
                        <button
                          onClick={() => handleSendWhatsAppRejectionToAgent(request)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Send Rejection
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {getFilteredRequests().length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p>No booking requests found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Booking Request Details</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Guest Information</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Name:</strong> {selectedRequest.guest_name}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedRequest.guest_phone}
                    </p>
                    <p>
                      <strong>City:</strong> {selectedRequest.guest_city}
                    </p>
                    <p>
                      <strong>Adults:</strong> {selectedRequest.number_of_adults}
                    </p>
                    <p>
                      <strong>Kids:</strong> {selectedRequest.number_of_kids}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Booking Information</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Property:</strong> {selectedRequest.property_types?.property_name}
                    </p>
                    <p>
                      <strong>Rooms:</strong> {selectedRequest.number_of_rooms}
                    </p>
                    <p>
                      <strong>Check-in:</strong>{' '}
                      {new Date(selectedRequest.check_in_date).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Check-out:</strong>{' '}
                      {new Date(selectedRequest.check_out_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Cost Details</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Regular Price:</strong> ₹{selectedRequest.total_cost.toLocaleString()}
                    </p>
                    <p>
                      <strong>Agent Rate:</strong> ₹{selectedRequest.agent_rate.toLocaleString()}
                    </p>
                    <p>
                      <strong>Advance Paid:</strong> ₹{selectedRequest.advance_amount.toLocaleString()}
                    </p>
                    <p>
                      <strong>Balance:</strong> ₹
                      {(selectedRequest.agent_rate - selectedRequest.advance_amount).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Agent Details</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Agent:</strong> {selectedRequest.b2b_agents?.agent_name}
                    </p>
                    <p>
                      <strong>Company:</strong> {selectedRequest.b2b_agents?.company_name}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedRequest.b2b_agents?.phone}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedRequest.b2b_agents?.email}
                    </p>
                    {selectedRequest.b2b_agents?.whatsapp_number ? (
                      <p>
                        <strong>WhatsApp:</strong> {selectedRequest.b2b_agents.whatsapp_number}
                      </p>
                    ) : (
                      <p className="text-yellow-600">
                        <strong>WhatsApp:</strong> Not set (agent needs to update profile)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {selectedRequest.payment_screenshot_url && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Screenshot</h3>
                  <img
                    src={selectedRequest.payment_screenshot_url}
                    alt="Payment proof"
                    className="max-w-2xl rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Notes {selectedRequest.status === 'pending' && '(Optional for approval, required for rejection)'}
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    rows={3}
                    placeholder="Add notes about this request..."
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setAdminNotes('');
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
                {selectedRequest.status === 'approved' && (
                  <button
                    onClick={() => handleSendWhatsAppToAgent(selectedRequest)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Send Approval to Agent via WhatsApp
                  </button>
                )}
                {selectedRequest.status === 'rejected' && (
                  <button
                    onClick={() => handleSendWhatsAppRejectionToAgent(selectedRequest)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Send Rejection to Agent via WhatsApp
                  </button>
                )}
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
