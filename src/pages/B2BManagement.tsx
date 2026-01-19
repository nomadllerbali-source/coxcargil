import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle, XCircle, Clock, Mail, Phone, Building, Users, DollarSign, FileText, MessageCircle } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import type { B2BAgent } from '../types/database';

export default function B2BManagement() {
  const [agents, setAgents] = useState<B2BAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('b2b_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching B2B agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAgentStatus = async (agentId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('b2b_agents')
        .update({
          status,
          approved_at: new Date().toISOString(),
          approved_by: 'Admin',
        })
        .eq('id', agentId);

      if (error) throw error;

      await supabase.from('agent_notifications').insert({
        agent_id: agentId,
        notification_type: 'announcement',
        title: status === 'approved' ? 'Account Approved' : 'Account Rejected',
        message:
          status === 'approved'
            ? 'Your B2B agent account has been approved! You can now login and start making bookings.'
            : 'Your B2B agent account application has been rejected. Please contact support for more information.',
        is_read: false,
      });

      alert(`Agent ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
      fetchAgents();
    } catch (error) {
      console.error('Error updating agent status:', error);
      alert('Failed to update agent status. Please try again.');
    }
  };

  const getFilteredAgents = () => {
    if (filter === 'all') return agents;
    return agents.filter((agent) => agent.status === filter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPendingCount = () => agents.filter((a) => a.status === 'pending').length;
  const getApprovedCount = () => agents.filter((a) => a.status === 'approved').length;

  if (loading) {
    return (
      <>
        <AdminSidebar />
        <div className="lg:ml-64 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading B2B management...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSidebar />
      <div className="lg:ml-64 min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">B2B Management System</h1>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/admin/b2b-booking-requests"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  Booking Requests
                </Link>
                <Link
                  to="/admin/agent-commissions"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Manage Commissions
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Clock className="w-10 h-10 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900">{getPendingCount()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Approved Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{getApprovedCount()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Building className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">B2B Agents</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'all'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'pending'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    New Sign Ups
                  </button>
                  <button
                    onClick={() => setFilter('approved')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'approved'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => setFilter('rejected')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'rejected'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Rejected
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {getFilteredAgents().map((agent) => (
                <div key={agent.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{agent.agent_name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            agent.status
                          )}`}
                        >
                          {agent.status.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                          {agent.commission_percentage}% Commission
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{agent.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{agent.phone}</span>
                        </div>
                        {agent.whatsapp_number && (
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp: {agent.whatsapp_number}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{agent.company_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Registered: {new Date(agent.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {agent.approved_at && (
                        <div className="mt-3 text-sm text-gray-500">
                          <span>
                            {agent.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                            {new Date(agent.approved_at).toLocaleDateString()} by {agent.approved_by}
                          </span>
                        </div>
                      )}
                    </div>

                    {agent.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => updateAgentStatus(agent.id, 'approved')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => updateAgentStatus(agent.id, 'rejected')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {getFilteredAgents().length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p>No agents found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
