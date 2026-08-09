import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/response';
import { config } from '../config/config';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Application errors (known)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  // PostgreSQL errors
  const pgError = (err as unknown) as Record<string, unknown>;
  if (pgError.code === '23505') {
    // Unique violation
    res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
    });
    return;
  }

  if (pgError.code === '23503') {
    // Foreign key violation
    res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
    return;
  }

  // Unknown errors — don't leak internals
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
}
