import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Leaf, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { containerVariants, itemVariants } from '../animations/variants';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, admin, loading, error, setError } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'user'); // 'user' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Set role in localStorage
  useEffect(() => {
    localStorage.setItem('userRole', activeTab);
  }, [activeTab]);

  // Redirect once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (admin) navigate('/admin', { replace: true });
      else if (user) navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, admin, navigate]);

  // Clear errors on unmount
  useEffect(() => () => setError(null), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    const result = await login(email.trim(), password, activeTab);
    if (result.success) {
      toast.success('Logged in successfully!');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-lime-400/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg"
      >
        {/* Back button */}
        <motion.div variants={itemVariants} className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={itemVariants}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-10"
        >
          {/* Tabs */}
          <div className="flex bg-slate-800 rounded-xl p-1.5 mb-10">
            <button
              type="button"
              onClick={() => setActiveTab('user')}
              className={`flex-1 py-3 text-base font-bold rounded-lg transition ${activeTab === 'user' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Farmer Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-3 text-base font-bold rounded-lg transition ${activeTab === 'admin' ? 'bg-lime-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Admin Login
            </button>
          </div>

          {/* Icon + Title */}
          <div className="text-center mb-10">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${activeTab === 'admin' ? 'bg-lime-400/20' : 'bg-emerald-500/20'}`}>
              {activeTab === 'admin'
                ? <Shield className="w-10 h-10 text-lime-400" />
                : <Leaf className="w-10 h-10 text-emerald-400" />
              }
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {activeTab === 'admin' ? 'Admin Access' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400 text-base">
              {activeTab === 'admin' ? 'Sign in to the admin panel' : 'Sign in to your AgroSentry account'}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-base">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-slate-300 text-base font-semibold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={activeTab === 'admin' ? 'admin@example.com' : 'you@example.com'}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-5 py-4 text-base focus:outline-none focus:border-emerald-500 transition placeholder-slate-500"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-base font-semibold mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-5 py-4 text-base focus:outline-none focus:border-emerald-500 transition placeholder-slate-500 pr-12"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${activeTab === 'admin' ? 'bg-gradient-to-r from-lime-600 to-emerald-600' : 'bg-gradient-to-r from-emerald-500 to-lime-500'} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl shadow-xl transition duration-300 flex items-center justify-center gap-2 mt-4`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                activeTab === 'admin' ? 'Sign In as Admin' : 'Sign In'
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-8 text-center text-base text-slate-400">
            {activeTab === 'user' ? (
              <p>
                Don't have an account?{' '}
                <Link to="/signup" state={{ tab: 'user' }} className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Create account
                </Link>
              </p>
            ) : (
              <p>
                Don't have an admin account?{' '}
                <Link to="/signup" state={{ tab: 'admin' }} className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Register Admin
                </Link>
              </p>
            )}
          </div>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-sm text-slate-400">
            <span className="text-emerald-400 font-semibold">Demo:</span>{' '}
            {activeTab === 'admin'
              ? 'admin@plantai.com / admin123'
              : 'user@example.com / password123'
            }
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
