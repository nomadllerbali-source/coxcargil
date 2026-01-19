import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, Check, Loader, Upload, X } from 'lucide-react';

const MAX_FILE_SIZE = 200 * 1024;

export default function HomepageSettingsManagement() {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('homepage_settings')
          .select('background_image_url')
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data?.background_image_url) {
          setBackgroundImageUrl(data.background_image_url);
        }
      } catch (err) {
        setError('Failed to load homepage settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');

    if (file.size > MAX_FILE_SIZE) {
      setError(`File size must be less than 200 KB. Selected file is ${(file.size / 1024).toFixed(2)} KB.`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const fileName = `homepage-bg-${Date.now()}.${selectedFile.name.split('.').pop()}`;

      const { error: uploadError } = await supabase.storage
        .from('homepage-images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('homepage-images')
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;

      const { data: existingData } = await supabase
        .from('homepage_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existingData) {
        const { error: updateError } = await supabase
          .from('homepage_settings')
          .update({
            background_image_url: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingData.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('homepage_settings')
          .insert({
            background_image_url: imageUrl,
          });

        if (insertError) throw insertError;
      }

      setBackgroundImageUrl(imageUrl);
      setSelectedFile(null);
      setPreviewUrl('');
      setSuccess('Homepage background updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload image');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Homepage Settings</h1>
        <p className="text-gray-600 mb-8">Upload a new background image (Max size: 200 KB)</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Upload New Background Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 200 KB</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {previewUrl && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Preview
                </label>
                <button
                  onClick={handleClearSelection}
                  className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              </div>
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                File size: {(selectedFile!.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          {backgroundImageUrl && !previewUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Background
              </label>
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                <img
                  src={backgroundImageUrl}
                  alt="Current background"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  Uploading...
                </div>
              ) : (
                'Upload Image'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
