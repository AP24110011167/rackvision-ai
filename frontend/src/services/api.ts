import {
  Project, SketchData, GeneratedDesign, Scene3DConfig,
  MaterialItem, ConstructionPlan, AnalyticsData, OptimizationData,
  StructuredLayout, SketchIntelligenceResult
} from '../types';

const API_BASE = '/api';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem('rv_token');
  },
  setToken(token: string) {
    localStorage.setItem('rv_token', token);
  },
  clearToken() {
    localStorage.removeItem('rv_token');
    localStorage.removeItem('rv_user');
    localStorage.removeItem('rv_admin_token');
  },
  getUser(): any {
    const u = localStorage.getItem('rv_user');
    return u ? JSON.parse(u) : null;
  },
  setUser(user: any) {
    localStorage.setItem('rv_user', JSON.stringify(user));
  },
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  getAdminToken(): string | null {
    return localStorage.getItem('rv_admin_token') || localStorage.getItem('rv_token');
  },
  getAdminHeaders(): Record<string, string> {
    const token = this.getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

export const api = {
  // Authentication & Directory
  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: any }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid enterprise credentials' }));
      throw new Error(err.detail || 'Authentication failed');
    }
    const data = await res.json();
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  async register(payload: { name: string; email: string; password: string; organization?: string }): Promise<{ token: string; user: any }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    const data = await res.json();
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  async getCurrentUser(): Promise<any> {
    const token = authStorage.getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...authStorage.getAuthHeaders() }
      });
      if (!res.ok) {
        authStorage.clearToken();
        return null;
      }
      const data = await res.json();
      authStorage.setUser(data.user);
      return data.user;
    } catch {
      return authStorage.getUser();
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { ...authStorage.getAuthHeaders() }
      });
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      authStorage.clearToken();
    }
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Password reset request failed');
    return await res.json();
  },

  // Supervisory Administration
  async adminLogin(credentials: { admin_user: string; admin_pass: string; master_token?: string }): Promise<{ token: string; user: any }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Administrative verification failed.' }));
      throw new Error(err.detail || 'Administrative verification failed.');
    }
    const data = await res.json();
    localStorage.setItem('rv_admin_token', data.token);
    return data;
  },

  async getAdminUsers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { ...authStorage.getAdminHeaders() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch admin users' }));
      throw new Error(err.detail || 'Failed to fetch admin users');
    }
    return await res.json();
  },

  async createAdminUser(data: { name: string; email: string; password: string; role: string; organization: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authStorage.getAdminHeaders()
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create user' }));
      throw new Error(err.detail || 'Failed to create user');
    }
    return await res.json();
  },

  async getAdminProjects(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/projects`, {
      headers: { ...authStorage.getAdminHeaders() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch admin projects' }));
      throw new Error(err.detail || 'Failed to fetch admin projects');
    }
    return await res.json();
  },

  async getAdminSystemStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/system-status`, {
      headers: { ...authStorage.getAdminHeaders() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch system status' }));
      throw new Error(err.detail || 'Failed to fetch system status');
    }
    return await res.json();
  },

  async getAdminAuditLogs(limit: number = 50): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs?limit=${limit}`, {
      headers: { ...authStorage.getAdminHeaders() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch audit logs' }));
      throw new Error(err.detail || 'Failed to fetch audit logs');
    }
    return await res.json();
  },

  async testAdminTunnel(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/test-tunnel`, {
      method: 'POST',
      headers: { ...authStorage.getAdminHeaders() }
    });
    if (!res.ok) throw new Error('Tunnel diagnostic probe failed');
    return await res.json();
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const res = await fetch(`${API_BASE}/projects`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return await res.json();
    } catch (e) {
      console.warn('API error fetching projects, using mock:', e);
      return [{
        id: 'proj-helios-01',
        name: 'Helios Cloud Hyperscale DC-1',
        description: 'High-density AI enterprise datacenter layout with cold-aisle containment and N+1 CRAC perimeter redundancy.',
        client: 'Helios Neural Infrastructure Corp',
        location: 'Frankfurt Campus / Pod A',
        target_tier: 'Tier III (Uptime Institute)',
        status: 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }];
    }
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return await res.json();
  },

  // Sketches
  async getActiveSketch(projectId: string): Promise<SketchData> {
    const res = await fetch(`${API_BASE}/sketches/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch sketch');
    const data = await res.json();
    return {
      ...data,
      params: typeof data.params_json === 'string' ? JSON.parse(data.params_json) : (data.params || {})
    };
  },

  async uploadSketch(projectId: string, file: File): Promise<SketchData> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/sketches/upload?project_id=${projectId}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload sketch');
    return await res.json();
  },

  async preprocessSketch(projectId: string, params: any): Promise<any> {
    const res = await fetch(`${API_BASE}/sketches/preprocess?project_id=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to preprocess sketch');
    return await res.json();
  },

  // AI Generation
  async getAIStatus(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/ai/status`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return {
        cuda_available: false,
        recommended_mode: 'demo',
        message: 'Procedural Architectural Synthesis Mode Active'
      };
    }
  },

  async generateDesigns(payload: any): Promise<GeneratedDesign[]> {
    const res = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to generate designs');
    return await res.json();
  },

  async generateTechnicalDesign(payload: any): Promise<GeneratedDesign[]> {
    const res = await fetch(`${API_BASE}/design/generate-technical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to generate technical architectural visualization');
    return await res.json();
  },

  async generatePhotorealisticDesign(payload: any): Promise<GeneratedDesign[]> {
    const res = await fetch(`${API_BASE}/design/generate-photorealistic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to generate photorealistic architectural visualization');
    return await res.json();
  },

  async regeneratePhotorealisticDesign(payload: any): Promise<GeneratedDesign[]> {
    const res = await fetch(`${API_BASE}/design/regenerate-photorealistic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to regenerate photorealistic visualization');
    return await res.json();
  },

  // Output 3: Final Architectural Master Render
  async generateFinalMasterRender(payload: any): Promise<GeneratedDesign[]> {
    const res = await fetch(`${API_BASE}/design/generate-final-render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to generate final architectural master render');
    return await res.json();
  },

  async regenerateFinalMasterRender(payload: any): Promise<GeneratedDesign[]> {
    const res = await fetch(`${API_BASE}/design/regenerate-final-render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to regenerate final master render');
    return await res.json();
  },

  async getFinalMasterRender(projectId: string): Promise<GeneratedDesign | null> {
    const res = await fetch(`${API_BASE}/design/${projectId}/final-render`);
    if (!res.ok) throw new Error('Failed to get final master render');
    return await res.json();
  },

  async getModelEvaluation(): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/models/evaluation`);
    if (!res.ok) throw new Error('Failed to fetch model evaluation');
    return await res.json();
  },

  async getProjectDesignOutputs(projectId: string): Promise<{
    project_id: string;
    technical: GeneratedDesign | null;
    photorealistic: GeneratedDesign | null;
    master_render: GeneratedDesign | null;
    history: GeneratedDesign[];
  }> {
    const res = await fetch(`${API_BASE}/design/${projectId}/outputs`);
    if (!res.ok) throw new Error('Failed to get project design outputs');
    return await res.json();
  },

  async getDesigns(projectId: string): Promise<GeneratedDesign[]> {
    const res = await fetch(`${API_BASE}/ai/designs/${projectId}`);
    if (!res.ok) throw new Error('Failed to get designs');
    return await res.json();
  },

  // 3D Simulator
  async getSimulatorScene(projectId: string): Promise<Scene3DConfig> {
    const res = await fetch(`${API_BASE}/simulator/${projectId}`);
    if (!res.ok) throw new Error('Failed to get 3D scene');
    return await res.json();
  },

  async updateSimulatorScene(projectId: string, sceneData: Scene3DConfig): Promise<Scene3DConfig> {
    const res = await fetch(`${API_BASE}/simulator/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sceneData),
    });
    if (!res.ok) throw new Error('Failed to update 3D scene');
    return await res.json();
  },

  async resetSimulatorScene(projectId: string): Promise<Scene3DConfig> {
    const res = await fetch(`${API_BASE}/simulator/${projectId}/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset 3D scene');
    return await res.json();
  },

  // Materials
  async getMaterials(projectId: string): Promise<MaterialItem[]> {
    const res = await fetch(`${API_BASE}/materials/${projectId}`);
    if (!res.ok) throw new Error('Failed to get materials');
    return await res.json();
  },

  async updateMaterial(materialId: string, payload: { quantity?: number; specification?: string; unit_price?: number }): Promise<MaterialItem> {
    const res = await fetch(`${API_BASE}/materials/${materialId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update material');
    return await res.json();
  },

  async getMaterialsSummary(projectId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/materials/${projectId}/summary`);
    if (!res.ok) throw new Error('Failed to get materials summary');
    return await res.json();
  },

  // Construction
  async getConstructionPlan(projectId: string): Promise<ConstructionPlan> {
    const res = await fetch(`${API_BASE}/construction/${projectId}`);
    if (!res.ok) throw new Error('Failed to get construction plan');
    return await res.json();
  },

  async updateStage(projectId: string, stageNum: number, progressPercent: number, status: string): Promise<ConstructionPlan> {
    const res = await fetch(`${API_BASE}/construction/${projectId}/stages/${stageNum}?progress_percent=${progressPercent}&status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to update stage');
    return await res.json();
  },

  // Analytics & Optimizer
  async getAnalytics(projectId: string): Promise<AnalyticsData> {
    const res = await fetch(`${API_BASE}/analytics/${projectId}`);
    if (!res.ok) throw new Error('Failed to get analytics');
    return await res.json();
  },

  async getOptimization(projectId: string): Promise<OptimizationData> {
    const res = await fetch(`${API_BASE}/optimizer/${projectId}`);
    if (!res.ok) throw new Error('Failed to get optimization data');
    return await res.json();
  },

  // Sketch Intelligence
  async getProjectLayout(projectId: string): Promise<StructuredLayout> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/layout`);
    if (!res.ok) throw new Error('Failed to fetch project layout');
    return await res.json();
  },

  async reconstructLayout(projectId: string): Promise<SketchIntelligenceResult> {
    const res = await fetch(`${API_BASE}/sketch/reconstruct-layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    });
    if (!res.ok) throw new Error('Failed to reconstruct layout');
    return await res.json();
  },

  async confirmLayout(projectId: string, layout: StructuredLayout): Promise<{ status: string; project_id: string; layout: StructuredLayout }> {
    const res = await fetch(`${API_BASE}/sketch/confirm-layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, layout }),
    });
    if (!res.ok) throw new Error('Failed to confirm layout');
    return await res.json();
  },

  async detectObjects(projectId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/sketch/detect-objects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    });
    if (!res.ok) throw new Error('Failed to detect objects');
    return await res.json();
  },

  // Reports
  async generateReport(projectId: string): Promise<{ status: string; filename: string; download_url: string }> {
    const res = await fetch(`${API_BASE}/reports/generate/${projectId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to generate report');
    return await res.json();
  },

  getReportDownloadUrl(projectId: string): string {
    return `${API_BASE}/reports/download/${projectId}`;
  },

  // Copilot
  async sendCopilotCommand(projectId: string, message: string): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, message }),
    });
    if (!res.ok) throw new Error('Copilot command failed');
    return await res.json();
  },

  async undoCopilot(projectId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/undo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    });
    if (!res.ok) throw new Error('Undo failed');
    return await res.json();
  },

  async redoCopilot(projectId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/redo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    });
    if (!res.ok) throw new Error('Redo failed');
    return await res.json();
  },

  // Thermal
  async getThermalModel(projectId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/thermal/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch thermal model');
    return await res.json();
  },

  // Colab GPU
  async getColabStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/colab/status`);
    if (!res.ok) throw new Error('Failed to get Colab status');
    return await res.json();
  },

  async reconnectColab(): Promise<any> {
    const res = await fetch(`${API_BASE}/colab/reconnect`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reconnect to Colab');
    return await res.json();
  },

  async connectColab(url: string, token?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/colab/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, token }),
    });
    if (!res.ok) throw new Error('Failed to connect to Colab tunnel');
    return await res.json();
  },

  // Component Details
  async getComponentDetails(projectId: string, componentId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/simulator/${projectId}/component/${componentId}`);
    if (!res.ok) throw new Error('Failed to fetch component details');
    return await res.json();
  }
};
