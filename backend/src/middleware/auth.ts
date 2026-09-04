import type { Request, Response, NextFunction } from 'express';
import type { IUser } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: missing token' });
    return;
  }

  const token = authHeader.slice(7);

  if (token === 'invalid') {
    res.status(401).json({ success: false, error: 'Unauthorized: invalid token' });
    return;
  }

  // Dummy: token format = dummy-token-<userId>
  // const userId = token.startsWith('dummy-token-') ? token.replace('dummy-token-', '') : token;
  // const user = dummyUsers.find((u) => u.id === userId);

  // if (!user) {
  //   res.status(401).json({ success: false, error: 'Unauthorized: user not found' });
  //   return;
  // }

  // req.user = user;
  next();
}
