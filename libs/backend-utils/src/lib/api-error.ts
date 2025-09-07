class ApiError extends Error {
  public readonly isOperational: boolean;
  public readonly statusCode: number;
  public readonly details?: any;
  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    details?: any
  ) {
    super(message);
    this.isOperational = isOperational;
    this.statusCode = statusCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// =========== common Errors ===========
// 1. Not found
class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 400);
  }
}

// 2. Validation Error
class ValidationError extends ApiError {
  constructor(message = 'Invalid request data', details?: any) {
    super(message, 400, true, details);
  }
}

// 3. Auth
class AuthError extends ApiError {
  constructor(message = 'Unauthorize') {
    super(message, 401);
  }
}

// 4. Forbidden Error
class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden access') {
    super(message, 403);
  }
}

// 5. Database Error
class DatabaseError extends ApiError {
  constructor(message = 'Database Error', details?: any) {
    super(message, 500, true, details);
  }
}

// 6. RateLimit Error
class RateLimitError extends ApiError {
  constructor(message = 'Too many request, pls try again later') {
    super(message, 429);
  }
}

export {
  ApiError,
  NotFoundError,
  ValidationError,
  AuthError,
  ForbiddenError,
  DatabaseError,
  RateLimitError,
};
