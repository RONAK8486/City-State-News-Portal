import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiFilter, FiCheck, FiX, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { reportAPI } from '../../services/api';
import Loading from '../../components/Loading';

const ReportList = () => {
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
      
      const res = await reportAPI.getAll(params);
      setReports(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [pagination.page, filterStatus, filterReason]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await reportAPI.updateStatus(id, status);
      toast.success(`Report marked as ${status}`);
      fetchReports();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleRemoveArticle = async (newsId) => {
    if (window.confirm('Are you sure you want to delete this article? This action cannot be undone and will mark associated pending reports as reviewed.')) {
      try {
        await reportAPI.removeArticle(newsId);
        toast.success('Article deleted successfully');
        fetchReports();
      } catch (error) {
        toast.error('Failed to delete article');
      }
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && reports.length === 0) return <Loading />;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header & Filters */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Reported Articles</h2>
          
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
              <option value="Misinformation">Misinformation</option>
              <option value="Hate Speech">Hate Speech</option>
              <option value="Spam">Spam</option>
              <option value="Copyright Violation">Copyright Violation</option>
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
              <th className="px-6 py-4">Article</th>
              <th className="px-6 py-4">Reporter</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                    {report.article ? (
                      <div className="flex items-center">
                         {report.article.image && (
                             <img src={report.article.image} alt="" className="w-10 h-10 rounded object-cover mr-3" />
                         )}
                         <div>
                            <span className="font-medium text-gray-900 block truncate max-w-[200px]">
                                {report.article.title}
                            </span>
                            <Link 
                                to={`/news/${report.article.slug}`} 
                                target="_blank"
                                className="text-primary-600 hover:text-primary-800 flex items-center text-xs mt-1"
                            >
                                View Article <FiExternalLink className="ml-1" />
                            </Link>
                         </div>
                      </div>
                    ) : (
                       <span className="text-gray-400 italic">Article Deleted</span>
                    )}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{report.reporter?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{report.reporter?.email || ''}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium">{report.reason}</span>
                  {report.description && (
                     <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={report.description}>
                        "{report.description}"
                     </p>
                  )}
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(report.status)}`}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(report._id, 'reviewed')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Mark as Reviewed"
                          >
                            <FiCheck size={18} />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(report._id, 'dismissed')}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                            title="Dismiss Report"
                          >
                            <FiX size={18} />
                          </button>
                        </>
                    )}
                    {report.article && (
                      <button
                        onClick={() => handleRemoveArticle(report.article._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded ml-2"
                        title="Delete Article"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No reports found matching your filters.
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

export default ReportList;
