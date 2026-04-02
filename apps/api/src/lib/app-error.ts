import { type ErrorCode, errorCodeSchema } from "@bolt-everything/contracts";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details: Record<string, unknown>;

  public constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = errorCodeSchema.parse(code);
    this.details = details;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      payload: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  return {
    statusCode: 500,
    payload: {
      error: {
        code: "forbidden_operation" as const,
        message: "Unexpected server error.",
        details: {},
      },
    },
  };
}
