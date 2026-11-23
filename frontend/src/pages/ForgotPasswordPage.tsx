import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Compass, Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigateToLogin,
  onNavigateToHome,
}) => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: any;
    if (isSent && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isSent, countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      try {
        await api.requestPasswordReset(email);
      } catch (e) {
        console.warn('Reset request error:', e);
      }
      setIsSent(true);
      setCountdown(60);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090D] flex items-center justify-center p-6 text-[#F4F7F8] font-sans-ui selection:bg-[#00E5CC] selection:text-[#07090D] nexus-grid-radial">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md nexus-glass rounded-2xl p-8 md:p-10 border border-[#C9D3DB]/15 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#C9D3DB]/10">
          <div onClick={onNavigateToHome} className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-[#101720] border border-[#00E5CC]/30 text-[#00E5CC] flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4 text-[#00E5CC]" />
            </div>
            <span className="font-editorial text-xl font-bold text-[#F4F7F8]">
              RackVision<span className="text-[#00E5CC] italic font-normal">.ai</span>
            </span>
          </div>

          <button
            onClick={onNavigateToLogin}
            className="text-xs text-[#C9D3DB] hover:text-[#00E5CC] flex items-center gap-1 transition-colors cursor-pointer font-mono-code"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        </div>

        {!isSent ? (
          <div>
            <span className="text-xs uppercase tracking-widest text-[#00E5CC] font-mono-code font-semibold">
              Security Protocol
            </span>
            <h1 className="font-editorial text-3xl font-bold text-[#F4F7F8] mt-1 mb-2">
              Reset Password
            </h1>
            <p className="text-xs sm:text-sm text-[#C9D3DB]/70 mb-6 font-light">
              Enter your registered enterprise email to receive secure recovery instructions.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-code uppercase tracking-wider text-[#C9D3DB] mb-1 font-semibold">
                  Enterprise Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C9D3DB]/50">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="architect@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#101720] border border-[#C9D3DB]/20 rounded-lg text-sm text-[#F4F7F8] placeholder-[#C9D3DB]/40 focus:outline-none focus:border-[#00E5CC] shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-nexus-teal w-full py-3 rounded-lg text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,229,204,0.3)] mt-2"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#00E5CC]/15 border border-[#00E5CC]/30 text-[#00E5CC] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="font-editorial text-2xl font-bold text-[#F4F7F8]">
              Dispatch Confirmed
            </h2>
            <p className="text-xs text-[#C9D3DB]/80 leading-relaxed font-mono-code">
              Recovery verification instructions have been dispatched to:
              <br />
              <strong className="text-[#00E5CC]">{email}</strong>
            </p>
            <p className="text-[11px] text-[#C9D3DB]/50 font-mono-code">
              Resend available in {countdown}s
            </p>
            <button
              onClick={onNavigateToLogin}
              className="btn-nexus-outline w-full py-2.5 rounded-lg text-xs font-mono-code uppercase tracking-wider"
            >
              Back to Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
