import { useState, useEffect, useRef } from 'react';
import { X, Send, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface PropertyType {
  id: string;
  property_name: string;
  cost: number;
  extra_person_cost: number;
  number_of_rooms: number;
  available_rooms?: number;
}

type Step = 'welcome' | 'check_in_date' | 'check_out_date' | 'guests' | 'properties' | 'final';

export default function ChatBot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { text: 'Hello! Welcome to COXCARGILL. I\'d love to help you find the perfect property. When are you planning to check in?', isBot: true, timestamp: new Date() }
  ]);
  const [step, setStep] = useState<Step>('check_in_date');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState('');
  const [tempCheckInDate, setTempCheckInDate] = useState('');
  const [tempCheckOutDate, setTempCheckOutDate] = useState('');
  const [availableProperties, setAvailableProperties] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, isBot: boolean) => {
    setMessages(prev => [...prev, { text, isBot, timestamp: new Date() }]);
  };

  const handleCheckInDateSubmit = (date: string) => {
    setCheckInDate(date);
    addMessage(date, false);
    addMessage('Great! When will you be checking out?', true);
    setStep('check_out_date');
  };

  const handleCheckOutDateSubmit = (date: string) => {
    setCheckOutDate(date);
    addMessage(date, false);
    addMessage('How many guests will be staying?', true);
    setStep('guests');
  };

  const handleGuestsSubmit = async (guests: string) => {
    setNumberOfGuests(guests);
    addMessage(guests, false);
    setLoading(true);
    addMessage('Let me check available properties for you...', true);

    try {
      const { data: propertyTypes, error: ptError } = await supabase
        .from('property_types')
        .select('*')
        .eq('is_available', true);

      if (ptError) throw ptError;

      if (!propertyTypes || propertyTypes.length === 0) {
        addMessage('I\'m sorry, no properties are currently available. Please contact us directly for assistance.', true);
        setStep('final');
        return;
      }

      const availablePropertiesWithRooms: PropertyType[] = [];

      for (const property of propertyTypes) {
        const { data: bookedRooms, error: bookingError } = await supabase
          .from('booking_rooms')
          .select('number_of_rooms, guests!inner(check_in_date, check_out_date, booking_status, is_deleted)')
          .eq('property_type_id', property.id);

        if (bookingError) {
          console.error('Error checking bookings:', bookingError);
          continue;
        }

        let totalBookedRooms = 0;
        if (bookedRooms) {
          for (const booking of bookedRooms) {
            const guest = booking.guests as any;

            if (guest.is_deleted || guest.booking_status === 'cancelled' || guest.booking_status === 'checked-out') {
              continue;
            }

            const bookingCheckIn = new Date(guest.check_in_date);
            const bookingCheckOut = new Date(guest.check_out_date);
            const requestedCheckIn = new Date(checkInDate);
            const requestedCheckOut = new Date(checkOutDate);

            const hasOverlap = requestedCheckIn < bookingCheckOut && requestedCheckOut > bookingCheckIn;

            if (hasOverlap) {
              totalBookedRooms += booking.number_of_rooms;
            }
          }
        }

        const availableRooms = property.number_of_rooms - totalBookedRooms;

        if (availableRooms > 0) {
          availablePropertiesWithRooms.push({
            ...property,
            available_rooms: availableRooms
          });
        }
      }

      if (availablePropertiesWithRooms.length > 0) {
        setAvailableProperties(availablePropertiesWithRooms);
        addMessage(`Great news! I found ${availablePropertiesWithRooms.length} ${availablePropertiesWithRooms.length === 1 ? 'property type' : 'property types'} with available rooms for your dates:`, true);
        setStep('properties');
      } else {
        addMessage('I\'m sorry, all properties are fully booked for your selected dates. Please try different dates or contact us directly for assistance.', true);
        setStep('final');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      addMessage('Sorry, I encountered an error. Please try again or contact us directly.', true);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelect = (property: PropertyType) => {
    const message = `Perfect choice! ${property.property_name}`;
    addMessage(message, false);

    const whatsappMessage = encodeURIComponent(
      `Hi! I'm interested in booking:\n\nProperty: ${property.property_name}\nCheck-in: ${checkInDate}\nCheck-out: ${checkOutDate}\nGuests: ${numberOfGuests}\nCost: ₹${property.cost}\n\nPlease help me with the booking process.`
    );
    const whatsappLink = `https://wa.me/919496960809?text=${whatsappMessage}`;

    addMessage(
      `Excellent! I'll connect you with our team to complete your booking. Click the button below to chat with us on WhatsApp.`,
      true
    );

    setTimeout(() => {
      window.open(whatsappLink, '_blank');
    }, 500);

    setStep('final');
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMinCheckOutDate = () => {
    if (checkInDate) {
      const date = new Date(checkInDate);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split('T')[0];
    }
    return getTodayDate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col h-[600px]">
        <div className="bg-gray-900 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">COXCARGILL Assistant</h3>
            <p className="text-xs text-gray-300">We're here to help</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.isBot
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-gray-900 text-white'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}

          {step === 'properties' && availableProperties.length > 0 && (
            <div className="space-y-3">
              {availableProperties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => handlePropertySelect(property)}
                  className="w-full bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-gray-900 transition-all text-left"
                >
                  <h4 className="font-semibold text-gray-900 mb-1">{property.property_name}</h4>
                  <p className="text-sm text-gray-600">Starting from ₹{property.cost}/night</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {property.available_rooms !== undefined && property.available_rooms > 0
                      ? `${property.available_rooms} ${property.available_rooms === 1 ? 'room' : 'rooms'} available for your dates`
                      : `${property.number_of_rooms} ${property.number_of_rooms === 1 ? 'room' : 'rooms'} total`
                    }
                  </p>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {step === 'check_in_date' && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  min={getTodayDate()}
                  value={tempCheckInDate}
                  onChange={(e) => setTempCheckInDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <button
                onClick={() => {
                  if (tempCheckInDate) {
                    handleCheckInDateSubmit(tempCheckInDate);
                  }
                }}
                disabled={!tempCheckInDate}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'check_out_date' && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  min={getMinCheckOutDate()}
                  value={tempCheckOutDate}
                  onChange={(e) => setTempCheckOutDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <button
                onClick={() => {
                  if (tempCheckOutDate) {
                    handleCheckOutDateSubmit(tempCheckOutDate);
                  }
                }}
                disabled={!tempCheckOutDate}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'guests' && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                placeholder="Number of guests"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    handleGuestsSubmit(e.currentTarget.value);
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (input.value) {
                    handleGuestsSubmit(input.value);
                  }
                }}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
