import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Edit, Trash2, Percent, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import type { B2BAgent, AgentCommissionOverride, PropertyType } from '../types/database';

interface CommissionOverrideWithDetails extends AgentCommissionOverride {
  b2b_agents?: B2BAgent;
  property_types?: PropertyType;
}

export default function AgentCommissionManagement() {
  const [agents, setAgents] = useState<B2BAgent[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [overrides, setOverrides] = useState<CommissionOverrideWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<B2BAgent | null>(null);
  const [newCommission, setNewCommission] = useState(10);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    agentId: '',
    propertyTypeId: '',
    startDate: '',
    endDate: '',
    commissionPercentage: 15,
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, propertyTypesRes, overridesRes] = await Promise.all([
        supabase.from('b2b_agents').select('*').eq('status', 'approved').order('agent_name'),
        supabase.from('property_types').select('*').order('property_name'),
        supabase
          .from('agent_commission_overrides')
          .select('*, b2b_agents(agent_name), property_types(property_name)')
          .order('created_at', { ascending: false }),
      ]);

      if (agentsRes.error) throw agentsRes.error;
      if (propertyTypesRes.error) throw propertyTypesRes.error;
      if (overridesRes.error) throw overridesRes.error;

      setAgents(agentsRes.data || []);
      setPropertyTypes(propertyTypesRes.data || []);
      setOverrides(overridesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAgentCommission = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('b2b_agents')
        .update({ commission_percentage: newCommission })
        .eq('id', editingAgent.id);

      if (error) throw error;

      alert('Commission updated successfully!');
      setShowModal(false);
      setEditingAgent(null);
      fetchData();
    } catch (error) {
      console.error('Error updating commission:', error);
      alert('Failed to update commission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOverride = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('agent_commission_overrides').insert({
        agent_id: overrideForm.agentId || null,
        property_type_id: overrideForm.propertyTypeId || null,
        start_date: overrideForm.startDate,
        end_date: overrideForm.endDate,
        commission_percentage: overrideForm.commissionPercentage,
        description: overrideForm.description,
        is_active: true,
      });

      if (error) throw error;

      alert('Commission override created successfully!');
      setShowOverrideModal(false);
      setOverrideForm({
        agentId: '',
        propertyTypeId: '',
        startDate: '',
        endDate: '',
        commissionPercentage: 15,
        description: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating override:', error);
      alert('Failed to create override. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOverride = async (id: string) => {
    if (!confirm('Are you sure you want to delete this override?')) return;

    try {
      const { error } = await supabase.from('agent_commission_overrides').delete().eq('id', id);

      if (error) throw error;
      alert('Override deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting override:', error);
      alert('Failed to delete override. Please try again.');
    }
  };

  const toggleOverrideStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('agent_commission_overrides')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling override status:', error);
      alert('Failed to update override status. Please try again.');
    }
  };

  if (loading && agents.length === 0) {
    return (
      <>
        <AdminSidebar />
        <div className="lg:ml-64 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading commission management...</p>
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
                <Link to="/admin/b2b-management" className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Agent Commission Management</h1>
              </div>
              <button
                onClick={() => setShowOverrideModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Date-wise Override
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Percent className="w-6 h-6 text-teal-600" />
                Agent Default Commissions
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{agent.agent_name}</h3>
                        <p className="text-sm text-gray-600">{agent.company_name}</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingAgent(agent);
                          setNewCommission(agent.commission_percentage);
                          setShowModal(true);
                        }}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3 bg-teal-50 rounded-lg">
                      <p className="text-sm text-gray-600">Commission</p>
                      <p className="text-2xl font-bold text-teal-600">
                        {agent.commission_percentage}% OFF
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {agents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No approved agents found</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-orange-600" />
                Date-wise Commission Overrides
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Special commissions for specific dates, agents, or properties
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {overrides.map((override) => (
                <div key={override.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {override.commission_percentage}% Commission
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            override.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {override.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {override.description && (
                        <p className="text-sm text-gray-600 mb-3">{override.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <strong>Agent:</strong> {override.agent_id ? override.b2b_agents?.agent_name : 'All Agents'}
                        </div>
                        <div>
                          <strong>Property:</strong>{' '}
                          {override.property_type_id
                            ? override.property_types?.property_name
                            : 'All Properties'}
                        </div>
                        <div>
                          <strong>Start Date:</strong>{' '}
                          {new Date(override.start_date).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>End Date:</strong> {new Date(override.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => toggleOverrideStatus(override.id, override.is_active)}
                        className={`p-2 rounded-lg transition ${
                          override.is_active
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {override.is_active ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteOverride(override.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {overrides.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="mb-4">No commission overrides created yet</p>
                  <button
                    onClick={() => setShowOverrideModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Add Your First Override
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && editingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Update Commission</h2>
              <p className="text-sm text-gray-600 mt-1">{editingAgent.agent_name}</p>
            </div>

            <form onSubmit={handleUpdateAgentCommission} className="p-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Commission Percentage (% OFF for agent)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={newCommission}
                  onChange={(e) => setNewCommission(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Agent will pay {100 - newCommission}% of the regular price
                </p>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAgent(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOverrideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create Commission Override</h2>
              <p className="text-sm text-gray-600 mt-1">
                Set special commissions for specific dates, agents, or properties
              </p>
            </div>

            <form onSubmit={handleCreateOverride} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={overrideForm.description}
                  onChange={(e) => setOverrideForm({ ...overrideForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  placeholder="e.g., Festival Season Discount"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Agent (Leave empty for all)
                  </label>
                  <select
                    value={overrideForm.agentId}
                    onChange={(e) => setOverrideForm({ ...overrideForm, agentId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  >
                    <option value="">All Agents</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.agent_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Property (Leave empty for all)
                  </label>
                  <select
                    value={overrideForm.propertyTypeId}
                    onChange={(e) => setOverrideForm({ ...overrideForm, propertyTypeId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  >
                    <option value="">All Properties</option>
                    {propertyTypes.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.property_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={overrideForm.startDate}
                    onChange={(e) => setOverrideForm({ ...overrideForm, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    value={overrideForm.endDate}
                    onChange={(e) => setOverrideForm({ ...overrideForm, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Commission Percentage (% OFF)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={overrideForm.commissionPercentage}
                    onChange={(e) =>
                      setOverrideForm({
                        ...overrideForm,
                        commissionPercentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOverrideModal(false);
                    setOverrideForm({
                      agentId: '',
                      propertyTypeId: '',
                      startDate: '',
                      endDate: '',
                      commissionPercentage: 15,
                      description: '',
                    });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
