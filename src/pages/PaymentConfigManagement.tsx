import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, DollarSign, User, Phone, CreditCard } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import type { PaymentConfig } from '../types/database';

export default function PaymentConfigManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [formData, setFormData] = useState({
    cash_contact_name: '',
    cash_contact_phone: '',
    upi_id: '',
    upi_number: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_config')
        .select('*')
        .eq('config_type', 'general')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data);
        setFormData({
          cash_contact_name: data.cash_contact_name,
          cash_contact_phone: data.cash_contact_phone,
          upi_id: data.upi_id,
          upi_number: data.upi_number,
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (config) {
        const { error } = await supabase
          .from('payment_config')
          .update({
            cash_contact_name: formData.cash_contact_name,
            cash_contact_phone: formData.cash_contact_phone,
            upi_id: formData.upi_id,
            upi_number: formData.upi_number,
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('payment_config').insert([
          {
            config_type: 'general',
            cash_contact_name: formData.cash_contact_name,
            cash_contact_phone: formData.cash_contact_phone,
            upi_id: formData.upi_id,
            upi_number: formData.upi_number,
          },
        ]);

        if (error) throw error;
      }

      alert('Payment configuration updated successfully!');
      fetchConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AdminSidebar />
        <div className="lg:ml-64 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading configuration...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSidebar />
      <div className="lg:ml-64 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Admin Dashboard</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Configuration</h1>
          <p className="text-gray-600">Manage payment methods and contact details</p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Cash Payment Details</h2>
                  <p className="text-sm text-gray-600">Contact information for cash collection</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cash_contact_name}
                    onChange={(e) => setFormData({ ...formData, cash_contact_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.cash_contact_phone}
                    onChange={(e) => setFormData({ ...formData, cash_contact_phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+91 1234567890"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">UPI Payment Details</h2>
                  <p className="text-sm text-gray-600">UPI information for digital payments</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4" />
                    UPI ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="yourname@upi"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    UPI Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.upi_number}
                    onChange={(e) => setFormData({ ...formData, upi_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Guests will be able to copy these details during check-in when they select UPI as payment method.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}
