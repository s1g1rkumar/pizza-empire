import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';

type ValidationTarget = 'body' | 'query' | 'params';

export function validateRequest(schema: Joi.ObjectSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { value, error } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      next(new ValidationError('Request validation failed', details));
      return;
    }

    req[target] = value;
    next();
  };
}
