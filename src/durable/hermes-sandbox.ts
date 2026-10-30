import type { Env } from '../types/env';

export interface IntelRunParams {
  jobId: string;
  taskType: 'entity_resolution' | 'property_equity' | 'sec_validation' | 'skip_trace';
  contextData: Record<string, unknown>;
}

export class HermesSandboxDO {
  private env: Env;
  private state: DurableObjectState;
  private jobs: Map<string, { status: string; startedAt: number; result?: unknown }> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (request.method === 'POST' && path === '/run') {
        const body = (await request.json()) as IntelRunParams;
        this.jobs.set(body.jobId, { status: 'processing', startedAt: Date.now() });
        await this.state.storage.put(`job:${body.jobId}`, {
          jobId: body.jobId,
          taskType: body.taskType,
          status: 'processing',
          startedAt: Date.now(),
        });
        return Response.json({ ok: true, jobId: body.jobId, status: 'processing' });
      }
      if (request.method === 'GET' && path.startsWith('/jobs/')) {
        const jobId = path.split('/')[2];
        if (!jobId) return Response.json({ ok: false, error: 'Job ID missing' }, { status: 400 });
        const job = (await this.state.storage.get(`job:${jobId}`)) ?? this.jobs.get(jobId);
        if (!job) return Response.json({ ok: false, error: 'Job not found' }, { status: 404 });
        return Response.json({ ok: true, job });
      }
      return Response.json({ ok: false, error: 'Endpoint not found' }, { status: 404 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ ok: false, error: message }, { status: 500 });
    }
  }
}
