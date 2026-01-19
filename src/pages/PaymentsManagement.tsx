import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, DollarSign, Calendar, User, CreditCard, Check, X, Filter } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import type { Payment, Guest } from '../types/database';

interface PaymentWithGuest extends Payment {
  guests?: Guest;
}

export default function PaymentsManagement() {
  const [payments, setPayments] = useState<PaymentWithGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          guests (
            guest_name,
            phone,
            check_in_date,
            check_out_date,
            booking_status,
            confirmation_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPayments = () => {
    let filtered = payments;

    if (filterMethod !== 'all') {
      filtered = filtered.filter((p) => p.payment_method === filterMethod);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.payment_status === filterStatus);
    }

    return filtered;
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'upi':
        return 'bg-blue-100 text-blue-800';
      case 'pay_at_property':
        return 'bg-green-100 text-green-800';
      case 'online_booking':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'upi':
        return 'UPI';
      case 'pay_at_property':
        return 'Pay at Property';
      case 'online_booking':
        return 'Online Booking';
      default:
        return method || 'Not Selected';
    }
  };

  const getTotalAmount = () => {
    return getFilteredPayments().reduce((sum, p) => sum + p.paid_amount, 0);
  };

  const getUPIPayments = () => {
    return payments.filter((p) => p.payment_method === 'upi');
  };

  if (loading) {
    return (
      <>
        <AdminSidebar />
        <div className="lg:ml-64 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payments...</p>
          </div>
        </div>
      </>
    );
  }

  const filteredPayments = getFilteredPayments();

  return (
    <>
      <AdminSidebar />
      <div className="lg:ml-64 min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Payments Management</h1>
                <p className="text-sm text-gray-600 mt-1">View and verify all payment transactions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <DollarSign className="w-10 h-10 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <CreditCard className="w-10 h-10 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">UPI Payments</p>
                <p className="text-2xl font-bold text-gray-900">{getUPIPayments().length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Check className="w-10 h-10 text-teal-600" />
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter((p) => p.payment_status === 'paid').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <X className="w-10 h-10 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter((p) => p.payment_status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Filter Payments</h2>
              </div>
              <div className="flex gap-3">
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="all">All Methods</option>
                  <option value="upi">UPI Only</option>
                  <option value="pay_at_property">Pay at Property Only</option>
                  <option value="online_booking">Online Booking Only</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {(filterMethod !== 'all' || filterStatus !== 'all') && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <p className="text-sm text-blue-800">
                  Showing {filteredPayments.length} of {payments.length} payments
                  {filterMethod !== 'all' && ` (${getPaymentMethodLabel(filterMethod)})`}
                  {filterStatus !== 'all' && ` (${filterStatus})`}
                </p>
                <button
                  onClick={() => {
                    setFilterMethod('all');
                    setFilterStatus('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No payments found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confirmation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {(payment.guests as any)?.guest_name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(payment.guests as any)?.phone || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(payment.guests as any)?.confirmation_number || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentMethodColor(
                            payment.payment_method
                          )}`}
                        >
                          {getPaymentMethodLabel(payment.payment_method)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.payment_method === 'upi' ? (
                          payment.transaction_id ? (
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono bg-blue-50 px-2 py-1 rounded text-blue-900">
                                {payment.transaction_id}
                              </code>
                              <Check className="w-4 h-4 text-green-600" />
                            </div>
                          ) : (
                            <span className="text-sm text-red-600 font-medium">Missing</span>
                          )
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{payment.total_amount.toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-900">
                          ₹{payment.paid_amount.toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-orange-900">
                          ₹{payment.balance_due.toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                            payment.payment_status
                          )}`}
                        >
                          {payment.payment_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(payment.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ₹
                      {getFilteredPayments()
                        .reduce((sum, p) => sum + p.total_amount, 0)
                        .toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-900">
                      ₹{getTotalAmount().toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-orange-900">
                      ₹
                      {getFilteredPayments()
                        .reduce((sum, p) => sum + p.balance_due, 0)
                        .toLocaleString('en-IN')}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
