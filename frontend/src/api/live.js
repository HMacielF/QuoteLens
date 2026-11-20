// Talks to the QuoteLens Azure Functions API (api/function_app.py).
import { ApiError } from './errors.js';

export function createLiveApi({ base, devUser }) {
  const root = base.replace(/\/+$/, '');

  async function call(method, path, { json, body, headers = {} } = {}) {
    const init = { method, credentials: 'include', headers: { ...headers } };
    // Local only: the func host accepts x-user-id when ALLOW_DEV_USER=true. Azure ignores it.
    if (devUser) init.headers['x-user-id'] = devUser;
    if (json !== undefined) {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(json);
    } else if (body !== undefined) {
      init.body = body;
    }
    let response;
    try {
      response = await fetch(root + path, init);
    } catch {
      throw new ApiError(0, `Could not reach the QuoteLens API at ${root}.`);
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, data?.error || `The API answered with status ${response.status}.`, data?.details);
    return data;
  }

  return {
    mode: 'live',
    health: () => call('GET', '/health'),
    listComparisons: () => call('GET', '/comparisons'),
    createComparison: (title) => call('POST', '/comparisons', { json: { title } }),
    getComparison: (id) => call('GET', `/comparisons/${encodeURIComponent(id)}`),
    addQuote: (id, file) =>
      call('POST', `/comparisons/${encodeURIComponent(id)}/quotes`, {
        body: file,
        headers: { 'content-type': 'application/pdf', 'x-file-name': file.name },
      }),
    getStatus: (id) => call('GET', `/comparisons/${encodeURIComponent(id)}/status`),
    buildComparison: (id) => call('POST', `/comparisons/${encodeURIComponent(id)}/build`),
    listQuotes: () => call('GET', '/quotes'),
    confirmQuote: (id, reviewed) => call('PUT', `/quotes/${encodeURIComponent(id)}/confirm`, { json: reviewed }),
    getPdfLink: (id) => call('GET', `/quotes/${encodeURIComponent(id)}/pdf`),
  };
}
