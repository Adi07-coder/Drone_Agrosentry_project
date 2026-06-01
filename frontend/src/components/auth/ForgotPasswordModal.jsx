import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import * as authService from '../../utils/authService';

const ForgotPasswordModal = ({ isOpen, onClose, isAdmin = false }) => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('request'); // 'request' | 'success'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetData, setResetData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const role = isAdmin ? 'admin' : 'user';
      const response = await authService.forgotPassword(email, role);
      setResetData(response);
      setStep('success');
      toast.success('Reset token generated!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (resetData?.resetToken) {
      navigator.clipboard.writeText(resetData.resetToken);
      setCopied(true);
      toast.success('Token copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setEmail('');
    setStep('request');
    setError('');
    setResetData(null);
    setCopied(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-lime-400" />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                {step === 'request' ? (
                  <>
                    {/* Header */}
                    <div className="mb-6">
                      <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
                      <p className="text-slate-400 text-sm">
                        Enter your {isAdmin ? 'admin ' : ''}email address and we'll generate a
                        password reset token for you.
                      </p>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-sm">{error}</p>
                      </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                          }}
                          placeholder={isAdmin ? 'admin@plantai.com' : 'your@email.com'}
                          className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                          disabled={isLoading}
                          autoFocus
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating token...
                          </>
                        ) : (
                          'Send Reset Token'
                        )}
                      </button>
                    </form>

                    <button
                      onClick={handleClose}
                      className="w-full mt-3 py-2 text-slate-400 hover:text-white text-sm transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {/* Success State */}
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">Token Generated!</h2>
                      <p className="text-slate-400 text-sm">
                        A password reset token has been generated for <span className="text-white font-medium">{email}</span>.
                        Copy it below and use it to reset your password.
                      </p>
                    </div>

                    {/* Token Display */}
                    {resetData?.resetToken && (
                      <div className="mb-6">
                        <p className="text-sm font-semibold text-slate-400 mb-2">Your Reset Token:</p>
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-start gap-3">
                          <code className="text-emerald-400 text-xs break-all flex-1 leading-relaxed">
                            {resetData.resetToken}
                          </code>
                          <button
                            onClick={handleCopy}
                            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
                            title="Copy token"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          ⏱ Valid for 1 hour
                          {resetData.expiresAt && ` · Expires at ${new Date(resetData.expiresAt).toLocaleTimeString()}`}
                        </p>
                      </div>
                    )}

                    {/* Note for demo */}
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
                      <p className="text-amber-300 text-xs">
                        <strong>Demo Mode:</strong> In production, this token would be emailed to you.
                        Use it with the <code className="bg-amber-500/20 px-1 rounded">POST /api/{isAdmin ? 'admin' : 'auth'}/reset-password</code> endpoint.
                      </p>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-white font-semibold rounded-lg transition-all"
                    >
                      Back to Login
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ForgotPasswordModal;
