import React from 'react';
import {
  ShieldAlert, Activity, Users, FolderGit2, Server, BarChart3,
  Sliders, LogOut, ArrowLeft, Terminal, AlertTriangle, KeyRound, Shield
} from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onNavigateTab,
  onExitAdmin,
  children,
}) => {
  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Platform Overview', icon: Activity },
    { id: 'admin-users', label: 'User Directory', icon: Users },
    { id: 'admin-projects', label: 'Project Ledger', icon: FolderGit2 },
    { id: 'admin-system', label: 'System Health & Colab', icon: Server },
    { id: 'admin-analytics', label: 'Compute Usage', icon: BarChart3 },
    { id: 'admin-settings', label: 'Administration Settings', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#07090D] text-[#F4F7F8] font-sans-ui flex flex-col selection:bg-[#00E5CC] selection:text-[#07090D]">
      {/* Top Admin Security Bar */}
      <header className="bg-[#101720] border-b border-[#C9D3DB]/12 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00E5CC]/15 border border-[#00E5CC]/30 text-[#00E5CC] flex items-center justify-center font-bold text-xs shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-mono-code text-xs font-bold tracking-wider text-[#F4F7F8] uppercase">
                RackVision AI &bull; Command Control Center
              </div>
              <div className="text-[10px] text-[#C9D3DB]/60 font-mono-code">
                Cluster: ap-south-1 &bull; Scope: Global Fleet Orchestration
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#00B894]/15 border border-[#00B894]/30 text-[11px] font-mono-code text-[#00B894]">
            <span className="w-2 h-2 rounded-full bg-[#00B894] animate-pulse"></span>
            <span>Cluster Healthy (8 GPU Nodes Active)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExitAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#C9D3DB] hover:text-[#00E5CC] hover:bg-[#111E2A] transition-colors font-mono-code border border-[#C9D3DB]/20 text-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#00E5CC]" />
            <span>Return to User Studio</span>
          </button>
        </div>
      </header>

      {/* Security Disclaimer Banner */}
      <div className="bg-[#111E2A] border-b border-[#00E5CC]/20 px-6 py-2 text-xs font-mono-code text-[#C9D3DB] flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#00E5CC] shrink-0" />
        <span>
          <strong className="text-[#00E5CC]">ADMINISTRATIVE AUTHORIZATION ACTIVE:</strong> Supervisory control session established. Server-side role-based access control (RBAC) token verified.
        </span>
      </div>

      {/* Main Admin Workspace (Sidebar + Content) */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Dedicated Admin Sidebar */}
        <aside className="w-full md:w-64 bg-[#101720] border-r border-[#C9D3DB]/12 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono-code uppercase tracking-widest text-[#C9D3DB]/50 font-semibold">
              Fleet Management
            </div>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigateTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono-code transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#111E2A] text-[#00E5CC] border border-[#00E5CC]/30 font-bold shadow-xs'
                      : 'text-[#C9D3DB]/70 hover:bg-[#111E2A]/60 hover:text-[#F4F7F8]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00E5CC]' : 'text-[#C9D3DB]/50'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-[#07090D] rounded-xl border border-[#C9D3DB]/10 text-[10px] font-mono-code text-[#C9D3DB]/60 space-y-1">
            <div className="text-[#00E5CC] font-bold">SECURITY GATEWAY</div>
            <div>Audit logging: Active</div>
            <div>TLS 1.3 Transport: Enforced</div>
          </div>
        </aside>

        {/* Admin Main Viewport */}
        <main className="flex-1 bg-[#07090D] p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
