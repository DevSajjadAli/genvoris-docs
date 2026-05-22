/**
 * Error hierarchy. Consumers can `instanceof GenvorisAPIError` to
 * branch on HTTP failures vs network / shape errors. All errors carry
 * a stable `code` string so logic can branch without parsing messages.
 */

export class GenvorisError extends Error {
  public readonly code: string;
  constructor(message: string, code = 'genvoris_error') {
    super(message);
    this.name = 'GenvorisError';
    this.code = code;
  }
}

export class GenvorisAuthError extends GenvorisError {
  constructor(message = 'Invalid or missing API key.') {
    super(message, 'auth_error');
    this.name = 'GenvorisAuthError';
  }
}

export class GenvorisAPIError extends GenvorisError {
  public readonly status: number;
  public readonly requestId?: string;
  public readonly raw?: unknown;

  constructor(args: {
    message: string;
    status: number;
    code?: string;
    requestId?: string;
    raw?: unknown;
  }) {
    super(args.message, args.code ?? `http_${args.status}`);
    this.name = 'GenvorisAPIError';
    this.status = args.status;
    this.requestId = args.requestId;
    this.raw = args.raw;
  }
}

export class GenvorisWebhookError extends GenvorisError {
  constructor(message: string, code = 'webhook_error') {
    super(message, code);
    this.name = 'GenvorisWebhookError';
  }
}
