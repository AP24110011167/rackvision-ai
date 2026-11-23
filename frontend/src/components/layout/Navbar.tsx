import React, { useState } from 'react';
import { Project } from '../../types';
import {
  Compass, Cpu, Download, Plus, Sparkles, Building2,
  ChevronDown, User, LogOut, KeyRound, Home, Bell, Shield,
  Activity, CheckCircle2, AlertCircle
} from 'lucide-react';

interface NavbarProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (proj: Project) => void;
  aiStatus: { cuda_available: boolean; recommended_mode: string; message?: string } | null;
  onNewProject: () => void;
  onDownloadReport: () => void;
  onNavigateToHome?: () => void;
  onNavigateToAdmin?: () => void;
  onSignOut?: () => void;
  currentTabName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  activeProject,
  onSelectProject,
  aiStatus,
  onNewProject,
  onDownloadReport,
  onNavigateToHome,
  onNavigateToAdmin,
  onSignOut,
  currentTabName = 'Command Workspace',
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Retrieve user if stored
  const storedUserRaw = typeof window !== 'undefined' ? localStorage.getItem('rv_user') : null;
  const user = storedUserRaw ? JSON.parse(storedUserRaw) : { name: 'Elena Rostova', role: 'Lead Architect', organization: 'Helios Data Systems' };

  return (
    <header className="h-16 border-b border-[#C9D3DB]/12 bg-[#0B0F15]/95 backdrop-blur-xl px-6 flex items-center justify-between z-40 sticky top-0 font-sans-ui text-[#F4F7F8]">
      {/* Left: Breadcrumbs & Project Switcher */}
      <div className="flex items-center gap-4">
        {/* Breadcrumb path */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono-code text-[#C9D3DB]/60">
          <span className="uppercase tracking-wider">PROJECT NEXUS</span>
          <span>/</span>
          <span className="text-[#F4F7F8] font-semibold">{activeProject?.name || 'Helios DC'}</span>
          <span>/</span>
          <span className="text-[#00E5CC] font-bold">{currentTabName}</span>
        </div>

        <div className="h-4 w-px bg-[#C9D3DB]/15 hidden lg:block"></div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#00E5CC]" />
          <select
            value={activeProject?.id || ''}
            onChange={(e) => {
              const found = projects.find((p) => p.id === e.target.value);
              if (found) onSelectProject(found);
            }}
            className="bg-[#101720] text-[#F4F7F8] border border-[#C9D3DB]/20 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#00E5CC] cursor-pointer shadow-inner"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#101720] text-[#F4F7F8]">
                {p.name} &bull; {p.target_tier || 'Tier III'}
              </option>
            ))}
          </select>

          <button
            onClick={onNewProject}
            className="p-1.5 rounded-lg bg-[#101720] hover:bg-[#111E2A] text-[#C9D3DB] hover:text-[#00E5CC] transition-colors border border-[#C9D3DB]/20 cursor-pointer"
            title="Create New Data Center Project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Telemetry, Notifications & Profile Menu */}
      <div className="flex items-center gap-3">
        {/* GPU / AI Inference Engine Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#101720] border border-[#C9D3DB]/15 text-[11px] font-mono-code shadow-xs">
          <Cpu className="w-3.5 h-3.5 text-[#00E5CC]" />
          {aiStatus?.cuda_available ? (
            <span className="text-[#00B894] flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00B894] animate-pulse" />
              <span>COLAB SDXL ONLINE</span>
            </span>
          ) : (
            <span className="text-[#62DDF5] flex items-center gap-1.5 font-medium" title={aiStatus?.message}>
              <span className="w-2 h-2 rounded-full bg-[#00E5CC]" />
              <span>HYBRID PBR READY</span>
            </span>
          )}
        </div>

        {/* Quick Report Download */}
        <button
          onClick={onDownloadReport}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#101720] hover:bg-[#111E2A] text-xs font-medium text-[#C9D3DB] hover:text-[#00E5CC] border border-[#C9D3DB]/20 transition-all cursor-pointer shadow-xs"
          title="Download Comprehensive Engineering PDF"
        >
          <Download className="w-3.5 h-3.5 text-[#00E5CC]" />
          <span>Export Dossier</span>
        </button>

        {/* Notifications Icon with Indicator */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-[#101720] hover:bg-[#111E2A] text-[#C9D3DB] hover:text-[#00E5CC] border border-[#C9D3DB]/20 transition-colors cursor-pointer relative"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00E5CC]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#101720] border border-[#00E5CC]/30 shadow-2xl py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-[#C9D3DB]/10 flex items-center justify-between">
                <span className="font-semibold text-[#F4F7F8]">Telemetry Alerts</span>
                <span className="text-[10px] font-mono-code text-[#00E5CC]">3 ACTIVE</span>
              </div>
              <div className="py-1">
                <div className="px-4 py-2 hover:bg-[#111E2A] transition-colors border-b border-[#C9D3DB]/5">
                  <div className="text-[#00E5CC] font-mono-code text-[11px] font-bold">CONTROLNET COORDINATES LOCKED</div>
                  <div className="text-[11px] text-[#C9D3DB]/70">P2 Ground truth 12 racks mapped to ±0.0mm.</div>
                </div>
                <div className="px-4 py-2 hover:bg-[#111E2A] transition-colors border-b border-[#C9D3DB]/5">
                  <div className="text-[#62DDF5] font-mono-code text-[11px] font-bold">ASHRAE TC 9.9 PASS</div>
                  <div className="text-[11px] text-[#C9D3DB]/70">Class A1 thermal compliance verified at 23.4°C inlet.</div>
                </div>
                <div className="px-4 py-2 hover:bg-[#111E2A] transition-colors">
                  <div className="text-[#00B894] font-mono-code text-[11px] font-bold">BOM MATERIAL LEDGER READY</div>
                  <div className="text-[11px] text-[#C9D3DB]/70">Itemized 10-stage equipment cost calculated.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Public Showcase / Home Link */}
        {onNavigateToHome && (
          <button
            onClick={onNavigateToHome}
            className="p-2 rounded-lg bg-[#101720] hover:bg-[#111E2A] text-[#C9D3DB] hover:text-[#00E5CC] border border-[#C9D3DB]/20 transition-colors cursor-pointer"
            title="Return to Presentation Landing Page"
          >
            <Home className="w-4 h-4" />
          </button>
        )}

        {/* Admin Direct Switcher */}
        {onNavigateToAdmin && (
          <button
            onClick={onNavigateToAdmin}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-code text-[#C9D3DB] hover:text-[#00E5CC] border border-[#C9D3DB]/20 bg-[#101720] hover:border-[#00E5CC]/40 transition-all cursor-pointer"
            title="Enterprise Management Console"
          >
            <Shield className="w-3.5 h-3.5 text-[#00E5CC]" />
            <span>Admin</span>
          </button>
        )}

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 pl-2 pr-1.5 py-1 rounded-lg bg-[#101720] hover:bg-[#111E2A] transition-colors cursor-pointer border border-[#C9D3DB]/20"
          >
            <div className="w-7 h-7 rounded-full bg-[#00E5CC]/15 text-[#00E5CC] border border-[#00E5CC]/30 flex items-center justify-center font-bold text-xs shadow-xs">
              {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden md:block text-left text-xs">
              <div className="font-semibold text-[#F4F7F8] leading-tight">{user.name}</div>
              <div className="text-[10px] text-[#C9D3DB]/60 -mt-0.5 font-mono-code">{user.role || 'Lead Architect'}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#C9D3DB]/60" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl bg-[#101720] border border-[#00E5CC]/30 shadow-2xl py-1 z-50 text-xs font-sans-ui">
              <div className="px-4 py-2.5 border-b border-[#C9D3DB]/10 bg-[#0B0F15]">
                <p className="font-semibold text-[#F4F7F8]">{user.name}</p>
                <p className="text-[11px] text-[#C9D3DB]/60 font-mono-code">{user.email || 'architect@helios.dc'}</p>
                <p className="text-[10px] text-[#00E5CC] font-mono-code mt-0.5">{user.organization || 'Helios Data Systems'}</p>
              </div>

              <div className="py-1">
                {onNavigateToAdmin && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigateToAdmin();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-[#C9D3DB] hover:bg-[#111E2A] hover:text-[#00E5CC] cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-[#00E5CC]" />
                    <span>Admin Control Center</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onNavigateToHome) onNavigateToHome();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-[#C9D3DB] hover:bg-[#111E2A] hover:text-[#F4F7F8] cursor-pointer"
                >
                  <Home className="w-4 h-4 text-[#C9D3DB]" />
                  <span>Public Showcase</span>
                </button>
              </div>

              {onSignOut && (
                <div className="border-t border-[#C9D3DB]/10 py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-red-400 hover:bg-[#111E2A] cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
