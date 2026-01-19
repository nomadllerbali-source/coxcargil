import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, Users, Baby, Home, AlertCircle, Save } from 'lucide-react';
import type { PropertyType } from '../types/database';

interface PropertyWithAvailability extends PropertyType {
  available_rooms: number;
}

interface BookingRequest {
  id: string;
  agent_id: string;
  guest_name: string;
  guest_phone: string;
  guest_city: string;
  number_of_adults: number;
  number_of_kids: number;
  check_in_date: string;
  check_out_date: string;
  property_type_id: string;
  number_of_rooms: number;
  total_cost: number;
  agent_rate: number;
  advance_amount: number;
  status: string;
  confirmation_number: string;
  property_types?: PropertyType;
}

interface EditB2BBookingModalProps {
  booking: BookingRequest;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditB2BBookingModal({ booking, onClose, onUpdate }: EditB2BBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [availableProperties, setAvailableProperties] = useState<PropertyWithAvailability[]>([]);
  const [formData, setFormData] = useState({
    numberOfAdults: booking.number_of_adults,
    numberOfKids: booking.number_of_kids,
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    propertyTypeId: booking.property_type_id,
    numberOfRooms: booking.number_of_rooms,
  });

  const isDateChangeAllowed = () => {
    const checkInDate = new Date(booking.check_in_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkInDate.setHours(0, 0, 0, 0);

    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 3;
  };

  const dateChangeAllowed = isDateChangeAllowed();

  useEffect(() => {
    fetchPropertyTypes();
  }, []);

  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate && propertyTypes.length > 0) {
      checkAvailability();
    }
  }, [formData.checkInDate, formData.checkOutDate, propertyTypes]);

  const fetchPropertyTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('property_types')
        .select('*')
        .eq('is_available', true)
        .order('property_name');

      if (error) throw error;
      setPropertyTypes(data || []);
    } catch (error) {
      console.error('Error fetching property types:', error);
    }
  };

  const checkAvailability = async () => {
    try {
      const { data: bookings, error } = await supabase
        .from('booking_rooms')
        .select(`
          property_type_id,
          number_of_rooms,
          guests!inner (
            id,
            check_in_date,
            check_out_date,
            booking_status,
            is_deleted
          )
        `);

      if (error) throw error;

      const propertyAvailability: { [key: string]: number } = {};

      propertyTypes.forEach(property => {
        let bookedRooms = 0;

        bookings?.forEach((roomBooking: any) => {
          if (
            roomBooking.property_type_id === property.id &&
            !roomBooking.guests.is_deleted &&
            roomBooking.guests.booking_status !== 'cancelled' &&
            datesOverlap(
              formData.checkInDate,
              formData.checkOutDate,
              roomBooking.guests.check_in_date,
              roomBooking.guests.check_out_date
            )
          ) {
            bookedRooms += roomBooking.number_of_rooms;
          }
        });

        const availableRooms = property.number_of_rooms - bookedRooms;
        propertyAvailability[property.id] = Math.max(0, availableRooms);
      });

      const availableProps = propertyTypes.map(property => ({
        ...property,
        available_rooms: propertyAvailability[property.id] !== undefined
          ? propertyAvailability[property.id]
          : property.number_of_rooms
      }));

      setAvailableProperties(availableProps);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailableProperties(propertyTypes.map(p => ({ ...p, available_rooms: p.number_of_rooms })));
    }
  };

  const datesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    return s1 < e2 && e1 > s2;
  };

  const calculateCosts = () => {
    if (!formData.propertyTypeId || !formData.checkInDate || !formData.checkOutDate) {
      return { totalCost: 0, agentRate: 0, advanceAmount: 0 };
    }

    const property = availableProperties.find(p => p.id === formData.propertyTypeId);
    if (!property) return { totalCost: 0, agentRate: 0, advanceAmount: 0 };

    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) return { totalCost: 0, agentRate: 0, advanceAmount: 0 };

    const roomCost = property.cost * formData.numberOfRooms * nights;
    const baseCapacity = formData.numberOfRooms * 2;
    const extraAdults = Math.max(0, formData.numberOfAdults - baseCapacity);

    let totalCost = roomCost;
    if (extraAdults > 0) {
      const extraPersonCost = extraAdults * (property.extra_person_cost || 0) * nights;
      totalCost += extraPersonCost;
    }

    const commission = 10;
    const discount = (totalCost * commission) / 100;
    const agentRate = totalCost - discount;
    const advanceAmount = agentRate * 0.5;

    return { totalCost, agentRate, advanceAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const datesChanged = formData.checkInDate !== booking.check_in_date ||
                         formData.checkOutDate !== booking.check_out_date;

    if (datesChanged && !dateChangeAllowed) {
      alert('Date changes are not allowed within 3 days of check-in date.');
      setLoading(false);
      return;
    }

    const selectedProperty = availableProperties.find(p => p.id === formData.propertyTypeId);
    if (selectedProperty && formData.numberOfRooms > selectedProperty.available_rooms) {
      alert(`Only ${selectedProperty.available_rooms} rooms available for selected dates`);
      setLoading(false);
      return;
    }

    const costs = calculateCosts();

    try {
      const { error } = await supabase
        .from('b2b_booking_requests')
        .update({
          number_of_adults: formData.numberOfAdults,
          number_of_kids: formData.numberOfKids,
          check_in_date: formData.checkInDate,
          check_out_date: formData.checkOutDate,
          property_type_id: formData.propertyTypeId,
          number_of_rooms: formData.numberOfRooms,
          total_cost: costs.totalCost,
          agent_rate: costs.agentRate,
          advance_amount: costs.advanceAmount,
        })
        .eq('id', booking.id);

      if (error) throw error;

      alert('Booking request updated successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating booking request:', error);
      alert('Failed to update booking request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const costs = calculateCosts();
  const selectedProperty = availableProperties.find(p => p.id === formData.propertyTypeId);
  const datesSelected = formData.checkInDate && formData.checkOutDate;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Edit Booking Request</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900">Editing Request: {booking.confirmation_number}</p>
            <p className="text-sm text-blue-700 mt-1">
              Guest: {booking.guest_name} | Phone: {booking.guest_phone}
            </p>
          </div>

          {!dateChangeAllowed && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Date Changes Restricted</p>
                <p className="text-sm text-amber-800 mt-1">
                  Date changes are only allowed up to 3 days before check-in. You can still modify guest count, property type, and number of rooms.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Users className="w-4 h-4" />
                Number of Adults
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.numberOfAdults}
                onChange={(e) =>
                  setFormData({ ...formData, numberOfAdults: parseInt(e.target.value) || 1 })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Baby className="w-4 h-4" />
                Number of Kids
              </label>
              <input
                type="number"
                min="0"
                value={formData.numberOfKids}
                onChange={(e) =>
                  setFormData({ ...formData, numberOfKids: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Check-in Date
              </label>
              <input
                type="date"
                required
                disabled={!dateChangeAllowed}
                min={new Date().toISOString().split('T')[0]}
                value={formData.checkInDate}
                onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {!dateChangeAllowed && (
                <p className="mt-1 text-xs text-amber-600">
                  Date changes not allowed within 3 days of check-in
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Check-out Date
              </label>
              <input
                type="date"
                required
                disabled={!dateChangeAllowed}
                min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                value={formData.checkOutDate}
                onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {!dateChangeAllowed && (
                <p className="mt-1 text-xs text-amber-600">
                  Date changes not allowed within 3 days of check-in
                </p>
              )}
            </div>
          </div>

          {datesSelected && availableProperties.length === 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">No properties available</p>
                <p className="text-sm text-red-700 mt-1">
                  All properties are fully booked for the selected dates. Please try different dates.
                </p>
              </div>
            </div>
          )}

          {datesSelected && availableProperties.length > 0 && (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Home className="w-4 h-4" />
                  Property Type
                </label>
                <select
                  required
                  value={formData.propertyTypeId}
                  onChange={(e) => setFormData({ ...formData, propertyTypeId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                >
                  <option value="">Select Property</option>
                  {availableProperties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.property_name} - ₹{property.cost.toLocaleString()}/night
                    </option>
                  ))}
                </select>
                {selectedProperty && (
                  <p className="mt-2 text-sm text-green-600 font-medium">
                    {selectedProperty.available_rooms} rooms available for selected dates
                  </p>
                )}
                {selectedProperty && formData.numberOfRooms > selectedProperty.available_rooms && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    Only {selectedProperty.available_rooms} rooms available! Please adjust the number of rooms.
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  Number of Rooms
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedProperty?.available_rooms || 999}
                  value={formData.numberOfRooms}
                  onChange={(e) =>
                    setFormData({ ...formData, numberOfRooms: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
              </div>

              {costs.agentRate > 0 && (
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border-2 border-teal-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Updated Cost Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Regular Rate</p>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{costs.totalCost.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Agent Rate</p>
                      <p className="text-xl font-bold text-teal-600">
                        ₹{costs.agentRate.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-100 to-red-100 p-4 rounded-lg border-2 border-orange-300">
                      <p className="text-sm text-gray-700 font-semibold">
                        Advance Payment (50%)
                      </p>
                      <p className="text-xl font-bold text-orange-700">
                        ₹{costs.advanceAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Discount</p>
                      <p className="text-xl font-bold text-green-600">
                        -₹{(costs.totalCost - costs.agentRate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !datesSelected || availableProperties.length === 0 || (selectedProperty && formData.numberOfRooms > selectedProperty.available_rooms)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Updating...' : 'Update Booking Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
