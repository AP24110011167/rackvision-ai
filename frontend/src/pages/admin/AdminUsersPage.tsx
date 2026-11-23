import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, CheckCircle2, XCircle, Search, Filter, X } from 'lucide-react';
import { api } from '../../services/api';

export const AdminUsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [provisionName, setProvisionName] = useState('');
  const [provisionEmail, setProvisionEmail] = useState('');
  const [provisionPassword, setProvisionPassword] = useState('HeliosArchitect2026!');
  const [provisionRole, setProvisionRole] = useState('architect');
  const [provisionOrg, setProvisionOrg] = useState('Helios Data Systems');
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [provisionSuccess, setProvisionSuccess] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionError(null);
    setProvisionSuccess(null);
    try {
      await api.createAdminUser({
        name: provisionName,
        email: provisionEmail,
        password: provisionPassword,
        role: provisionRole,
        organization: provisionOrg
      });
      setProvisionSuccess(`Provisioned enterprise seat for ${provisionName}`);
      setProvisionName('');
      setProvisionEmail('');
      setTimeout(() => {
        setIsProvisionOpen(false);
        setProvisionSuccess(null);
        loadUsers();
      }, 1000);
    } catch (err: any) {
      setProvisionError(err.message || 'Provisioning failed');
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.organization || u.org || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl font-sans-ui text-[#F4F3EE]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono-code uppercase tracking-widest text-[#00A99D]">
            Access & Directory
          </span>
          <h1 className="font-editorial text-3xl font-bold text-white mt-1">
            Enterprise User Directory
          </h1>
          <p className="text-xs text-[#87939B] font-mono-code mt-1">
            Manage authenticated architects, engineering consultants, and role-based policies.
          </p>
        </div>

        <button
          onClick={() => setIsProvisionOpen(true)}
          className="bg-[#00A99D] hover:bg-[#008B82] text-white px-4 py-2 rounded-lg text-xs font-mono-code flex items-center gap-2 self-start md:self-auto cursor-pointer shadow-sm transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Provision Enterprise Seat</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4 bg-[#20272D] border border-[#2A3744] p-3 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#87939B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, organization, or email..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#111C27] border border-[#2A3744] text-xs text-white focus:outline-none focus:border-[#00A99D] font-mono-code transition-colors"
          />
        </div>
        <div className="text-xs font-mono-code text-[#87939B]">
          Total: {filteredUsers.length} seats {loading ? '(Loading...)' : ''}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-[#20272D] border border-[#2A3744] rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs font-mono-code">
          <thead className="bg-[#111C27] text-[#87939B] uppercase border-b border-[#2A3744]">
            <tr>
              <th className="px-5 py-3">Architect / User</th>
              <th className="px-5 py-3">Enterprise Organization</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Designs Run</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A3744]/60 text-[#F4F3EE]">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-[#111C27]/60 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="text-white font-medium">{u.name}</div>
                  <div className="text-[10px] text-[#87939B]">{u.email}</div>
                </td>
                <td className="px-5 py-3.5">{u.organization || u.org || 'Helios Data Systems'}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] ${
                    u.role === 'admin'
                      ? 'bg-[#B87954]/20 text-[#B87954] border border-[#B87954]/40'
                      : 'bg-[#111C27] text-[#00A99D] border border-[#2A3744]'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-bold text-white">{u.designs_count ?? u.designs ?? 0}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-lg ${
                      (u.status || 'Active') === 'Active'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    <span>{u.status || 'Active'}</span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right space-x-2">
                  <button className="text-[11px] text-[#00A99D] hover:underline cursor-pointer">Edit</button>
                  <button className="text-[11px] text-[#87939B] hover:text-white cursor-pointer">Audit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Provision User Modal */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 bg-[#111C27]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#20272D] border border-[#2A3744] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsProvisionOpen(false)}
              className="absolute top-4 right-4 text-[#87939B] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-editorial text-2xl font-bold text-white mb-1">
              Provision Enterprise Seat
            </h3>
            <p className="text-xs font-mono-code text-[#87939B] mb-4">
              Create credentials for an authorized architectural or MEP team member.
            </p>

            {provisionError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-mono-code">
                {provisionError}
              </div>
            )}
            {provisionSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-mono-code">
                {provisionSuccess}
              </div>
            )}

            <form onSubmit={handleProvisionUser} className="space-y-3 font-mono-code text-xs">
              <div>
                <label className="block text-[#87939B] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={provisionName}
                  onChange={(e) => setProvisionName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3 py-2 rounded-lg bg-[#111C27] border border-[#2A3744] text-white focus:outline-none focus:border-[#00A99D]"
                />
              </div>

              <div>
                <label className="block text-[#87939B] mb-1">Enterprise Email</label>
                <input
                  type="email"
                  required
                  value={provisionEmail}
                  onChange={(e) => setProvisionEmail(e.target.value)}
                  placeholder="e.g. s.jenkins@colopartners.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#111C27] border border-[#2A3744] text-white focus:outline-none focus:border-[#00A99D]"
                />
              </div>

              <div>
                <label className="block text-[#87939B] mb-1">Organization</label>
                <input
                  type="text"
                  value={provisionOrg}
                  onChange={(e) => setProvisionOrg(e.target.value)}
                  placeholder="e.g. Helios Data Systems"
                  className="w-full px-3 py-2 rounded-lg bg-[#111C27] border border-[#2A3744] text-white focus:outline-none focus:border-[#00A99D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#87939B] mb-1">Role</label>
                  <select
                    value={provisionRole}
                    onChange={(e) => setProvisionRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111C27] border border-[#2A3744] text-white focus:outline-none focus:border-[#00A99D]"
                  >
                    <option value="architect">Lead Architect</option>
                    <option value="engineer">MEP Engineer</option>
                    <option value="admin">Platform Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#87939B] mb-1">Temporary Password</label>
                  <input
                    type="text"
                    required
                    value={provisionPassword}
                    onChange={(e) => setProvisionPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111C27] border border-[#2A3744] text-white focus:outline-none focus:border-[#00A99D]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProvisionOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#111C27] text-[#87939B] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#00A99D] hover:bg-[#008B82] text-white font-bold"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
