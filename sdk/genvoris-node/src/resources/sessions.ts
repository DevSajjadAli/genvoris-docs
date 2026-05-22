import { HttpClient } from '../client';
import { MintSessionInput, Session } from '../types';

export class SessionsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Mint an end-customer session JWT. Hand the returned `token` to the
   * widget via `data-end-customer-token=` or `openTryOn({ token })`.
   * The portal enforces per-customer quota off the embedded `sub` claim.
   */
  mint(input: MintSessionInput): Promise<Session> {
    return this.http.request<Session>({
      method: 'POST',
      path: '/api/v1/sessions',
      body: input,
    });
  }
}
