import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Home, Clock, MapPin, FileText, Wifi, IndianRupee, Hash } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

export default function AddPropertyType() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    property_name: '',
    number_of_rooms: 1,
    room_prefix: '',
    cost: 0,
    extra_person_cost: 0,
    check_in_time: '14:00',
    check_out_time: '11:00',
    map_link: '',
    rules_and_regulations: '',
    wifi_details: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insert property type
      const { data: propertyType, error: propertyError } = await supabase
        .from('property_types')
        .insert([
          {
            property_name: formData.property_name,
            number_of_rooms: formData.number_of_rooms,
            room_prefix: formData.room_prefix.toUpperCase(),
            cost: formData.cost,
            extra_person_cost: formData.extra_person_cost,
            check_in_time: formData.check_in_time,
            check_out_time: formData.check_out_time,
            map_link: formData.map_link,
            rules_and_regulations: formData.rules_and_regulations,
            wifi_details: formData.wifi_details,
          },
        ])
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Generate and insert rooms
      const rooms = [];
      for (let i = 1; i <= formData.number_of_rooms; i++) {
        rooms.push({
          property_type_id: propertyType.id,
          room_number: `${formData.room_prefix.toUpperCase()}${i}`,
          is_available: true,
        });
      }

      const { error: roomsError } = await supabase.from('rooms').insert(rooms);

      if (roomsError) throw roomsError;

      alert(`Property type added successfully with ${formData.number_of_rooms} rooms!`);
      navigate('/admin');
    } catch (error) {
      console.error('Error adding property type:', error);
      alert('Failed to add property type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminSidebar />
      <div className="lg:ml-64 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Add Property Type</h1>
          <p className="text-gray-600">Configure a new property type for your resort</p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Home className="w-4 h-4" />
                Property Name
              </label>
              <input
                type="text"
                required
                value={formData.property_name}
                onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., Attic Frame Standard, Cocoon Glamp"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4" />
                  Room Prefix (for numbering)
                </label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={formData.room_prefix}
                  onChange={(e) => setFormData({ ...formData, room_prefix: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition uppercase"
                  placeholder="e.g., A, P, C"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Letter(s) for room numbers (e.g., A → A1, A2, A3...)
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Home className="w-4 h-4" />
                  Number of Rooms (Nos)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.number_of_rooms}
                  onChange={(e) =>
                    setFormData({ ...formData, number_of_rooms: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="How many rooms?"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.room_prefix && formData.number_of_rooms > 0 && (
                    <span className="text-blue-600 font-medium">
                      Will create: {formData.room_prefix}1, {formData.room_prefix}2
                      {formData.number_of_rooms > 2 && `, ... ${formData.room_prefix}${formData.number_of_rooms}`}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <IndianRupee className="w-4 h-4" />
                  Cost per Room (per night)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., 5000.00"
                />
                <p className="mt-1 text-sm text-gray-500">Price per room per night (for 2 people)</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <IndianRupee className="w-4 h-4" />
                  Extra Person Cost (per night)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.extra_person_cost}
                  onChange={(e) => setFormData({ ...formData, extra_person_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., 1000.00"
                />
                <p className="mt-1 text-sm text-gray-500">Additional cost per extra person beyond 2 people (kids under 8 are free)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4" />
                  Check-in Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.check_in_time}
                  onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4" />
                  Check-out Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.check_out_time}
                  onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                Map Link
              </label>
              <input
                type="url"
                value={formData.map_link}
                onChange={(e) => setFormData({ ...formData, map_link: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="https://maps.google.com/..."
              />
              <p className="mt-1 text-sm text-gray-500">Google Maps link or location URL</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                Rules and Regulations
              </label>
              <textarea
                value={formData.rules_and_regulations}
                onChange={(e) =>
                  setFormData({ ...formData, rules_and_regulations: e.target.value })
                }
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter property rules, policies, and important information for guests..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Wifi className="w-4 h-4" />
                WiFi Details
              </label>
              <textarea
                value={formData.wifi_details}
                onChange={(e) => setFormData({ ...formData, wifi_details: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Network name, password, and any WiFi instructions..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Property Type...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}
