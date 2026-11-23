import React, { useState } from 'react';
import { Project } from '../types';
import {
  Server, Plus, ArrowRight, Box, PenTool, Download,
  Building, CheckCircle2, X, Compass, Shield
} from 'lucide-react';

interface MyProjectsPageProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project) => void;
  onCreateProject: (data: Partial<Project>) => void;
  onNavigate: (tabId: string) => void;
  onDownloadReport: (projectId: string) => void;
}

export const MyProjectsPage: React.FC<MyProjectsPageProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onNavigate,
  onDownloadReport,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [tier, setTier] = useState('Tier III');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateProject({
      name,
      client: client || 'Enterprise Cloud Client',
      location: location || 'Frankfurt Campus / Pod A',
      target_tier: tier,
      description: 'AI Workload High-Density Mission Critical Facility',
    });
    setName('');
    setClient('');
    setLocation('');
    setShowModal(false);
  };

  const sampleImages = [
    '/images/p2_view_a_elevated_overview_master.png',
    '/images/p2_view_b_server_room_master.png',
    '/images/p2_view_c_technical_area_master.png',
    '/images/p1_view_b_master.png',
  ];

  return (
    <div className="space-y-8 pb-16 font-sans text-warm-ivory">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-electric-teal font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            Enterprise Architecture Portfolio
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-warm-ivory mt-1">
            Data Center Facilities Ledger
          </h1>
          <p className="text-xs text-muted-silver mt-1">
            Manage your mission-critical white spaces, tier designations, and active architectural design packages.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary-teal flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,214,201,0.25)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Facility Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj, idx) => {
          const isActive = activeProject?.id === proj.id;
          const imgUrl = sampleImages[idx % sampleImages.length];

          return (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj)}
              className={`rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between group shadow-xl bg-graphite/80 backdrop-blur-md ${
                isActive
                  ? 'border-electric-teal ring-2 ring-electric-teal/30 shadow-[0_0_25px_rgba(0,214,201,0.2)]'
                  : 'border-white/10 hover:border-electric-teal/40'
              }`}
            >
              {/* Architectural Image Card Header */}
              <div className="h-48 relative overflow-hidden bg-obsidian">
                <img
                  src={imgUrl}
                  alt={proj.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/p2_output3_master_render.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-transparent opacity-90" />

                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-obsidian/85 text-electric-teal border border-electric-teal/30 font-bold backdrop-blur-md">
                    {proj.target_tier || 'Tier III'}
                  </span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-warm-ivory">
                  <div className="text-[10px] font-mono text-electric-teal uppercase tracking-wider font-semibold">
                    {proj.location || 'Frankfurt Campus'}
                  </div>
                  <h3 className="font-serif text-lg font-bold truncate">
                    {proj.name}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-muted-silver line-clamp-2 leading-relaxed">
                  {proj.description || 'Enterprise Tier-classified server hall with automated hot-aisle containment and N+1 cooling redundancy.'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-3 border-t border-white/10 text-muted-silver">
                  <div>
                    <span className="text-muted-silver/60 block text-[10px]">CLIENT</span>
                    <span className="text-warm-ivory font-medium truncate block">{proj.client || 'Enterprise'}</span>
                  </div>
                  <div>
                    <span className="text-muted-silver/60 block text-[10px]">STATUS</span>
                    <span className="text-controlled-emerald font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-controlled-emerald animate-pulse" />
                      {proj.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProject(proj);
                      onNavigate('generate');
                    }}
                    className="text-xs font-mono text-electric-teal hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>Launch Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadReport(proj.id);
                    }}
                    className="p-1.5 rounded-lg text-muted-silver hover:text-warm-ivory hover:bg-white/10 transition-colors cursor-pointer"
                    title="Export Architectural Dossier (PDF)"
                  >
                    <Download className="w-4 h-4 text-electric-teal" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-graphite border border-white/15 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 text-warm-ivory">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono text-electric-teal uppercase tracking-wider font-semibold">
                  New Mission Critical White Space
                </span>
                <h3 className="font-serif text-2xl font-bold text-warm-ivory mt-0.5">
                  Initialize Facility Project
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-muted-silver hover:text-warm-ivory hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-muted-silver block mb-1">
                  Facility Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Helios - High Density Pod 01"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-titanium-charcoal text-sm text-warm-ivory focus:outline-none focus:border-electric-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-muted-silver block mb-1">
                    Client Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Helios Data Systems"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-titanium-charcoal text-sm text-warm-ivory focus:outline-none focus:border-electric-teal"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-silver block mb-1">
                    Site Location / Campus
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Frankfurt Campus"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-titanium-charcoal text-sm text-warm-ivory focus:outline-none focus:border-electric-teal"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-muted-silver block mb-1">
                  Target Uptime Institute Tier Standard
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-titanium-charcoal text-sm text-warm-ivory focus:outline-none focus:border-electric-teal cursor-pointer"
                >
                  <option value="Tier I">Tier I — Basic Capacity (99.671% Uptime)</option>
                  <option value="Tier II">Tier II — Redundant Capacity Components (99.741% Uptime)</option>
                  <option value="Tier III">Tier III — Concurrently Maintainable (99.982% Uptime)</option>
                  <option value="Tier IV">Tier IV — Fault Tolerant Architecture (99.995% Uptime)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-muted-silver hover:text-warm-ivory text-xs font-mono hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-teal px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(0,214,201,0.25)]"
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

export default MyProjectsPage;
