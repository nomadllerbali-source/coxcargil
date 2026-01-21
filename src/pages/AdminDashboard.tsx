import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Users, Bell, Calendar, Home, CheckCircle, XCircle, Settings, DollarSign, Edit, Ban, Trash2, Eye } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import UpdateBookingModal from '../components/UpdateBookingModal';
import CancellationModal from '../components/CancellationModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import GuestDetailsModal from '../components/GuestDetailsModal';
import type { Guest, ServiceRequest, PropertyType, BookingRoom } from '../types/database';

interface GuestWithRooms extends Guest {
  booking_rooms?: (BookingRoom & { property_types?: PropertyType })[];
}

export default function AdminDashboard() {
  const [guests, setGuests] = useState<GuestWithRooms[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [checkDate, setCheckDate] = useState<string>('');
  const [selectedGuest, setSelectedGuest] = useState<GuestWithRooms | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'all-bookings' | 'checked-in' | 'pending-requests'>('dashboard');
  const [checkinFilterDate, setCheckinFilterDate] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [guestsRes, requestsRes, propertyTypesRes] = await Promise.all([
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
        supabase
          .from('service_requests')
          .select(`
            *,
            guests:guest_id(
              guest_name,
              phone,
              confirmation_number,
              booking_rooms(
                property_types(
                  property_name
                )
              )
            )
          `)
          .order('requested_at', { ascending: false }),
        supabase
          .from('property_types')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (guestsRes.error) throw guestsRes.error;
      if (requestsRes.error) throw requestsRes.error;
      if (propertyTypesRes.error) throw propertyTypesRes.error;

      setGuests(guestsRes.data || []);
      setServiceRequests(requestsRes.data || []);
      setPropertyTypes(propertyTypesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredGuests = () => {
    if (filter === 'all') return guests;
    return guests.filter((guest) => guest.booking_status === filter);
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

  const getPendingRequests = () => {
    return serviceRequests.filter((req) => req.status === 'received' || req.status === 'in_progress');
  };

  const getCheckedInCount = () => {
    return guests.filter((g) => g.booking_status === 'checked-in').length;
  };

  const getCheckedInGuests = () => {
    return guests.filter((g) => g.booking_status === 'checked-in');
  };

  const getTodayCheckIns = () => {
    const today = new Date().toISOString().split('T')[0];
    return guests.filter((g) => {
      const checkInDate = new Date(g.check_in_date).toISOString().split('T')[0];
      return checkInDate === today;
    });
  };

  const getFilteredCheckedInGuests = () => {
    if (!checkinFilterDate) return getCheckedInGuests();

    return getCheckedInGuests().filter((g) => {
      const checkInDate = new Date(g.check_in_date).toISOString().split('T')[0];
      return checkInDate === checkinFilterDate;
    });
  };

  const toggleAvailability = async (propertyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('property_types')
        .update({ is_available: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', propertyId);

      if (error) throw error;

      setPropertyTypes(
        propertyTypes.map((prop) =>
          prop.id === propertyId ? { ...prop, is_available: !currentStatus } : prop
        )
      );
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const getAvailableRooms = (propertyType: PropertyType) => {
    if (!checkDate) return null;

    const checkDateObj = new Date(checkDate);

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

      const roomCount = propertyTypeRooms.reduce(
        (sum, room) => sum + room.number_of_rooms,
        0
      );

      return total + roomCount;
    }, 0);

    return propertyType.number_of_rooms - bookedRooms;
  };

  if (loading) {
    return (
      <>
        <AdminSidebar />
        <div className="lg:ml-64 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <Link
                to="/admin/add-property-type"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Property Type
              </Link>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setActiveView('all-bookings')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <Users className="w-10 h-10 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{guests.length}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveView('checked-in')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-10 h-10 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Checked In</p>
                <p className="text-2xl font-bold text-gray-900">{getCheckedInCount()}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveView('pending-requests')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-10 h-10 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{getPendingRequests().length}</p>
              </div>
            </div>
          </button>

          <Link
            to="/admin/payments"
            className="bg-gradient-to-r from-teal-600 to-blue-600 p-6 rounded-lg shadow text-white hover:from-teal-700 hover:to-blue-700 transition"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-10 h-10" />
              <div>
                <p className="text-sm text-teal-100">View All</p>
                <p className="text-xl font-bold">Payments</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/service-requests"
            className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 rounded-lg shadow text-white hover:from-blue-700 hover:to-teal-700 transition"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-10 h-10" />
              <div>
                <p className="text-sm text-blue-100">View All</p>
                <p className="text-xl font-bold">Service Requests</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/payment-config"
            className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-lg shadow text-white hover:from-green-700 hover:to-teal-700 transition"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-10 h-10" />
              <div>
                <p className="text-sm text-green-100">Configure</p>
                <p className="text-xl font-bold">Payment Settings</p>
              </div>
            </div>
          </Link>
        </div>

        {activeView === 'dashboard' && (
        <>
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Property Types</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <input
                    type="date"
                    value={checkDate}
                    onChange={(e) => setCheckDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Check availability"
                  />
                  {checkDate && (
                    <button
                      onClick={() => setCheckDate('')}
                      className="px-3 py-2 text-gray-600 hover:text-gray-900 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/admin/property-types"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Manage All
                  </Link>
                  <Link
                    to="/admin/add-property-type"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Property
                  </Link>
                </div>
              </div>
            </div>
            {checkDate && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Showing availability for <span className="font-semibold">{new Date(checkDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </p>
              </div>
            )}
          </div>

          <div className="p-6">
            {propertyTypes.length === 0 ? (
              <div className="text-center py-12">
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">No property types added yet</p>
                <Link
                  to="/admin/add-property-type"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Property Type
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {propertyTypes.map((property) => {
                  const availableRooms = getAvailableRooms(property);
                  const isFullyBooked = availableRooms !== null && availableRooms <= 0;

                  return (
                    <div
                      key={property.id}
                      className={`border rounded-lg p-6 hover:shadow-md transition ${
                        isFullyBooked ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg ${isFullyBooked ? 'bg-red-100' : 'bg-blue-100'}`}>
                            <Home className={`w-6 h-6 ${isFullyBooked ? 'text-red-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {property.property_name}
                            </h3>
                            <p className="text-sm text-gray-500">{property.number_of_rooms} total rooms</p>
                          </div>
                        </div>
                      </div>

                      {checkDate && availableRooms !== null && (
                        <div className={`mb-4 p-3 rounded-lg ${
                          isFullyBooked ? 'bg-red-100' : availableRooms < property.number_of_rooms ? 'bg-yellow-50' : 'bg-green-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${
                              isFullyBooked ? 'text-red-800' : availableRooms < property.number_of_rooms ? 'text-yellow-800' : 'text-green-800'
                            }`}>
                              {isFullyBooked ? 'Fully Booked' : 'Available'}
                            </span>
                            <span className={`text-lg font-bold ${
                              isFullyBooked ? 'text-red-800' : availableRooms < property.number_of_rooms ? 'text-yellow-800' : 'text-green-800'
                            }`}>
                              {availableRooms}/{property.number_of_rooms}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isFullyBooked ? 'bg-red-600' : availableRooms < property.number_of_rooms ? 'bg-yellow-500' : 'bg-green-600'
                              }`}
                              style={{ width: `${(availableRooms / property.number_of_rooms) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Check-in:</span>
                          <span className="text-gray-900 font-medium">{property.check_in_time}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Check-out:</span>
                          <span className="text-gray-900 font-medium">{property.check_out_time}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <button
                          onClick={() => toggleAvailability(property.id, property.is_available)}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                            property.is_available
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {property.is_available ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-medium">Available</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              <span className="font-medium">Unavailable</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('confirmed')}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === 'confirmed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Confirmed
                </button>
                <button
                  onClick={() => setFilter('checked-in')}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === 'checked-in'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Checked In
                </button>
                <button
                  onClick={() => setFilter('checked-out')}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === 'checked-out'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Checked Out
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confirmation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredGuests().map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{guest.guest_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{guest.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {guest.booking_rooms && guest.booking_rooms.length > 0 ? (
                          <div className="space-y-1">
                            {guest.booking_rooms.map((room) => (
                              <div key={room.id}>
                                {(room.property_types as any)?.property_name || 'N/A'} x {room.number_of_rooms}
                              </div>
                            ))}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {guest.number_of_packs} Adults
                        {guest.number_of_kids > 0 && `, ${guest.number_of_kids} Kids`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{guest.confirmation_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(guest.check_in_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(guest.check_out_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          guest.booking_status
                        )}`}
                      >
                        {guest.booking_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedGuest(guest);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGuest(guest);
                            setShowUpdateModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Update booking"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGuest(guest);
                            setShowCancelModal(true);
                          }}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Cancel booking"
                          disabled={guest.booking_status === 'cancelled'}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGuest(guest);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}

        {activeView === 'all-bookings' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">All Bookings</h2>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confirmation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {guests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{guest.guest_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{guest.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {guest.booking_rooms && guest.booking_rooms.length > 0 ? (
                            <div className="space-y-1">
                              {guest.booking_rooms.map((room) => (
                                <div key={room.id}>
                                  {(room.property_types as any)?.property_name || 'N/A'} x {room.number_of_rooms}
                                </div>
                              ))}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {guest.number_of_packs} Adults
                          {guest.number_of_kids > 0 && `, ${guest.number_of_kids} Kids`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{guest.confirmation_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(guest.check_in_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(guest.check_out_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            guest.booking_status
                          )}`}
                        >
                          {guest.booking_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedGuest(guest);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGuest(guest);
                              setShowUpdateModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Update booking"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGuest(guest);
                              setShowCancelModal(true);
                            }}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Cancel booking"
                            disabled={guest.booking_status === 'cancelled'}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGuest(guest);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'checked-in' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Checked In Guests</h2>
                  <button
                    onClick={() => {
                      setActiveView('dashboard');
                      setCheckinFilterDate('');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Back to Dashboard
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <input
                      type="date"
                      value={checkinFilterDate}
                      onChange={(e) => setCheckinFilterDate(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="Filter by check-in date"
                    />
                    {checkinFilterDate && (
                      <button
                        onClick={() => setCheckinFilterDate('')}
                        className="px-3 py-2 text-gray-600 hover:text-gray-900 transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex-1 text-sm text-gray-600">
                    Showing {getFilteredCheckedInGuests().length} of {getCheckedInCount()} checked-in guests
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-out Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredCheckedInGuests().map((guest) => (
                      <tr key={guest.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{guest.guest_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{guest.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {guest.booking_rooms && guest.booking_rooms.length > 0 ? (
                              <div className="space-y-1">
                                {guest.booking_rooms.map((room) => (
                                  <div key={room.id}>
                                    {(room.property_types as any)?.property_name || 'N/A'} x {room.number_of_rooms}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {guest.number_of_packs} Adults
                            {guest.number_of_kids > 0 && `, ${guest.number_of_kids} Kids`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(guest.check_in_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(guest.check_out_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedGuest(guest);
                                setShowDetailsModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 bg-green-50">
                <h3 className="text-xl font-bold text-green-900">Today's Check-Ins</h3>
                <p className="text-sm text-green-700 mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="overflow-x-auto">
                {getTodayCheckIns().length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No check-ins scheduled for today</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guest
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Property
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guests
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getTodayCheckIns().map((guest) => (
                        <tr key={guest.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{guest.guest_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{guest.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {guest.booking_rooms && guest.booking_rooms.length > 0 ? (
                                <div className="space-y-1">
                                  {guest.booking_rooms.map((room) => (
                                    <div key={room.id}>
                                      {(room.property_types as any)?.property_name || 'N/A'} x {room.number_of_rooms}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {guest.number_of_packs} Adults
                              {guest.number_of_kids > 0 && `, ${guest.number_of_kids} Kids`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                guest.booking_status
                              )}`}
                            >
                              {guest.booking_status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedGuest(guest);
                                  setShowDetailsModal(true);
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'pending-requests' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Pending Service Requests</h2>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {getPendingRequests().length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No pending service requests</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPendingRequests().map((request: any) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.guests?.guest_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{request.room_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.guests?.booking_rooms && request.guests.booking_rooms.length > 0
                              ? request.guests.booking_rooms.map((br: any) => br.property_types?.property_name).filter(Boolean).join(', ')
                              : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{request.request_details || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(request.requested_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {request.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {showUpdateModal && selectedGuest && (
        <UpdateBookingModal
          guest={selectedGuest}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedGuest(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowUpdateModal(false);
            setSelectedGuest(null);
          }}
        />
      )}

      {showCancelModal && selectedGuest && (
        <CancellationModal
          guest={selectedGuest}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedGuest(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowCancelModal(false);
            setSelectedGuest(null);
          }}
        />
      )}

      {showDeleteModal && selectedGuest && (
        <DeleteConfirmationModal
          guest={selectedGuest}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedGuest(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowDeleteModal(false);
            setSelectedGuest(null);
          }}
        />
      )}

      {showDetailsModal && selectedGuest && (
        <GuestDetailsModal
          guest={selectedGuest}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedGuest(null);
          }}
        />
      )}
    </>
  );
}
