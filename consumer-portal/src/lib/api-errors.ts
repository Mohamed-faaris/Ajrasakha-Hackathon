import { z } from "zod";
import { ApiErrorSchema } from "@shared/schemas";
import type { ApiError as ApiErrorType } from "@shared/types";

export type ApiErrorResponse = ApiErrorType;

export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly details: unknown;

  constructor(
    status: number,
    statusText: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromResponse(status: number, statusText: string, body: unknown): ApiError {
    const parsed = parseErrorResponse(body);
    return new ApiError(status, statusText, parsed.error, parsed.details);
  }

  isNetworkError(): boolean {
    return this.status === 0;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}

export function parseErrorResponse(body: unknown): ApiErrorResponse {
  const result = ApiErrorSchema.safeParse(body);
  if (result.success) {
    return result.data;
  }
  if (typeof body === "object" && body !== null && "message" in body) {
    return { error: String((body as { message: string }).message) };
  }
  if (typeof body === "string" && body.trim()) {
    return { error: body.trim() };
  }
  return { error: "An unexpected error occurred" };
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isErrorWithStatus(
  error: unknown,
  status: number
): error is ApiError {
  return isApiError(error) && error.status === status;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

export function isZodValidationError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}

export function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join("; ");
}

export class ValidationError extends Error {
  public readonly zodError: z.ZodError;

  constructor(zodError: z.ZodError, message?: string) {
    super(message ?? formatZodErrors(zodError));
    this.name = "ValidationError";
    this.zodError = zodError;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}