import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Hash, Check, AlertCircle } from 'lucide-react';

interface Room {
  id: string;
  property_type_id: string;
  room_number: string;
  is_available: boolean;
}

interface RoomManagementModalProps {
  propertyTypeId: string;
  propertyTypeName: string;
  roomPrefix: string;
  onClose: () => void;
}

export default function RoomManagementModal({
  propertyTypeId,
  propertyTypeName,
  roomPrefix,
  onClose,
}: RoomManagementModalProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRoomNumber, setEditRoomNumber] = useState('');

  useEffect(() => {
    fetchRooms();
  }, [propertyTypeId]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_type_id', propertyTypeId)
        .order('room_number');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (roomId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_available: !currentStatus })
        .eq('id', roomId);

      if (error) throw error;
      fetchRooms();
    } catch (error) {
      console.error('Error updating room availability:', error);
      alert('Failed to update room availability.');
    }
  };

  const startEdit = (room: Room) => {
    setEditingId(room.id);
    setEditRoomNumber(room.room_number);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRoomNumber('');
  };

  const saveEdit = async (roomId: string) => {
    if (!editRoomNumber.trim()) {
      alert('Room number cannot be empty.');
      return;
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .update({ room_number: editRoomNumber.trim().toUpperCase() })
        .eq('id', roomId);

      if (error) throw error;
      setEditingId(null);
      setEditRoomNumber('');
      fetchRooms();
    } catch (error) {
      console.error('Error updating room number:', error);
      alert('Failed to update room number. It may already exist.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Room Management</h2>
            <p className="text-blue-100 text-sm mt-1">{propertyTypeName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No rooms found for this property type.</p>
              <p className="text-sm text-gray-500 mt-2">
                Rooms are automatically created when you add a property type.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`border-2 rounded-lg p-4 transition ${
                    room.is_available
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  {editingId === room.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1">
                          <Hash className="w-3 h-3" />
                          Room Number
                        </label>
                        <input
                          type="text"
                          value={editRoomNumber}
                          onChange={(e) => setEditRoomNumber(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm uppercase"
                          placeholder={`e.g., ${roomPrefix}1`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(room.id)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm flex items-center justify-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {room.room_number}
                          </div>
                          <div
                            className={`text-xs font-medium mt-1 ${
                              room.is_available ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {room.is_available ? 'Available' : 'Unavailable'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAvailability(room.id, room.is_available)}
                          className={`flex-1 px-3 py-2 rounded-lg transition text-sm font-medium ${
                            room.is_available
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {room.is_available ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                        <button
                          onClick={() => startEdit(room)}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
          <div className="text-sm text-gray-600">
            Total Rooms: <span className="font-semibold">{rooms.length}</span>
            <span className="mx-2">|</span>
            Available: <span className="font-semibold text-green-600">
              {rooms.filter((r) => r.is_available).length}
            </span>
            <span className="mx-2">|</span>
            Unavailable: <span className="font-semibold text-red-600">
              {rooms.filter((r) => !r.is_available).length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
