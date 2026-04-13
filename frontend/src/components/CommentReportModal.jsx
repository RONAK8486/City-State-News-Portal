import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { commentReportAPI } from '../services/api';

const REPORT_REASONS = [
  'Spam',
  'Abusive/Hate Speech',
  'Harassment',
  'Off-topic',
  'Other'
];

const CommentReportModal = ({ isOpen, onClose, commentId }) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await commentReportAPI.create(commentId, { reason, note });
      toast.success(res.data.message || 'Comment reported successfully');
      onClose();
      setReason(REPORT_REASONS[0]);
      setNote('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Report Comment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why are you reporting this?
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                    required
                  />
                  <span className="text-sm text-gray-700">{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="note">
              Additional Details (Optional)
            </label>
            <textarea
              id="note"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors resize-none"
              rows={3}
              maxLength={200}
              placeholder="Provide more context..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {note.length}/200
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              ) : null}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentReportModal;
