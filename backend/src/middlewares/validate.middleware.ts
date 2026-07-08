import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

// Validates req.body / req.query / req.params against a Zod schema
export function validate(schema: Schema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      // Reassign the parsed (and coerced) values
      req[source] = parsed as never;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
