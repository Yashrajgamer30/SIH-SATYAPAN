/**
 * AICTE SATYAPAN - Frontend API Configuration
 * Supports environment-based configuration for cloud deployment (e.g. Render, Vercel)
 * Set VITE_API_URL in deployment environment to override default localhost.
 */

let rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').trim().replace(/\/+$/, '');
if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}

export const API_BASE = rawUrl;
