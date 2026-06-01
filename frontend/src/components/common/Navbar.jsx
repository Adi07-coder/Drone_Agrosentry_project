import React from 'react';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = ({ user: propUser, onLogout, userRole = 'user' }) => {
  const navigate = useNavigate();
  const { user: authUser, admin: authAdmin, logout } = useAuth();

  const currentUser = propUser || authUser || authAdmin;

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      navigate('/login');
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 z-50"
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-400 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-emerald-400 to-lime-300 bg-clip-text text-transparent">
            PlantAI
          </span>
        </Link>

        {/* Center Menu - Only show for non-admin users */}
        {userRole !== 'admin' && (
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-slate-300 hover:text-white transition text-sm">
              Home
            </Link>
            <Link to={userRole === 'admin' ? '/admin/dashboard' : '/dashboard'} className="text-slate-300 hover:text-white transition text-sm">
              Dashboard
            </Link>
            <a href="#features" className="text-slate-300 hover:text-white transition text-sm">
              Features
            </a>
          </div>
        )}

        {/* Right Menu */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <>
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm text-slate-300">{currentUser.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-300 hover:text-white transition text-sm">
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-500 to-lime-400 text-white hover:shadow-lg transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
