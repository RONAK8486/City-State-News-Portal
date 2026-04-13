import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiFilter, FiCheck, FiX, FiTrash2, FiAlertCircle, FiSlash, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { commentReportAPI } from '../../services/api';
import Loading from '../../components/Loading';

const CommentReportList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        status: filterStatus,
        reason: filterReason
      };
      
      const res = await commentReportAPI.getAll(params);
      setReports(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch comment reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [pagination.page, filterStatus, filterReason]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await commentReportAPI.updateStatus(id, status);
      toast.success(`Report marked as ${status}`);
      fetchReports();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to completely delete this comment?')) {
      try {
        await commentReportAPI.deleteComment(commentId);
        toast.success('Comment deleted successfully');
        fetchReports();
      } catch (error) {
        toast.error('Failed to delete comment');
      }
    }
  };

  const handleWarnUser = async (userId) => {
    if (window.confirm('Warn this user? This will increment their internal warning tracking.')) {
        try {
            const res = await commentReportAPI.warnUser(userId);
            toast.success(res.data.message);
            fetchReports();
        } catch (error) {
            toast.error('Failed to warn user');
        }
    }
  };

  const handleBanUser = async (userId) => {
    if (window.confirm('CRITICAL: Are you sure you want to ban this user? They will instantly lose access to their account.')) {
        try {
            const res = await commentReportAPI.banUser(userId);
            toast.success(res.data.message);
            fetchReports();
        } catch (error) {
            toast.error('Failed to ban user');
        }
    }
  };


  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && reports.length === 0) return <Loading />;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header & Filters */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Comment Reports</h2>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                className="border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <select
              className="border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
              value={filterReason}
              onChange={(e) => {
                setFilterReason(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
            >
              <option value="">All Reasons</option>
              <option value="Spam">Spam</option>
              <option value="Abusive/Hate Speech">Abusive/Hate Speech</option>
              <option value="Harassment">Harassment</option>
              <option value="Off-topic">Off-topic</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-4 w-1/4">Comment</th>
              <th className="px-6 py-4">Offender (User)</th>
              <th className="px-6 py-4">Report Details</th>
              <th className="px-6 py-4">Status & Date</th>
              <th className="px-6 py-4 text-right">Moderator Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
               const commentDeleted = !report.comment;
               const offender = report.comment?.user;
               
               return (
                <tr key={report._id} className="border-b hover:bg-gray-50 align-top">
                    {/* Comment Snippet */}
                    <td className="px-6 py-4">
                        {commentDeleted ? (
                            <span className="text-gray-400 italic">Comment was deleted</span>
                        ) : (
                            <div>
                                <p className="text-gray-800 whitespace-pre-wrap break-words text-sm mb-1">
                                    "{report.comment.content}"
                                </p>
                                {report.comment.isUnderReview && (
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                        Hidden (Auto-Threshold hit)
                                    </span>
                                )}
                            </div>
                        )}
                    </td>

                    {/* Offender User */}
                    <td className="px-6 py-4">
                       {commentDeleted || !offender ? (
                           <span className="text-gray-400">—</span>
                       ) : (
                           <div>
                               <div className="font-medium text-gray-900">{offender.name}</div>
                               <div className="text-xs text-gray-500 mb-1">{offender.email}</div>
                               {offender.isBanned ? (
                                   <span className="text-xs text-red-600 font-bold">BANNED</span>
                               ) : (
                                   <span className="text-xs text-orange-500">Warnings: {offender.warningCount || 0}</span>
                               )}
                           </div>
                       )}
                    </td>

                    {/* Report Information */}
                    <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{report.reason}</div>
                        {report.note && (
                            <p className="text-xs text-gray-500 mt-1 italic break-words max-w-[200px]">
                                "{report.note}"
                            </p>
                        )}
                        <div className="text-xs text-indigo-500 mt-2">
                           Reported by: {report.reporter?.name || 'Unknown'}
                        </div>
                    </td>

                    {/* Status & Date */}
                    <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${getStatusBadgeColor(report.status)}`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                        <div className="text-xs text-gray-400">
                           {format(new Date(report.createdAt), 'MMM dd, yyyy h:mm a')}
                        </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                            {report.status === 'pending' && (
                                <div className="flex gap-1 mb-2 pb-2 border-b border-gray-100 w-full justify-end">
                                    <button
                                        onClick={() => handleStatusUpdate(report._id, 'reviewed')}
                                        className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded text-xs px-2 flex items-center"
                                        title="Mark as Reviewed"
                                    >
                                        <FiCheck className="mr-1" /> Reviewed
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(report._id, 'dismissed')}
                                        className="p-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded text-xs px-2 flex items-center"
                                        title="Dismiss Report"
                                    >
                                        <FiX className="mr-1" /> Dismiss
                                    </button>
                                </div>
                            )}

                            {!commentDeleted && (
                                <button
                                    onClick={() => handleDeleteComment(report.comment._id)}
                                    className="flex items-center text-xs text-red-600 hover:text-red-800 w-full justify-end"
                                >
                                    <FiTrash2 className="mr-1.5" /> Delete Comment
                                </button>
                            )}
                            
                            {!commentDeleted && offender && !offender.isBanned && (
                                <button
                                    onClick={() => handleWarnUser(offender._id)}
                                    className="flex items-center text-xs text-orange-600 hover:text-orange-800 mt-1.5 w-full justify-end"
                                >
                                    <FiAlertCircle className="mr-1.5" /> Warn User
                                </button>
                            )}

                            {!commentDeleted && offender && !offender.isBanned && (
                                <button
                                    onClick={() => handleBanUser(offender._id)}
                                    className="flex items-center text-xs text-red-700 font-semibold hover:text-red-900 mt-1.5 w-full justify-end"
                                >
                                    <FiSlash className="mr-1.5" /> Ban User
                                </button>
                            )}
                        </div>
                    </td>
                </tr>
               )
            })}
            {reports.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No comment reports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

       {/* Pagination */}
       {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentReportList;
