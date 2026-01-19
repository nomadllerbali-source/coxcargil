import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle, Clock, X } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import type { ServiceRequest, ServiceStatus } from '../types/database';

interface ServiceRequestWithGuest extends ServiceRequest {
  guest?: {
    guest_name: string;
    phone: string;
    confirmation_number: string;
    booking_rooms?: Array<{
      property_types?: {
        property_name: string;
      };
    }>;
  };
}

export default function ServiceRequestsManagement() {
  const [requests, setRequests] = useState<ServiceRequestWithGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
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
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((item: any) => ({
        ...item,
        guest: item.guests,
      }));

      setRequests(formattedData);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId: string, newStatus: ServiceStatus) => {
    try {
      const updates: any = {
        status: newStatus,
      };

      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('service_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const getFilteredRequests = () => {
    if (filter === 'all') return requests;
    return requests.filter((req) => req.status === filter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <>
        <AdminSidebar />
        <div className="lg:ml-64 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading service requests...</p>
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
            <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Service Requests Management</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">All Requests</h2>
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
                  onClick={() => setFilter('received')}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === 'received'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  New
                </button>
                <button
                  onClick={() => setFilter('in_progress')}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === 'in_progress'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === 'completed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {getFilteredRequests().map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {request.service_category.replace('_', ' ')}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                          request.priority
                        )}`}
                      >
                        {request.priority.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-3">{request.request_details}</p>

                    {request.guest && (
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                        <span>
                          <strong>Guest:</strong> {request.guest.guest_name}
                        </span>
                        <span>
                          <strong>Phone:</strong> {request.guest.phone}
                        </span>
                        <span>
                          <strong>Booking:</strong> {request.guest.confirmation_number}
                        </span>
                        {request.guest.booking_rooms && request.guest.booking_rooms.length > 0 && (
                          <span>
                            <strong>Property:</strong> {request.guest.booking_rooms.map((br: any) => br.property_types?.property_name).filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>
                        Requested: {new Date(request.requested_at).toLocaleString()}
                      </span>
                      {request.completed_at && (
                        <span>
                          Completed: {new Date(request.completed_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {request.status !== 'completed' && request.status !== 'cancelled' && (
                    <div className="flex gap-2">
                      {request.status === 'received' && (
                        <button
                          onClick={() => updateStatus(request.id, 'in_progress')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          <Clock className="w-4 h-4" />
                          Start
                        </button>
                      )}
                      {request.status === 'in_progress' && (
                        <button
                          onClick={() => updateStatus(request.id, 'completed')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(request.id, 'cancelled')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {getFilteredRequests().length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <p>No service requests found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
