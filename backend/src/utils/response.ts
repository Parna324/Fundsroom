import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: Record<string, unknown>
): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...meta,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: unknown[]
): void {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && errors.length > 0 ? { errors } : {}),
  });
}

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors?: unknown[]
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
