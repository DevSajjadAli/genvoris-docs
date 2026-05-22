/**
 * Public entry point. Mirrors the layout of the Stripe SDK:
 *
 *   import Genvoris from '@genvoris/node';
 *   const gv = new Genvoris({ apiKey: process.env.GENVORIS_API_KEY! });
 *   await gv.customers.list();
 *
 * Named imports work too for tree-shaking:
 *
 *   import { GenvorisClient, GenvorisAPIError } from '@genvoris/node';
 */

import { HttpClient } from './client';
import { ClientOptions } from './types';
import { CustomersResource } from './resources/customers';
import { PlansResource } from './resources/plans';
import { SessionsResource } from './resources/sessions';
import { TryOnResource } from './resources/tryon';
import { WebhooksResource } from './resources/webhooks';

export class GenvorisClient {
  public readonly customers: CustomersResource;
  public readonly plans: PlansResource;
  public readonly sessions: SessionsResource;
  public readonly tryon: TryOnResource;
  /** Static-only namespace for webhook signature verification. */
  public readonly webhooks: typeof WebhooksResource = WebhooksResource;

  constructor(opts: ClientOptions) {
    const http = new HttpClient(opts);
    this.customers = new CustomersResource(http);
    this.plans = new PlansResource(http);
    this.sessions = new SessionsResource(http);
    this.tryon = new TryOnResource(http);
  }
}

export {
  GenvorisError,
  GenvorisAuthError,
  GenvorisAPIError,
  GenvorisWebhookError,
} from './errors';
export { WebhooksResource } from './resources/webhooks';
export type {
  ClientOptions,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  Plan,
  CreatePlanInput,
  UpdatePlanInput,
  Session,
  MintSessionInput,
  AnalyzeInput,
  AnalyzeResult,
  GenerateInput,
  TryOnResult,
  WebhookEvent,
  WebhookEventType,
  ProductCategory,
  PaginationParams,
  ListResult,
} from './types';

export default GenvorisClient;
