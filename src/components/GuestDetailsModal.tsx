import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [activeTab, setActiveTab] = useState<'details' | 'bill'>('details');
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

  const handlePrint = (type: 'details' | 'bill') => {
    const originalTab = activeTab;
    setActiveTab(type);
    // Use a small timeout to ensure the DOM updates before printing
    setTimeout(() => {
      window.print();
      setActiveTab(originalTab);
    }, 100);
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

  return createPortal(
    <>
      <style>{`
        /* Global styles within modal */
        .signature-section {
          display: none !important;
        }

        @media print {
          @page {
            size: auto;
            margin: 0mm;
          }

          /* Set body and html to auto height to prevent rendering empty overflow pages */
          html, body {
            visibility: hidden !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Hide the Vite root to avoid it taking up space in the background */
          #root {
            display: none !important;
          }

          /* Show the modal container and its contents */
          .no-print-overlay {
            visibility: visible !important;
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .no-print-overlay * {
            visibility: visible !important;
          }

          .no-print-overlay > div {
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important; /* Fix for print clipping */
            overflow: visible !important; /* Fix for print clipping */
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Show signatures only during print */
          .signature-section {
            display: grid !important;
          }

          /* Hide sections that are NOT the active tag during print */
          ${activeTab === 'bill' ? '.print-details-only { display: none !important; }' : ''}
          ${activeTab === 'details' ? '.print-bill-only { display: none !important; }' : ''}

          .no-print {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          .print-header {
            margin-bottom: 10px; /* Reduced gap */
            padding-bottom: 5px; /* Reduced gap */
            border-bottom: 2px solid #000;
          }

          .print-section {
            margin-bottom: 15px;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .print-photo-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            margin-top: 10px !important;
          }

          .print-photo-grid img {
            width: 100% !important;
            height: auto !important;
            max-height: 400px !important;
            object-fit: contain !important;
            border: 1px solid #ccc !important;
          }

          .bill-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .bill-table th, .bill-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .bill-table th {
            background-color: #f8f9fa !important;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print-overlay">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between no-print z-10">
            <h2 className="text-2xl font-bold text-gray-900">Guest Management</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {!loading && (
            <div className="flex border-b border-gray-200 no-print">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'details'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Check-in Details
              </button>
              <button
                onClick={() => setActiveTab('bill')}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'bill'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Guest Bill
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 no-print">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* CHECK-IN DETAILS SECTION */}
              <div className={`print-details-only ${activeTab === 'details' ? 'block' : 'hidden md:hidden'}`}>
                <div className="p-6">
                  <div className="print-header">
                    <h1 className="text-2xl font-bold text-gray-900">Guest Check-in Details</h1>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 print-section">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-blue-900">{guest.guest_name}</h3>
                        <p className="text-blue-800">
                          Confirmation: <span className="font-mono font-bold text-lg">{guest.confirmation_number}</span>
                        </p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${getStatusColor(guest.booking_status)}`}>
                        {guest.booking_status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h4 className="font-bold text-gray-900 border-b pb-2 mb-4">Contact & Occupancy</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">{guest.country_code || '+91'} {guest.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Adults:</span>
                          <span className="font-medium">{guest.number_of_packs}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kids (below 8):</span>
                          <span className="font-medium">{guest.number_of_kids}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h4 className="font-bold text-gray-900 border-b pb-2 mb-4">Stay Information</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Check-in:</span>
                          <span className="font-medium">{new Date(guest.check_in_date).toDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Check-out:</span>
                          <span className="font-medium">{new Date(guest.check_out_date).toDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Property:</span>
                          <span className="font-medium text-blue-700">{bookingRoomsText}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-5 shadow-sm mb-6 print-section">
                    <h4 className="font-bold text-gray-900 border-b pb-2 mb-4">Guest Requirements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <p>
                        <span className="text-gray-600 block mb-1">Meal Preference:</span>
                        <span className="font-medium px-2 py-1 bg-orange-100 text-orange-800 rounded">{guest.meal_preference.charAt(0).toUpperCase() + guest.meal_preference.slice(1)}</span>
                      </p>
                      {guest.food_remarks && (
                        <div>
                          <span className="text-gray-600 block mb-1">Food Remarks:</span>
                          <p className="font-medium bg-gray-50 p-2 rounded">{guest.food_remarks}</p>
                        </div>
                      )}
                      {guest.final_remarks && (
                        <div className="col-span-full">
                          <span className="text-gray-600 block mb-1">General Notes / Requests:</span>
                          <p className="font-medium bg-gray-50 p-2 rounded">{guest.final_remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {details.photos.length > 0 && (
                    <div className="border border-gray-200 rounded-xl p-5 shadow-sm mb-6 no-print">
                      <h4 className="font-bold text-gray-900 border-b pb-2 mb-4">Guest Selfies</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {details.photos.map((photo, index) => (
                          <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border">
                            <img src={photo.photo_url} alt="Guest" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {details.idCards.length > 0 && (
                    <div className="border border-gray-200 rounded-xl p-5 shadow-sm mb-6 no-print">
                      <h4 className="font-bold text-gray-900 border-b pb-2 mb-4">Document Verification</h4>
                      <div className="space-y-4">
                        {details.idCards.map((idCard) => (
                          <div key={idCard.id} className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1">
                              <p className="font-bold">{idCard.id_type.toUpperCase()}</p>
                              <p className="text-sm">Number: <span className="font-mono">{idCard.id_number}</span></p>
                            </div>
                            <div className="flex gap-2 h-20">
                              {(idCard.additional_details?.all_photos || [idCard.id_photo_url]).map((url: string, i: number) => (
                                <img key={i} src={url} className="h-full w-20 object-cover rounded border border-white" />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Printed Photo Section */}
                  {(details.photos.length > 0 || details.idCards.length > 0) && (
                    <div className="hidden md:hidden print:block !mb-0 mt-8">
                      <div className="print-header" style={{ pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
                        <h1 className="text-2xl font-bold">Verification Documents</h1>
                      </div>
                      <div className="block mt-4 text-left">
                        {getAllPhotosForPrint().map((url, i) => (
                          <div key={i} className="inline-block w-[48%] mr-[2%] mb-6 border-2 border-slate-300 rounded-lg h-64 bg-slate-50 p-2 shadow-sm align-top" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <img src={url} className="w-full h-full object-contain mx-auto block" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signature Section - Handled by CSS to only show on print */}
                  <div className="signature-section mt-12 pt-8 grid-cols-2 gap-16 text-center page-break-inside-avoid mb-4">
                    <div className="border-t-2 border-gray-400 pt-2 px-4">
                      <p className="font-bold text-gray-900">Guest Signature</p>
                    </div>
                    <div className="border-t-2 border-gray-400 pt-2 px-4">
                      <p className="font-bold text-gray-900">Manager Signature</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BILL SECTION */}
              <div className={`print-bill-only ${activeTab === 'bill' ? 'block' : 'hidden md:hidden'}`}>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-8 border-b-2 border-gray-900 pb-6">
                    <div>
                      <h1 className="text-4xl font-black text-gray-900 tracking-tight">COXCARGILL GLAMPS</h1>
                      <p className="text-gray-600 font-medium">Thalavanji, Koviloor - Top Station Rd, Vattavada, Kerala 685615</p>
                      <p className="text-gray-600">Phone: +91 94969 60809</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-black text-white px-4 py-2 font-bold text-xl mb-2">GUEST BILL</div>
                      <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                      <p className="text-gray-600">No: INV-{guest.confirmation_number.split('-').pop()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Billed To</h3>
                      <p className="text-xl font-bold text-gray-900">{guest.guest_name}</p>
                      <p className="text-gray-600">{guest.country_code || '+91'} {guest.phone}</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Booking Reference</h3>
                      <p className="text-lg font-bold text-blue-700">{guest.confirmation_number}</p>
                      <p className="text-gray-600">{new Date(guest.check_in_date).toLocaleDateString()} to {new Date(guest.check_out_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <table className="bill-table min-w-full">
                    <thead>
                      <tr>
                        <th className="font-bold">Description</th>
                        <th className="text-right font-bold w-32">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className="font-bold mb-1">Accommodation Charges</div>
                          <div className="text-sm text-gray-600 italic">{bookingRoomsText}</div>
                        </td>
                        <td className="text-right font-bold">₹{details.payment?.total_amount.toFixed(2) || '0.00'}</td>
                      </tr>
                      {/* Placeholder for future specific charges if added */}
                      <tr className="border-t-2 border-gray-200">
                        <td className="text-right font-bold text-lg bg-gray-50">Grand Total</td>
                        <td className="text-right font-bold text-lg bg-gray-50">₹{details.payment?.total_amount.toFixed(2) || '0.00'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-10 grid grid-cols-2 gap-8">
                    <div className="bg-gray-100 p-5 rounded-xl">
                      <h4 className="font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">Payment Details</h4>
                      <div className="space-y-2 font-medium">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className={`${details.payment?.payment_status === 'full' ? 'text-green-700' : 'text-orange-700'} uppercase font-black`}>
                            {details.payment?.payment_status || 'PENDING'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Method:</span>
                          <span className="uppercase">{details.payment?.payment_method || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-lg p-2 rounded-lg bg-green-50 text-green-900">
                        <span className="font-bold">Total Paid:</span>
                        <span className="font-black">₹{details.payment?.paid_amount.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xl p-3 rounded-lg border-2 border-blue-600 text-blue-900 bg-blue-50">
                        <span className="font-bold">Balance Due:</span>
                        <span className="font-black">₹{details.payment?.balance_due.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-20 border-t border-gray-200 pt-10 text-center">
                    <p className="text-gray-800 font-bold text-xl italic mb-2">Thank you for staying with us!</p>
                    <p className="text-gray-500">This is a system generated document and does not require a physical signature.</p>
                  </div>

                  {/* Signature Section - Handled by CSS to only show on print */}
                  <div className="signature-section mt-12 pt-8 grid-cols-2 gap-16 text-center page-break-inside-avoid mb-4">
                    <div className="border-t-2 border-gray-400 pt-2 px-4">
                      <p className="font-bold text-gray-900">Guest Signature</p>
                    </div>
                    <div className="border-t-2 border-gray-400 pt-2 px-4">
                      <p className="font-bold text-gray-900">Manager Signature</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="sticky bottom-0 bg-gray-100 border-t border-gray-200 px-6 py-4 flex flex-wrap gap-3 no-print z-10">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold"
                >
                  Close
                </button>
                <div className="flex-1 flex gap-3">
                  <button
                    onClick={() => handlePrint('details')}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition font-bold shadow-sm ${activeTab === 'details' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                  >
                    <Printer className="w-5 h-5" />
                    Print All Details
                  </button>
                  <button
                    onClick={() => handlePrint('bill')}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition font-bold shadow-sm ${activeTab === 'bill' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                  >
                    <Printer className="w-5 h-5" />
                    Print Guest Bill
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
