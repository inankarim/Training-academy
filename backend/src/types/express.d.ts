export {};

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      /** Set by requireAuth after verifying the access token. */
      user?: {
        id: string;
        role: string;
        permissions?: string[];
      };
    }
  }
}
