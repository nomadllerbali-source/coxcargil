import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Home, Tag, LogOut, Plus, Bell, Copy, Check, MessageCircle, X, List, User } from 'lucide-react';
import type { PropertyType, Guest, BookingRoom } from '../types/database';

interface GuestWithRooms extends Guest {
  booking_rooms?: (BookingRoom & { property_types?: PropertyType })[];
}

export default function B2BDashboard() {
  const navigate = useNavigate();
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [specialOffers, setSpecialOffers] = useState<any[]>([]);
  const [guests, setGuests] = useState<GuestWithRooms[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [agentName, setAgentName] = useState('');
  const [agentId, setAgentId] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const id = sessionStorage.getItem('b2bAgentId');
    const name = sessionStorage.getItem('b2bAgentName');

    if (!id) {
      navigate('/b2b');
      return;
    }

    setAgentId(id);
    setAgentName(name || 'Agent');
    fetchData(id);
  }, [navigate]);

  const fetchData = async (agentId: string) => {
    try {
      const [propertyRes, offersRes, guestsRes, notificationsRes, requestsRes] = await Promise.all([
        supabase.from('property_types').select('*').eq('is_available', true),
        supabase.from('special_offers').select('*, property_types(property_name)').eq('is_active', true).or(`target_agent_id.eq.${agentId},target_agent_id.is.null`),
        supabase
          .from('guests')
          .select(`
            *,
            booking_rooms (
              id,
              property_type_id,
              number_of_rooms,
              property_types (
                property_name,
                number_of_rooms
              )
            )
          `)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false }),
        supabase.from('agent_notifications').select('*').eq('agent_id', agentId).order('created_at', { ascending: false }).limit(5),
        supabase.from('b2b_booking_requests').select('*, property_types(property_name)').eq('agent_id', agentId).order('created_at', { ascending: false }).limit(10),
      ]);

      if (propertyRes.error) throw propertyRes.error;
      if (offersRes.error) throw offersRes.error;
      if (guestsRes.error) throw guestsRes.error;
      if (notificationsRes.error) throw notificationsRes.error;
      if (requestsRes.error) throw requestsRes.error;

      setPropertyTypes(propertyRes.data || []);
      setSpecialOffers(offersRes.data || []);
      setGuests(guestsRes.data || []);
      setNotifications(notificationsRes.data || []);
      setBookingRequests(requestsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('b2bAgentId');
    sessionStorage.removeItem('b2bAgentName');
    navigate('/b2b');
  };

  const getAvailableRooms = (propertyType: PropertyType) => {
    if (!selectedDate) return null;

    const checkDateObj = new Date(selectedDate);

    const overlappingGuests = guests.filter((guest) => {
      const checkIn = new Date(guest.check_in_date);
      const checkOut = new Date(guest.check_out_date);
      return (
        guest.booking_status !== 'cancelled' &&
        guest.booking_status !== 'checked-out' &&
        checkDateObj >= checkIn &&
        checkDateObj < checkOut
      );
    });

    const bookedRooms = overlappingGuests.reduce((total, guest) => {
      if (!guest.booking_rooms) return total;

      const propertyTypeRooms = guest.booking_rooms.filter(
        (room) => room.property_type_id === propertyType.id
      );

      const roomCount = propertyTypeRooms.reduce((sum, room) => sum + room.number_of_rooms, 0);
      return total + roomCount;
    }, 0);

    return propertyType.number_of_rooms - bookedRooms;
  };

  const getActiveOffers = () => {
    const today = new Date().toISOString().split('T')[0];
    return specialOffers.filter((offer) => {
      return offer.valid_from <= today && offer.valid_to >= today;
    });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const extractCheckInLink = (message: string) => {
    const linkMatch = message.match(/Link: (https?:\/\/[^\s]+)/);
    return linkMatch ? linkMatch[1] : null;
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link to clipboard');
    }
  };

  const handleShareWhatsApp = (notification: any) => {
    const link = extractCheckInLink(notification.message);
    if (!link) return;

    const confirmationMatch = notification.message.match(/Booking ([^\s]+)/);
    const confirmationNumber = confirmationMatch ? confirmationMatch[1] : '';
    const guestMatch = notification.message.match(/Guest: ([^|]+)/);
    const guestName = guestMatch ? guestMatch[1].trim() : '';
    const checkInMatch = notification.message.match(/Check-in: ([^|]+)/);
    const checkInDate = checkInMatch ? checkInMatch[1].trim() : '';

    const message = `🎉 *Booking Confirmed!*\n\n` +
      `*Confirmation Number:* ${confirmationNumber}\n` +
      `*Guest Name:* ${guestName}\n` +
      `*Check-in Date:* ${checkInDate}\n\n` +
      `*Complete Your Check-in:*\n${link}\n\n` +
      `Please complete your check-in using the link above before arrival.`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('agent_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Home className="w-6 h-6 text-teal-600" />
                      Check Room Availability
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      placeholder="Select date"
                    />
                    {selectedDate && (
                      <button
                        onClick={() => setSelectedDate('')}
                        className="px-3 py-2 text-gray-600 hover:text-gray-900 transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {selectedDate && (
                    <div className="p-3 bg-teal-50 rounded-lg mb-4">
                      <p className="text-sm text-teal-800">
                        Showing availability for{' '}
                        <span className="font-semibold">
                          {new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {propertyTypes.map((property) => {
                      const availableRooms = getAvailableRooms(property);
                      const isFullyBooked = availableRooms !== null && availableRooms <= 0;

                      return (
                        <div
                          key={property.id}
                          className={`border rounded-lg p-4 hover:shadow-md transition ${
                            isFullyBooked ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {property.property_name}
                              </h3>
                              <p className="text-sm text-gray-500">{property.number_of_rooms} total rooms</p>
                              <p className="text-sm font-semibold text-teal-600 mt-1">
                                ₹{property.cost.toLocaleString()} per night
                              </p>
                              {property.extra_person_cost && property.extra_person_cost > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Extra person: ₹{property.extra_person_cost.toLocaleString()}/night
                                </p>
                              )}
                            </div>
                          </div>

                          {selectedDate && availableRooms !== null && (
                            <div
                              className={`p-3 rounded-lg mb-3 ${
                                isFullyBooked
                                  ? 'bg-red-100'
                                  : availableRooms < property.number_of_rooms
                                  ? 'bg-yellow-50'
                                  : 'bg-green-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`text-sm font-medium ${
                                    isFullyBooked
                                      ? 'text-red-800'
                                      : availableRooms < property.number_of_rooms
                                      ? 'text-yellow-800'
                                      : 'text-green-800'
                                  }`}
                                >
                                  {isFullyBooked ? 'Fully Booked' : 'Available'}
                                </span>
                                <span
                                  className={`text-lg font-bold ${
                                    isFullyBooked
                                      ? 'text-red-800'
                                      : availableRooms < property.number_of_rooms
                                      ? 'text-yellow-800'
                                      : 'text-green-800'
                                  }`}
                                >
                                  {availableRooms}/{property.number_of_rooms}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    isFullyBooked
                                      ? 'bg-red-600'
                                      : availableRooms < property.number_of_rooms
                                      ? 'bg-yellow-500'
                                      : 'bg-green-600'
                                  }`}
                                  style={{ width: `${(availableRooms / property.number_of_rooms) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {selectedDate && availableRooms !== null && !isFullyBooked && (
                            <Link
                              to={`/b2b/booking?propertyId=${property.id}&checkInDate=${selectedDate}`}
                              className="block w-full px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 text-white text-center font-semibold rounded-lg hover:from-teal-700 hover:to-blue-700 transition"
                            >
                              Book Now
                            </Link>
                          )}

                          {!selectedDate && (
                            <div className="text-center p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                              Select a date to check availability
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {bookingRequests.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">My Recent Booking Requests</h2>
                    <Link
                      to="/b2b/my-bookings"
                      className="text-sm text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                    >
                      View All
                      <List className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {bookingRequests.map((request) => (
                      <div key={request.id} className="p-6 hover:bg-gray-50 transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {request.confirmation_number}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  request.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : request.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {request.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                              <p>
                                <strong>Guest:</strong> {request.guest_name}
                              </p>
                              <p>
                                <strong>Property:</strong> {request.property_types?.property_name}
                              </p>
                              <p>
                                <strong>Check-in:</strong>{' '}
                                {new Date(request.check_in_date).toLocaleDateString()}
                              </p>
                              <p>
                                <strong>Agent Rate:</strong> ₹{request.agent_rate.toLocaleString()}
                              </p>
                            </div>
                            {request.admin_notes && (
                              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-gray-700">
                                <strong>Admin Notes:</strong> {request.admin_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-500">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Special Offers
                  </h2>
                </div>

                <div className="p-6">
                  {getActiveOffers().length === 0 ? (
                    <div className="text-center py-8">
                      <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No active offers at the moment</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getActiveOffers().map((offer: any) => (
                        <div
                          key={offer.id}
                          className="border border-orange-200 rounded-lg p-4 bg-gradient-to-br from-orange-50 to-red-50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{offer.offer_title}</h3>
                            <span className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded">
                              {offer.discount_percentage}% OFF
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{offer.offer_description}</p>
                          <div className="text-xs text-gray-500">
                            <p>
                              <strong>Property:</strong> {offer.property_types?.property_name}
                            </p>
                            <p>
                              <strong>Valid:</strong> {new Date(offer.valid_from).toLocaleDateString()} -{' '}
                              {new Date(offer.valid_to).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {notifications.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-600" />
                      Recent Notifications
                    </h2>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {notifications.map((notif) => {
                      const hasCheckInLink = extractCheckInLink(notif.message);
                      return (
                        <div
                          key={notif.id}
                          onClick={() => {
                            setSelectedNotification(notif);
                            if (!notif.is_read) markAsRead(notif.id);
                          }}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                            !notif.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm">{notif.title}</h4>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {hasCheckInLink && (
                              <div className="ml-2 flex gap-1">
                                <Copy className="w-4 h-4 text-teal-600" />
                                <MessageCircle className="w-4 h-4 text-green-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Notification Details</h2>
              <button
                onClick={() => {
                  setSelectedNotification(null);
                  setCopiedLink(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {selectedNotification.title}
                </h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedNotification.message.split('Link:')[0]}
                  </p>
                </div>
              </div>

              {extractCheckInLink(selectedNotification.message) && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Guest Check-in Link</h4>
                  <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border-2 border-teal-200">
                    <p className="text-sm text-gray-700 mb-3 break-all font-mono">
                      {extractCheckInLink(selectedNotification.message)}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleCopyLink(extractCheckInLink(selectedNotification.message)!)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-5 h-5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            Copy Link
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleShareWhatsApp(selectedNotification)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Share via WhatsApp
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      Share this link with your guest so they can complete their check-in process before arrival.
                    </p>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-3 border-t">
                <p>
                  Received: {new Date(selectedNotification.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedNotification(null);
                  setCopiedLink(false);
                }}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
