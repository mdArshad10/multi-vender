import { Request, Response } from 'express';
import { ApiError } from './api-error.js';

export const errorMiddleware = (err: Error, req: Request, res: Response) => {
  if (err instanceof ApiError) {
    console.log(`Error - ${req.method} ${req.url} - ${err.message}`);
    return res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  console.log(`unhandled error: `, err);

  return res.status(500).json({
    error: 'Something went wrong, please try again',
  });
};
