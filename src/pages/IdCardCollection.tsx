import { useState, useRef, FormEvent, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CreditCard, Upload, ArrowRight, X, AlertCircle } from 'lucide-react';
import type { IdType, Guest } from '../types/database';

export default function IdCardCollection() {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingGuest, setFetchingGuest] = useState(true);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState({
    id_type: 'passport' as IdType,
    id_number: '',
  });
  const [idPhotos, setIdPhotos] = useState<File[]>([]);
  const [idPhotoPreviews, setIdPhotoPreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchGuestData();
  }, [guestId]);

  const fetchGuestData = async () => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('id', guestId)
        .maybeSingle();

      if (error) throw error;
      setGuest(data);
    } catch (error) {
      console.error('Error fetching guest:', error);
      alert('Failed to load guest information');
    } finally {
      setFetchingGuest(false);
    }
  };

  const getTotalPersons = () => {
    if (!guest) return 0;
    return guest.number_of_packs + guest.number_of_kids;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const totalPersons = getTotalPersons();

    if (idPhotos.length + newFiles.length > totalPersons) {
      alert(`You can only upload ${totalPersons} ID card photo(s) (${guest?.number_of_packs} adults + ${guest?.number_of_kids} kids)`);
      return;
    }

    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setIdPhotos([...idPhotos, ...newFiles]);
    setIdPhotoPreviews([...idPhotoPreviews, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = idPhotos.filter((_, i) => i !== index);
    const newPreviews = idPhotoPreviews.filter((_, i) => i !== index);

    URL.revokeObjectURL(idPhotoPreviews[index]);

    setIdPhotos(newPhotos);
    setIdPhotoPreviews(newPreviews);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const totalPersons = getTotalPersons();

    if (idPhotos.length !== totalPersons) {
      alert(`Please upload exactly ${totalPersons} ID card photo(s) - one for each person (${guest?.number_of_packs} adults + ${guest?.number_of_kids} kids)`);
      return;
    }

    setLoading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < idPhotos.length; i++) {
        const photo = idPhotos[i];
        const fileExt = photo.name.split('.').pop();
        const fileName = `${guestId}/id-${i + 1}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('guest-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('guest-photos')
          .getPublicUrl(uploadData.path);

        uploadedUrls.push(urlData.publicUrl);
      }

      const { error: dbError } = await supabase.from('guest_id_cards').insert([
        {
          guest_id: guestId,
          id_type: formData.id_type,
          id_number: formData.id_number,
          id_photo_url: uploadedUrls[0],
          additional_details: { all_photos: uploadedUrls },
        },
      ]);

      if (dbError) throw dbError;

      navigate(`/checkin/payment/${guestId}`);
    } catch (error) {
      console.error('Error saving ID details:', error);
      alert('Failed to save ID details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingGuest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Guest information not found</p>
        </div>
      </div>
    );
  }

  const totalPersons = getTotalPersons();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ID Verification</h1>
          <p className="text-gray-600">Please provide identification details for all guests</p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Photo Upload Required</p>
                <p className="text-sm text-blue-800 mt-1">
                  Please upload {totalPersons} ID card photo(s) - one for each person
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Total: {guest.number_of_packs} adult(s) + {guest.number_of_kids} kid(s) = {totalPersons} person(s)
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <CreditCard className="inline w-4 h-4 mr-1" />
                ID Type
              </label>
              <select
                value={formData.id_type}
                onChange={(e) =>
                  setFormData({ ...formData, id_type: e.target.value as IdType })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
                <option value="aadhar">Aadhar Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ID Number
              </label>
              <input
                type="text"
                required
                value={formData.id_number}
                onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter ID number"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ID Card Photos <span className="text-red-600">*</span>
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({idPhotos.length}/{totalPersons} uploaded)
                </span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {idPhotoPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {idPhotoPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`ID Card ${index + 1}`}
                        className="w-full h-40 object-cover border-2 border-gray-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                        Photo {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {idPhotos.length < totalPersons && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-blue-500 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition"
                >
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-600 font-medium">
                    Click to upload ID photos ({totalPersons - idPhotos.length} more needed)
                  </span>
                </button>
              )}

              {idPhotos.length === totalPersons && (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center">
                  <p className="text-green-800 font-medium">All {totalPersons} ID card photos uploaded!</p>
                </div>
              )}
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading || idPhotos.length !== totalPersons}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Continue to Payment'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
              {idPhotos.length !== totalPersons && (
                <p className="text-center text-sm text-red-600 mt-2">
                  Please upload all {totalPersons} ID card photos to continue
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
