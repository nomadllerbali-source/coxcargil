import { useState, useEffect, FormEvent } from 'react';
import { X, Calendar, Users, UtensilsCrossed, MessageSquare, Baby, Plus, Trash2, IndianRupee, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Guest, PropertyType, BookingRoom, MealPreference } from '../types/database';

const COUNTRIES = [
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'UAE', code: '+971', flag: '🇦🇪' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Oman', code: '+968', flag: '🇴🇲' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
];

interface RoomSelection {
  id: string;
  property_type_id: string;
  number_of_rooms: number;
}

interface PropertyWithAvailability extends PropertyType {
  available_rooms: number;
}

interface UpdateBookingModalProps {
  guest: Guest & { booking_rooms?: (BookingRoom & { property_types?: PropertyType })[] };
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpdateBookingModal({ guest, onClose, onSuccess }: UpdateBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [availableProperties, setAvailableProperties] = useState<PropertyWithAvailability[]>([]);
  const [roomSelections, setRoomSelections] = useState<RoomSelection[]>([]);
  const [formData, setFormData] = useState({
    guest_name: guest.guest_name,
    country_code: guest.country_code || '+91',
    phone: guest.phone,
    number_of_packs: guest.number_of_packs,
    number_of_kids: guest.number_of_kids || 0,
    check_in_date: guest.check_in_date,
    check_out_date: guest.check_out_date,
    meal_preference: guest.meal_preference as MealPreference,
    food_remarks: guest.food_remarks || '',
    final_remarks: guest.final_remarks || '',
    discount: 0,
    advance_amount: 0,
  });

  useEffect(() => {
    fetchPropertyTypes();
    fetchPaymentDetails();
    initializeRoomSelections();
  }, []);

  useEffect(() => {
    if (formData.check_in_date && formData.check_out_date && propertyTypes.length > 0) {
      checkAvailability();
    }
  }, [formData.check_in_date, formData.check_out_date, propertyTypes]);

  const initializeRoomSelections = () => {
    if (guest.booking_rooms && guest.booking_rooms.length > 0) {
      setRoomSelections(
        guest.booking_rooms.map((room) => ({
          id: room.id,
          property_type_id: room.property_type_id,
          number_of_rooms: room.number_of_rooms,
        }))
      );
    } else {
      setRoomSelections([{ id: crypto.randomUUID(), property_type_id: '', number_of_rooms: 1 }]);
    }
  };

  const fetchPropertyTypes = async () => {
    const { data, error } = await supabase
      .from('property_types')
      .select('*')
      .eq('is_available', true)
      .order('property_name');

    if (!error && data) {
      setPropertyTypes(data);
      setAvailableProperties(data.map((p) => ({ ...p, available_rooms: p.number_of_rooms })));
    }
  };

  const fetchPaymentDetails = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('guest_id', guest.id)
      .maybeSingle();

    if (!error && data) {
      const paymentConfig = await supabase
        .from('payment_config')
        .select('*')
        .maybeSingle();

      const totalAmount = data.total_amount || 0;
      const discount = paymentConfig.data?.default_discount || 0;
      const subtotal = totalAmount / (1 - discount / 100);

      setFormData((prev) => ({
        ...prev,
        discount: discount,
        advance_amount: data.paid_amount || 0,
      }));
    }
  };

  const checkAvailability = async () => {
    const { data: allGuests, error } = await supabase
      .from('guests')
      .select(`
        id,
        check_in_date,
        check_out_date,
        booking_status,
        booking_rooms (
          property_type_id,
          number_of_rooms
        )
      `)
      .neq('id', guest.id)
      .neq('booking_status', 'cancelled')
      .eq('is_deleted', false);

    if (error || !allGuests) {
      setAvailableProperties(propertyTypes.map((p) => ({ ...p, available_rooms: p.number_of_rooms })));
      return;
    }

    const overlappingGuests = allGuests.filter((g) => {
      return datesOverlap(
        formData.check_in_date,
        formData.check_out_date,
        g.check_in_date,
        g.check_out_date
      );
    });

    const updatedProperties = propertyTypes.map((propertyType) => {
      let bookedRooms = 0;
      overlappingGuests.forEach((g) => {
        if (g.booking_rooms) {
          g.booking_rooms.forEach((room: any) => {
            if (room.property_type_id === propertyType.id) {
              bookedRooms += room.number_of_rooms;
            }
          });
        }
      });
      return {
        ...propertyType,
        available_rooms: propertyType.number_of_rooms - bookedRooms,
      };
    });

    setAvailableProperties(updatedProperties);
  };

  const datesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    return s1 < e2 && e1 > s2;
  };

  const addRoomSelection = () => {
    setRoomSelections([
      ...roomSelections,
      { id: crypto.randomUUID(), property_type_id: '', number_of_rooms: 1 },
    ]);
  };

  const removeRoomSelection = (id: string) => {
    if (roomSelections.length > 1) {
      setRoomSelections(roomSelections.filter((selection) => selection.id !== id));
    }
  };

  const updateRoomSelection = (id: string, field: keyof RoomSelection, value: string | number) => {
    setRoomSelections(
      roomSelections.map((selection) =>
        selection.id === id ? { ...selection, [field]: value } : selection
      )
    );
  };

  const calculateSubtotal = () => {
    let totalRoomCost = 0;

    const numberOfDays = formData.check_in_date && formData.check_out_date
      ? Math.max(1, Math.ceil((new Date(formData.check_out_date).getTime() - new Date(formData.check_in_date).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

    roomSelections.forEach((selection) => {
      if (selection.property_type_id) {
        const propertyType = availableProperties.find((pt) => pt.id === selection.property_type_id);
        if (propertyType) {
          totalRoomCost += propertyType.cost * selection.number_of_rooms * numberOfDays;
        }
      }
    });
    return totalRoomCost;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = (subtotal * formData.discount) / 100;
    return subtotal - discountAmount;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.check_in_date || !formData.check_out_date) {
      alert('Please select check-in and check-out dates.');
      return;
    }

    const hasEmptySelections = roomSelections.some((sel) => !sel.property_type_id);
    if (hasEmptySelections) {
      alert('Please select a property type for all room selections or remove empty selections.');
      return;
    }

    setLoading(true);

    try {
      const { error: guestError } = await supabase
        .from('guests')
        .update({
          guest_name: formData.guest_name,
          country_code: formData.country_code,
          phone: formData.phone,
          number_of_packs: formData.number_of_packs,
          number_of_kids: formData.number_of_kids,
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          meal_preference: formData.meal_preference,
          food_remarks: formData.food_remarks,
          final_remarks: formData.final_remarks,
          updated_at: new Date().toISOString(),
        })
        .eq('id', guest.id);

      if (guestError) throw guestError;

      await supabase.from('booking_rooms').delete().eq('guest_id', guest.id);

      const bookingRoomsData = roomSelections.map((selection) => ({
        guest_id: guest.id,
        property_type_id: selection.property_type_id,
        number_of_rooms: selection.number_of_rooms,
      }));

      const { error: bookingRoomsError } = await supabase
        .from('booking_rooms')
        .insert(bookingRoomsData);

      if (bookingRoomsError) throw bookingRoomsError;

      const totalAmount = calculateTotal();
      const balanceDue = totalAmount - formData.advance_amount;

      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          total_amount: totalAmount,
          paid_amount: formData.advance_amount,
          balance_due: balanceDue,
          payment_status: balanceDue <= 0 ? 'paid' : formData.advance_amount > 0 ? 'partial' : 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('guest_id', guest.id);

      if (paymentError) throw paymentError;

      alert('Booking updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPropertyTypeInfo = (propertyTypeId: string) => {
    return availableProperties.find((pt) => pt.id === propertyTypeId);
  };

  const datesSelected = formData.check_in_date && formData.check_out_date;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Update Booking</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="border-b pb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Guest Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Guest Name</label>
                <input
                  type="text"
                  required
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <div className="flex gap-2">
                  <select
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                    className="w-32 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Number of Adults
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.number_of_packs}
                    onChange={(e) =>
                      setFormData({ ...formData, number_of_packs: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Baby className="inline w-4 h-4 mr-1" />
                    Number of Kids (below 8 years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.number_of_kids}
                    onChange={(e) =>
                      setFormData({ ...formData, number_of_kids: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-b pb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Room Selections</h3>
              {datesSelected && (
                <button
                  type="button"
                  onClick={addRoomSelection}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Room
                </button>
              )}
            </div>

            {!datesSelected && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  Please select check-in and check-out dates first to view available rooms.
                </p>
              </div>
            )}

            {datesSelected && (
              <div className="space-y-4">
                {roomSelections.map((selection, index) => {
                  const propertyInfo = getPropertyTypeInfo(selection.property_type_id);
                  const isOverbooked =
                    propertyInfo && selection.number_of_rooms > propertyInfo.available_rooms;

                  return (
                    <div key={selection.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Room Selection {index + 1}</h4>
                        {roomSelections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRoomSelection(selection.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Home className="inline w-4 h-4 mr-1" />
                            Property Type
                          </label>
                          <select
                            required
                            value={selection.property_type_id}
                            onChange={(e) =>
                              updateRoomSelection(selection.id, 'property_type_id', e.target.value)
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                          >
                            <option value="">Select a property type</option>
                            {availableProperties.map((property) => (
                              <option key={property.id} value={property.id}>
                                {property.property_name} - ₹{property.cost}/night ({property.available_rooms}{' '}
                                available)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Number of Rooms
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={selection.number_of_rooms}
                            onChange={(e) =>
                              updateRoomSelection(selection.id, 'number_of_rooms', parseInt(e.target.value))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          />
                        </div>
                      </div>

                      {isOverbooked && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 text-sm">
                            Only {propertyInfo.available_rooms} rooms available for this property type on
                            selected dates.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-b pb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <UtensilsCrossed className="inline w-4 h-4 mr-1" />
                  Meal Preference
                </label>
                <select
                  value={formData.meal_preference}
                  onChange={(e) =>
                    setFormData({ ...formData, meal_preference: e.target.value as MealPreference })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MessageSquare className="inline w-4 h-4 mr-1" />
                  Food Remarks
                </label>
                <textarea
                  value={formData.food_remarks}
                  onChange={(e) => setFormData({ ...formData, food_remarks: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  placeholder="Any dietary restrictions or preferences"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MessageSquare className="inline w-4 h-4 mr-1" />
                  Final Remarks
                </label>
                <textarea
                  value={formData.final_remarks}
                  onChange={(e) => setFormData({ ...formData, final_remarks: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  placeholder="Any special requests or additional information"
                />
              </div>
            </div>
          </div>

          <div className="border-b pb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <IndianRupee className="inline w-4 h-4 mr-1" />
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <IndianRupee className="inline w-4 h-4 mr-1" />
                    Advance Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.advance_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, advance_amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900 font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount ({formData.discount}%):</span>
                  <span className="text-red-600 font-medium">
                    -₹{((calculateSubtotal() * formData.discount) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">₹{calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Advance Paid:</span>
                  <span className="text-green-600 font-medium">₹{formData.advance_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span className="text-gray-900">Balance Due:</span>
                  <span className="text-blue-600">
                    ₹{(calculateTotal() - formData.advance_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400"
            >
              {loading ? 'Updating...' : 'Update Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
