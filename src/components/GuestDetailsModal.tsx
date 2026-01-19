import { useState, useEffect } from 'react';
import { X, Printer, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Guest, GuestPhoto, GuestIdCard, Payment, BookingRoom, PropertyType } from '../types/database';

interface GuestDetailsModalProps {
  guest: Guest & { booking_rooms?: (BookingRoom & { property_types?: PropertyType })[] };
  onClose: () => void;
}

interface GuestDetails {
  photos: GuestPhoto[];
  idCards: GuestIdCard[];
  payment: Payment | null;
}

export default function GuestDetailsModal({ guest, onClose }: GuestDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<GuestDetails>({
    photos: [],
    idCards: [],
    payment: null,
  });

  useEffect(() => {
    fetchGuestDetails();
  }, []);

  const fetchGuestDetails = async () => {
    try {
      const [photosRes, idCardsRes, paymentRes] = await Promise.all([
        supabase
          .from('guest_photos')
          .select('*')
          .eq('guest_id', guest.id)
          .order('uploaded_at', { ascending: false }),
        supabase
          .from('guest_id_cards')
          .select('*')
          .eq('guest_id', guest.id)
          .order('uploaded_at', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .eq('guest_id', guest.id)
          .maybeSingle(),
      ]);

      setDetails({
        photos: photosRes.data || [],
        idCards: idCardsRes.data || [],
        payment: paymentRes.data || null,
      });
    } catch (error) {
      console.error('Error fetching guest details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'checked-in':
        return 'bg-green-100 text-green-800';
      case 'checked-out':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const bookingRoomsText = guest.booking_rooms
    ?.map((room) => `${(room.property_types as any)?.property_name || 'N/A'} x ${room.number_of_rooms}`)
    .join(', ') || 'N/A';

  const getAllPhotosForPrint = () => {
    const allPhotos: string[] = [];
    details.photos.forEach(photo => allPhotos.push(photo.photo_url));
    details.idCards.forEach(idCard => {
      const idPhotos = idCard.additional_details?.all_photos || (idCard.id_photo_url ? [idCard.id_photo_url] : []);
      if (Array.isArray(idPhotos)) {
        allPhotos.push(...idPhotos);
      }
    });
    return allPhotos;
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          .no-print-overlay,
          .no-print-overlay > div,
          .print-only-page-1,
          .print-only-page-1 *,
          .print-only-page-2,
          .print-only-page-2 * {
            visibility: visible !important;
          }

          .no-print-overlay {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            max-width: 100% !important;
            overflow: visible !important;
            box-shadow: none !important;
          }

          .no-print-overlay > div {
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          .print-only-page-1 {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            page-break-after: always !important;
          }

          .print-only-page-2 {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            page-break-before: always !important;
          }

          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            left: -9999px !important;
          }

          .print-header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }

          .print-section {
            margin-bottom: 15px;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .print-photo-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 15px !important;
            margin-top: 10px !important;
          }

          .print-photo-grid img {
            width: 100% !important;
            height: 250px !important;
            object-fit: cover !important;
            border: 2px solid #333 !important;
            border-radius: 4px !important;
          }

          .print-photo-grid > div {
            position: relative !important;
          }
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print-overlay">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between no-print">
            <h2 className="text-2xl font-bold text-gray-900">Guest Check-in Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 no-print">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="print-only-page-1">
              <div className="print-header">
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Guest Check-in Details</h1>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print-section" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold" style={{ color: '#1e3a8a' }}>{guest.guest_name}</h3>
                    <p className="text-sm" style={{ color: '#1e40af' }}>
                      Confirmation: <span className="font-mono font-semibold">{guest.confirmation_number}</span>
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(guest.booking_status)}`}>
                    {guest.booking_status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Phone:</span> {guest.country_code || '+91'} {guest.phone}</p>
                    <p><span className="text-gray-600">Adults:</span> {guest.number_of_packs}</p>
                    <p><span className="text-gray-600">Kids (below 8):</span> {guest.number_of_kids}</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Booking Dates</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Check-in:</span>{' '}
                      {new Date(guest.check_in_date).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="text-gray-600">Check-out:</span>{' '}
                      {new Date(guest.check_out_date).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="text-gray-600">Properties:</span> {bookingRoomsText}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 print-section" style={{ marginTop: '20px' }}>
                <h4 className="font-semibold text-gray-900 mb-3">Preferences & Remarks</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Meal Preference:</span>{' '}
                    {guest.meal_preference.charAt(0).toUpperCase() + guest.meal_preference.slice(1)}
                  </p>
                  {guest.food_remarks && (
                    <p>
                      <span className="text-gray-600">Food Remarks:</span> {guest.food_remarks}
                    </p>
                  )}
                  {guest.final_remarks && (
                    <p>
                      <span className="text-gray-600">Final Remarks:</span> {guest.final_remarks}
                    </p>
                  )}
                </div>
              </div>

              {details.payment && (
                <div className="border border-gray-200 rounded-lg p-4 print-section" style={{ marginTop: '20px' }}>
                  <h4 className="font-semibold text-gray-900 mb-3">Payment Summary</h4>
                  <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3" style={{ backgroundColor: '#f9fafb' }}>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold">₹{details.payment.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid Amount:</span>
                      <span className="font-semibold" style={{ color: '#16a34a' }}>₹{details.payment.paid_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Balance Due:</span>
                      <span className="font-semibold" style={{ color: '#2563eb' }}>₹{details.payment.balance_due.toFixed(2)}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '8px' }} className="flex justify-between">
                      <span className="font-semibold text-gray-900">Payment Status:</span>
                      <span className="font-semibold">{details.payment.payment_status.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(details.photos.length > 0 || details.idCards.length > 0) && (
              <div className="print-only-page-2">
                <div className="print-header">
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Uploaded Photos</h1>
                </div>
                <div className="print-photo-grid">
                  {getAllPhotosForPrint().map((photoUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photoUrl}
                        alt={`Photo ${index + 1}`}
                      />
                      <div style={{ position: 'absolute', bottom: '5px', right: '5px', padding: '4px 8px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '12px', borderRadius: '3px' }}>
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6 space-y-6 no-print">
                {details.photos.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Guest Photos ({details.photos.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {details.photos.map((photo, index) => (
                        <div key={photo.id} className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                          <img src={photo.photo_url} alt={`Guest photo ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {details.idCards.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Identity Verification ({details.idCards.length})</h4>
                    <div className="space-y-4">
                      {details.idCards.map((idCard, index) => {
                        const allPhotos = idCard.additional_details?.all_photos || (idCard.id_photo_url ? [idCard.id_photo_url] : []);
                        return (
                          <div key={idCard.id} className="bg-gray-50 rounded-lg p-3">
                            <p className="font-semibold text-gray-900 mb-2">
                              ID Card {index + 1}: {idCard.id_type.charAt(0).toUpperCase() + idCard.id_type.slice(1).replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">ID Number: {idCard.id_number}</p>
                            {Array.isArray(allPhotos) && allPhotos.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-semibold text-gray-700 mb-2">ID Card Photos ({allPhotos.length}):</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {allPhotos.map((photoUrl, photoIndex) => (
                                    <div key={photoIndex} className="relative">
                                      <img
                                        src={photoUrl}
                                        alt={`ID Card Photo ${photoIndex + 1}`}
                                        className="w-full h-32 object-cover rounded border border-gray-300"
                                      />
                                      <div className="absolute bottom-1 right-1 px-2 py-0.5 bg-black bg-opacity-70 text-white text-xs rounded">
                                        {photoIndex + 1}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {details.photos.length === 0 && details.idCards.length === 0 && !details.payment && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-yellow-900">No additional data yet</p>
                        <p className="text-sm text-yellow-800">
                          Guest check-in photos, ID cards, or payment information not yet uploaded.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 no-print">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                <Printer className="w-4 h-4" />
                Print Details
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}
