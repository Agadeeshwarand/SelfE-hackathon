// Central error type so controllers can throw domain errors with a clear
// HTTP status instead of leaking stack traces or ad-hoc error shapes.
export class AppError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "AppError";
  }
}
