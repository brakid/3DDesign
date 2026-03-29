import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { getDesign, getModelUrl, getCoverUrl, getThumbnailUrl } from '../lib/api';
import { ModelViewer } from '../components/ModelViewer';
import type { Design } from '../types';

export function DesignViewer() {
  const { id } = useParams<{ id: string }>();
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    getDesign(parseInt(id, 10))
      .then(setDesign)
      .catch(() => setError('Design not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">{error || 'Design not found'}</p>
          <Link to="/" className="mt-4 text-primary-600 hover:underline">
            Back to gallery
          </Link>
        </div>
      </div>
    );
  }

  const coverUrl = getCoverUrl(design.coverImage);
  const thumbnailUrl = getThumbnailUrl(design.thumbnail);
  const previewUrl = coverUrl || thumbnailUrl;
  const modelUrl = getModelUrl(design.filename);

  const handleDownload = async () => {
    try {
      const response = await fetch(modelUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = design.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            Back to gallery
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="aspect-square">
                {showViewer ? (
                  <ModelViewer
                    modelUrl={modelUrl}
                    filename={design.filename}
                    onLoad={() => {}}
                  />
                ) : (
                  <div className="w-full h-full relative flex items-center justify-center">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={design.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400">No preview available</div>
                    )}
                    <button
                      onClick={() => setShowViewer(true)}
                      className="absolute inset-0 flex items-center justify-center hover:bg-black/20 transition-colors"
                    >
                      <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-3 border border-gray-200">
                        <span className="text-2xl">🎮</span>
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">View in 3D</div>
                          <div className="text-sm text-gray-500">Rotate, zoom, and explore</div>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-900">{design.name}</h1>
              
              {design.category && (
                <span className="inline-block mt-2 px-3 py-1 text-sm font-medium bg-primary-100 text-primary-700 rounded-full">
                  {design.category}
                </span>
              )}
              
              {design.description && (
                <p className="mt-4 text-gray-600 leading-relaxed">{design.description}</p>
              )}
              
              {design.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {design.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-medium text-gray-900 mb-2">File Information</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Format</dt>
                  <dd className="text-gray-900 font-medium">
                    {design.filename.split('.').pop()?.toUpperCase()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Uploaded</dt>
                  <dd className="text-gray-900">
                    {new Date(design.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
              <button
                onClick={handleDownload}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download size={18} />
                Download {design.filename.split('.').pop()?.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
