import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Turno from '../models/Turno';

const router = express.Router();

// Obtener turno desde token
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const turno = await Turno.findOne({ invitationToken: token })
      .populate('organizador', 'nombre email')
      .populate('participantes', 'nombre email')
      .populate('enEspera', 'nombre email')
      .exec();

    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    const cantidadConfirmados = turno.participantes.length + (turno.invitados?.filter(i => i.estado === 'confirmado').length || 0);

    res.json({
      _id: turno._id,
      lugar: turno.lugar,
      fechaHora: turno.fechaHora,
      cupo: turno.cupo,
      cantidadConfirmados,
      organizador: turno.organizador,
      participantes: turno.participantes,
      invitados: turno.invitados,
      enEspera: turno.enEspera,
    });
  } catch (error) {
    console.error('Error al obtener turno por token:', error);
    res.status(500).json({ message: 'Error al acceder al turno' });
  }
});


router.post('/:token/confirmar', async (req, res) => {
  try {
    const { token } = req.params;
    const { nombre, email } = req.body;

    const turno = await Turno.findOne({ invitationToken: token })
      .populate('participantes', 'nombre email')
      .populate('invitados', 'nombre email')
      .exec();

    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    if (!nombre || !email) {
      return res.status(400).json({ message: 'Faltan nombre o email del invitado' });
    }

    const yaExiste = turno.invitados.some((i) => {
      const nombreInv = i.nombre?.toLowerCase();
      const emailInv = i.email?.toLowerCase();
      return (
        (nombreInv && nombreInv === nombre?.toLowerCase()) ||
        (emailInv && emailInv === email?.toLowerCase())
      );
    });

    const yaRegistrado = (email: string) => {
      return turno.participantes.some(
        (p: any) => p.email?.trim().toLowerCase() === email.trim().toLowerCase()
      );
    };
    

    if (yaExiste || yaRegistrado(email)) {
      return res.status(400).json({ message: '❌ Ya existe un invitado con ese nombre o email' });
    }

    // Revisar si está logueado
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(
          authHeader.split(' ')[1],
          process.env.JWT_SECRET || 'secretkey123'
        ) as { id: string };
        userId = decoded.id;
      } catch {
        userId = null;
      }
    }

    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Verificar si ya está anotado
      const yaRegistrado =
        turno.participantes.some((id) => id.equals(userObjectId)) ||
        turno.enEspera.some((id) => id.equals(userObjectId));

      if (yaRegistrado) {
        return res.status(400).json({ message: 'Ya estás registrado en este turno' });
      }

      if (turno.participantes.length < turno.cupo) {
        turno.participantes.push(userObjectId);
      } else {
        turno.enEspera.push(userObjectId);
      }
    } else {
      // Invitado no registrado
      turno.invitados.push({
        nombre: nombre || '',
        email: email || '',
        estado: 'confirmado',
        registrado: false,
      });
    }

    await turno.save();
    return res.json({ message: 'Asistencia confirmada con éxito' });

  } catch (error) {
    console.error('Error al confirmar asistencia:', error);
    res.status(500).json({ message: 'Error al confirmar asistencia' });
  }
});

router.patch('/:token/equipo', async (req: Request, res: Response) => {
  const { token } = req.params;
  const { equipo } = req.body;

  if (!['A', 'B'].includes(equipo)) {
    return res.status(400).json({ message: 'Equipo inválido. Debe ser A o B' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secretkey123') as any;
    const userId = new mongoose.Types.ObjectId(decoded.id);

    const turno = await Turno.findOne({ invitationToken: token });
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    // Verificar que sea participante
    const esParticipante = turno.participantes.some(p => p.toString() === userId.toString());
    if (!esParticipante) {
      return res.status(403).json({ message: 'Solo los participantes registrados pueden unirse a un equipo' });
    }

    // Inicializar equipos si no existe
    if (!turno.equipos) {
      turno.equipos = { equipoA: [], equipoB: [], invitadosA: [], invitadosB: [] };
    }

    // Quitar usuario de ambos equipos si ya estaba asignado
    turno.equipos.equipoA = turno.equipos.equipoA.filter(id => id.toString() !== userId.toString());
    turno.equipos.equipoB = turno.equipos.equipoB.filter(id => id.toString() !== userId.toString());

    // Agregar al equipo correspondiente
    if (equipo === 'A') {
      turno.equipos.equipoA.push(userId);
    } else {
      turno.equipos.equipoB.push(userId);
    }

    await turno.save();
    return res.json({ message: `Te uniste al equipo ${equipo}` });

  } catch (error) {
    console.error('Error al asignar equipo:', error);
    res.status(500).json({ message: 'Error al asignar equipo' });
  }
});

export default router;
