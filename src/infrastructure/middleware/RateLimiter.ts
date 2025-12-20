import rateLimit from 'express-rate-limit';

export const createRateLimiter = (
    windowMs: number,
    max: number,
    message: string = 'Too many requests, please try again later.'
) => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        message: { error: message, code: 'RATE_LIMIT_EXCEEDED' },
    });
};

// General API Limiter: 100 requests per 15 minutes
export const generalLimiter = createRateLimiter(15 * 60 * 1000, 100);

// Strict AI Limiter: 20 requests per hour (expensive operations)
export const aiLimiter = createRateLimiter(60 * 60 * 1000, 20, 'AI quota exceeded. Please try again in an hour.');
