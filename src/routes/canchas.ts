// routes/canchas.ts
import express from 'express';
import mongoose from 'mongoose';
import Cancha from '../models/Cancha';
import Usuario from '../models/User';
import { verifyToken } from '../middlewares/authMiddleware';

const router = express.Router();

// POST /api/canchas/:id/agendar
router.post('/:id/agendar', verifyToken, async (req, res) => {
  try {
    const canchaId = req.params.id;
    const user = await Usuario.findById(req.user!.id);

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (!user.canchasAgendadas.includes(canchaId as any)) {
      user.canchasAgendadas.push(new mongoose.Types.ObjectId(canchaId));
      await user.save();
    }

    res.json({ message: 'Cancha agendada correctamente', canchas: user.canchasAgendadas });
  } catch (error) {
    res.status(500).json({ message: 'Error al agendar cancha' });
  }
});

// POST /api/canchas/:id/desagendar
router.post('/:id/desagendar', verifyToken, async (req, res) => {
  try {
    const canchaId = req.params.id;
    const user = await Usuario.findById(req.user!.id);

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.canchasAgendadas = user.canchasAgendadas.filter(id => id.toString() !== canchaId);
    await user.save();

    res.json({ message: 'Cancha desagendada correctamente', canchas: user.canchasAgendadas });
  } catch (error) {
    res.status(500).json({ message: 'Error al desagendar cancha' });
  }
});

export default router;
