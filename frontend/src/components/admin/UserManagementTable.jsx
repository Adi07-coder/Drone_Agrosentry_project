import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Eye, MoreVertical } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { itemVariants } from '../../animations/variants';
import ScanHistoryDrawer from './ScanHistoryDrawer';

const UserManagementTable = ({ users, mockScans }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showScanHistory, setShowScanHistory] = useState(false);

  const itemsPerPage = 5;

  // Filter users
  let filtered = users.filter((user) => {
    const matchSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || user.role === roleFilter;
    const matchStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  // Paginate
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filtered.slice(startIdx, startIdx + itemsPerPage);

  const handleViewScanHistory = (user) => {
    setSelectedUser(user);
    setShowScanHistory(true);
  };

  const userScans = selectedUser
    ? mockScans.filter((scan) => scan.userId === selectedUser.id)
    : [];

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
              placeholder="Search by name or email..."
              className="w-full pl-12 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <p className="text-sm text-slate-400">
          Showing <span className="font-semibold text-white">{paginatedUsers.length}</span> of{' '}
          <span className="font-semibold text-white">{filtered.length}</span> users
        </p>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Scans</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Last Scan</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Account</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    variants={itemVariants}
                    className="border-b border-slate-800 hover:bg-slate-900/50 transition"
                  >
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="font-medium text-white">{user.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-slate-400 text-sm">{user.email}</td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'admin' ? 'warning' : 'success'} size="sm">
                        {user.role}
                      </Badge>
                    </td>

                    {/* Scans */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-400">{user.scans}</span>
                    </td>

                    {/* Last Scan */}
                    <td className="px-6 py-4 text-sm text-slate-400">{user.lastScanTime}</td>

                    {/* Account Status */}
                    <td className="px-6 py-4">
                      <Badge
                        variant={user.accountStatus === 'verified' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {user.accountStatus}
                      </Badge>
                    </td>

                    {/* Scan Status */}
                    <td className="px-6 py-4">
                      <Badge variant="success" size="sm">
                        {user.scanStatus}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewScanHistory(user)}
                          className="p-2 hover:bg-emerald-500/20 rounded-lg transition text-emerald-400"
                          title="View scan history"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
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

      {/* Scan History Drawer */}
      <ScanHistoryDrawer
        isOpen={showScanHistory}
        userName={selectedUser?.name || ''}
        scans={userScans}
        onClose={() => setShowScanHistory(false)}
      />
    </>
  );
};

export default UserManagementTable;
