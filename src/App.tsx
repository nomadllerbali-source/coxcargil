import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BookingForm from './pages/BookingForm';
import BookingConfirmation from './pages/BookingConfirmation';
import CheckInSearch from './pages/CheckInSearch';
import IdCardCollection from './pages/IdCardCollection';
import PaymentDetails from './pages/PaymentDetails';
import CompleteCheckIn from './pages/CompleteCheckIn';
import GuestDashboard from './pages/GuestDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AddPropertyType from './pages/AddPropertyType';
import PropertyTypesManagement from './pages/PropertyTypesManagement';
import PaymentConfigManagement from './pages/PaymentConfigManagement';
import ServiceRequestsManagement from './pages/ServiceRequestsManagement';
import PaymentsManagement from './pages/PaymentsManagement';
import B2BLogin from './pages/B2BLogin';
import B2BDashboard from './pages/B2BDashboard';
import B2BBookingRequest from './pages/B2BBookingRequest';
import B2BMyBookings from './pages/B2BMyBookings';
import B2BProfile from './pages/B2BProfile';
import B2BManagement from './pages/B2BManagement';
import B2BBookingRequests from './pages/B2BBookingRequests';
import AgentCommissionManagement from './pages/AgentCommissionManagement';
import SpecialOffersManagement from './pages/SpecialOffersManagement';
import HomepageSettingsManagement from './pages/HomepageSettingsManagement';
import StaffLogin from './pages/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';
import StaffManagement from './pages/StaffManagement';
import StaffBooking from './pages/StaffBooking';
import StaffCheckIn from './pages/StaffCheckIn';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/booking" element={<BookingForm />} />
        <Route path="/confirmation/:guestId" element={<BookingConfirmation />} />
        <Route path="/checkin" element={<CheckInSearch />} />
        <Route path="/checkin/id/:guestId" element={<IdCardCollection />} />
        <Route path="/checkin/payment/:guestId" element={<PaymentDetails />} />
        <Route path="/checkin/complete/:guestId" element={<CompleteCheckIn />} />
        <Route path="/dashboard/:guestId" element={<GuestDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/add-property-type" element={<ProtectedRoute><AddPropertyType /></ProtectedRoute>} />
        <Route path="/admin/property-types" element={<ProtectedRoute><PropertyTypesManagement /></ProtectedRoute>} />
        <Route path="/admin/payment-config" element={<ProtectedRoute><PaymentConfigManagement /></ProtectedRoute>} />
        <Route path="/admin/service-requests" element={<ProtectedRoute><ServiceRequestsManagement /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute><PaymentsManagement /></ProtectedRoute>} />
        <Route path="/admin/b2b-management" element={<ProtectedRoute><B2BManagement /></ProtectedRoute>} />
        <Route path="/admin/b2b-booking-requests" element={<ProtectedRoute><B2BBookingRequests /></ProtectedRoute>} />
        <Route path="/admin/agent-commissions" element={<ProtectedRoute><AgentCommissionManagement /></ProtectedRoute>} />
        <Route path="/admin/special-offers" element={<ProtectedRoute><SpecialOffersManagement /></ProtectedRoute>} />
        <Route path="/admin/homepage" element={<ProtectedRoute><HomepageSettingsManagement /></ProtectedRoute>} />
        <Route path="/admin/staff-management" element={<ProtectedRoute><StaffManagement /></ProtectedRoute>} />
        <Route path="/b2b" element={<B2BLogin />} />
        <Route path="/b2b/dashboard" element={<B2BDashboard />} />
        <Route path="/b2b/booking" element={<B2BBookingRequest />} />
        <Route path="/b2b/my-bookings" element={<B2BMyBookings />} />
        <Route path="/b2b/profile" element={<B2BProfile />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/new-booking" element={<StaffBooking />} />
        <Route path="/staff/check-in" element={<StaffCheckIn />} />
      </Routes>
    </Router>
  );
}

export default App;
