import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Compass, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldAlert,
  CheckCircle2, ArrowLeft, Building2, User, Briefcase, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

interface RegisterPageProps {
  onRegisterSuccess: (user: { email: string; name: string }) => void;
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onNavigateToHome,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [jobRole, setJobRole] = useState('Data Center Architect');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute password strength (0 to 4)
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Enterprise-Grade'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-[#62DDF5]', 'bg-[#00E5CC]'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !organization || !password) {
      setError('Please complete all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }
    if (!agreeTerms) {
      setError('Please accept the enterprise terms of service to proceed.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        name: fullName,
        email,
        password,
        organization
      });
      onRegisterSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090D] flex flex-col md:flex-row text-[#F4F7F8] font-sans-ui selection:bg-[#00E5CC] selection:text-[#07090D]">
      {/* LEFT: Architectural Context */}
      <div className="md:w-5/12 relative bg-[#07090D] text-[#F4F7F8] p-8 md:p-14 flex flex-col justify-between overflow-hidden min-h-[300px] md:min-h-screen border-r border-[#C9D3DB]/12">
        <img
          src="/images/p2_view_b_server_room_master.png"
          alt="Architectural Facility"
          className="absolute inset-0 w-full h-full object-cover opacity-45 brightness-75 scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/p2_output3_master_render.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090D] via-[#07090D]/50 to-transparent"></div>

        {/* Brand header */}
        <div className="relative z-10 flex items-center justify-between">
          <div onClick={onNavigateToHome} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-[#101720] border border-[#00E5CC]/30 text-[#00E5CC] flex items-center justify-center shadow-md group-hover:border-[#00E5CC] transition-colors">
              <Compass className="w-5 h-5 text-[#00E5CC]" />
            </div>
            <div>
              <div className="font-editorial text-2xl font-bold tracking-tight text-[#F4F7F8]">
                RackVision<span className="text-[#00E5CC] italic font-normal">.ai</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[#C9D3DB]/60 -mt-1 font-mono-code font-semibold">
                Project Nexus &bull; Enrollment
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

        {/* Architectural Narrative */}
        <div className="relative z-10 my-auto py-10 max-w-md">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00E5CC]/15 text-[#00E5CC] text-xs font-mono-code uppercase tracking-wider mb-4 border border-[#00E5CC]/30 font-semibold shadow-xs">
            <Sparkles className="w-3 h-3" />
            <span>ENTERPRISE ENROLLMENT</span>
          </span>
          <h2 className="font-editorial text-3xl md:text-4xl font-bold text-[#F4F7F8] leading-tight mb-4">
            Join the Next Generation of Data Center Design.
          </h2>
          <p className="text-sm text-[#C9D3DB] leading-relaxed mb-6 font-light">
            Equip your enterprise engineering team with automated layout reconstruction, real-time ASHRAE thermal validation, and 1080p photorealistic master renders.
          </p>

          <div className="space-y-3 text-xs font-mono-code text-[#C9D3DB] border-t border-[#C9D3DB]/15 pt-6">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#00B894]" />
              <span>Canny ControlNet Layout Conditioning</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#00B894]" />
              <span>Multi-Scale PBR Spatial Shading</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#00B894]" />
              <span>Itemized Facility BOM & 10-Stage Milestone Delivery</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs font-mono-code text-[#C9D3DB]/60 pt-4 border-t border-[#C9D3DB]/10 flex justify-between">
          <span>Enterprise Edition</span>
          <span>Version 3.0</span>
        </div>
      </div>

      {/* RIGHT: Registration Form */}
      <div className="md:w-7/12 flex items-center justify-center p-8 md:p-14 bg-[#07090D] overflow-y-auto nexus-grid-radial">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg nexus-glass p-8 rounded-2xl border border-[#C9D3DB]/15"
        >
          {/* Header */}
          <div className="mb-6">
            <span className="text-xs uppercase tracking-widest text-[#00E5CC] font-mono-code font-semibold">
              Onboarding
            </span>
            <h1 className="font-editorial text-3xl md:text-4xl font-bold text-[#F4F7F8] mt-1 mb-2">
              Create Enterprise Account
            </h1>
            <p className="text-xs sm:text-sm text-[#C9D3DB]/70">
              Configure your credentials to collaborate on mission-critical facility layouts.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name & Job Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono-code uppercase tracking-wider text-[#C9D3DB] mb-1 font-semibold">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C9D3DB]/50">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Elena Rostova"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-[#101720] border border-[#C9D3DB]/20 rounded-lg text-sm text-[#F4F7F8] placeholder-[#C9D3DB]/40 focus:outline-none focus:border-[#00E5CC] shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-code uppercase tracking-wider text-[#C9D3DB] mb-1 font-semibold">
                  Professional Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C9D3DB]/50">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <select
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-[#101720] border border-[#C9D3DB]/20 rounded-lg text-sm text-[#F4F7F8] focus:outline-none focus:border-[#00E5CC] shadow-inner cursor-pointer"
                  >
                    <option value="Data Center Architect">Data Center Architect</option>
                    <option value="Mechanical MEP Engineer">Mechanical MEP Engineer</option>
                    <option value="Facilities Director">Facilities Director</option>
                    <option value="Infrastructure Project Manager">Infrastructure Project Manager</option>
                    <option value="General Contractor">General Contractor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Email Field */}
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
                  placeholder="name@enterprise-datacenter.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#101720] border border-[#C9D3DB]/20 rounded-lg text-sm text-[#F4F7F8] placeholder-[#C9D3DB]/40 focus:outline-none focus:border-[#00E5CC] shadow-inner"
                />
              </div>
            </div>

            {/* Organization Field */}
            <div>
              <label className="block text-xs font-mono-code uppercase tracking-wider text-[#C9D3DB] mb-1 font-semibold">
                Organization / Client Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C9D3DB]/50">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Helios Data Systems AG"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#101720] border border-[#C9D3DB]/20 rounded-lg text-sm text-[#F4F7F8] placeholder-[#C9D3DB]/40 focus:outline-none focus:border-[#00E5CC] shadow-inner"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono-code uppercase tracking-wider text-[#C9D3DB] mb-1 font-semibold">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C9D3DB]/50">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full pl-10 pr-9 py-2.5 bg-[#101720] border border-[#C9D3DB]/20 rounded-lg text-sm text-[#F4F7F8] placeholder-[#C9D3DB]/40 focus:outline-none focus:border-[#00E5CC] shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#C9D3DB]/50 hover:text-[#00E5CC]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-code uppercase tracking-wider text-[#C9D3DB] mb-1 font-semibold">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C9D3DB]/50">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#101720] border border-[#C9D3DB]/20 rounded-lg text-sm text-[#F4F7F8] placeholder-[#C9D3DB]/40 focus:outline-none focus:border-[#00E5CC] shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[10px] font-mono-code text-[#C9D3DB]/60">
                  <span>PASSWORD COMPLEXITY</span>
                  <span className="text-[#00E5CC] font-bold">
                    {strengthLabels[Math.min(strength, 3)]}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1">
                  {[0, 1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-full rounded-sm ${
                        step < strength ? strengthColors[strength - 1] : 'bg-[#101720]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Terms Agreement */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#C9D3DB]">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#C9D3DB]/30 bg-[#101720] text-[#00E5CC] focus:ring-[#00E5CC]"
                />
                <span>
                  I agree to the Enterprise Master Subscription Agreement, data governance policy, and cryptographic audit logging.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-nexus-teal w-full py-3 rounded-lg text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,229,204,0.3)] disabled:opacity-50 mt-4"
            >
              {loading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Create Enterprise Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-[#C9D3DB]/10 flex items-center justify-between text-xs">
            <span className="text-[#C9D3DB]/60">Already registered?</span>
            <button
              onClick={onNavigateToLogin}
              className="text-[#00E5CC] font-semibold hover:underline font-mono-code cursor-pointer"
            >
              Sign In Instead &rarr;
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
