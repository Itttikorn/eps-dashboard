import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { request, uploadFile, AppApiError } from './client';

describe('API Client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('unwraps successful 1000 responses', async () => {
    const mockData = { id: 1, name: 'Project A' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: { code: 1000, header: 'Success', description: 'Operation completed' },
        result: mockData,
        total: 1,
      }),
    });

    const res = await request<typeof mockData>('/projects');
    expect(res).toEqual(mockData);
  });

  it('throws AppApiError with server classification when status.code is not 1000', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        status: { code: 5000, header: 'Internal Error', description: 'Database timeout' },
        result: null,
      }),
    });

    await expect(request('/error')).rejects.toThrow('Database timeout');
  });

  it('classifies 409 conflict responses correctly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        status: { code: 4090, header: 'Conflict', description: 'Chronology downgrade' },
        result: null,
      }),
    });

    try {
      await request('/conflict');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppApiError);
      const apiErr = err as AppApiError;
      expect(apiErr.classification).toBe('conflict');
      expect(apiErr.statusCode).toBe(409);
    }
  });

  it('handles network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    try {
      await request('/projects');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppApiError);
      const apiErr = err as AppApiError;
      expect(apiErr.classification).toBe('network');
      expect(apiErr.statusCode).toBe(0);
    }
  });

  it('sanitizes driver / postgres error messages', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        status: {
          code: 5001,
          header: 'Query Failed',
          description: 'pq: syntax error at or near SELECT table_projects',
        },
        result: null,
      }),
    });

    try {
      await request('/projects');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppApiError);
      const apiErr = err as AppApiError;
      expect(apiErr.statusDescription).not.toContain('pq:');
      expect(apiErr.statusDescription).toContain('An internal storage error occurred.');
    }
  });

  it('handles multipart file upload correctly', async () => {
    const mockResult = { batch_id: 'batch-123', status: 'INGESTED' };
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: { code: 1000, header: 'Success', description: 'File processed' },
        result: mockResult,
      }),
    });
    globalThis.fetch = fetchSpy;

    const file = new File(['header1,header2\nval1,val2'], 'test.csv', { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', file);

    const res = await uploadFile<typeof mockResult>('/ingest', formData);
    expect(res).toEqual(mockResult);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/ingest'),
      expect.objectContaining({ method: 'POST', body: formData })
    );
  });

  it('handles upload network failure in uploadFile', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network drop'));
    const formData = new FormData();
    formData.append('file', new File(['content'], 'test.csv'));

    try {
      await uploadFile('/ingest', formData);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppApiError);
      const apiErr = err as AppApiError;
      expect(apiErr.classification).toBe('network');
    }
  });

  it('handles non-json response in uploadFile', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: async () => {
        throw new Error('Not JSON');
      },
    });

    const formData = new FormData();
    formData.append('file', new File(['content'], 'test.csv'));

    try {
      await uploadFile('/ingest', formData);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppApiError);
      const apiErr = err as AppApiError;
      expect(apiErr.classification).toBe('conflict');
      expect(apiErr.statusCode).toBe(409);
    }
  });

  it('handles error envelope in uploadFile', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        status: { code: 4001, header: 'Bad Request', description: 'Invalid CSV format' },
        result: null,
      }),
    });

    const formData = new FormData();
    formData.append('file', new File(['content'], 'test.csv'));

    try {
      await uploadFile('/ingest', formData);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppApiError);
      const apiErr = err as AppApiError;
      expect(apiErr.classification).toBe('client');
      expect(apiErr.statusCode).toBe(400);
      expect(apiErr.statusDescription).toBe('Invalid CSV format');
    }
  });
});

