interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cleanup();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
    
    // Cleanup ทุก 5 นาที
    setTimeout(() => this.cleanup(), 5 * 60 * 1000);
  }

  private generateKey(identifier: string): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(identifier);
    }
    return identifier;
  }

  public isAllowed(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter: number;
  } {
    const key = this.generateKey(identifier);
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // สร้าง entry ใหม่
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
        retryAfter: 0
      };
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }

    // เพิ่ม count
    entry.count++;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
      retryAfter: 0
    };
  }

  public reset(identifier: string): void {
    const key = this.generateKey(identifier);
    this.store.delete(key);
  }

  public getStats(identifier: string): {
    count: number;
    remaining: number;
    resetTime: number;
  } | null {
    const key = this.generateKey(identifier);
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return null;
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }
}

// สร้าง rate limiters สำหรับ use cases ต่างๆ
export const rateLimiters = {
  // Rate limiter สำหรับ login attempts
  login: new RateLimiter({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 นาที
    keyGenerator: (identifier: string) => `login:${identifier}`
  }),

  // Rate limiter สำหรับ API calls
  api: new RateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 นาที
    keyGenerator: (identifier: string) => `api:${identifier}`
  }),

  // Rate limiter สำหรับ queue creation
  queueCreation: new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 ชั่วโมง
    keyGenerator: (identifier: string) => `queue:${identifier}`
  }),

  // Rate limiter สำหรับ file uploads
  fileUpload: new RateLimiter({
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 ชั่วโมง
    keyGenerator: (identifier: string) => `upload:${identifier}`
  }),

  // Rate limiter สำหรับ admin actions
  adminAction: new RateLimiter({
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 นาที
    keyGenerator: (identifier: string) => `admin:${identifier}`
  })
};

// Hook สำหรับใช้ rate limiting ใน components
export const useRateLimit = (type: keyof typeof rateLimiters) => {
  const limiter = rateLimiters[type];

  const checkRateLimit = (identifier: string) => {
    return limiter.isAllowed(identifier);
  };

  const resetRateLimit = (identifier: string) => {
    limiter.reset(identifier);
  };

  const getRateLimitStats = (identifier: string) => {
    return limiter.getStats(identifier);
  };

  return {
    checkRateLimit,
    resetRateLimit,
    getRateLimitStats
  };
};

// ฟังก์ชันสำหรับตรวจสอบ IP address
export const getClientIP = (): string => {
  // ในระบบจริงควรดึงจาก request headers
  // สำหรับ demo ใช้ค่า default
  return '127.0.0.1';
};

// ฟังก์ชันสำหรับสร้าง identifier จาก request
export const createRateLimitIdentifier = (
  type: 'ip' | 'user' | 'session',
  value?: string
): string => {
  switch (type) {
    case 'ip':
      return getClientIP();
    case 'user':
      return value || 'anonymous';
    case 'session':
      return value || 'anonymous';
    default:
      return 'anonymous';
  }
};

// ฟังก์ชันสำหรับตรวจสอบ rate limit และส่ง response
export const checkRateLimitAndRespond = (
  type: keyof typeof rateLimiters,
  identifier: string
): {
  allowed: boolean;
  headers?: Record<string, string>;
  error?: string;
} => {
  const limiter = rateLimiters[type];
  const result = limiter.isAllowed(identifier);

  if (!result.allowed) {
    return {
      allowed: false,
      headers: {
        'X-RateLimit-Limit': rateLimiters[type]['config'].maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': result.retryAfter.toString()
      },
      error: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`
    };
  }

  return {
    allowed: true,
    headers: {
      'X-RateLimit-Limit': rateLimiters[type]['config'].maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.toString()
    }
  };
};

// ฟังก์ชันสำหรับ middleware ใน API routes
export const rateLimitMiddleware = (
  type: keyof typeof rateLimiters,
  identifierType: 'ip' | 'user' | 'session' = 'ip'
) => {
  return (req: any, res: any, next: any) => {
    const identifier = createRateLimitIdentifier(identifierType, req.user?.id);
    const result = checkRateLimitAndRespond(type, identifier);

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: result.error,
        retryAfter: result.headers?.['Retry-After']
      });
    }

    // เพิ่ม headers
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
    }

    next();
  };
}; 