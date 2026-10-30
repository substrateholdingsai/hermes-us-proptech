export interface AiBinding {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

export interface Env {
  ENVIRONMENT: string;
  AI: AiBinding;
  AI_MODEL?: string;
  DB: D1Database;
  R2: R2Bucket;
  HERMES_SANDBOX?: DurableObjectNamespace;
  APP_URL?: string;
  TZ?: string;
  CREDIT_COST_ENTITY_RESOLUTION?: string;
  CREDIT_COST_PROPERTY_EQUITY?: string;
  CREDIT_COST_SEC_VALIDATION?: string;
  CREDIT_COST_SKIP_TRACE?: string;
}
