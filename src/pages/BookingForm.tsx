import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateAgent, getAgentCommissionPercentage, calculateB2BPrice } from '../lib/commissionUtils';
import { Calendar, Users, UtensilsCrossed, MessageSquare, Baby, Plus, Trash2, IndianRupee, Home, ClipboardList, CheckCircle, XCircle, Search, ChevronDown } from 'lucide-react';
import type { MealPreference, PropertyType, BookingType, B2BAgent } from '../types/database';

const COUNTRIES = [
  { name: 'Afghanistan', code: '+93', flag: '🇦🇫' },
  { name: 'Albania', code: '+355', flag: '🇦🇱' },
  { name: 'Algeria', code: '+213', flag: '🇩🇿' },
  { name: 'Andorra', code: '+376', flag: '🇦🇩' },
  { name: 'Angola', code: '+244', flag: '🇦🇴' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { name: 'Armenia', code: '+374', flag: '🇦🇲' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Austria', code: '+43', flag: '🇦🇹' },
  { name: 'Azerbaijan', code: '+994', flag: '🇦🇿' },
  { name: 'Bahamas', code: '+1-242', flag: '🇧🇸' },
  { name: 'Bahrain', code: '+973', flag: '🇧🇭' },
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { name: 'Barbados', code: '+1-246', flag: '🇧🇧' },
  { name: 'Belarus', code: '+375', flag: '🇧🇾' },
  { name: 'Belgium', code: '+32', flag: '🇧🇪' },
  { name: 'Belize', code: '+501', flag: '🇧🇿' },
  { name: 'Benin', code: '+229', flag: '🇧🇯' },
  { name: 'Bhutan', code: '+975', flag: '🇧🇹' },
  { name: 'Bolivia', code: '+591', flag: '🇧🇴' },
  { name: 'Bosnia', code: '+387', flag: '🇧🇦' },
  { name: 'Botswana', code: '+267', flag: '🇧🇼' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Brunei', code: '+673', flag: '🇧🇳' },
  { name: 'Bulgaria', code: '+359', flag: '🇧🇬' },
  { name: 'Burkina Faso', code: '+226', flag: '🇧🇫' },
  { name: 'Burundi', code: '+257', flag: '🇧🇮' },
  { name: 'Cambodia', code: '+855', flag: '🇰🇭' },
  { name: 'Cameroon', code: '+237', flag: '🇨🇲' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Cape Verde', code: '+238', flag: '🇨🇻' },
  { name: 'Central African Republic', code: '+236', flag: '🇨🇫' },
  { name: 'Chad', code: '+235', flag: '🇹🇩' },
  { name: 'Chile', code: '+56', flag: '🇨🇱' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Colombia', code: '+57', flag: '🇨🇴' },
  { name: 'Comoros', code: '+269', flag: '🇰🇲' },
  { name: 'Congo', code: '+242', flag: '🇨🇬' },
  { name: 'Costa Rica', code: '+506', flag: '🇨🇷' },
  { name: 'Croatia', code: '+385', flag: '🇭🇷' },
  { name: 'Cuba', code: '+53', flag: '🇨🇺' },
  { name: 'Cyprus', code: '+357', flag: '🇨🇾' },
  { name: 'Czech Republic', code: '+420', flag: '🇨🇿' },
  { name: 'Denmark', code: '+45', flag: '🇩🇰' },
  { name: 'Djibouti', code: '+253', flag: '🇩🇯' },
  { name: 'Dominica', code: '+1-767', flag: '🇩🇲' },
  { name: 'Dominican Republic', code: '+1-809', flag: '🇩🇴' },
  { name: 'Ecuador', code: '+593', flag: '🇪🇨' },
  { name: 'Egypt', code: '+20', flag: '🇪🇬' },
  { name: 'El Salvador', code: '+503', flag: '🇸🇻' },
  { name: 'Equatorial Guinea', code: '+240', flag: '🇬🇶' },
  { name: 'Eritrea', code: '+291', flag: '🇪🇷' },
  { name: 'Estonia', code: '+372', flag: '🇪🇪' },
  { name: 'Ethiopia', code: '+251', flag: '🇪🇹' },
  { name: 'Fiji', code: '+679', flag: '🇫🇯' },
  { name: 'Finland', code: '+358', flag: '🇫🇮' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Gabon', code: '+241', flag: '🇬🇦' },
  { name: 'Gambia', code: '+220', flag: '🇬🇲' },
  { name: 'Georgia', code: '+995', flag: '🇬🇪' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'Ghana', code: '+233', flag: '🇬🇭' },
  { name: 'Greece', code: '+30', flag: '🇬🇷' },
  { name: 'Grenada', code: '+1-473', flag: '🇬🇩' },
  { name: 'Guatemala', code: '+502', flag: '🇬🇹' },
  { name: 'Guinea', code: '+224', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', code: '+245', flag: '🇬🇼' },
  { name: 'Guyana', code: '+592', flag: '🇬🇾' },
  { name: 'Haiti', code: '+509', flag: '🇭🇹' },
  { name: 'Honduras', code: '+504', flag: '🇭🇳' },
  { name: 'Hong Kong', code: '+852', flag: '🇭🇰' },
  { name: 'Hungary', code: '+36', flag: '🇭🇺' },
  { name: 'Iceland', code: '+354', flag: '🇮🇸' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'Iran', code: '+98', flag: '🇮🇷' },
  { name: 'Iraq', code: '+964', flag: '🇮🇶' },
  { name: 'Ireland', code: '+353', flag: '🇮🇪' },
  { name: 'Israel', code: '+972', flag: '🇮🇱' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
  { name: 'Jamaica', code: '+1-876', flag: '🇯🇲' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'Jordan', code: '+962', flag: '🇯🇴' },
  { name: 'Kazakhstan', code: '+7', flag: '🇰🇿' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  { name: 'Kiribati', code: '+686', flag: '🇰🇮' },
  { name: 'Kosovo', code: '+383', flag: '🇽🇰' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼' },
  { name: 'Kyrgyzstan', code: '+996', flag: '🇰🇬' },
  { name: 'Laos', code: '+856', flag: '🇱🇦' },
  { name: 'Latvia', code: '+371', flag: '🇱🇻' },
  { name: 'Lebanon', code: '+961', flag: '🇱🇧' },
  { name: 'Lesotho', code: '+266', flag: '🇱🇸' },
  { name: 'Liberia', code: '+231', flag: '🇱🇷' },
  { name: 'Libya', code: '+218', flag: '🇱🇾' },
  { name: 'Liechtenstein', code: '+423', flag: '🇱🇮' },
  { name: 'Lithuania', code: '+370', flag: '🇱🇹' },
  { name: 'Luxembourg', code: '+352', flag: '🇱🇺' },
  { name: 'Macau', code: '+853', flag: '🇲🇴' },
  { name: 'Madagascar', code: '+261', flag: '🇲🇬' },
  { name: 'Malawi', code: '+265', flag: '🇲🇼' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Maldives', code: '+960', flag: '🇲🇻' },
  { name: 'Mali', code: '+223', flag: '🇲🇱' },
  { name: 'Malta', code: '+356', flag: '🇲🇹' },
  { name: 'Marshall Islands', code: '+692', flag: '🇲🇭' },
  { name: 'Mauritania', code: '+222', flag: '🇲🇷' },
  { name: 'Mauritius', code: '+230', flag: '🇲🇺' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'Micronesia', code: '+691', flag: '🇫🇲' },
  { name: 'Moldova', code: '+373', flag: '🇲🇩' },
  { name: 'Monaco', code: '+377', flag: '🇲🇨' },
  { name: 'Mongolia', code: '+976', flag: '🇲🇳' },
  { name: 'Montenegro', code: '+382', flag: '🇲🇪' },
  { name: 'Morocco', code: '+212', flag: '🇲🇦' },
  { name: 'Mozambique', code: '+258', flag: '🇲🇿' },
  { name: 'Myanmar', code: '+95', flag: '🇲🇲' },
  { name: 'Namibia', code: '+264', flag: '🇳🇦' },
  { name: 'Nauru', code: '+674', flag: '🇳🇷' },
  { name: 'Nepal', code: '+977', flag: '🇳🇵' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
  { name: 'Nicaragua', code: '+505', flag: '🇳🇮' },
  { name: 'Niger', code: '+227', flag: '🇳🇪' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'North Korea', code: '+850', flag: '🇰🇵' },
  { name: 'North Macedonia', code: '+389', flag: '🇲🇰' },
  { name: 'Norway', code: '+47', flag: '🇳🇴' },
  { name: 'Oman', code: '+968', flag: '🇴🇲' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'Palau', code: '+680', flag: '🇵🇼' },
  { name: 'Palestine', code: '+970', flag: '🇵🇸' },
  { name: 'Panama', code: '+507', flag: '🇵🇦' },
  { name: 'Papua New Guinea', code: '+675', flag: '🇵🇬' },
  { name: 'Paraguay', code: '+595', flag: '🇵🇾' },
  { name: 'Peru', code: '+51', flag: '🇵🇪' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭' },
  { name: 'Poland', code: '+48', flag: '🇵🇱' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦' },
  { name: 'Romania', code: '+40', flag: '🇷🇴' },
  { name: 'Russia', code: '+7', flag: '🇷🇺' },
  { name: 'Rwanda', code: '+250', flag: '🇷🇼' },
  { name: 'Saint Kitts and Nevis', code: '+1-869', flag: '🇰🇳' },
  { name: 'Saint Lucia', code: '+1-758', flag: '🇱🇨' },
  { name: 'Saint Vincent', code: '+1-784', flag: '🇻🇨' },
  { name: 'Samoa', code: '+685', flag: '🇼🇸' },
  { name: 'San Marino', code: '+378', flag: '🇸🇲' },
  { name: 'Sao Tome and Principe', code: '+239', flag: '🇸🇹' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'Senegal', code: '+221', flag: '🇸🇳' },
  { name: 'Serbia', code: '+381', flag: '🇷🇸' },
  { name: 'Seychelles', code: '+248', flag: '🇸🇨' },
  { name: 'Sierra Leone', code: '+232', flag: '🇸🇱' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'Slovakia', code: '+421', flag: '🇸🇰' },
  { name: 'Slovenia', code: '+386', flag: '🇸🇮' },
  { name: 'Solomon Islands', code: '+677', flag: '🇸🇧' },
  { name: 'Somalia', code: '+252', flag: '🇸🇴' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'South Sudan', code: '+211', flag: '🇸🇸' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
  { name: 'Sudan', code: '+249', flag: '🇸🇩' },
  { name: 'Suriname', code: '+597', flag: '🇸🇷' },
  { name: 'Sweden', code: '+46', flag: '🇸🇪' },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭' },
  { name: 'Syria', code: '+963', flag: '🇸🇾' },
  { name: 'Taiwan', code: '+886', flag: '🇹🇼' },
  { name: 'Tajikistan', code: '+992', flag: '🇹🇯' },
  { name: 'Tanzania', code: '+255', flag: '🇹🇿' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { name: 'Timor-Leste', code: '+670', flag: '🇹🇱' },
  { name: 'Togo', code: '+228', flag: '🇹🇬' },
  { name: 'Tonga', code: '+676', flag: '🇹🇴' },
  { name: 'Trinidad and Tobago', code: '+1-868', flag: '🇹🇹' },
  { name: 'Tunisia', code: '+216', flag: '🇹🇳' },
  { name: 'Turkey', code: '+90', flag: '🇹🇷' },
  { name: 'Turkmenistan', code: '+993', flag: '🇹🇲' },
  { name: 'Tuvalu', code: '+688', flag: '🇹🇻' },
  { name: 'Uganda', code: '+256', flag: '🇺🇬' },
  { name: 'Ukraine', code: '+380', flag: '🇺🇦' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'Uruguay', code: '+598', flag: '🇺🇾' },
  { name: 'Uzbekistan', code: '+998', flag: '🇺🇿' },
  { name: 'Vanuatu', code: '+678', flag: '🇻🇺' },
  { name: 'Vatican City', code: '+379', flag: '🇻🇦' },
  { name: 'Venezuela', code: '+58', flag: '🇻🇪' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'Yemen', code: '+967', flag: '🇾🇪' },
  { name: 'Zambia', code: '+260', flag: '🇿🇲' },
  { name: 'Zimbabwe', code: '+263', flag: '🇿🇼' },
];

interface RoomSelection {
  id: string;
  property_type_id: string;
  selected_room_ids: string[];
}

interface PropertyWithAvailability extends PropertyType {
  available_rooms: number;
}

interface AvailableRoom {
  id: string;
  room_number: string;
  property_type_id: string;
}

export default function BookingForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [availableProperties, setAvailableProperties] = useState<PropertyWithAvailability[]>([]);
  const [roomSelections, setRoomSelections] = useState<RoomSelection[]>([
    { id: crypto.randomUUID(), property_type_id: '', selected_room_ids: [] }
  ]);
  const [availableRooms, setAvailableRooms] = useState<Record<string, AvailableRoom[]>>({});
  const [b2bAgents, setB2bAgents] = useState<B2BAgent[]>([]);
  const [validatedAgent, setValidatedAgent] = useState<B2BAgent | null>(null);
  const [agentValidationError, setAgentValidationError] = useState<string>('');
  const [agentCommission, setAgentCommission] = useState<number>(10);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    booking_type: 'normal' as BookingType,
    guest_name: '',
    country_code: '+91',
    phone: '',
    number_of_packs: '' as any,
    number_of_kids: 0,
    check_in_date: '',
    check_out_date: '',
    meal_preference: 'veg' as MealPreference,
    food_remarks: '',
    final_remarks: '',
    discount: 0,
    advance_amount: 0,
    agent_id: '',
    manual_cost: 0,
  });

  const calculateSubtotal = () => {
    if (formData.booking_type === 'airbnb' || formData.booking_type === 'mmt') {
      return formData.manual_cost;
    }

    if (formData.booking_type === 'promotion') {
      return 0;
    }

    let totalRoomCost = 0;
    let totalRooms = 0;
    let totalExtraPersonCost = 0;

    const numberOfDays = formData.check_in_date && formData.check_out_date
      ? Math.max(1, Math.ceil((new Date(formData.check_out_date).getTime() - new Date(formData.check_in_date).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

    roomSelections.forEach(selection => {
      if (selection.property_type_id) {
        const propertyType = availableProperties.find(pt => pt.id === selection.property_type_id);
        if (propertyType) {
          const numRooms = selection.selected_room_ids.length;
          let costPerNight = propertyType.cost;
          let extraPersonCostPerNight = propertyType.extra_person_cost || 0;

          if (formData.booking_type === 'b2b' && validatedAgent) {
            costPerNight = calculateB2BPrice(propertyType.cost, agentCommission);
            extraPersonCostPerNight = calculateB2BPrice(propertyType.extra_person_cost || 0, agentCommission);
          }

          totalRoomCost += costPerNight * numRooms * numberOfDays;
          totalRooms += numRooms;
          totalExtraPersonCost += extraPersonCostPerNight * numRooms * numberOfDays;
        }
      }
    });

    const baseCapacity = totalRooms * 2;
    const numPacks = typeof formData.number_of_packs === 'number' ? formData.number_of_packs : 0;
    const extraAdults = Math.max(0, numPacks - baseCapacity);

    let subtotal = totalRoomCost;

    if (extraAdults > 0 && totalRooms > 0) {
      const avgExtraPersonCost = totalExtraPersonCost / totalRooms;
      subtotal += extraAdults * avgExtraPersonCost;
    }

    return subtotal;
  };

  const subtotal = calculateSubtotal();
  const totalAmount = subtotal - formData.discount;
  const dueAmount = totalAmount - formData.advance_amount;

  useEffect(() => {
    fetchPropertyTypes();
    fetchB2BAgents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (formData.check_in_date && formData.check_out_date && propertyTypes.length > 0) {
      checkAvailability();
    }
  }, [formData.check_in_date, formData.check_out_date, propertyTypes]);

  useEffect(() => {
    const validateB2BAgent = async () => {
      if (formData.booking_type === 'b2b' && formData.agent_id && formData.check_in_date) {
        const result = await validateAgent(formData.agent_id);
        if (result.valid && result.agent) {
          setValidatedAgent(result.agent);
          setAgentValidationError('');
          const firstPropertyTypeId = roomSelections.find(sel => sel.property_type_id)?.property_type_id || '';
          const commission = await getAgentCommissionPercentage(
            formData.agent_id,
            firstPropertyTypeId,
            formData.check_in_date
          );
          setAgentCommission(commission);
        } else {
          setValidatedAgent(null);
          setAgentValidationError(result.error || 'Invalid agent');
        }
      } else {
        setValidatedAgent(null);
        setAgentValidationError('');
      }
    };

    validateB2BAgent();
  }, [formData.agent_id, formData.booking_type, formData.check_in_date, roomSelections]);

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

  const fetchB2BAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('b2b_agents')
        .select('*')
        .eq('status', 'approved')
        .order('agent_name');

      if (error) throw error;
      setB2bAgents(data || []);
    } catch (error) {
      console.error('Error fetching B2B agents:', error);
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
            booking_status
          )
        `);

      if (error) throw error;

      const { data: allRooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, room_number, property_type_id')
        .order('room_number');

      if (roomsError) throw roomsError;

      const propertyAvailability: { [key: string]: number } = {};
      const roomsAvailabilityMap: Record<string, AvailableRoom[]> = {};

      propertyTypes.forEach(property => {
        let bookedRooms = 0;

        bookings?.forEach((booking: any) => {
          if (
            booking.property_type_id === property.id &&
            booking.guests.booking_status !== 'cancelled' &&
            datesOverlap(
              formData.check_in_date,
              formData.check_out_date,
              booking.guests.check_in_date,
              booking.guests.check_out_date
            )
          ) {
            bookedRooms += booking.number_of_rooms;
          }
        });

        const availableRooms = property.number_of_rooms - bookedRooms;
        propertyAvailability[property.id] = Math.max(0, availableRooms);

        const propertyRooms = (allRooms || []).filter(r => r.property_type_id === property.id);
        roomsAvailabilityMap[property.id] = propertyRooms.slice(0, Math.max(0, availableRooms));
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
      setAvailableRooms(roomsAvailabilityMap);
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

  const generateConfirmationNumber = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `BK${timestamp}${random}`.toUpperCase();
  };

  const addRoomSelection = () => {
    setRoomSelections([
      ...roomSelections,
      { id: crypto.randomUUID(), property_type_id: '', selected_room_ids: [] }
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.check_in_date || !formData.check_out_date) {
      alert('Please select check-in and check-out dates before selecting rooms.');
      return;
    }

    const hasEmptySelections = roomSelections.some(sel => !sel.property_type_id);
    if (hasEmptySelections) {
      alert('Please select a property type for all room selections or remove empty selections.');
      return;
    }

    const hasNoRooms = roomSelections.some(sel => sel.selected_room_ids.length === 0);
    if (hasNoRooms) {
      alert('Please select at least one room for each property type.');
      return;
    }

    if (formData.booking_type === 'b2b' && !validatedAgent) {
      alert('Please enter a valid agent ID before creating a B2B booking.');
      return;
    }

    setLoading(true);

    try {
      const confirmationNumber = generateConfirmationNumber();
      const checkInLink = `${window.location.origin}/checkin`;

      const isAirbnbOrMmt = formData.booking_type === 'airbnb' || formData.booking_type === 'mmt';

      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .insert([
          {
            guest_name: formData.guest_name,
            country_code: isAirbnbOrMmt ? '+00' : formData.country_code,
            phone: isAirbnbOrMmt ? 'N/A' : formData.phone,
            number_of_packs: isAirbnbOrMmt ? 1 : (typeof formData.number_of_packs === 'number' ? formData.number_of_packs : parseInt(formData.number_of_packs as string) || 0),
            number_of_kids: isAirbnbOrMmt ? 0 : formData.number_of_kids,
            check_in_date: formData.check_in_date,
            check_out_date: formData.check_out_date,
            meal_preference: formData.meal_preference,
            food_remarks: formData.food_remarks,
            final_remarks: formData.final_remarks,
            confirmation_number: confirmationNumber,
            check_in_link: checkInLink,
            booking_status: 'confirmed',
            booking_type: formData.booking_type,
            agent_id: formData.booking_type === 'b2b' ? formData.agent_id : null,
            manual_cost: isAirbnbOrMmt ? formData.manual_cost : 0,
          },
        ])
        .select()
        .single();

      if (guestError) throw guestError;

      const bookingRoomsData = roomSelections.map(selection => ({
        guest_id: guestData.id,
        property_type_id: selection.property_type_id,
        number_of_rooms: selection.selected_room_ids.length,
      }));

      const { error: bookingRoomsError } = await supabase
        .from('booking_rooms')
        .insert(bookingRoomsData);

      if (bookingRoomsError) throw bookingRoomsError;

      let paymentData;
      if (formData.booking_type === 'airbnb' || formData.booking_type === 'mmt') {
        paymentData = {
          guest_id: guestData.id,
          total_amount: formData.manual_cost,
          paid_amount: formData.manual_cost,
          balance_due: 0,
          payment_status: 'paid' as const,
        };
      } else if (formData.booking_type === 'promotion') {
        paymentData = {
          guest_id: guestData.id,
          total_amount: 0,
          paid_amount: 0,
          balance_due: 0,
          payment_status: 'paid' as const,
        };
      } else {
        paymentData = {
          guest_id: guestData.id,
          total_amount: totalAmount,
          paid_amount: formData.advance_amount,
          balance_due: dueAmount,
          payment_status: formData.advance_amount >= totalAmount ? 'paid' : (formData.advance_amount > 0 ? 'partial' : 'pending'),
        };
      }

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([paymentData]);

      if (paymentError) throw paymentError;

      const roomDetails = roomSelections.map(selection => {
        const propertyInfo = availableProperties.find(pt => pt.id === selection.property_type_id);
        const roomNumbers = selection.selected_room_ids
          .map(roomId => {
            const rooms = availableRooms[selection.property_type_id] || [];
            const room = rooms.find(r => r.id === roomId);
            return room?.room_number || '';
          })
          .filter(Boolean)
          .join(', ');
        return `${propertyInfo?.property_name || 'Room'} (${roomNumbers || 'No rooms selected'})`;
      }).join(', ');

      const whatsappMessage = `
🎉 *Booking Confirmation*

📋 *Booking Details:*
Confirmation Number: ${confirmationNumber}
Guest Name: ${formData.guest_name}
Phone: ${formData.country_code} ${formData.phone}

📅 *Stay Duration:*
Check-in: ${new Date(formData.check_in_date).toLocaleDateString('en-IN')}
Check-out: ${new Date(formData.check_out_date).toLocaleDateString('en-IN')}

🏠 *Rooms:*
${roomDetails}

👥 *Guests:*
Adults: ${formData.number_of_packs}
Kids: ${formData.number_of_kids}

🍽️ *Meal Preference:*
${formData.meal_preference === 'veg' ? 'Vegetarian' : formData.meal_preference === 'non-veg' ? 'Non-Vegetarian' : 'Other'}

💰 *Payment Details:*
Total Amount: ₹${totalAmount.toLocaleString('en-IN')}
Advance Paid: ₹${formData.advance_amount.toLocaleString('en-IN')}
Balance Due: ₹${dueAmount.toLocaleString('en-IN')}

🔗 *Complete your check-in here:*
${checkInLink}

Thank you for choosing Coxcargill Glamps! 🏕️
      `.trim();

      const phoneNumber = formData.country_code.replace('+', '') + formData.phone;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;

      window.open(whatsappUrl, '_blank');

      navigate(`/confirmation/${guestData.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const datesSelected = formData.check_in_date && formData.check_out_date;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Coxcargill Glamps</h1>
          <p className="text-gray-600">Reserve your perfect getaway</p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                <ClipboardList className="inline w-5 h-5 mr-2" />
                Booking Type
              </h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Booking Type
                </label>
                <select
                  value={formData.booking_type}
                  onChange={(e) => setFormData({ ...formData, booking_type: e.target.value as BookingType })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                  required
                >
                  <option value="normal">Normal Booking</option>
                  <option value="airbnb">Airbnb</option>
                  <option value="mmt">MakeMyTrip (MMT)</option>
                  <option value="b2b">B2B Booking</option>
                  <option value="promotion">Promotion</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Guest Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter full name"
                  />
                </div>

                {formData.booking_type !== 'airbnb' && formData.booking_type !== 'mmt' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <div className="relative w-32" ref={countryDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white flex items-center justify-between"
                        >
                          <span className="text-sm">
                            {COUNTRIES.find(c => c.code === formData.country_code)?.flag || ''} {formData.country_code}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isCountryDropdownOpen && (
                          <div className="absolute z-50 w-80 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
                            <div className="p-3 border-b border-gray-200 bg-gray-50 sticky top-0">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  value={countrySearchTerm}
                                  onChange={(e) => setCountrySearchTerm(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  placeholder="Search country..."
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>

                            <div className="overflow-y-auto max-h-72">
                              {COUNTRIES
                                .filter(country => {
                                  if (!countrySearchTerm) return true;
                                  const searchLower = countrySearchTerm.toLowerCase();
                                  return (
                                    country.name.toLowerCase().includes(searchLower) ||
                                    country.code.toLowerCase().includes(searchLower)
                                  );
                                })
                                .map((country) => (
                                  <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => {
                                      setFormData({ ...formData, country_code: country.code });
                                      setIsCountryDropdownOpen(false);
                                      setCountrySearchTerm('');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0 ${
                                      formData.country_code === country.code ? 'bg-blue-100' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{country.flag}</span>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{country.name}</p>
                                        <p className="text-xs text-gray-600">{country.code}</p>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              {COUNTRIES.filter(country => {
                                if (!countrySearchTerm) return true;
                                const searchLower = countrySearchTerm.toLowerCase();
                                return (
                                  country.name.toLowerCase().includes(searchLower) ||
                                  country.code.toLowerCase().includes(searchLower)
                                );
                              }).length === 0 && (
                                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                  No countries found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
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
                )}

                {formData.booking_type === 'b2b' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select B2B Agent
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition flex items-center justify-between ${
                          validatedAgent
                            ? 'border-green-500 focus:ring-green-500 bg-green-50'
                            : 'border-gray-300 focus:ring-blue-500 bg-white'
                        }`}
                      >
                        <span className={validatedAgent ? 'text-gray-900' : 'text-gray-500'}>
                          {validatedAgent
                            ? `${validatedAgent.agent_name} - ${validatedAgent.company_name}`
                            : '-- Select an agent --'}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                          <div className="p-3 border-b border-gray-200 bg-gray-50">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={agentSearchTerm}
                                onChange={(e) => setAgentSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="Search by name, company, or ID..."
                                autoFocus
                              />
                            </div>
                          </div>

                          <div className="overflow-y-auto max-h-60">
                            {b2bAgents
                              .filter(agent => {
                                if (!agentSearchTerm) return true;
                                const searchLower = agentSearchTerm.toLowerCase();
                                return (
                                  agent.agent_name.toLowerCase().includes(searchLower) ||
                                  agent.company_name.toLowerCase().includes(searchLower) ||
                                  agent.id.toLowerCase().includes(searchLower)
                                );
                              })
                              .map((agent) => (
                                <button
                                  key={agent.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, agent_id: agent.id });
                                    setIsDropdownOpen(false);
                                    setAgentSearchTerm('');
                                  }}
                                  className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0 ${
                                    formData.agent_id === agent.id ? 'bg-blue-100' : ''
                                  }`}
                                >
                                  <p className="text-sm font-semibold text-gray-900">
                                    {agent.agent_name} - {agent.company_name}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Commission: {agent.commission_percentage}% • ID: {agent.id.substring(0, 8)}...
                                  </p>
                                </button>
                              ))}
                            {b2bAgents.filter(agent => {
                              if (!agentSearchTerm) return true;
                              const searchLower = agentSearchTerm.toLowerCase();
                              return (
                                agent.agent_name.toLowerCase().includes(searchLower) ||
                                agent.company_name.toLowerCase().includes(searchLower) ||
                                agent.id.toLowerCase().includes(searchLower)
                              );
                            }).length === 0 && (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                No agents found matching your search
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {validatedAgent && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-800">Agent Selected</p>
                            <p className="text-sm text-green-700 mt-1">
                              <strong>{validatedAgent.agent_name}</strong> - {validatedAgent.company_name}
                            </p>
                            <p className="text-sm text-green-700">
                              Commission: <strong>{agentCommission}%</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.booking_type !== 'airbnb' && formData.booking_type !== 'mmt' && (
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
                        onChange={(e) => setFormData({ ...formData, number_of_packs: e.target.value === '' ? '' : parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Enter number of adults"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Baby className="inline w-4 h-4 mr-1" />
                        Number of Kids
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.number_of_kids}
                        onChange={(e) => setFormData({ ...formData, number_of_kids: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                      <p className="mt-1 text-xs text-gray-500">Kids below 8 years old</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                <Calendar className="inline w-5 h-5 mr-2" />
                Stay Duration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    required
                    min={formData.check_in_date}
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {datesSelected && availableProperties.length === 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    No properties available for the selected dates. Please try different dates.
                  </p>
                </div>
              )}
            </div>

            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  <Home className="inline w-5 h-5 mr-2" />
                  Room Selection
                </h2>
                {datesSelected && availableProperties.length > 0 && (
                  <button
                    type="button"
                    onClick={addRoomSelection}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Room Type
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
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Property Type
                              </label>
                              <select
                                value={selection.property_type_id}
                                onChange={(e) => updateRoomSelection(selection.id, 'property_type_id', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                                required
                              >
                                <option value="">Select a property type</option>
                                {[...availableProperties].sort((a, b) => b.cost - a.cost).map((property) => {
                                  let displayCost = property.cost;
                                  if (formData.booking_type === 'b2b' && validatedAgent) {
                                    displayCost = calculateB2BPrice(property.cost, agentCommission);
                                  }
                                  const costLabel = formData.booking_type === 'airbnb' || formData.booking_type === 'mmt' || formData.booking_type === 'promotion'
                                    ? ''
                                    : ` - ₹${displayCost.toLocaleString('en-IN')} per night`;
                                  return (
                                    <option key={property.id} value={property.id}>
                                      {property.property_name}{costLabel}
                                    </option>
                                  );
                                })}
                              </select>
                              {propertyInfo && (
                                <p className="mt-1 text-xs text-green-600 font-medium">
                                  {propertyInfo.available_rooms} rooms available for selected dates
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Select Room Numbers
                              </label>
                              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                                {availableRooms[selection.property_type_id]?.map((room) => (
                                  <label key={room.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                    <input
                                      type="checkbox"
                                      checked={selection.selected_room_ids.includes(room.id)}
                                      onChange={(e) => {
                                        const newRoomIds = e.target.checked
                                          ? [...selection.selected_room_ids, room.id]
                                          : selection.selected_room_ids.filter(id => id !== room.id);
                                        updateRoomSelection(selection.id, 'selected_room_ids', newRoomIds);
                                      }}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-900">{room.room_number}</span>
                                  </label>
                                ))}
                                {(!availableRooms[selection.property_type_id] || availableRooms[selection.property_type_id].length === 0) && (
                                  <p className="text-sm text-gray-500 text-center py-2">No rooms available</p>
                                )}
                              </div>
                              {selection.selected_room_ids.length > 0 && (
                                <p className="mt-1 text-xs text-green-600 font-medium">
                                  {selection.selected_room_ids.length} room(s) selected
                                </p>
                              )}
                            </div>

                            {propertyInfo && formData.booking_type !== 'airbnb' && formData.booking_type !== 'mmt' && formData.booking_type !== 'promotion' && (
                              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <p className="text-sm font-semibold text-blue-900">
                                  Room Cost: ₹{(() => {
                                    const numberOfDays = formData.check_in_date && formData.check_out_date
                                      ? Math.max(1, Math.ceil((new Date(formData.check_out_date).getTime() - new Date(formData.check_in_date).getTime()) / (1000 * 60 * 60 * 24)))
                                      : 1;
                                    let costPerNight = propertyInfo.cost;
                                    if (formData.booking_type === 'b2b' && validatedAgent) {
                                      costPerNight = calculateB2BPrice(propertyInfo.cost, agentCommission);
                                    }
                                    return (costPerNight * selection.selected_room_ids.length * numberOfDays).toLocaleString('en-IN');
                                  })()}
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                  {(() => {
                                    const numberOfDays = formData.check_in_date && formData.check_out_date
                                      ? Math.max(1, Math.ceil((new Date(formData.check_out_date).getTime() - new Date(formData.check_in_date).getTime()) / (1000 * 60 * 60 * 24)))
                                      : 1;
                                    let costPerNight = propertyInfo.cost;
                                    if (formData.booking_type === 'b2b' && validatedAgent) {
                                      costPerNight = calculateB2BPrice(propertyInfo.cost, agentCommission);
                                    }
                                    return `${selection.selected_room_ids.length} room(s) × ₹${costPerNight.toLocaleString('en-IN')} × ${numberOfDays} day(s)`;
                                  })()}
                                </p>
                              </div>
                            )}
                            {propertyInfo && (formData.booking_type === 'airbnb' || formData.booking_type === 'mmt' || formData.booking_type === 'promotion') && (
                              <p className="text-xs text-green-600 font-medium">
                                {propertyInfo.available_rooms} rooms available for selected dates
                              </p>
                            )}
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

            {datesSelected && availableProperties.length > 0 && (
              <>
                {(formData.booking_type === 'airbnb' || formData.booking_type === 'mmt') && (
                  <div className="border-b pb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      <IndianRupee className="inline w-5 h-5 mr-2" />
                      Cost Details
                    </h2>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Total Cost (Already paid online)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.manual_cost}
                        onChange={(e) => setFormData({ ...formData, manual_cost: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Enter amount paid"
                      />
                    </div>
                  </div>
                )}

                {formData.booking_type !== 'airbnb' && formData.booking_type !== 'mmt' && formData.booking_type !== 'promotion' && (
                  <div className="border-b pb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      <IndianRupee className="inline w-5 h-5 mr-2" />
                      Payment Details
                      {formData.booking_type === 'b2b' && (
                        <span className="ml-2 text-sm font-normal text-blue-600">(B2B Pricing Applied)</span>
                      )}
                    </h2>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Subtotal (from rooms)
                          </label>
                          <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-blue-50 text-blue-900 font-semibold">
                            ₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Discount
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Total Amount
                          </label>
                          <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-green-50 text-green-900 font-bold text-lg">
                            ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Advance Amount
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.advance_amount}
                            onChange={(e) => setFormData({ ...formData, advance_amount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Due Amount
                          </label>
                          <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-orange-50 text-orange-900 font-semibold">
                            ₹ {dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-b pb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    <UtensilsCrossed className="inline w-5 h-5 mr-2" />
                    Meal Preferences
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Meal Preference
                      </label>
                      <select
                        value={formData.meal_preference}
                        onChange={(e) => setFormData({ ...formData, meal_preference: e.target.value as MealPreference })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="veg">Vegetarian</option>
                        <option value="non-veg">Non-Vegetarian</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Food Remarks
                      </label>
                      <textarea
                        value={formData.food_remarks}
                        onChange={(e) => setFormData({ ...formData, food_remarks: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Any special dietary requirements or preferences..."
                      />
                    </div>
                  </div>
                </div>

                {formData.booking_type !== 'airbnb' && formData.booking_type !== 'mmt' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MessageSquare className="inline w-4 h-4 mr-1" />
                      Final Remarks
                    </label>
                    <textarea
                      value={formData.final_remarks}
                      onChange={(e) => setFormData({ ...formData, final_remarks: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Any additional notes or special requests..."
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Submit Booking'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
