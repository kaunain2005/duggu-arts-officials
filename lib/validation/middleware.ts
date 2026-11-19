import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export function validateRequest<T extends z.ZodType>(schema: T) {
  return async (request: NextRequest): Promise<z.infer<T>> => {
    try {
      const body = await request.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        throw new Error(`VALIDATION_ERROR: ${message}`);
      }
      throw error;
    }
  };
}

export function validateQuery<T extends z.ZodType>(schema: T) {
  return (request: NextRequest): z.infer<T> => {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    try {
      return schema.parse(searchParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        throw new Error(`VALIDATION_ERROR: ${message}`);
      }
      throw error;
    }
  };
}

export function createErrorResponse(error: unknown, status: number = 400): NextResponse {
  if (error instanceof Error) {
    if (error.message.startsWith('VALIDATION_ERROR:')) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message.replace('VALIDATION_ERROR: ', '') },
        { status: 422 }
      );
    }
    if (error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function withValidation<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
  handler: (data: T) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return await handler(data);
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function withQueryValidation<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
  handler: (data: T) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const data = schema.parse(searchParams);
    return await handler(data);
  } catch (error) {
    return createErrorResponse(error);
  }
}
