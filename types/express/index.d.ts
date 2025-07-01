import { JwtPayload as DefaultJwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        rol: string;
      };
    }
  }
}
