import { useSyncExternalStore } from 'react';

// Upload jobs live outside React so a job keeps running if the page re-renders, remounts, or
// the person navigates away and back. Each job uploads its PDFs one at a time, in order.
const jobs = new Map();
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

function update(id, change) {
  const job = jobs.get(id);
  jobs.set(id, { ...job, ...change(job) });
  notify();
}

export function startUploads(api, comparisonId, files) {
  if (jobs.has(comparisonId) && !jobs.get(comparisonId).done) return;
  jobs.set(comparisonId, {
    done: false,
    files: files.map((file) => ({ name: file.name, size: file.size, status: 'queued', error: '', extractionSource: '' })),
  });
  notify();

  (async () => {
    for (let i = 0; i < files.length; i += 1) {
      update(comparisonId, (job) => ({ files: job.files.map((f, j) => (j === i ? { ...f, status: 'uploading' } : f)) }));
      try {
        const quote = await api.addQuote(comparisonId, files[i]);
        update(comparisonId, (job) => ({
          files: job.files.map((f, j) => (j === i ? { ...f, status: quote.status, extractionSource: quote.extractionSource } : f)),
        }));
      } catch (error) {
        update(comparisonId, (job) => ({ files: job.files.map((f, j) => (j === i ? { ...f, status: 'failed', error: error.message } : f)) }));
      }
    }
    update(comparisonId, () => ({ done: true }));
  })();
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function useUploadJob(comparisonId) {
  return useSyncExternalStore(subscribe, () => jobs.get(comparisonId) || null);
}
