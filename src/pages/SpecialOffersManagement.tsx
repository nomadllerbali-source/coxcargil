import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Tag, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import type { SpecialOffer, PropertyType } from '../types/database';

interface SpecialOfferWithProperty extends SpecialOffer {
  property_types?: PropertyType;
}

export default function SpecialOffersManagement() {
  const [offers, setOffers] = useState<SpecialOfferWithProperty[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
  const [formData, setFormData] = useState({
    offerTitle: '',
    offerDescription: '',
    discountPercentage: 0,
    validFrom: '',
    validTo: '',
    propertyTypeId: '',
    targetAgentId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [offersRes, propertyTypesRes, agentsRes] = await Promise.all([
        supabase
          .from('special_offers')
          .select('*, property_types(property_name)')
          .order('created_at', { ascending: false }),
        supabase.from('property_types').select('*').order('property_name'),
        supabase.from('b2b_agents').select('id, agent_name').eq('status', 'approved').order('agent_name'),
      ]);

      if (offersRes.error) throw offersRes.error;
      if (propertyTypesRes.error) throw propertyTypesRes.error;
      if (agentsRes.error) throw agentsRes.error;

      setOffers(offersRes.data || []);
      setPropertyTypes(propertyTypesRes.data || []);
      setAgents(agentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const offerData = {
        offer_title: formData.offerTitle,
        offer_description: formData.offerDescription,
        discount_percentage: formData.discountPercentage,
        valid_from: formData.validFrom,
        valid_to: formData.validTo,
        property_type_id: formData.propertyTypeId,
        target_agent_id: formData.targetAgentId || null,
        is_active: true,
      };

      if (editingOffer) {
        const { error } = await supabase
          .from('special_offers')
          .update(offerData)
          .eq('id', editingOffer.id);

        if (error) throw error;
        alert('Offer updated successfully!');
      } else {
        const { error } = await supabase.from('special_offers').insert(offerData);

        if (error) throw error;

        const agentIds = formData.targetAgentId ? [formData.targetAgentId] : agents.map(a => a.id);

        for (const agentId of agentIds) {
          await supabase.from('agent_notifications').insert({
            agent_id: agentId,
            notification_type: 'offer',
            title: 'New Special Offer Available',
            message: `${formData.offerTitle}: ${formData.discountPercentage}% discount on bookings.`,
            related_id: null,
            is_read: false,
          });
        }

        alert('Offer created and agents notified successfully!');
      }

      setShowModal(false);
      setEditingOffer(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving offer:', error);
      alert('Failed to save offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer: SpecialOffer) => {
    setEditingOffer(offer);
    setFormData({
      offerTitle: offer.offer_title,
      offerDescription: offer.offer_description || '',
      discountPercentage: offer.discount_percentage,
      validFrom: offer.valid_from,
      validTo: offer.valid_to,
      propertyTypeId: offer.property_type_id,
      targetAgentId: offer.target_agent_id || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const { error } = await supabase.from('special_offers').delete().eq('id', offerId);

      if (error) throw error;
      alert('Offer deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer. Please try again.');
    }
  };

  const toggleOfferStatus = async (offerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('special_offers')
        .update({ is_active: !currentStatus })
        .eq('id', offerId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling offer status:', error);
      alert('Failed to update offer status. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      offerTitle: '',
      offerDescription: '',
      discountPercentage: 0,
      validFrom: '',
      validTo: '',
      propertyTypeId: '',
      targetAgentId: '',
    });
  };

  const getActiveOffersCount = () => offers.filter((o) => o.is_active).length;

  if (loading && offers.length === 0) {
    return (
      <>
        <AdminSidebar />
        <div className="lg:ml-64 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading offers...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Special Offers Management</h1>
              </div>
              <button
                onClick={() => {
                  setEditingOffer(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Offer
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Tag className="w-10 h-10 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Offers</p>
                  <p className="text-2xl font-bold text-gray-900">{getActiveOffersCount()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Tag className="w-10 h-10 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Offers</p>
                  <p className="text-2xl font-bold text-gray-900">{offers.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className={`bg-white rounded-lg shadow p-6 border-2 ${
                  offer.is_active ? 'border-orange-300' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{offer.offer_title}</h3>
                  </div>
                  <span className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded">
                    {offer.discount_percentage}% OFF
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{offer.offer_description}</p>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>
                    <strong>Property:</strong> {offer.property_types?.property_name || 'N/A'}
                  </p>
                  <p>
                    <strong>Valid From:</strong> {new Date(offer.valid_from).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Valid To:</strong> {new Date(offer.valid_to).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Target:</strong> {offer.target_agent_id ? 'Specific Agent' : 'All Agents'}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={offer.is_active ? 'text-green-600' : 'text-gray-500'}>
                      {offer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleOfferStatus(offer.id, offer.is_active)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition ${
                      offer.is_active
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {offer.is_active ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(offer)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {offers.length === 0 && (
              <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
                <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No special offers created yet</p>
                <button
                  onClick={() => {
                    setEditingOffer(null);
                    resetForm();
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Offer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Offer Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.offerTitle}
                  onChange={(e) => setFormData({ ...formData, offerTitle: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="e.g., Early Bird Discount"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Offer Description
                </label>
                <textarea
                  value={formData.offerDescription}
                  onChange={(e) => setFormData({ ...formData, offerDescription: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="Describe the offer details"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Property Type
                  </label>
                  <select
                    required
                    value={formData.propertyTypeId}
                    onChange={(e) => setFormData({ ...formData, propertyTypeId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  >
                    <option value="">Select Property</option>
                    {propertyTypes.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.property_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Target Agent (Leave empty for all agents)
                  </label>
                  <select
                    value={formData.targetAgentId}
                    onChange={(e) => setFormData({ ...formData, targetAgentId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  >
                    <option value="">All B2B Agents</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.agent_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Valid From
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Valid To
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOffer(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingOffer ? 'Update Offer' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
