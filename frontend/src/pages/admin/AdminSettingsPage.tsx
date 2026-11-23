import React, { useState } from 'react';
import { Sliders, Save, ShieldAlert, Key, Check } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [tunnelUrl, setTunnelUrl] = useState('https://interest-communicate-sun-gsm.trycloudflare.com');
  const [authToken, setAuthToken] = useState('rv_prod_9941_alpha_key');
  const [timeout, setTimeoutVal] = useState('45');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans-ui text-[#F4F3EE]">
      <div>
        <span className="text-[11px] font-mono-code uppercase tracking-widest text-[#00A99D]">
          Supervisory Configuration
        </span>
        <h1 className="font-editorial text-3xl font-bold text-white mt-1">
          Platform Administration Settings
        </h1>
        <p className="text-xs text-[#87939B] font-mono-code mt-1">
          Manage system thresholds, default Colab tunnel URLs, and security rate limits.
        </p>
      </div>

      <div className="bg-[#20272D] border border-[#2A3744] rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-mono-code uppercase tracking-wider text-[#87939B] mb-2">
              Default Remote Colab Tunnel Endpoint
            </label>
            <input
              type="text"
              value={tunnelUrl}
              onChange={(e) => setTunnelUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#111C27] border border-[#2A3744] text-xs text-white focus:outline-none focus:border-[#00A99D] font-mono-code transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono-code uppercase tracking-wider text-[#87939B] mb-2">
              Colab Tunnel Shared Secret Token
            </label>
            <input
              type="password"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#111C27] border border-[#2A3744] text-xs text-[#B87954] focus:outline-none focus:border-[#00A99D] font-mono-code transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-code uppercase tracking-wider text-[#87939B] mb-2">
                Inference Timeout (Seconds)
              </label>
              <input
                type="number"
                value={timeout}
                onChange={(e) => setTimeoutVal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#111C27] border border-[#2A3744] text-xs text-white focus:outline-none focus:border-[#00A99D] font-mono-code transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-code uppercase tracking-wider text-[#87939B] mb-2">
                Max Concurrent Inferences
              </label>
              <input
                type="number"
                defaultValue={4}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#111C27] border border-[#2A3744] text-xs text-white focus:outline-none focus:border-[#00A99D] font-mono-code transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#00A99D] hover:bg-[#008B82] text-white px-5 py-2.5 rounded-lg text-xs font-mono-code font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saved ? 'Settings Staged' : 'Save System Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
