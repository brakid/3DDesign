import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Upload, Trash2, LogOut, X, Camera } from 'lucide-react';
import { login, verifyToken, uploadDesign, deleteDesign, getDesigns } from '../lib/api';
import { UploadPreview, UploadPreviewHandle } from '../components/UploadPreview';
import type { Design } from '../types';

export function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [designs, setDesigns] = useState<Design[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const previewRef = useRef<UploadPreviewHandle>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    console.log('Admin: Checking token:', token ? 'Token exists' : 'No token');
    
    verifyToken().then(valid => {
      console.log('Admin: Token verification result:', valid);
      setIsAuthenticated(valid);
      setCheckingAuth(false);
      if (valid) {
        loadDesigns();
      }
    });
  }, []);

  const loadDesigns = () => {
    getDesigns().then(result => setDesigns(result.designs)).catch(console.error);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const result = await login(password);
      if (result.token) {
        localStorage.setItem('adminToken', result.token);
        setIsAuthenticated(true);
        setPassword('');
        loadDesigns();
      } else {
        setLoginError('Login failed');
      }
    } catch {
      setLoginError('Invalid password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  const handleFileSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['obj', 'gltf', 'glb'].includes(ext || '')) {
      setSelectedFile(file);
    } else {
      alert('Only OBJ, GLTF, and GLB files are supported');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a model file');
      return;
    }

    setUploading(true);
    
    const thumbnailBlob = previewRef.current?.captureSnapshot() || null;
    
    const formData = new FormData();
    formData.append('model', selectedFile);
    formData.append('name', uploadForm.name || selectedFile.name.replace(/\.[^.]+$/, ''));
    formData.append('description', uploadForm.description);
    formData.append('category', uploadForm.category);
    formData.append('tags', JSON.stringify(
      uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    ));

    if (thumbnailBlob) {
      formData.append('thumbnail', thumbnailBlob, 'thumbnail.png');
    }

    try {
      await uploadDesign(formData);
      setUploadForm({ name: '', description: '', category: '', tags: '' });
      setSelectedFile(null);
      loadDesigns();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this design?')) return;
    
    try {
      await deleteDesign(id);
      loadDesigns();
    } catch {
      alert('Failed to delete');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Lock className="text-primary-600" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Access</h1>
              <p className="text-sm text-gray-500">Enter your password to continue</p>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              autoFocus
            />
            
            {loginError && (
              <p className="mt-2 text-sm text-red-600">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full mt-4 px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Login
            </button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
              View gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
              View gallery
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload size={20} />
              Upload New Design
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Camera size={16} className="inline mr-1" />
                    Preview
                  </label>
                  <UploadPreview ref={previewRef} file={selectedFile} />
                  <p className="mt-1 text-xs text-gray-500">
                    Adjust view, then upload
                  </p>
                </div>

                <div className="space-y-4">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                    }`}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto text-gray-400 mb-1" size={24} />
                        <p className="text-sm text-gray-600">Drop OBJ/GLTF/GLB</p>
                        <input
                          type="file"
                          accept=".obj,.gltf,.glb"
                          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                          className="hidden"
                          id="file-input"
                        />
                        <label
                          htmlFor="file-input"
                          className="mt-2 inline-block px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer"
                        >
                          Browse
                        </label>
                      </>
                    )}
                  </div>

                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder="Design name"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />

                  <input
                    type="text"
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    placeholder="Category (optional)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />

                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                    placeholder="Tags (comma separated)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-gray-900 bg-white"
              />

              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera size={18} />
                    Upload with Current View as Thumbnail
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Existing Designs ({designs.length})
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {designs.map(design => (
                <div
                  key={design.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    {design.thumbnail ? (
                      <img
                        src={`/uploads/thumbnails/${design.thumbnail}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Camera size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{design.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {design.tags.join(', ') || 'No tags'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(design.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {designs.length === 0 && (
                <p className="text-center text-gray-500 py-8">No designs uploaded yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
