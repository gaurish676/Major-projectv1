import rateLimit from 'express-rate-limit';

/**
 * Authentication rate limiter:
 * Limits login attempts to prevent brute-force and credential-stuffing attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
  },
});

/**
 * Upload rate limiter:
 * Protects certificate and rulebook upload endpoints from Denial-of-Service and disk flood attacks.
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40, // Max 40 uploads per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'File upload rate limit reached. Please wait a few minutes before submitting more certificates.',
  },
});

/**
 * Public credential verification rate limiter:
 * Prevents automated scraping and brute-force enumeration of credential hashes.
 */
export const publicVerifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Max 60 verification requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Public credential verification rate limit exceeded. Please wait a moment.',
  },
});

/**
 * AI Advisor / GraphRAG query rate limiter:
 * Protects LLM token usage and rate limits from automated spam.
 */
export const aiAdvisorLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // Max 15 queries per minute per user/IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI Advisor query rate limit reached. Please wait a moment before sending another message.',
  },
});
