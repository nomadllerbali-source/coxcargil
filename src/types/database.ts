export type MealPreference = 'veg' | 'non-veg' | 'other';

export type BookingType = 'normal' | 'airbnb' | 'mmt' | 'b2b' | 'promotion' | 'other';

export type BookingStatus = 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';

export type PaymentStatus = 'pending' | 'partial' | 'paid';

export type PaymentMethod = '' | 'pay_at_property' | 'upi' | 'online_booking';

export type IdType = 'passport' | 'drivers_license' | 'aadhar' | 'other';

export type ServiceCategory = 'housekeeping' | 'room_service' | 'maintenance' | 'concierge';

export type ServiceStatus = 'received' | 'in_progress' | 'completed' | 'cancelled';

export type Priority = 'low' | 'medium' | 'high';

export interface Guest {
  id: string;
  guest_name: string;
  country_code: string;
  phone: string;
  number_of_packs: number;
  number_of_kids: number;
  property_type_id: string | null;
  check_in_date: string;
  check_out_date: string;
  meal_preference: MealPreference;
  food_remarks: string;
  final_remarks: string;
  booking_status: BookingStatus;
  booking_type: BookingType;
  agent_id?: string;
  manual_cost: number;
  confirmation_number: string;
  check_in_link: string;
  is_deleted: boolean;
  deleted_at?: string;
  cancellation_message?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  actual_check_in_time?: string;
}

export interface GuestPhoto {
  id: string;
  guest_id: string;
  photo_url: string;
  uploaded_at: string;
}

export interface GuestIdCard {
  id: string;
  guest_id: string;
  id_type: IdType;
  id_number: string;
  id_photo_url?: string;
  additional_details: Record<string, any>;
  uploaded_at: string;
}

export interface Payment {
  id: string;
  guest_id: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_notes: string;
  refund_amount: number;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertySettings {
  id: string;
  property_name: string;
  location_url: string;
  location_embed: string;
  rules_and_regulations: string;
  check_in_time: string;
  check_out_time: string;
  emergency_contact: string;
  wifi_details: string;
  amenities_info: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  guest_id: string;
  service_category: ServiceCategory;
  request_details: string;
  priority: Priority;
  status: ServiceStatus;
  requested_at: string;
  completed_at?: string;
}

export interface PropertyType {
  id: string;
  property_name: string;
  number_of_rooms: number;
  room_prefix: string;
  cost: number;
  extra_person_cost: number;
  check_in_time: string;
  check_out_time: string;
  map_link: string;
  rules_and_regulations: string;
  wifi_details: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingRoom {
  id: string;
  guest_id: string;
  property_type_id: string;
  number_of_rooms: number;
  created_at: string;
}

export interface PaymentConfig {
  id: string;
  config_type: string;
  cash_contact_name: string;
  cash_contact_phone: string;
  upi_id: string;
  upi_number: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export type B2BAgentStatus = 'pending' | 'approved' | 'rejected';

export interface B2BAgent {
  id: string;
  agent_name: string;
  email: string;
  password: string;
  phone: string;
  whatsapp_number?: string;
  company_name: string;
  status: B2BAgentStatus;
  commission_percentage: number;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface SpecialOffer {
  id: string;
  property_type_id: string;
  offer_title: string;
  offer_description?: string;
  discount_percentage: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  target_agent_id?: string;
  created_at: string;
}

export type BookingRequestStatus = 'pending' | 'approved' | 'rejected';

export interface B2BBookingRequest {
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
  payment_screenshot_url?: string;
  status: BookingRequestStatus;
  admin_notes?: string;
  confirmation_number?: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface AgentCommissionOverride {
  id: string;
  agent_id?: string;
  property_type_id?: string;
  start_date: string;
  end_date: string;
  commission_percentage: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export type NotificationType = 'offer' | 'booking_status' | 'announcement';

export interface AgentNotification {
  id: string;
  agent_id?: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}
