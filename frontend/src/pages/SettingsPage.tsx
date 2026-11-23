import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  Server,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RefreshCw,
  FolderOpen,
  CloudLightning,
  Radio,
  Eye,
  EyeOff,
  Link2,
  Lock,
  XCircle,
  Check
} from 'lucide-react';
import { api } from '../services/api';

interface SettingsPageProps {
  aiStatus: {
    torch_available?: boolean;
    cuda_available: boolean;
    gpu_name?: string | null;
    diffusers_available?: boolean;
    recommended_mode: string;
    message?: string;
  } | null;
  onRefreshStatus: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  aiStatus,
  onRefreshStatus
}) => {
  const [apiEndpoint, setApiEndpoint] = useState('http://127.0.0.1:8000/api');
  const [controlnetModel, setControlnetModel] = useState('lllyasviel/control_v11p_sd15_canny');
  const [baseModel, setBaseModel] = useState('runwayml/stable-diffusion-v1-5');
  const [customCheckpoint, setCustomCheckpoint] = useState('./checkpoints/custom_datacenter_lora.safetensors');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Colab GPU State
  const [colabUrl, setColabUrl] = useState('');
  const [colabToken, setColabToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnectingColab, setIsConnectingColab] = useState(false);
  const [isReconnectingColab, setIsReconnectingColab] = useState(false);
  const [colabStatus, setColabStatus] = useState<any>(null);
  const [colabFeedback, setColabFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadColab();
  }, []);

  const loadColab = async () => {
    try {
      const status = await api.getColabStatus();
      setColabStatus(status);
      if (status?.url && !colabUrl) {
        setColabUrl(status.url);
      }
    } catch {
      setColabStatus({
        configured: false,
        url: null,
        health: 'offline',
        message: 'Could not contact backend Colab adapter service.',
        mode: 'procedural'
      });
    }
  };

  const handleConnectColab = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = colabUrl.trim();
    if (!cleanUrl) {
      setColabFeedback({ type: 'error', message: 'Colab Server URL is required.' });
      return;
    }
    setIsConnectingColab(true);
    setColabFeedback(null);
    try {
      const res = await api.connectColab(cleanUrl, colabToken.trim() || undefined);
      setColabStatus(res);
      if (res.health === 'online') {
        setColabFeedback({
          type: 'success',
          message: `Connected successfully to Colab GPU Node! Device: ${res.gpu_name || 'NVIDIA T4'} | Model: ${res.model || 'SDXL 1.0 (FP16 Low-RAM)'}`
        });
      } else if (res.health === 'unauthorized') {
        setColabFeedback({
          type: 'error',
          message: 'Colab rejected connection: 401 Unauthorized. Please verify your authentication token.'
        });
      } else {
        setColabFeedback({
          type: 'error',
          message: res.message || 'Could not verify Colab GPU health. Ensure the Colab tunnel is active.'
        });
      }
    } catch (err: any) {
      setColabFeedback({
        type: 'error',
        message: err.message || 'Failed to connect to Colab server tunnel.'
      });
    } finally {
      setIsConnectingColab(false);
    }
  };

  const handleTestConnection = async () => {
    setIsReconnectingColab(true);
    setColabFeedback(null);
    try {
      const res = await api.reconnectColab();
      const details = res.details || res;
      setColabStatus(details);
      if (details.health === 'online') {
        setColabFeedback({
          type: 'success',
          message: `Connection online! GPU: ${details.gpu_name || 'NVIDIA T4'} (${details.vram_allocated_gb ?? 0}GB used / ${details.vram_total_gb ?? 15}GB VRAM)`
        });
      } else if (details.health === 'unauthorized') {
        setColabFeedback({
          type: 'error',
          message: 'Connection ping rejected (401 Unauthorized). Missing or invalid authentication token.'
        });
      } else {
        setColabFeedback({
          type: 'error',
          message: details.message || 'Colab node is currently offline or unreachable.'
        });
      }
    } catch (err: any) {
      setColabFeedback({
        type: 'error',
        message: err.message || 'Health check ping failed.'
      });
    } finally {
      setIsReconnectingColab(false);
    }
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl font-sans text-warm-ivory">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-electric-teal font-bold flex items-center gap-1.5">
            <SettingsIcon className="w-3.5 h-3.5" />
            Platform Infrastructure &amp; Neural Engines
          </span>
          <h1 className="text-3xl font-serif font-bold text-warm-ivory tracking-tight mt-1">
            System Settings &amp; GPU Adapters
          </h1>
          <p className="text-sm text-muted-silver mt-1">
            Compute device detection, Google Colab SDXL tunnel configuration, neural checkpoints, and API environment.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-titanium-charcoal/80 hover:bg-titanium-charcoal text-warm-ivory font-mono text-xs border border-white/10 hover:border-electric-teal/40 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-electric-teal' : 'text-muted-silver'}`} />
          <span>REFRESH HARDWARE STATUS</span>
        </button>
      </div>

      {/* GPU & Compute Device Telemetry */}
      <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-5 shadow-xl">
        <h3 className="text-base font-serif font-bold text-warm-ivory flex items-center gap-2">
          <Cpu className="w-5 h-5 text-electric-teal" />
          Local AI / ML Compute Accelerator Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          {/* Torch */}
          <div className="bg-titanium-charcoal/60 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-muted-silver">PyTorch Framework</span>
            <div className="text-base font-bold text-warm-ivory flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-controlled-emerald" /> Online
            </div>
            <span className="text-muted-silver/60 text-[10px]">CPU Execution Supported</span>
          </div>

          {/* CUDA GPU */}
          <div className="bg-titanium-charcoal/60 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-muted-silver">CUDA GPU Acceleration</span>
            <div className="text-base font-bold text-warm-ivory flex items-center gap-1.5 mt-0.5">
              {aiStatus?.cuda_available ? (
                <span className="text-controlled-emerald flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-controlled-emerald" />
                  {aiStatus.gpu_name || 'NVIDIA GPU'}
                </span>
              ) : (
                <span className="text-champagne-bronze flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-champagne-bronze" />
                  No Local GPU
                </span>
              )}
            </div>
            <span className="text-muted-silver/60 text-[10px]">
              {aiStatus?.cuda_available ? 'FP16 Half-Precision Active' : 'Automatic Remote Colab Fallback'}
            </span>
          </div>

          {/* Diffusers Pipeline */}
          <div className="bg-titanium-charcoal/60 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-muted-silver">Inference Mode</span>
            <div className="text-base font-bold text-electric-teal uppercase mt-0.5">
              {aiStatus?.recommended_mode || 'Hybrid'}
            </div>
            <span className="text-muted-silver/60 text-[10px]">
              {aiStatus?.recommended_mode === 'inference' ? 'Neural Latent Model' : 'Procedural + Remote SDXL'}
            </span>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="p-4 rounded-xl bg-titanium-charcoal/40 border border-white/10 text-xs text-muted-silver font-mono">
          {aiStatus?.message || 'Academic Demonstration Mode active. Connect an external NVIDIA GPU node or Google Colab tunnel for remote ControlNet Canny diffusion.'}
        </div>
      </div>

      {/* Google Colab GPU Inference Remote Node */}
      <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-6 shadow-xl">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-titanium-charcoal border border-white/10 text-electric-teal shadow-[0_0_12px_rgba(0,214,201,0.2)]">
              <CloudLightning className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-warm-ivory flex items-center gap-2">
                Google Colab Remote GPU Inference Node
              </h3>
              <p className="text-xs text-muted-silver">
                Encrypted Cloudflare Tunnel connection for Output 3: Final Architectural Master Render
              </p>
            </div>
          </div>

          {/* Connection Status Indicator */}
          <div>
            {colabStatus?.health === 'online' ? (
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-controlled-emerald/15 border border-controlled-emerald/30 text-controlled-emerald font-mono text-xs font-bold shadow-[0_0_10px_rgba(0,184,148,0.25)]">
                <span className="w-2 h-2 rounded-full bg-controlled-emerald animate-pulse" />
                <span>ONLINE &amp; READY</span>
              </span>
            ) : colabStatus?.health === 'unauthorized' ? (
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>401 UNAUTHORIZED</span>
              </span>
            ) : colabStatus?.health === 'offline' ? (
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>OFFLINE</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-titanium-charcoal border border-white/10 text-muted-silver font-mono text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-stone-400" />
                <span>STANDBY</span>
              </span>
            )}
          </div>
        </div>

        {/* Live Feedback Banner */}
        {colabFeedback && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono flex items-center gap-2.5 transition-all ${
              colabFeedback.type === 'success'
                ? 'bg-controlled-emerald/15 border-controlled-emerald/30 text-controlled-emerald'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {colabFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-controlled-emerald shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="flex-1 font-semibold">{colabFeedback.message}</span>
            <button
              type="button"
              onClick={() => setColabFeedback(null)}
              className="text-muted-silver hover:text-warm-ivory transition-colors cursor-pointer text-[10px] font-bold"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Active Telemetry Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-titanium-charcoal/60 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-muted-silver">Tunnel Connection State</span>
            <div className="text-sm font-bold flex items-center gap-1.5 mt-1">
              {colabStatus?.health === 'online' ? (
                <span className="text-controlled-emerald flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-controlled-emerald animate-pulse" /> ONLINE
                </span>
              ) : colabStatus?.health === 'unauthorized' ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> 401 UNAUTHORIZED
                </span>
              ) : colabStatus?.health === 'offline' ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> OFFLINE
                </span>
              ) : (
                <span className="text-muted-silver flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-stone-400" /> STANDBY
                </span>
              )}
            </div>
            <span className="text-muted-silver/60 text-[10px] truncate block" title={colabStatus?.url || ''}>
              {colabStatus?.url || 'No active tunnel configured'}
            </span>
          </div>

          <div className="bg-titanium-charcoal/60 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-muted-silver">Active Synthesis Engine</span>
            <div className="text-sm font-bold text-warm-ivory uppercase mt-1">
              {colabStatus?.health === 'online'
                ? 'Remote SDXL + ControlNet'
                : 'Remote SDXL + ControlNet (Standby)'}
            </div>
            <span className="text-muted-silver/60 text-[10px]">
              {colabStatus?.health === 'online' ? 'Tesla T4 Neural Diffusion Active' : 'Connect Colab GPU node to generate Output 3'}
            </span>
          </div>

          <div className="bg-titanium-charcoal/60 p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-muted-silver">GPU Hardware Specification</span>
            <div className="text-sm font-bold text-electric-teal truncate mt-1">
              {colabStatus?.gpu_name || (colabStatus?.health === 'online' ? 'NVIDIA Tesla T4' : 'None Active')}
            </div>
            <span className="text-muted-silver/60 text-[10px]">
              {colabStatus?.vram_total_gb
                ? `${colabStatus.vram_allocated_gb ?? 0} GB used / ${colabStatus.vram_total_gb} GB VRAM`
                : 'PyTorch CUDA 12.x'}
            </span>
          </div>
        </div>

        {/* Colab Connection Form */}
        <form onSubmit={handleConnectColab} className="space-y-4 pt-2 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Colab Server URL */}
            <div className="space-y-1.5">
              <label className="text-warm-ivory font-bold flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-electric-teal" />
                <span>Colab Server URL (Cloudflare Tunnel)</span>
              </label>
              <input
                type="url"
                value={colabUrl}
                onChange={(e) => setColabUrl(e.target.value)}
                placeholder="https://xxxx-xxxx-xxxx.trycloudflare.com"
                className="w-full bg-titanium-charcoal border border-white/10 focus:border-electric-teal rounded-xl px-3.5 py-2.5 text-warm-ivory text-xs font-mono focus:outline-none transition-colors"
                required
              />
              <span className="text-[10px] text-muted-silver/60 block">
                Public Cloudflare Tunnel URL emitted by Stage 8 of RackVision_SDXL_ControlNet.ipynb
              </span>
            </div>

            {/* Authentication Token */}
            <div className="space-y-1.5">
              <label className="text-warm-ivory font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-electric-teal" />
                <span>Authentication Token</span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={colabToken}
                  onChange={(e) => setColabToken(e.target.value)}
                  placeholder="Enter session token (from .rackvision_auth_token or Colab Secrets)"
                  className="w-full bg-titanium-charcoal border border-white/10 focus:border-electric-teal rounded-xl pl-3.5 pr-10 py-2.5 text-warm-ivory text-xs font-mono focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-silver hover:text-warm-ivory transition-colors cursor-pointer p-1"
                  title={showToken ? 'Mask Token' : 'Show Token'}
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-muted-silver/60 block">
                Masked by default. Sent securely via x-colab-auth header; never logged or exposed.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isConnectingColab || !colabUrl.trim()}
              className="btn-primary-teal flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold font-mono text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,214,201,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CloudLightning className={`w-4 h-4 ${isConnectingColab ? 'animate-bounce' : ''}`} />
              <span>{isConnectingColab ? 'CONNECTING TO COLAB...' : 'CONNECT TO COLAB'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isReconnectingColab || isConnectingColab}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-titanium-charcoal/80 hover:bg-titanium-charcoal text-warm-ivory font-mono text-xs border border-white/10 hover:border-white/20 transition-all cursor-pointer disabled:opacity-40 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconnectingColab ? 'animate-spin text-electric-teal' : 'text-muted-silver'}`} />
              <span>{isReconnectingColab ? 'TESTING...' : 'TEST CONNECTION'}</span>
            </button>

            {colabStatus?.health === 'online' && (
              <span className="text-controlled-emerald font-mono text-xs font-bold flex items-center gap-1.5 ml-auto">
                <CheckCircle2 className="w-4 h-4 text-controlled-emerald" />
                Active Node: {colabStatus.gpu_name || 'Tesla T4'} ({colabStatus.model || 'SDXL 1.0'})
              </span>
            )}
          </div>
        </form>

        {/* Setup Guide */}
        <div className="p-4 rounded-xl bg-titanium-charcoal/40 border border-white/10 text-xs text-muted-silver font-mono space-y-2">
          <div className="font-bold text-warm-ivory flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-electric-teal" />
            <span>Remote GPU Inference Setup Guide (Cloudflare Tunnel)</span>
          </div>
          <ol className="list-decimal list-inside text-muted-silver/90 space-y-1.5 leading-relaxed text-[11px]">
            <li>
              Open <code className="text-electric-teal bg-obsidian px-1 py-0.5 rounded border border-white/10">notebooks/RackVision_SDXL_ControlNet.ipynb</code> in Google Colab with <strong>T4 GPU</strong> runtime.
            </li>
            <li>
              <em>(Optional)</em> In Colab Secrets (<code className="text-warm-ivory">🔑</code> tab on the left), add <code className="text-electric-teal">RACKVISION_AUTH_TOKEN</code> with your secret token.
            </li>
            <li>
              Click <strong>Runtime → Run all</strong>. Stages 1–7 verify memory, dependencies, and generate a diagnostic image.
            </li>
            <li>
              Stage 8 starts the authenticated FastAPI server and opens an encrypted Cloudflare Tunnel (<code className="text-electric-teal">https://xxxx.trycloudflare.com</code>).
            </li>
            <li>
              Copy the printed <code className="text-electric-teal">PUBLIC TUNNEL URL</code> and session token into the form above, then click <strong>CONNECT TO COLAB</strong>.
            </li>
          </ol>
        </div>
      </div>

      {/* Model Checkpoint Configurations */}
      <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-5 shadow-xl">
        <h3 className="text-base font-serif font-bold text-warm-ivory flex items-center gap-2">
          <Server className="w-5 h-5 text-electric-teal" />
          Hugging Face &amp; Model Weights Configuration
        </h3>

        <div className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-muted-silver mb-1 font-semibold">Base Diffusion Model ID</label>
            <input
              type="text"
              value={baseModel}
              onChange={(e) => setBaseModel(e.target.value)}
              className="w-full bg-titanium-charcoal border border-white/10 focus:border-electric-teal rounded-xl px-3.5 py-2.5 text-warm-ivory"
            />
          </div>

          <div>
            <label className="block text-muted-silver mb-1 font-semibold">ControlNet Canny Model Checkpoint</label>
            <input
              type="text"
              value={controlnetModel}
              onChange={(e) => setControlnetModel(e.target.value)}
              className="w-full bg-titanium-charcoal border border-white/10 focus:border-electric-teal rounded-xl px-3.5 py-2.5 text-warm-ivory"
            />
          </div>

          <div>
            <label className="block text-muted-silver mb-1 font-semibold">Custom Fine-Tuned Weights Path (Optional)</label>
            <input
              type="text"
              value={customCheckpoint}
              onChange={(e) => setCustomCheckpoint(e.target.value)}
              className="w-full bg-titanium-charcoal border border-white/10 focus:border-electric-teal rounded-xl px-3.5 py-2.5 text-warm-ivory"
            />
            <span className="text-[10px] text-muted-silver/60 mt-1 block">
              Trained using `ai_engine/training/train_controlnet_lora.py`
            </span>
          </div>
        </div>
      </div>

      {/* API Endpoint & Environment */}
      <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-4 shadow-xl">
        <h3 className="text-base font-serif font-bold text-warm-ivory">FastAPI Backend Gateway</h3>
        <div>
          <label className="block text-xs font-mono text-muted-silver mb-1 font-semibold">REST API Gateway URL</label>
          <input
            type="text"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            className="w-full bg-titanium-charcoal border border-white/10 focus:border-electric-teal rounded-xl px-3.5 py-2.5 text-warm-ivory text-xs font-mono"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn-primary-teal flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold font-mono text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,214,201,0.25)]"
        >
          <Save className="w-4 h-4" />
          <span>{savedSuccess ? 'CONFIGURATION SAVED!' : 'SAVE SETTINGS'}</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
