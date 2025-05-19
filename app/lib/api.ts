import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiResponse = <T>(data: T, message?: string) => {
  return NextResponse.json({
    success: true,
    message,
    data,
  });
};

export const apiError = (error: ApiError) => {
  return NextResponse.json(
    {
      success: false,
      message: error.message,
      errors: error.errors,
    },
    { status: error.statusCode }
  );
};

export const handleApiError = (error: unknown) => {
  if (error instanceof ApiError) {
    return apiError(error);
  }

  console.error('Unhandled API error:', error);
  return apiError(
    new ApiError(500, 'An unexpected error occurred')
  );
};

// API route handler wrapper
export const withApiHandler = (handler: Function) => {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      return handleApiError(error);
    }
  };
}; 