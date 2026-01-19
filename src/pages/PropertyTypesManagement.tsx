import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Home, Clock, MapPin, FileText, Wifi, IndianRupee, Pencil, Trash2, X, Check, DoorOpen } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import RoomManagementModal from '../components/RoomManagementModal';
import type { PropertyType } from '../types/database';

export default function PropertyTypesManagement() {
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PropertyType>>({});
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyType | null>(null);

  useEffect(() => {
    fetchPropertyTypes();
  }, []);

  const fetchPropertyTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('property_types')
        .select('*')
        .order('property_name');

      if (error) throw error;
      setPropertyTypes(data || []);
    } catch (error) {
      console.error('Error fetching property types:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (propertyType: PropertyType) => {
    setEditingId(propertyType.id);
    setEditForm(propertyType);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('property_types')
        .update({
          property_name: editForm.property_name,
          number_of_rooms: editForm.number_of_rooms,
          cost: editForm.cost,
          extra_person_cost: editForm.extra_person_cost,
          check_in_time: editForm.check_in_time,
          check_out_time: editForm.check_out_time,
          map_link: editForm.map_link,
          rules_and_regulations: editForm.rules_and_regulations,
          wifi_details: editForm.wifi_details,
          is_available: editForm.is_available,
        })
        .eq('id', editingId);

      if (error) throw error;

      alert('Property type updated successfully!');
      setEditingId(null);
      setEditForm({});
      fetchPropertyTypes();
    } catch (error) {
      console.error('Error updating property type:', error);
      alert('Failed to update property type. Please try again.');
    }
  };

  const handleDelete = async (id: string, propertyName: string) => {
    if (!confirm(`Are you sure you want to delete "${propertyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('property_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Property type deleted successfully!');
      fetchPropertyTypes();
    } catch (error) {
      console.error('Error deleting property type:', error);
      alert('Failed to delete property type. It may be linked to existing bookings.');
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('property_types')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchPropertyTypes();
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update availability.');
    }
  };

  const openRoomModal = (property: PropertyType) => {
    setSelectedProperty(property);
    setShowRoomModal(true);
  };

  const closeRoomModal = () => {
    setShowRoomModal(false);
    setSelectedProperty(null);
  };

  if (loading) {
    return (
      <>
        <AdminSidebar />
        <div className="lg:ml-64 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading property types...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSidebar />
      <div className="lg:ml-64 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Admin Dashboard</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Property Types Management</h1>
          <p className="text-gray-600">View, edit, and manage all property types</p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-teal-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Property Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Rooms
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Cost/Night
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Check-in/out
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {propertyTypes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No property types found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  propertyTypes.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50 transition">
                      {editingId === property.id ? (
                        <td colSpan={6} className="px-6 py-4">
                          <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1">
                                  <Home className="w-3 h-3" />
                                  Property Name
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={editForm.property_name || ''}
                                  onChange={(e) => setEditForm({ ...editForm, property_name: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>

                              <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1">
                                  <Home className="w-3 h-3" />
                                  Number of Rooms
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={editForm.number_of_rooms || 1}
                                  onChange={(e) => setEditForm({ ...editForm, number_of_rooms: parseInt(e.target.value) || 1 })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>

                              <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1">
                                  <IndianRupee className="w-3 h-3" />
                                  Cost per Room (per night)
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  value={editForm.cost || 0}
                                  onChange={(e) => setEditForm({ ...editForm, cost: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>

                              <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1">
                                  <IndianRupee className="w-3 h-3" />
                                  Extra Person Cost (per night)
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  value={editForm.extra_person_cost || 0}
                                  onChange={(e) => setEditForm({ ...editForm, extra_person_cost: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                                <p className="mt-1 text-xs text-gray-500">Additional cost per extra person beyond 2 people</p>
                              </div>

                              <div className="flex items-center gap-3 pt-6">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={editForm.is_available || false}
                                    onChange={(e) => setEditForm({ ...editForm, is_available: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  Available for Booking
                                </label>
                              </div>

                              <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1">
                                  <Clock className="w-3 h-3" />
                                  Check-in Time
                                </label>
                                <input
                                  type="time"
                                  required
                                  value={editForm.check_in_time || '14:00'}
                                  onChange={(e) => setEditForm({ ...editForm, check_in_time: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>

                              <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1">
                                  <Clock className="w-3 h-3" />
                                  Check-out Time
                                </label>
                                <input
                                  type="time"
                                  required
                                  value={editForm.check_out_time || '11:00'}
                                  onChange={(e) => setEditForm({ ...editForm, check_out_time: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1">
                                  <MapPin className="w-3 h-3" />
                                  Map Link
                                </label>
                                <input
                                  type="url"
                                  value={editForm.map_link || ''}
                                  onChange={(e) => setEditForm({ ...editForm, map_link: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1">
                                  <FileText className="w-3 h-3" />
                                  Rules and Regulations
                                </label>
                                <textarea
                                  value={editForm.rules_and_regulations || ''}
                                  onChange={(e) => setEditForm({ ...editForm, rules_and_regulations: e.target.value })}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1">
                                  <Wifi className="w-3 h-3" />
                                  WiFi Details
                                </label>
                                <textarea
                                  value={editForm.wifi_details || ''}
                                  onChange={(e) => setEditForm({ ...editForm, wifi_details: e.target.value })}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg hover:from-blue-700 hover:to-teal-700 transition flex items-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Save Changes
                              </button>
                            </div>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">{property.property_name}</div>
                            <div className="text-xs text-gray-500 mt-1">Prefix: {property.room_prefix || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{property.number_of_rooms}</div>
                            <button
                              onClick={() => openRoomModal(property)}
                              className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                            >
                              <DoorOpen className="w-3 h-3" />
                              View Rooms
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-green-700">
                              ₹{property.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {property.check_in_time} / {property.check_out_time}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleAvailability(property.id, property.is_available)}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition ${
                                property.is_available
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {property.is_available ? 'Available' : 'Unavailable'}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEdit(property)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit property"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(property.id, property.property_name)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete property"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/admin/add-property-type"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition"
          >
            <Home className="w-5 h-5" />
            Add New Property Type
          </Link>
        </div>
      </div>
      </div>

      {showRoomModal && selectedProperty && (
        <RoomManagementModal
          propertyTypeId={selectedProperty.id}
          propertyTypeName={selectedProperty.property_name}
          roomPrefix={selectedProperty.room_prefix || 'R'}
          onClose={closeRoomModal}
        />
      )}
    </>
  );
}
