import { ApiClientError, UniversalEnvelope } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class AppApiError extends Error implements ApiClientError {
  classification: 'network' | 'client' | 'conflict' | 'server';
  statusCode: number;
  statusHeader: string;
  statusDescription: string;

  constructor(
    classification: 'network' | 'client' | 'conflict' | 'server',
    statusCode: number,
    statusHeader: string,
    statusDescription: string
  ) {
    super(statusDescription);
    this.name = 'AppApiError';
    this.classification = classification;
    this.statusCode = statusCode;
    this.statusHeader = statusHeader;
    this.statusDescription = statusDescription;
  }
}

function sanitizeErrorMessage(msg: string): string {
  // Strip potential driver details or raw SQL stack traces
  if (/pq:|sql:|postgres:|driver:|dial tcp/i.test(msg)) {
    return 'An internal storage error occurred. Please try again later.';
  }
  return msg || 'An unexpected error occurred.';
}

export async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new AppApiError(
      'network',
      0,
      'Network Connection Error',
      'Unable to connect to the server. Please check your network connection.'
    );
  }

  let envelope: UniversalEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as UniversalEnvelope<T>;
  } catch {
    // Non-JSON response
    const status = response.status;
    const classification =
      status === 409 ? 'conflict' : status >= 500 ? 'server' : 'client';
    throw new AppApiError(
      classification,
      status,
      response.statusText || 'HTTP Error',
      response.status === 409
        ? 'A chronological conflict occurred with the snapshot upload.'
        : `Request failed with HTTP status ${status}`
    );
  }

  // Inspect envelope status code (1000 = SUCCESS)
  if (!response.ok || envelope.status.code !== 1000) {
    const httpStatus = response.status;
    let classification: 'network' | 'client' | 'conflict' | 'server' = 'client';

    if (httpStatus === 409 || envelope.status.code === 4090) {
      classification = 'conflict';
    } else if (httpStatus >= 500 || envelope.status.code >= 5000) {
      classification = 'server';
    }

    const description = sanitizeErrorMessage(
      envelope.status.description || response.statusText
    );

    throw new AppApiError(
      classification,
      httpStatus,
      envelope.status.header || 'Request Error',
      description
    );
  }

  return envelope.result;
}

export async function uploadFile<T>(
  path: string,
  formData: FormData,
  signal?: AbortSignal
): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal,
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new AppApiError(
      'network',
      0,
      'Upload Network Error',
      'Failed to upload file due to a network connection failure.'
    );
  }

  let envelope: UniversalEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as UniversalEnvelope<T>;
  } catch {
    const status = response.status;
    const classification =
      status === 409 ? 'conflict' : status >= 500 ? 'server' : 'client';
    throw new AppApiError(
      classification,
      status,
      response.statusText || 'Upload Failed',
      status === 409
        ? 'Uploaded snapshot is older than the current dataset.'
        : `Upload failed with HTTP status ${status}`
    );
  }

  if (!response.ok || envelope.status.code !== 1000) {
    const httpStatus = response.status;
    const classification =
      httpStatus === 409 || envelope.status.code === 4090
        ? 'conflict'
        : httpStatus >= 500
        ? 'server'
        : 'client';

    const description = sanitizeErrorMessage(
      envelope.status.description || 'Failed to process file ingestion.'
    );

    throw new AppApiError(
      classification,
      httpStatus,
      envelope.status.header || 'Ingestion Error',
      description
    );
  }

  return envelope.result;
}

