import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, Users, Phone, User, Baby, MapPin, Upload, DollarSign, Home, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { PropertyType, B2BAgent } from '../types/database';

interface RoomSelection {
  id: string;
  property_type_id: string;
  number_of_rooms: number;
}

interface PropertyWithAvailability extends PropertyType {
  available_rooms: number;
}

export default function B2BBookingRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [availableProperties, setAvailableProperties] = useState<PropertyWithAvailability[]>([]);
  const [agent, setAgent] = useState<B2BAgent | null>(null);
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [roomSelections, setRoomSelections] = useState<RoomSelection[]>([
    { id: crypto.randomUUID(), property_type_id: '', number_of_rooms: 1 }
  ]);
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestCity: '',
    numberOfAdults: 1,
    numberOfKids: 0,
    checkInDate: '',
    checkOutDate: '',
  });
  const [calculatedCosts, setCalculatedCosts] = useState({
    totalCost: 0,
    agentRate: 0,
    advanceAmount: 0,
    commissionPercentage: 10,
  });

  useEffect(() => {
    const agentId = sessionStorage.getItem('b2bAgentId');
    if (!agentId) {
      navigate('/b2b');
      return;
    }

    fetchData(agentId);
  }, [navigate]);

  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate && propertyTypes.length > 0) {
      checkAvailability();
    }
  }, [formData.checkInDate, formData.checkOutDate, propertyTypes]);

  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate && roomSelections.some(s => s.property_type_id)) {
      calculateCosts();
    }
  }, [roomSelections, formData.checkInDate, formData.checkOutDate, formData.numberOfAdults]);

  const fetchData = async (agentId: string) => {
    try {
      const [agentRes, propertyTypesRes] = await Promise.all([
        supabase.from('b2b_agents').select('*').eq('id', agentId).single(),
        supabase.from('property_types').select('*').eq('is_available', true).order('property_name'),
      ]);

      if (agentRes.error) throw agentRes.error;
      if (propertyTypesRes.error) throw propertyTypesRes.error;

      setAgent(agentRes.data);
      setPropertyTypes(propertyTypesRes.data || []);

      const propertyId = searchParams.get('propertyId');
      const checkInDate = searchParams.get('checkInDate');

      if (propertyId && propertyTypesRes.data?.some((p: PropertyType) => p.id === propertyId)) {
        setRoomSelections([{ id: crypto.randomUUID(), property_type_id: propertyId, number_of_rooms: 1 }]);
      }
      if (checkInDate) {
        setFormData(prev => ({ ...prev, checkInDate }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

        bookings?.forEach((booking: any) => {
          if (
            booking.property_type_id === property.id &&
            !booking.guests.is_deleted &&
            booking.guests.booking_status !== 'cancelled' &&
            datesOverlap(
              formData.checkInDate,
              formData.checkOutDate,
              booking.guests.check_in_date,
              booking.guests.check_out_date
            )
          ) {
            bookedRooms += booking.number_of_rooms;
          }
        });

        const availableRooms = property.number_of_rooms - bookedRooms;
        propertyAvailability[property.id] = Math.max(0, availableRooms);
      });

      const availableProps = propertyTypes
        .map(property => ({
          ...property,
          available_rooms: propertyAvailability[property.id] !== undefined
            ? propertyAvailability[property.id]
            : property.number_of_rooms
        }))
        .filter(property => property.available_rooms > 0);

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

  const calculateCosts = async () => {
    if (!agent || !formData.checkInDate || !formData.checkOutDate) return;

    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) return;

    let totalRoomCost = 0;
    let totalRooms = 0;
    let totalExtraPersonCost = 0;

    roomSelections.forEach(selection => {
      if (selection.property_type_id) {
        const property = availableProperties.find(p => p.id === selection.property_type_id);
        if (property) {
          totalRoomCost += property.cost * selection.number_of_rooms * nights;
          totalRooms += selection.number_of_rooms;
          totalExtraPersonCost += (property.extra_person_cost || 0) * selection.number_of_rooms * nights;
        }
      }
    });

    const baseCapacity = totalRooms * 2;
    const extraAdults = Math.max(0, formData.numberOfAdults - baseCapacity);

    let subtotal = totalRoomCost;
    if (extraAdults > 0 && totalRooms > 0) {
      const avgExtraPersonCost = totalExtraPersonCost / totalRooms;
      subtotal += extraAdults * avgExtraPersonCost;
    }

    const commission = agent.commission_percentage || 10;
    const discount = (subtotal * commission) / 100;
    const agentRate = subtotal - discount;
    const advanceAmount = agentRate * 0.5;

    setCalculatedCosts({
      totalCost: subtotal,
      agentRate,
      advanceAmount,
      commissionPercentage: commission,
    });
  };

  const addRoomSelection = () => {
    setRoomSelections([
      ...roomSelections,
      { id: crypto.randomUUID(), property_type_id: '', number_of_rooms: 1 }
    ]);
  };

  const removeRoomSelection = (id: string) => {
    if (roomSelections.length > 1) {
      setRoomSelections(roomSelections.filter(selection => selection.id !== id));
    }
  };

  const updateRoomSelection = (id: string, field: keyof RoomSelection, value: string | number) => {
    setRoomSelections(roomSelections.map(selection =>
      selection.id === id ? { ...selection, [field]: value } : selection
    ));
  };

  const getPropertyTypeInfo = (propertyTypeId: string) => {
    return availableProperties.find(pt => pt.id === propertyTypeId);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadScreenshot = async (file: File, requestId: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${requestId}.${fileExt}`;
      const filePath = `b2b-payments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('payment-screenshots').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      throw error;
    }
  };

  const generateConfirmationNumber = () => {
    const prefix = 'B2BREQ';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const createNotification = async (agentId: string, title: string, message: string) => {
    try {
      await supabase.from('agent_notifications').insert({
        agent_id: agentId,
        notification_type: 'booking_status',
        title,
        message,
        is_read: false,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!agent) {
      alert('Agent not found');
      setLoading(false);
      return;
    }

    if (!formData.checkInDate || !formData.checkOutDate) {
      alert('Please select check-in and check-out dates');
      setLoading(false);
      return;
    }

    const hasEmptySelections = roomSelections.some(sel => !sel.property_type_id);
    if (hasEmptySelections) {
      alert('Please select a property type for all room selections or remove empty selections');
      setLoading(false);
      return;
    }

    if (calculatedCosts.advanceAmount === 0) {
      alert('Please select property and dates to calculate costs');
      setLoading(false);
      return;
    }

    if (!screenshot) {
      alert('Please upload payment screenshot');
      setLoading(false);
      return;
    }

    try {
      const baseConfirmationNumber = generateConfirmationNumber();

      for (let i = 0; i < roomSelections.length; i++) {
        const selection = roomSelections[i];
        const property = availableProperties.find(p => p.id === selection.property_type_id);
        if (!property) continue;

        const confirmationNumber = roomSelections.length > 1
          ? `${baseConfirmationNumber}-${i + 1}`
          : baseConfirmationNumber;

        const checkIn = new Date(formData.checkInDate);
        const checkOut = new Date(formData.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        const roomCost = property.cost * selection.number_of_rooms * nights;
        const totalRooms = roomSelections.reduce((sum, s) => sum + s.number_of_rooms, 0);
        const baseCapacity = totalRooms * 2;
        const extraAdults = Math.max(0, formData.numberOfAdults - baseCapacity);

        let selectionTotalCost = roomCost;
        if (extraAdults > 0) {
          const extraPersonCost = extraAdults * (property.extra_person_cost || 0) * nights;
          selectionTotalCost += extraPersonCost / roomSelections.length;
        }

        const commission = agent.commission_percentage || 10;
        const discount = (selectionTotalCost * commission) / 100;
        const selectionAgentRate = selectionTotalCost - discount;
        const selectionAdvanceAmount = selectionAgentRate * 0.5;

        const { data: requestData, error: requestError } = await supabase
          .from('b2b_booking_requests')
          .insert({
            agent_id: agent.id,
            guest_name: formData.guestName,
            guest_phone: formData.guestPhone,
            guest_city: formData.guestCity,
            number_of_adults: formData.numberOfAdults,
            number_of_kids: formData.numberOfKids,
            check_in_date: formData.checkInDate,
            check_out_date: formData.checkOutDate,
            property_type_id: selection.property_type_id,
            number_of_rooms: selection.number_of_rooms,
            total_cost: selectionTotalCost,
            agent_rate: selectionAgentRate,
            advance_amount: selectionAdvanceAmount,
            status: 'pending',
            confirmation_number: confirmationNumber,
          })
          .select()
          .single();

        if (requestError) throw requestError;

        const screenshotUrl = await uploadScreenshot(screenshot, requestData.id);

        const { error: updateError } = await supabase
          .from('b2b_booking_requests')
          .update({ payment_screenshot_url: screenshotUrl })
          .eq('id', requestData.id);

        if (updateError) throw updateError;
      }

      await createNotification(
        agent.id,
        'Booking Request Submitted',
        `Your booking request ${baseConfirmationNumber} has been submitted and is pending admin approval.`
      );

      alert(
        `Booking request${roomSelections.length > 1 ? 's' : ''} submitted successfully!\n\nRequest Number: ${baseConfirmationNumber}\n\nYou will be notified once the admin approves your request.`
      );

      navigate('/b2b/dashboard');
    } catch (error) {
      console.error('Error creating booking request:', error);
      alert('Failed to create booking request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const datesSelected = formData.checkInDate && formData.checkOutDate;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Guest Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    Guest Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    placeholder="Enter guest name"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    placeholder="Enter contact number"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.guestCity}
                    onChange={(e) => setFormData({ ...formData, guestCity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    placeholder="Enter city"
                  />
                </div>

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
                    Number of Kids (Below 8 years)
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
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                <Calendar className="inline w-5 h-5 mr-2" />
                Booking Dates
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    required
                    min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                </div>
              </div>

              {datesSelected && availableProperties.length === 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">No properties available</p>
                    <p className="text-sm text-red-700 mt-1">
                      All properties are fully booked for the selected dates. Please try different dates.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  <Home className="inline w-5 h-5 mr-2" />
                  Room Selection
                </h2>
                {datesSelected && availableProperties.length > 0 && (
                  <button
                    type="button"
                    onClick={addRoomSelection}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Property Type
                  </button>
                )}
              </div>

              {!datesSelected && (
                <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <p className="text-gray-600">
                    Please select check-in and check-out dates first to view available properties
                  </p>
                </div>
              )}

              {datesSelected && availableProperties.length > 0 && (
                <div className="space-y-4">
                  {roomSelections.map((selection) => {
                    const propertyInfo = getPropertyTypeInfo(selection.property_type_id);
                    return (
                      <div key={selection.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Property Type
                              </label>
                              <select
                                value={selection.property_type_id}
                                onChange={(e) => updateRoomSelection(selection.id, 'property_type_id', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                                required
                              >
                                <option value="">Select a property type</option>
                                {availableProperties.map((property) => (
                                  <option key={property.id} value={property.id}>
                                    {property.property_name} - ₹{property.cost.toLocaleString('en-IN')} per night
                                  </option>
                                ))}
                              </select>
                              {propertyInfo && (
                                <p className="mt-2 text-sm text-green-600 font-medium">
                                  {propertyInfo.available_rooms} rooms available for selected dates
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Rooms
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={propertyInfo?.available_rooms || 999}
                                value={selection.number_of_rooms}
                                onChange={(e) => updateRoomSelection(selection.id, 'number_of_rooms', parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                                required
                              />
                            </div>
                          </div>

                          {roomSelections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRoomSelection(selection.id)}
                              className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Remove this room selection"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {datesSelected && availableProperties.length > 0 && calculatedCosts.advanceAmount > 0 && (
              <>
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg shadow p-6 border-2 border-teal-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-teal-600" />
                    Cost Breakdown
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Regular Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{calculatedCosts.totalCost.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Your Commission ({calculatedCosts.commissionPercentage}% OFF)
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        -₹{(calculatedCosts.totalCost - calculatedCosts.agentRate).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Agent Rate</p>
                      <p className="text-2xl font-bold text-teal-600">
                        ₹{calculatedCosts.agentRate.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-100 to-red-100 p-4 rounded-lg border-2 border-orange-300">
                      <p className="text-sm text-gray-700 font-semibold">
                        Advance Payment Required (50%)
                      </p>
                      <p className="text-2xl font-bold text-orange-700">
                        ₹{calculatedCosts.advanceAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Proof</h2>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Upload className="w-4 h-4" />
                      Upload Payment Screenshot
                    </label>
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                    {screenshotPreview && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <img
                          src={screenshotPreview}
                          alt="Payment screenshot"
                          className="max-w-md rounded-lg border-2 border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/b2b/dashboard')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || calculatedCosts.advanceAmount === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting Request...' : 'Submit Booking Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
