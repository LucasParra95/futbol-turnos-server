import express, { Request, Response } from 'express';
import crypto from 'crypto';
import Turno from '../models/Turno';
import { verifyToken } from '../middlewares/authMiddleware';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const turnosAll = await Turno.find();


    res.status(201).json({ message: 'Turnos: ', turnos: turnosAll });
  } catch (error) {
    console.error('Error al acceder a los turnos:', error);
    res.status(500).json({ message: 'Error al acceder a los turnos' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { fechaHora, lugar, cupo, periodicidad } = req.body;

  if (!fechaHora || !lugar || !cupo) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    const nuevoTurno = new Turno({
      organizador: req.user!.id,
      fechaHora,
      lugar,
      participantes: [req.user!.id], // el organizador se suma automáticamente
      cupo,
      periodicidad,
      invitationToken: crypto.randomBytes(8).toString('hex'),
    });

    await nuevoTurno.save();

    res.status(201).json({ message: 'Turno creado con éxito', turno: nuevoTurno });
  } catch (error) {
    console.error('Error al crear turno:', error);
    res.status(500).json({ message: 'Error al crear el turno' });
  }
});

// PUT /api/turnos/:id - Editar turno (solo organizador)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fechaHora,
      lugar,
      cupo,
      periodicidad,
      equipos,
      participantes,
      invitados
    } = req.body;

    const turno = await Turno.findById(id);
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    // Solo puede editar el organizador
    if (turno.organizador.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'No autorizado para editar este turno' });
    }

    turno.fechaHora = fechaHora;
    turno.lugar = lugar;
    turno.cupo = cupo;
    turno.periodicidad = periodicidad;
    turno.invitados = invitados;
    turno.participantes = participantes;

    // Actualizamos los equipos
    turno.equipos = {
      equipoA: equipos?.equipoA || [],
      equipoB: equipos?.equipoB || [],
      invitadosA: equipos?.invitadosA || [],
      invitadosB: equipos?.invitadosB || [],
    };

    const edited = await turno.save();
    res.json({ message: 'Turno actualizado correctamente' , turno: edited});
  } catch (error) {
    console.error('Error al actualizar turno:', error);
    res.status(500).json({ message: 'Error al actualizar el turno' });
  }
});

// GET /api/turnos/mios
router.get('/mios', verifyToken, async (req, res) => {
  try {
    const turnos = await Turno.find({
      $or: [
        { organizador: req.user!.id },
        { participantes: req.user!.id }
      ]
    })
      .populate('participantes', 'nombre email')
      .populate('organizador', 'nombre email')
      .populate('equipos.equipoA', 'nombre email')
      .populate('equipos.equipoB', 'nombre email')
      .sort({ fechaHora: -1 });

    const formateados = turnos.map(t => ({
      _id: t._id,
      fechaHora: t.fechaHora,
      lugar: t.lugar,
      cupo: t.cupo,
      periodicidad: t.periodicidad,
      esOrganizador: t.organizador._id.toString() === req.user!.id,
      participantes: t.participantes,
      invitados: t.invitados,
      invitationToken: t.invitationToken,
      equipos: {
        equipoA: t.equipos?.equipoA || [],
        equipoB: t.equipos?.equipoB || [],
        invitadosA: t.equipos?.invitadosA || [],
        invitadosB: t.equipos?.invitadosB || [],
      },
    }));

    res.json(formateados);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener turnos' });
  }
});


export default router;