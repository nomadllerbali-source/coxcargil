import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, MapPin, Calendar, Users, UtensilsCrossed, Copy, Share2, Home } from 'lucide-react';
import type { Guest, PropertySettings } from '../types/database';

export default function BookingConfirmation() {
  const { guestId } = useParams();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [propertySettings, setPropertySettings] = useState<PropertySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [guestId]);

  const fetchData = async () => {
    try {
      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .select('*')
        .eq('id', guestId)
        .maybeSingle();

      if (guestError) throw guestError;
      setGuest(guestData);

      const { data: settingsData, error: settingsError } = await supabase
        .from('property_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (settingsError) throw settingsError;
      setPropertySettings(settingsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    if (!guest || !propertySettings) return;

    const message = `
🏖️ Booking Confirmation - ${propertySettings.property_name}

Confirmation Number: ${guest.confirmation_number}
Guest: ${guest.guest_name}
Check-in: ${new Date(guest.check_in_date).toLocaleDateString()}
Check-out: ${new Date(guest.check_out_date).toLocaleDateString()}
Packs: ${guest.number_of_packs}

📍 Location: ${propertySettings.location_url || 'To be shared'}

🔗 Check-in Link: ${guest.check_in_link}
    `.trim();

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Booking not found</p>
          <Link to="/booking" className="mt-4 inline-block text-blue-600 hover:underline">
            Create a new booking
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-8 text-center">
            <CheckCircle className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-green-100">Your reservation has been successfully created</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
              <p className="text-sm text-gray-600 mb-1">Confirmation Number</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">{guest.confirmation_number}</p>
                <button
                  onClick={() => copyToClipboard(guest.confirmation_number)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Guest Name</p>
                  <p className="font-semibold text-gray-900">{guest.guest_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{guest.country_code} {guest.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Check-in Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(guest.check_in_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Check-out Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(guest.check_out_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Number of Packs</p>
                  <p className="font-semibold text-gray-900">{guest.number_of_packs}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UtensilsCrossed className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Meal Preference</p>
                  <p className="font-semibold text-gray-900 capitalize">{guest.meal_preference}</p>
                </div>
              </div>
            </div>

            {guest.food_remarks && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Food Remarks</p>
                <p className="text-gray-900">{guest.food_remarks}</p>
              </div>
            )}

            {guest.final_remarks && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Additional Remarks</p>
                <p className="text-gray-900">{guest.final_remarks}</p>
              </div>
            )}

            {propertySettings?.location_url && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Property Location</h3>
                </div>
                <a
                  href={propertySettings.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <MapPin className="w-4 h-4" />
                  View on Google Maps
                </a>
              </div>
            )}

            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Check-in Link</h3>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={guest.check_in_link}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  onClick={() => copyToClipboard(guest.check_in_link)}
                  className="px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Home className="w-5 h-5" />
                Go to Home
              </Link>
              <button
                onClick={shareViaWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Share2 className="w-5 h-5" />
                Share via WhatsApp
              </button>
              <Link
                to="/booking"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                Create Another Booking
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
