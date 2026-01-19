import { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Guest } from '../types/database';

interface DeleteConfirmationModalProps {
  guest: Guest;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteConfirmationModal({ guest, onClose, onSuccess }: DeleteConfirmationModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('guests')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', guest.id);

      if (error) throw error;

      alert('Booking deleted successfully! This booking is now archived and hidden from the dashboard.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Delete Booking</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Are you sure?</h3>
                <p className="text-sm text-red-800">
                  This will soft-delete the booking for <span className="font-semibold">{guest.guest_name}</span> (Confirmation: {guest.confirmation_number}).
                </p>
                <p className="text-sm text-red-800 mt-2">
                  The booking will be hidden from the dashboard but preserved in the database for audit purposes.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Type <span className="text-red-600 font-bold">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              placeholder="Type DELETE"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== 'DELETE'}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
