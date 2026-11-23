import React, { useState } from 'react';
import { Project, AnalyticsData } from '../types';
import {
  FolderGit2,
  Box,
  Image as GalleryIcon,
  DollarSign,
  Activity,
  Plus,
  ArrowUpRight,
  Zap,
  Server,
  Layers,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface DashboardPageProps {
  projects: Project[];
  activeProject: Project | null;
  analytics: AnalyticsData | null;
  designsCount: number;
  materialsTotalCost: number;
  onSelectProject: (p: Project) => void;
  onCreateProject: (data: Partial<Project>) => void;
  onNavigate: (tabId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  projects,
  activeProject,
  analytics,
  designsCount,
  materialsTotalCost,
  onSelectProject,
  onCreateProject,
  onNavigate
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newTier, setNewTier] = useState('Tier III');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateProject({
      name: newName,
      client: newClient || 'Enterprise Cloud Client',
      target_tier: newTier,
      description: 'Standard High-Density Data Center Facility'
    });
    setNewName('');
    setNewClient('');
    setShowCreateModal(false);
  };

  // Mock Power Telemetry Data for Area Chart
  const powerHourlyData = [
    { time: '00:00', itLoad: 175, facilityTotal: 215 },
    { time: '04:00', itLoad: 168, facilityTotal: 206 },
    { time: '08:00', itLoad: 195, facilityTotal: 240 },
    { time: '12:00', itLoad: 230, facilityTotal: 282 },
    { time: '16:00', itLoad: 245, facilityTotal: 301 },
    { time: '20:00', itLoad: 210, facilityTotal: 258 },
    { time: '23:59', itLoad: 185, facilityTotal: 227 },
  ];

  // Rack Distribution data for Bar Chart
  const rackTypeData = [
    { name: 'AI Compute', count: 12, power: 144 },
    { name: 'Storage SAN', count: 4, power: 28 },
    { name: 'Spine/Leaf', count: 2, power: 14 },
    { name: 'Edge Gateway', count: 2, power: 9 },
  ];

  // Space Breakdown for Donut Chart
  const spaceData = [
    { name: 'Cold Aisles', value: 35, color: '#00F0FF' },
    { name: 'Server Footprint', value: 30, color: '#8B5CF6' },
    { name: 'Hot Aisles', value: 20, color: '#EF4444' },
    { name: 'Perimeter Clearance', value: 15, color: '#64748B' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Project Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time infrastructure metrics and project portfolio for {activeProject?.name || 'All Facilities'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>NEW PROJECT</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Projects */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Facilities</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{projects.length}</div>
          <div className="text-xs text-cyan-400/80 mt-2 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Pod Pod-A Deployment</span>
          </div>
        </div>

        {/* Card 2: Generated Designs */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase">AI Design Renders</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <GalleryIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{designsCount}</div>
          <div className="text-xs text-purple-400/80 mt-2 flex items-center gap-1 font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>ControlNet Canny Latents</span>
          </div>
        </div>

        {/* Card 3: IT Power Demand */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase">Total IT Power</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {analytics?.total_it_power_kw ? `${analytics.total_it_power_kw} kW` : '195.0 kW'}
          </div>
          <div className="text-xs text-emerald-400/80 mt-2 flex items-center gap-1 font-mono">
            <Activity className="w-3.5 h-3.5" />
            <span>Target PUE: {analytics?.estimated_pue || '1.22'}</span>
          </div>
        </div>

        {/* Card 4: Estimated Material Cost */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase">Estimated Capex (BOM)</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            ${materialsTotalCost ? materialsTotalCost.toLocaleString() : '842,450'}
          </div>
          <div className="text-xs text-amber-400/80 mt-2 flex items-center gap-1 font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span>Preliminary Heuristic Estimate</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Power Telemetry Timeline */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">IT Power vs Facility Load (24h Profile)</h3>
              <p className="text-xs text-slate-400">Thermal cooling & IT demand in Kilowatts (kW)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-slate-300">IT Load</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-slate-300">Total Facility</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={powerHourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} fontStyle="mono" />
                <YAxis stroke="#64748B" fontSize={11} fontStyle="mono" unit=" kW" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#11131F', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#E2E8F0', fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="facilityTotal" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#purpleGrad)" />
                <Area type="monotone" dataKey="itLoad" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#cyanGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Floor Space Utilization Donut */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">White Space Allocation</h3>
            <p className="text-xs text-slate-400">Total area: {analytics?.total_floor_area_sqm || 352} m²</p>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spaceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {spaceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#11131F', borderColor: '#334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {spaceData.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-300 truncate">{s.name} ({s.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rack Distribution & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rack Distribution Bar */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Rack Distribution by Workload</h3>
              <p className="text-xs text-slate-400">Allocated power and server chassis count</p>
            </div>
            <button
              onClick={() => onNavigate('simulator')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View in 3D</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rackTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} fontStyle="mono" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#11131F', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="power" fill="#00F0FF" radius={[4, 4, 0, 0]} name="Power (kW)" />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Rack Units" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects List */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Active Projects Portfolio</h3>
            <span className="text-xs font-mono text-slate-400">{projects.length} Saved</span>
          </div>

          <div className="space-y-3">
            {projects.map((p) => {
              const isSelected = activeProject?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                      : 'bg-white/5 border-white/5 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <Server className="w-4 h-4 text-cyan-400" />
                      <span>{p.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-3 font-mono">
                      <span>{p.client || 'Enterprise'}</span>
                      <span>•</span>
                      <span>{p.target_tier || 'Tier III'}</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {p.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#11131F] border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create New Data Center Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-400 font-mono text-xs mb-1">Project / Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Titan Cloud Pod B"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#0A0B10] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs mb-1">Client / Operator</label>
                <input
                  type="text"
                  placeholder="e.g. Global Distributed Compute Inc"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full bg-[#0A0B10] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs mb-1">Uptime Institute Target Tier</label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value)}
                  className="w-full bg-[#0A0B10] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Tier I">Tier I (Basic Non-Redundant)</option>
                  <option value="Tier II">Tier II (Redundant Capacity)</option>
                  <option value="Tier III">Tier III (Concurrently Maintainable)</option>
                  <option value="Tier IV">Tier IV (Fault Tolerant)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wide"
                >
                  Create Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
