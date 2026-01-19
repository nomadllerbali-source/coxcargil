import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Camera, Upload, Trash2, ArrowRight } from 'lucide-react';

interface PhotoPreview {
  id: string;
  file: File;
  preview: string;
}

export default function PhotoCollection() {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PhotoPreview[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
    }));

    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    setPhotos(photos.filter((photo) => photo.id !== id));
  };

  const handleContinue = async () => {
    if (photos.length === 0) {
      alert('Please upload at least one photo');
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = photos.map(async (photo) => {
        const fileExt = photo.file.name.split('.').pop();
        const fileName = `${guestId}/${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('guest-photos')
          .upload(fileName, photo.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('guest-photos')
          .getPublicUrl(uploadData.path);

        const { error: dbError } = await supabase.from('guest_photos').insert([
          {
            guest_id: guestId,
            photo_url: urlData.publicUrl,
          },
        ]);

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);
      navigate(`/checkin/id/${guestId}`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Guest Photos</h1>
          <p className="text-gray-600">Upload photos of all guests in your party</p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="mb-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Upload className="w-5 h-5" />
                Upload from Device
              </button>

              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment');
                    fileInputRef.current.click();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </button>
            </div>
          </div>

          {photos.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Uploaded Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.preview}
                      alt="Guest"
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {photos.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg mb-8">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No photos uploaded yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Click the buttons above to add guest photos
              </p>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={uploading || photos.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Continue to ID Verification'}
            {!uploading && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
