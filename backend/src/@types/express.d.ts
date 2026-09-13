export {};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: "CUSTOMER" | "STAFF" | "ADMIN";
    }
  }
}
