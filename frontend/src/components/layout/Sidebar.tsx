import React, { useState } from 'react';
import {
  Compass, FolderGit2, PenTool, Scan, Wand2,
  Image as GalleryIcon, Box, ClipboardList, HardHat,
  BarChart3, Sliders, FileText, Settings as SettingsIcon,
  ChevronLeft, ChevronRight, MessageSquare, Thermometer,
  Shield, KeyRound
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  onNavigateToAdmin?: () => void;
}

export interface NavGroup {
  groupName: string;
  items: {
    id: string;
    label: string;
    icon: any;
    badge?: string;
  }[];
}

export const navigationGroups: NavGroup[] = [
  {
    groupName: 'WORKSPACE',
    items: [
      { id: 'overview', label: 'Overview', icon: Compass, badge: 'Brief' },
      { id: 'projects', label: 'My Projects', icon: FolderGit2 },
    ],
  },
  {
    groupName: 'DESIGN STUDIO',
    items: [
      { id: 'sketch', label: 'Sketch Studio', icon: PenTool, badge: 'Draft' },
      { id: 'intelligence', label: 'Sketch Intelligence', icon: Scan, badge: 'CV' },
      { id: 'generate', label: 'AI Design Generator', icon: Wand2, badge: '3-Output' },
      { id: 'gallery', label: 'Design Gallery', icon: GalleryIcon },
      { id: 'copilot', label: 'AI Design Copilot', icon: MessageSquare, badge: 'Advisor' },
    ],
  },
  {
    groupName: 'ENGINEERING',
    items: [
      { id: 'simulator', label: '3D Simulator', icon: Box, badge: 'WebGL' },
      { id: 'thermal', label: 'Thermal Simulation', icon: Thermometer, badge: 'CFD' },
      { id: 'optimizer', label: 'Design Optimizer', icon: Sliders, badge: 'ASHRAE' },
    ],
  },
  {
    groupName: 'DELIVERY',
    items: [
      { id: 'materials', label: 'Material Planner', icon: ClipboardList, badge: 'BOM' },
      { id: 'construction', label: 'Construction Guide', icon: HardHat, badge: '10-Stage' },
      { id: 'reports', label: 'Reports', icon: FileText, badge: 'PDF' },
    ],
  },
  {
    groupName: 'MANAGEMENT',
    items: [
      { id: 'analytics', label: 'Data Center Analytics', icon: BarChart3, badge: 'PUE' },
      { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onNavigateToAdmin }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative z-30 h-screen bg-[#080B0F]/90 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 font-sans-ui text-[#F4F7F8] shrink-0 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 bg-transparent">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#101720] border border-[#00E5CC]/30 text-[#00E5CC] flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4 text-[#00E5CC]" />
            </div>
            <div>
              <span className="font-editorial text-lg font-bold tracking-tight text-[#F4F7F8]">
                RackVision<span className="text-[#00E5CC] font-normal italic">.ai</span>
              </span>
              <div className="text-[9px] uppercase tracking-widest text-[#C9D3DB]/60 -mt-1 font-mono-code">
                Project Nexus
              </div>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg bg-[#101720] border border-[#00E5CC]/30 text-[#00E5CC] flex items-center justify-center">
            <Compass className="w-4 h-4 text-[#00E5CC]" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-[#C9D3DB]/60 hover:text-[#00E5CC] hover:bg-[#101720] transition-colors cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups List */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
        {navigationGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-mono-code uppercase tracking-widest text-[#C9D3DB]/40 font-semibold">
                {group.groupName}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative cursor-pointer ${
                    isActive
                      ? 'bg-[#101720] text-[#00E5CC] font-semibold border border-[#00E5CC]/30 shadow-[0_0_15px_rgba(0,229,204,0.1)]'
                      : 'text-[#C9D3DB] hover:text-[#00E5CC] hover:bg-[#101720]/60'
                  }`}
                >
                  {/* Active highlight bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#00E5CC] rounded-r shadow-[0_0_8px_#00E5CC]" />
                  )}

                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-[#00E5CC]' : 'text-[#C9D3DB]/60 group-hover:text-[#00E5CC]'
                    }`}
                  />

                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between text-left">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono-code px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-[#00E5CC]/15 text-[#00E5CC] border border-[#00E5CC]/30'
                              : 'bg-[#101720] text-[#C9D3DB]/60 border border-[#C9D3DB]/15'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Info & Admin link */}
      {!collapsed && (
        <div className="p-3 border-t border-[#C9D3DB]/12 bg-[#0B0F15] text-[11px] font-mono-code text-[#C9D3DB]/70 space-y-2">
          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#101720] border border-[#C9D3DB]/15 text-[#C9D3DB] hover:text-[#00E5CC] hover:border-[#00E5CC]/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#00E5CC]" />
                <span className="font-sans-ui font-medium text-xs">Admin Console</span>
              </div>
              <span className="text-[9px] text-[#00E5CC] font-bold bg-[#00E5CC]/15 px-1.5 py-0.5 rounded">RBAC</span>
            </button>
          )}

          <div className="flex items-center justify-between text-[10px] px-1 text-[#C9D3DB]/60">
            <span>Engine: Hybrid PBR + SDXL</span>
            <span className="text-[#00B894] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B894] animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
