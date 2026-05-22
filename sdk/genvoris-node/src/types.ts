/**
 * Public type surface of the Genvoris SDK. These shapes mirror the
 * REST contract documented at https://docs.genvoris.org/api -- we keep
 * them deliberately narrow (only fields the API guarantees) so adding
 * optional fields server-side never breaks SDK consumers.
 */

export type ProductCategory = 'apparel' | 'home' | 'object' | 'other';

export interface ClientOptions {
  /** Genvoris API key (starts with `gvk_live_` or `gvk_test_`). */
  apiKey: string;
  /** Override the base URL. Defaults to https://api.genvoris.org. */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Default: 30_000. */
  timeoutMs?: number;
  /** Maximum retries on 429 / 5xx responses. Default: 3. */
  maxRetries?: number;
  /** Custom fetch implementation (defaults to globalThis.fetch). */
  fetch?: typeof fetch;
  /** Extra headers attached to every request. */
  defaultHeaders?: Record<string, string>;
}

export interface PaginationParams {
  /** 1-based page index. */
  page?: number;
  /** Items per page, max 100. */
  limit?: number;
}

export interface ListResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

// ---------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------

export interface Customer {
  id: string;
  externalId: string;
  email: string | null;
  planId: string | null;
  isSubscribed: boolean;
  quotaUsed: number;
  quotaLimit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  externalId: string;
  email?: string | null;
  planId?: string | null;
}

export type UpdateCustomerInput = Partial<Omit<CreateCustomerInput, 'externalId'>>;

// ---------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------

export interface Plan {
  id: string;
  name: string;
  monthlyQuota: number;
  overageAllowed: boolean;
  priceCents: number;
  currency: string;
  createdAt: string;
}

export interface CreatePlanInput {
  name: string;
  monthlyQuota: number;
  overageAllowed?: boolean;
  priceCents?: number;
  currency?: string;
}

export type UpdatePlanInput = Partial<CreatePlanInput>;

// ---------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------

export interface Session {
  /** End-customer session JWT to pass to the widget. */
  token: string;
  /** Unix epoch seconds. */
  expiresAt: number;
  customerId: string;
}

export interface MintSessionInput {
  customerId: string;
  /** TTL in seconds. Server clamps to its own bounds. */
  ttlSeconds?: number;
  /** Optional per-session metadata, surfaced in webhook payloads. */
  metadata?: Record<string, string | number | boolean>;
}

// ---------------------------------------------------------------------
// Try-On
// ---------------------------------------------------------------------

export interface AnalyzeInput {
  productCategory?: ProductCategory;
  productTitle?: string;
  productDescription?: string;
  productImages: string[];
}

export interface AnalyzeResult {
  sessionToken: string;
  productCategory: ProductCategory;
}

export interface GenerateInput {
  sessionToken: string;
  userImage?: string;
  variationCount?: 1 | 4;
}

export interface TryOnResult {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  variations: string[];
  remainingCredits: number;
  generationTimeMs?: number;
}

// ---------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------

export type WebhookEventType =
  | 'tryon.completed'
  | 'tryon.failed'
  | 'customer.plan_changed'
  | 'customer.quota_exhausted'
  | 'credit.low_balance'
  | 'credit.balance_added'
  // Back-compat (deprecated -- kept until 2027):
  | 'end_customer.quota_exhausted'
  | 'plan.updated';

export interface WebhookEvent<T = unknown> {
  id: string;
  type: WebhookEventType;
  createdAt: string;
  data: T;
}
