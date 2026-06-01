import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import { containerVariants, itemVariants } from '../animations/variants';
import UserManagementTable from '../components/admin/UserManagementTable';
import * as authService from '../utils/authService';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authService.getAllUsers(1, 100);
      if (response.success && response.users) {
        // Map backend schema to table expectations if needed
        setUsers(response.users.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.isActive ? 'Active' : 'Inactive',
          joined: new Date(u.createdAt).toLocaleDateString(),
          scans: u.scansCount || 0
        })));
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-bold mb-2">User Management</h2>
        <p className="text-slate-400">Manage and monitor all system users</p>
      </motion.div>

      {loading ? (
        <Card className="p-8 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          Loading users from database...
        </Card>
      ) : (
        <UserManagementTable users={users} onRefresh={fetchUsers} />
      )}
    </motion.div>
  );
};

export default AdminUsers;
