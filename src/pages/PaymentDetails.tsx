import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DollarSign, CreditCard, ArrowRight, Copy, Check, Phone, User } from 'lucide-react';
import type { Payment, PaymentMethod, PaymentConfig } from '../types/database';

export default function PaymentDetails() {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [copiedField, setCopiedField] = useState<string>('');
  const [formData, setFormData] = useState({
    payment_method: '' as PaymentMethod,
    payment_notes: '',
    transaction_id: '',
  });

  useEffect(() => {
    fetchData();
  }, [guestId]);

  const fetchData = async () => {
    try {
      const [paymentRes, configRes] = await Promise.all([
        supabase
          .from('payments')
          .select('*')
          .eq('guest_id', guestId)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('payment_config')
          .select('*')
          .eq('config_type', 'general')
          .limit(1),
      ]);

      if (paymentRes.error) throw paymentRes.error;
      if (configRes.error) throw configRes.error;

      const paymentData = paymentRes.data && paymentRes.data.length > 0 ? paymentRes.data[0] : null;
      const configData = configRes.data && configRes.data.length > 0 ? configRes.data[0] : null;

      setPayment(paymentData);
      setPaymentConfig(configData);

      if (paymentData) {
        setFormData({
          payment_method: paymentData.payment_method,
          payment_notes: paymentData.payment_notes,
          transaction_id: paymentData.transaction_id || '',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.payment_method) {
      alert('Please select a payment method');
      return;
    }

    if (formData.payment_method === 'upi' && !formData.transaction_id.trim()) {
      alert('Please enter the UPI transaction ID');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          payment_method: formData.payment_method,
          payment_notes: formData.payment_notes,
          transaction_id: formData.transaction_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('guest_id', guestId);

      if (error) throw error;

      navigate(`/checkin/complete/${guestId}`);
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Payment information not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Details</h1>
          <p className="text-gray-600">Select payment method and complete check-in</p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="mb-8 space-y-4">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                <p className="text-4xl font-bold text-gray-900">
                  ₹{payment.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Paid Amount</p>
                <p className="text-2xl font-bold text-green-900">
                  ₹{payment.paid_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Due Amount</p>
                <p className="text-2xl font-bold text-orange-900">
                  ₹{payment.balance_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <CreditCard className="inline w-4 h-4 mr-1" />
                Payment Method
              </label>
              <select
                required
                value={formData.payment_method}
                onChange={(e) =>
                  setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="">Select payment method</option>
                <option value="pay_at_property">Pay at Property</option>
                <option value="upi">UPI</option>
                <option value="online_booking">Online Booking</option>
              </select>
            </div>

            {formData.payment_method === 'pay_at_property' && paymentConfig && (
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg space-y-4">
                <h3 className="text-lg font-bold text-green-900 mb-4">Pay at Property - Contact</h3>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-green-700 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-green-700 font-medium">Contact Person</p>
                    <p className="text-lg font-bold text-green-900">{paymentConfig.cash_contact_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-green-700 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-green-700 font-medium">Phone Number</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-green-900">{paymentConfig.cash_contact_phone}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentConfig.cash_contact_phone, 'cash_phone')}
                        className="p-2 text-green-700 hover:bg-green-100 rounded-lg transition"
                        title="Copy phone number"
                      >
                        {copiedField === 'cash_phone' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-green-100 rounded-lg">
                  <p className="text-sm text-green-800">
                    Please contact the person above to arrange payment at the property. They will assist you with the payment process.
                  </p>
                </div>
              </div>
            )}

            {formData.payment_method === 'upi' && paymentConfig && (
              <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
                <h3 className="text-lg font-bold text-blue-900 mb-4">UPI Payment Details</h3>

                <div>
                  <p className="text-sm text-blue-700 font-medium mb-2">UPI ID</p>
                  <div className="flex items-center gap-2 p-3 bg-white border border-blue-300 rounded-lg">
                    <p className="flex-1 text-lg font-mono font-bold text-blue-900">{paymentConfig.upi_id}</p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(paymentConfig.upi_id, 'upi_id')}
                      className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                      title="Copy UPI ID"
                    >
                      {copiedField === 'upi_id' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-blue-700 font-medium mb-2">UPI Number</p>
                  <div className="flex items-center gap-2 p-3 bg-white border border-blue-300 rounded-lg">
                    <p className="flex-1 text-lg font-mono font-bold text-blue-900">{paymentConfig.upi_number}</p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(paymentConfig.upi_number, 'upi_number')}
                      className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                      title="Copy UPI number"
                    >
                      {copiedField === 'upi_number' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Use the UPI ID or phone number above to make payment through any UPI app. Click the copy icon to copy the details.
                  </p>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-blue-900 mb-2">
                    Transaction ID <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.transaction_id}
                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                    placeholder="Enter UPI transaction ID"
                  />
                  <p className="text-xs text-blue-700 mt-1">
                    Enter the transaction ID from your UPI payment confirmation
                  </p>
                </div>
              </div>
            )}

            {formData.payment_method === 'online_booking' && (
              <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Online Booking Payment</h3>
                <p className="text-sm text-gray-600">
                  Payment has been made through online booking platform. Add any additional remarks below if needed.
                </p>
              </div>
            )}

            {formData.payment_method && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {formData.payment_method === 'online_booking' ? 'Remarks' : 'Additional Notes (Optional)'}
                </label>
                <textarea
                  value={formData.payment_notes}
                  onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder={
                    formData.payment_method === 'online_booking'
                      ? 'Enter any remarks...'
                      : 'Any additional notes...'
                  }
                />
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={
                  submitting ||
                  !formData.payment_method ||
                  (formData.payment_method === 'upi' && !formData.transaction_id.trim())
                }
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Continue to Complete Check-in'}
                {!submitting && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
