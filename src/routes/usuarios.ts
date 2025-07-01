import express, { Request, Response } from 'express';
import User from '../models/User';
import { verifyToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { nombre, email } = req.body;

  if (req.user!.id !== id) {
    return res.status(403).json({ message: 'No tienes permisos para editar este usuario' });
  }

  try {
    const usuarioActualizado = await User.findByIdAndUpdate(
      id,
      { nombre, email },
      { new: true }
    ).select('-password'); // sin la contraseña

    res.json(usuarioActualizado);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

export default router;