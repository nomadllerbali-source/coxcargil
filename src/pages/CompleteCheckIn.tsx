import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, Clock, Wifi, Phone, Home } from 'lucide-react';
import type { PropertySettings } from '../types/database';

export default function CompleteCheckIn() {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [propertySettings, setPropertySettings] = useState<PropertySettings | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    fetchPropertySettings();
  }, []);

  const fetchPropertySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('property_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setPropertySettings(data);
    } catch (error) {
      console.error('Error fetching property settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCheckIn = async () => {
    if (!acknowledged) {
      alert('Please acknowledge that you have read the rules and regulations');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('guests')
        .update({
          booking_status: 'checked-in',
          actual_check_in_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', guestId);

      if (error) throw error;

      navigate(`/dashboard/${guestId}`);
    } catch (error) {
      console.error('Error completing check-in:', error);
      alert('Failed to complete check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Almost Done!</h1>
          <p className="text-gray-600">Please review the property information below</p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Home className="w-6 h-6" />
              {propertySettings?.property_name || 'Resort'}
            </h2>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Check-in Time</p>
                  <p className="text-gray-700">{propertySettings?.check_in_time || '2:00 PM'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Check-out Time</p>
                  <p className="text-gray-700">{propertySettings?.check_out_time || '11:00 AM'}</p>
                </div>
              </div>

              {propertySettings?.emergency_contact && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <Phone className="w-6 h-6 text-red-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Emergency Contact</p>
                    <p className="text-gray-700">{propertySettings.emergency_contact}</p>
                  </div>
                </div>
              )}

              {propertySettings?.wifi_details && (
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <Wifi className="w-6 h-6 text-green-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">WiFi Details</p>
                    <p className="text-gray-700 whitespace-pre-line">
                      {propertySettings.wifi_details}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {propertySettings?.amenities_info && (
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                <p className="text-gray-700 whitespace-pre-line">{propertySettings.amenities_info}</p>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Rules and Regulations</h3>
              <div
                className="prose prose-blue max-w-none text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: propertySettings?.rules_and_regulations || '',
                }}
              />
            </div>

            <div className="border-t pt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  I acknowledge that I have read and understood the property rules and regulations,
                  and agree to comply with them during my stay.
                </span>
              </label>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleCompleteCheckIn}
                disabled={submitting || !acknowledged}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                {submitting ? 'Completing Check-in...' : 'Complete Check-in & Go to Dashboard'}
              </button>

              <button
                onClick={() => navigate('/')}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Home className="w-5 h-5" />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
