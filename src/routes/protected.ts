import express, { Request, Response } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';

const router = express.Router();

// GET /api/protected
router.get('/', verifyToken, (req: Request, res: Response) => {
  res.json({
    message: 'Acceso autorizado',
    user: req.user,
  });
});

export default router;
