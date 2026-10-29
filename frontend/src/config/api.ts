/**
 * AICTE SATYAPAN - Frontend API Configuration
 * Supports environment-based configuration for cloud deployment (e.g. Render, Vercel)
 * Set VITE_API_URL in deployment environment to override default localhost.
 */

export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
