// errors.ts

// Custom Error Classes
export class AppError extends Error {
  public readonly name: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 400);
  }
}

export class ApiError extends AppError {
  public readonly endpoint: string;
  public readonly method: string;
  public readonly statusCode: number = 500;

  constructor(
    message = "API error occurred",
    statusCode = 500,
    endpoint: string,
    method: string
  ) {
    super(message, statusCode);
    this.endpoint = endpoint;
    this.method = method;
  }

  public toString(): string {
    return `[ApiError] ${this.method} ${this.endpoint} - ${this.message} (Status: ${this.statusCode})`;
  }
}

// Error Messages
export const ErrorMessages = {
  GENERIC: "An unexpected error has occurred.",
  NOT_FOUND: "The requested resource does not exist.",
  VALIDATION: "The provided data is invalid.",
  API: "An error occurred while communicating with the API.",
};

// Utility Function
export function handleError(error: unknown): void {
  if (error instanceof AppError) {
    console.error(`[${error.name}] ${error.message} (Status: ${error.statusCode})`);
    if (error instanceof ApiError) {
      console.error(`Endpoint: ${error.endpoint}, Method: ${error.method}`);
    }
  } else {
    console.error(`[UnhandledError] ${String(error)}`);
  }
}