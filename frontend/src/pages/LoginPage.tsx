import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Compass, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldAlert,
  CheckCircle2, ArrowLeft, Building2, KeyRound, Shield, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: { email: string; name: string }) => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onNavigateToHome: () => void;
  onNavigateToAdmin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onNavigateToHome,
  onNavigateToAdmin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both your enterprise email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({ email, password });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090D] flex flex-col md:flex-row text-[#F4F7F8] font-sans-ui selection:bg-[#00E5CC] selection:text-[#07090D]">
      {/* LEFT: Cinematic Architectural Data Center Visual */}
      <div className="md:w-1/2 relative bg-[#07090D] text-[#F4F7F8] p-8 md:p-16 flex flex-col justify-between overflow-hidden min-h-[340px] md:min-h-screen border-r border-[#C9D3DB]/12">
        <img
          src="/images/p2_view_a_elevated_overview_master.png"
          alt="Enterprise Architectural Data Center"
          className="absolute inset-0 w-full h-full object-cover opacity-50 brightness-75 scale-105 transition-transform duration-1000"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/p2_output3_master_render.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090D] via-[#07090D]/50 to-transparent"></div>

        {/* Brand header */}
        <div className="relative z-10 flex items-center justify-between">
          <div
            onClick={onNavigateToHome}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#101720] border border-[#00E5CC]/30 text-[#00E5CC] flex items-center justify-center shadow-lg group-hover:border-[#00E5CC] transition-colors">
              <Compass className="w-5 h-5 text-[#00E5CC]" />
            </div>
            <div>
              <div className="font-editorial text-2xl font-bold tracking-tight text-[#F4F7F8]">
                RackVision<span className="text-[#00E5CC] italic font-normal">.ai</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[#C9D3DB]/60 -mt-1 font-mono-code font-semibold">
                Project Nexus &bull; Command Gate
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToHome}
            className="text-xs text-[#C9D3DB] hover:text-[#00E5CC] flex items-center gap-1.5 transition-colors cursor-pointer font-mono-code"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Site</span>
          </button>
        </div>

        {/* Editorial Statement */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00E5CC]/15 text-[#00E5CC] text-xs font-mono-code uppercase tracking-wider mb-4 border border-[#00E5CC]/30 font-semibold shadow-xs">
            <Sparkles className="w-3 h-3" />
            <span>ENTERPRISE CLIENT WORKSPACE</span>
          </span>
          <h2 className="font-editorial text-3xl md:text-5xl font-bold text-[#F4F7F8] leading-tight mb-4">
            Computational Design for Mission-Critical Facilities.
          </h2>
          <p className="text-sm md:text-base text-[#C9D3DB] leading-relaxed font-light">
            Access validated floor plan layouts, real-time CFD thermal simulations, and hybrid PBR + SDXL 1080p architectural master renders under one unified engineering studio.
          </p>
        </div>

        {/* Bottom Specs Pill */}
        <div className="relative z-10 flex items-center justify-between pt-6 border-t border-[#C9D3DB]/10 text-xs font-mono-code text-[#C9D3DB]/70">
          <span>Security Protocol: TLS 1.3 &bull; SHA-256</span>
          <span className="text-[#00B894] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00B894] animate-pulse" />
            ASHRAE TC 9.9 Verified
          </span>
        </div>
      </div>

      {/* RIGHT: Split-screen Architectural Sign-In Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16 bg-[#07090D] nexus-grid-radial">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md nexus-glass p-8 rounded-2xl border border-[#C9D3DB]/15"
        >
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00E5CC]/10 border border-[#00E5CC]/25 text-[10px] font-mono-code text-[#00E5CC] font-semibold mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5CC] animate-pulse"></span>
              <span>ENTERPRISE AUTHENTICATION &bull; SECURE SESSION</span>
            </div>
            <h1 className="font-editorial text-3xl md:text-4xl font-bold text-[#F4F7F8] mt-1 mb-2">
              Sign In to Nexus
            </h1>
            <p className="text-xs sm:text-sm text-[#C9D3DB]/70">
              Enter your enterprise credentials to access your architectural projects.
            </p>

            {/* Quick Demo Fill Helper */}
            <button
              type="button"
              onClick={() => {
                setEmail('architect@helios-datacenter.com');
                setPassword('HeliosArchitect2026!');
              }}
              className="mt-3 text-[11px] font-mono-code text-[#00E5CC] hover:text-[#62DDF5] cursor-pointer bg-[#101720] px-3 py-1.5 rounded-lg border border-[#00E5CC]/30 inline-flex items-center gap-2 transition-colors"
            >
              <KeyRound className="w-3 h-3 text-[#00E5CC]" />
              <span>Fill Verified Lead Architect Credentials</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-mono-code uppercase tracking-wider text-[#C9D3DB] mb-1.5 font-semibold">
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
                  placeholder="architect@helios-datacenter.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#101720] border border-[#C9D3DB]/20 rounded-lg text-sm text-[#F4F7F8] placeholder-[#C9D3DB]/40 focus:outline-none focus:border-[#00E5CC] transition-colors shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono-code uppercase tracking-wider text-[#C9D3DB] font-semibold">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateToForgotPassword}
                  className="text-xs text-[#00E5CC] hover:underline font-mono-code"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C9D3DB]/50">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#101720] border border-[#C9D3DB]/20 rounded-lg text-sm text-[#F4F7F8] placeholder-[#C9D3DB]/40 focus:outline-none focus:border-[#00E5CC] transition-colors shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#C9D3DB]/50 hover:text-[#00E5CC] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#C9D3DB]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#C9D3DB]/30 bg-[#101720] text-[#00E5CC] focus:ring-[#00E5CC]"
                />
                <span>Remember session on this workstation</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-nexus-teal w-full py-3 rounded-lg text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,229,204,0.3)] disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating with Node...</span>
              ) : (
                <>
                  <span>Sign In to Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-[#C9D3DB]/10 flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
            <span className="text-[#C9D3DB]/60">Need enterprise access?</span>
            <button
              onClick={onNavigateToRegister}
              className="text-[#00E5CC] font-semibold hover:underline font-mono-code cursor-pointer"
            >
              Request Account Registration &rarr;
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
