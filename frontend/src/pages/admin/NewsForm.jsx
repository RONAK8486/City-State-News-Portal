import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import Loading from '../../components/Loading';

import { useAuth } from '../../context/AuthContext';

const NewsForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPublisher } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [imageMode, setImageMode] = useState('url'); // 'url' | 'upload'
  const [imagePreview, setImagePreview] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const debounceTimer = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'technology',
    tags: '',
    image: '',
    status: 'published',
    isFeatured: false
  });

  const categories = [
    'politics', 'business', 'technology', 'sports',
    'entertainment', 'health', 'science', 'world', 'local'
  ];

  useEffect(() => {
    if (isEditing) {
      const fetchNews = async () => {
        try {
          const res = await adminAPI.getNewsById(id);
          const news = res.data.data;
          const imageVal = news.image || '';
          setFormData({
            title: news.title,
            content: news.content,
            summary: news.summary || '',
            category: news.category,
            tags: news.tags?.join(', ') || '',
            image: imageVal,
            status: news.status,
            isFeatured: news.isFeatured
          });
          if (imageVal) {
            setImagePreview(imageVal);
            setImageMode(imageVal.startsWith('http') ? 'url' : 'upload');
          }
        } catch (error) {
          toast.error('Failed to fetch news article');
          navigate('/admin/news');
        } finally {
          setLoading(false);
        }
      };
      fetchNews();
    }
  }, [id, isEditing, navigate]);

  // Debounced URL preview
  const handleUrlChange = useCallback((url) => {
    setFormData(prev => ({ ...prev, image: url }));
    setImageError(false);
    setImagePreview('');

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!url.trim()) return;

    setImageLoading(true);
    debounceTimer.current = setTimeout(() => {
      setImagePreview(url.trim());
      setImageLoading(false);
    }, 600);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'image') {
      handleUrlChange(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await adminAPI.updateNews(id, formData);
        toast.success('News updated successfully');
      } else {
        await adminAPI.createNews(formData);
        toast.success('News created successfully');
      }
      if (isPublisher) {
        navigate('/admin/news/create', { replace: true });
        setFormData({
          title: '', content: '', summary: '', category: 'technology',
          tags: '', image: '', status: 'published', isFeatured: false
        });
        setImagePreview('');
        setImageMode('url');
      } else {
        navigate('/admin/news');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save news');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Local preview first
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);

    const formDataImage = new FormData();
    formDataImage.append('image', file);
    setUploading(true);
    try {
      const res = await adminAPI.uploadImage(formDataImage);
      const path = res.data.data.path;
      setFormData(prev => ({ ...prev, image: path }));
      setImagePreview(path);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
      setImagePreview('');
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setImagePreview('');
    setImageError(false);
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit News Article' : 'Create News Article'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-5">

        {/* Title */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter news title..."
            required
          />
        </div>

        {/* Summary */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Summary</label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Brief summary of the article..."
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={12}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm"
            required
            placeholder="Write your article content here... (HTML supported)"
          />
        </div>

        {/* Category & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {!isPublisher && (
            <div>
              <label className="block text-gray-700 font-medium mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Tags</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="tech, ai, innovation (comma separated)"
          />
        </div>

        {/* ===== FEATURED IMAGE SECTION ===== */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Featured Image</label>

          {/* Mode Toggle */}
          <div className="flex gap-0 mb-3 border border-gray-300 rounded-lg overflow-hidden w-fit">
            <button
              type="button"
              onClick={() => { setImageMode('url'); clearImage(); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                imageMode === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              🔗 From URL
            </button>
            <button
              type="button"
              onClick={() => { setImageMode('upload'); clearImage(); }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                imageMode === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              📁 Upload
            </button>
          </div>

          {/* URL Mode */}
          {imageMode === 'url' && (
            <div>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 Paste an image URL — a live preview will appear automatically.
              </p>
            </div>
          )}

          {/* Upload Mode */}
          {imageMode === 'upload' && (
            <div>
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
              }`}>
                <div className="flex flex-col items-center justify-center">
                  {uploading ? (
                    <>
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-sm text-blue-600">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500">Click to upload image</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (max 5MB)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          )}

          {/* Image Preview */}
          <div className="mt-3">
            {imageLoading && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-5 h-5 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-600">Loading preview...</span>
              </div>
            )}

            {imagePreview && !imageLoading && (
              <div className="relative group">
                <div className="rounded-xl overflow-hidden border-2 border-green-300 shadow-md" style={{ maxHeight: '280px' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full object-cover"
                    style={{ maxHeight: '280px' }}
                    onLoad={() => setImageError(false)}
                    onError={() => {
                      setImageError(true);
                      setImagePreview('');
                    }}
                  />
                </div>
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow">
                  ✓ Preview
                </div>
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm hover:bg-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            )}

            {imageError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-600 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Could not load image. Please check the URL and make sure it is a valid, publicly accessible image link.</span>
              </div>
            )}

            {!imagePreview && !imageLoading && !imageError && !formData.image && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Image preview will appear here</span>
              </div>
            )}
          </div>
        </div>
        {/* ===== END IMAGE SECTION ===== */}

        {/* Featured */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              className="w-5 h-5 accent-blue-600 rounded"
            />
            <span className="text-gray-700 font-medium">⭐ Mark as Featured</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {submitting ? '⏳ Saving...' : isEditing ? '✏️ Update Article' : '🚀 Create Article'}
          </button>
          {!isPublisher && (
            <button
              type="button"
              onClick={() => navigate('/admin/news')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default NewsForm;
