import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError, ForbiddenError } from "./permissions";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function badRequest(message = "Bad request", details?: unknown) {
  return new ApiError(message, 400, details);
}

export function unauthorized(message = "Unauthorized") {
  return new ApiError(message, 401);
}

export function forbidden(message = "Forbidden") {
  return new ApiError(message, 403);
}

export function notFound(message = "Resource not found") {
  return new ApiError(message, 404);
}

export function conflict(message = "Resource already exists") {
  return new ApiError(message, 409);
}

export function handleApiError(error: unknown) {
  console.error("API Error caught:", error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      { status: 422 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const message = error instanceof Error ? error.message : "Internal Server Error";
  return NextResponse.json({ error: message }, { status: 500 });
}

