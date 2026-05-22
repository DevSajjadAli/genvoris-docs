import { HttpClient } from '../client';
import { AnalyzeInput, AnalyzeResult, GenerateInput, TryOnResult } from '../types';

export class TryOnResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Submit the product images for category classification + caption
   * extraction. Returns a short-lived session token to pass to
   * `generate()`. Splitting analyze + generate lets you show a "ready"
   * indicator in the UI while the user chooses their own image.
   */
  analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
    return this.http.request<AnalyzeResult>({
      method: 'POST',
      path: '/api/v1/tryon/analyze',
      body: input,
    });
  }

  /**
   * Generate the actual try-on imagery. For `apparel` and `home` the
   * `userImage` is required; for `object` it is optional (we'll produce
   * an editorial product shot via Imagen 4 instead).
   */
  generate(input: GenerateInput): Promise<TryOnResult> {
    return this.http.request<TryOnResult>({
      method: 'POST',
      path: '/api/v1/tryon/generate',
      body: input,
    });
  }

  status(id: string): Promise<TryOnResult> {
    return this.http.request<TryOnResult>({
      method: 'GET',
      path: `/api/v1/tryon/${encodeURIComponent(id)}`,
    });
  }
}
