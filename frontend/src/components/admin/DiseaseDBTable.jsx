import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Download, Trash2, Eye } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { itemVariants } from '../../animations/variants';
import ImagePreviewModal from './ImagePreviewModal';
import ScanStatusBadge from './ScanStatusBadge';

const DiseaseDBTable = ({ scanRecords }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [diseaseFilter, setDiseaseFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const itemsPerPage = 5;

  // Get unique diseases and methods
  const uniqueDiseases = ['all', ...new Set(scanRecords.map((scan) => scan.diseaseName))];
  const uniqueMethods = ['all', ...new Set(scanRecords.map((scan) => scan.scanMethod))];

  // Filter records
  let filtered = scanRecords.filter((record) => {
    const matchSearch =
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diseaseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDisease = diseaseFilter === 'all' || record.diseaseName === diseaseFilter;
    const matchMethod = methodFilter === 'all' || record.scanMethod === methodFilter;
    return matchSearch && matchDisease && matchMethod;
  });

  // Paginate
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filtered.slice(startIdx, startIdx + itemsPerPage);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/20';
      case 'low':
        return 'text-blue-400 bg-blue-500/20';
      case 'none':
        return 'text-emerald-400 bg-emerald-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <>
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by user name or disease..."
              className="w-full pl-12 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Disease Filter */}
          <select
            value={diseaseFilter}
            onChange={(e) => {
              setDiseaseFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            {uniqueDiseases.map((disease) => (
              <option key={disease} value={disease}>
                {disease === 'all' ? 'All Diseases' : disease}
              </option>
            ))}
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            {uniqueMethods.map((method) => (
              <option key={method} value={method}>
                {method === 'all' ? 'All Methods' : method}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-slate-400">
          Showing <span className="font-semibold text-white">{paginatedRecords.length}</span> of{' '}
          <span className="font-semibold text-white">{filtered.length}</span> scans
        </p>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Image</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Disease</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Confidence</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Severity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Method</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record) => (
                  <motion.tr
                    key={record.id}
                    variants={itemVariants}
                    className="border-b border-slate-800 hover:bg-slate-900/50 transition"
                  >
                    {/* Image Preview */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedImage(record.imagePreview);
                          setShowImageModal(true);
                        }}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-emerald-500 transition"
                      >
                        <img
                          src={record.imagePreview}
                          alt="Scan preview"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    </td>

                    {/* User */}
                    <td className="px-6 py-4 text-white font-medium">{record.userName}</td>

                    {/* Disease */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-400">{record.diseaseName}</span>
                    </td>

                    {/* Confidence */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-lime-400"
                            style={{ width: `${record.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-blue-400">{record.confidence}%</span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(record.severity)}`}>
                        {record.severity || 'N/A'}
                      </span>
                    </td>

                    {/* Method */}
                    <td className="px-6 py-4">
                      <Badge variant="outline" size="sm">
                        {record.scanMethod}
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-sm text-slate-400">{record.scanDateTime}</td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <ScanStatusBadge status={record.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedImage(record.imagePreview);
                            setShowImageModal(true);
                          }}
                          className="p-2 hover:bg-emerald-500/20 rounded-lg transition text-emerald-400"
                          title="View report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-blue-500/20 rounded-lg transition text-blue-400" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/30">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-sm text-slate-400">
              Page {currentPage} of {totalPages || 1}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition text-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImageModal}
        image={selectedImage}
        onClose={() => setShowImageModal(false)}
      />
    </>
  );
};

export default DiseaseDBTable;
