import { useState, useEffect } from 'react';
import { X, Copy, Share2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Guest } from '../types/database';

interface CancellationModalProps {
  guest: Guest;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancellationModal({ guest, onClose, onSuccess }: CancellationModalProps) {
  const [loading, setLoading] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [refundAmount, setRefundAmount] = useState(0);
  const [daysUntilCheckIn, setDaysUntilCheckIn] = useState(0);
  const [cancellationMessage, setCancellationMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPaymentDetails();
    calculateRefund();
  }, []);

  const fetchPaymentDetails = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('guest_id', guest.id)
      .maybeSingle();

    if (!error && data) {
      setPaidAmount(data.paid_amount || 0);
    }
  };

  const calculateRefund = () => {
    const today = new Date();
    const checkInDate = new Date(guest.check_in_date);
    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setDaysUntilCheckIn(diffDays);

    let refund = 0;
    if (diffDays >= 3) {
      refund = paidAmount;
    } else {
      refund = 0;
    }

    setRefundAmount(refund);
    generateMessage(refund, diffDays);
  };

  useEffect(() => {
    if (paidAmount > 0) {
      calculateRefund();
    }
  }, [paidAmount]);

  const generateMessage = (refund: number, days: number) => {
    const checkInFormatted = new Date(guest.check_in_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const checkOutFormatted = new Date(guest.check_out_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const cancellationDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const cancellationTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const message = `Dear ${guest.guest_name},

We regret to inform you that your booking at Coxcargill Glamps has been cancelled.

*Booking Details:*
• Confirmation Number: ${guest.confirmation_number}
• Original Check-in: ${checkInFormatted}
• Original Check-out: ${checkOutFormatted}
• Cancellation Date: ${cancellationDate} at ${cancellationTime}

*Refund Information:*
${days >= 3
  ? `✅ Full refund of ₹${refund.toFixed(2)} will be processed as cancellation was made ${days} days before check-in.`
  : `❌ No refund applicable as cancellation was made less than 3 days before check-in (${days} days).`
}

*Refund Amount: ₹${refund.toFixed(2)}*

${refund > 0
  ? `Your refund will be processed within 5-7 business days to your original payment method.`
  : `As per our cancellation policy, bookings cancelled within 3 days of check-in are non-refundable.`
}

We apologize for any inconvenience. If you have any questions, please contact us:
📞 Phone: ${guest.country_code || '+91'} ${guest.phone}
📧 Email: support@coxcargillglamps.com

We hope to welcome you in the future!

Best regards,
Coxcargill Glamps Team`;

    setCancellationMessage(message);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cancellationMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const encodedMessage = encodeURIComponent(cancellationMessage);
    const phone = guest.phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${guest.country_code?.replace('+', '') || '91'}${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleConfirmCancellation = async () => {
    setLoading(true);

    try {
      const { error: guestError } = await supabase
        .from('guests')
        .update({
          booking_status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_message: cancellationMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', guest.id);

      if (guestError) throw guestError;

      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          refund_amount: refundAmount,
          payment_status: refundAmount > 0 ? 'partial' : 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('guest_id', guest.id);

      if (paymentError) throw paymentError;

      alert('Booking cancelled successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-900">Cancel Booking</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Booking Information</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-semibold">Guest:</span> {guest.guest_name}</p>
              <p><span className="font-semibold">Confirmation:</span> {guest.confirmation_number}</p>
              <p><span className="font-semibold">Check-in:</span> {new Date(guest.check_in_date).toLocaleDateString()}</p>
              <p><span className="font-semibold">Check-out:</span> {new Date(guest.check_out_date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className={`border-2 rounded-lg p-6 ${daysUntilCheckIn >= 3 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Refund Calculation</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Days until check-in:</span>
                <span className="text-xl font-bold text-gray-900">{daysUntilCheckIn} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Amount paid:</span>
                <span className="text-lg font-semibold text-gray-900">₹{paidAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-semibold">Refund amount:</span>
                  <span className={`text-2xl font-bold ${refundAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{refundAmount.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 mt-3">
                <p className="text-sm text-gray-700">
                  {daysUntilCheckIn >= 3
                    ? '✅ Full refund applicable (cancelled 3+ days before check-in)'
                    : '❌ No refund applicable (cancelled less than 3 days before check-in)'}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Cancellation Message</h3>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={shareOnWhatsApp}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </div>
            <textarea
              value={cancellationMessage}
              onChange={(e) => setCancellationMessage(e.target.value)}
              rows={18}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-2">
              You can edit this message before copying or sharing it.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              ⚠️ <span className="font-semibold">Warning:</span> This action will cancel the booking and cannot be undone. The booking status will be changed to "Cancelled" and rooms will be released for other guests.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Go Back
            </button>
            <button
              onClick={handleConfirmCancellation}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:bg-gray-400"
            >
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
