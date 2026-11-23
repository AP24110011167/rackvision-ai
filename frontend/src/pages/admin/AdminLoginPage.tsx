import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, KeyRound, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

interface AdminLoginPageProps {
  onAdminLoginSuccess: () => void;
  onNavigateToUserApp: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onAdminLoginSuccess,
  onNavigateToUserApp,
}) => {
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [masterToken, setMasterToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminUser || !adminPass) {
      setError('Administrative credentials required.');
      return;
    }

    setLoading(true);
    try {
      await api.adminLogin({
        admin_user: adminUser,
        admin_pass: adminPass,
        master_token: masterToken
      });
      onAdminLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Supervisory authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111C27] text-[#F4F3EE] flex items-center justify-center p-6 font-sans-ui selection:bg-[#00A99D] selection:text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#20272D] border border-[#2A3744] rounded-2xl p-8 shadow-2xl relative"
      >
        <button
          onClick={onNavigateToUserApp}
          className="absolute top-6 left-6 text-xs text-[#87939B] hover:text-white flex items-center gap-1.5 font-mono-code cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#00A99D]" />
          <span>User Studio</span>
        </button>

        <div className="text-center pt-8 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#111C27] border border-[#00A99D]/40 text-[#00A99D] flex items-center justify-center mx-auto mb-4 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-mono-code uppercase tracking-widest text-[#00A99D] font-bold">
            Supervisory Gate
          </span>
          <h1 className="font-editorial text-3xl font-bold text-white mt-1">
            Enterprise Administration
          </h1>
          <p className="text-xs text-[#87939B] mt-1 font-mono-code mb-3">
            Restricted to Infrastructure Operations Engineers
          </p>
          <button
            type="button"
            onClick={() => {
              setAdminUser('superadmin@rackvision.internal');
              setAdminPass('SysAdminRack2026!');
              setMasterToken('RV-SEC-TOKEN-9941');
            }}
            className="text-[10px] font-mono-code text-[#00A99D] hover:underline cursor-pointer bg-[#111C27] px-2.5 py-1 rounded border border-[#2A3744] inline-flex items-center gap-1.5"
          >
            <KeyRound className="w-3 h-3" />
            <span>Fill SuperAdmin Credentials</span>
          </button>
        </div>

        {/* Authorization Note */}
        <div className="mb-6 p-3 rounded-xl bg-[#B87954]/10 border border-[#B87954]/30 text-xs font-mono-code text-[#F4F3EE] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#B87954] shrink-0 mt-0.5" />
          <div>
            <strong>Access Policy:</strong> All administrative activities are auditable. Server-side role-based access control (RBAC) enforced.
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-mono-code">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono-code uppercase tracking-wider text-[#87939B] mb-1.5">
              Admin Identity
            </label>
            <input
              type="text"
              value={adminUser}
              onChange={(e) => setAdminUser(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#111C27] border border-[#2A3744] text-xs text-white focus:outline-none focus:border-[#00A99D] font-mono-code transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono-code uppercase tracking-wider text-[#87939B] mb-1.5">
              Admin Keyphrase
            </label>
            <input
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#111C27] border border-[#2A3744] text-xs text-white focus:outline-none focus:border-[#00A99D] font-mono-code transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono-code uppercase tracking-wider text-[#87939B] mb-1.5">
              Master Session Token
            </label>
            <input
              type="text"
              value={masterToken}
              onChange={(e) => setMasterToken(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#111C27] border border-[#2A3744] text-xs text-[#00A99D] font-mono-code focus:outline-none focus:border-[#00A99D] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#00A99D] hover:bg-[#008B82] text-white font-bold font-mono-code text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Authorize Administrative Access'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
