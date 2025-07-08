import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();
const REFRESH_SECRET = process.env.REFRESH_SECRET || "";
const ACCESS_SECRET = process.env.ACCESS_SECRET || "";

// POST /api/auth/register
router.post(
  '/register',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, email, password } = req.body;

    try {
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'El email ya está registrado' });

      // Hashear la contraseña
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Crear nuevo usuario
      const nuevoUsuario = new User({
        nombre,
        email,
        passwordHash,
        rol: 'jugador',
      });

      await nuevoUsuario.save();

      res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
);


// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

      const passwordOk = await bcrypt.compare(password, user.passwordHash);
      if (!passwordOk) return res.status(401).json({ message: 'Credenciales inválidas' });

      const generateTokens = (userId: string) => {
        const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secretkey123', {
          expiresIn: '15m',
        });

        const refreshToken = jwt.sign(
          { id: userId },
          process.env.JWT_REFRESH_SECRET || 'refreshSecret123',
          {
            expiresIn: '7d',
          }
        );

        return { accessToken, refreshToken };
      };

      const { accessToken, refreshToken } = generateTokens(user._id.toString());

      // Enviar refresh token en cookie segura
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        accessToken,
        user: {
          id: user._id,
          nombre: user.nombre,
          email: user.email,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
);

router.post('/refresh-token', (req, res) => {
  const token = req.cookies?.refreshToken;
  console.log("/refresh-token", token);
  
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  jwt.verify(token, REFRESH_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });

    const newToken = jwt.sign({ id: decoded.id }, ACCESS_SECRET, {
      expiresIn: '15m',
    });

    return res.json({ token: newToken });
  });
});

export default router;
