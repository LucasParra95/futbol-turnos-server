import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface Invitado {
  nombre: string;
  email: string;
  estado?: 'pendiente' | 'confirmado' | 'cancelado';
  registrado?: boolean;
  userId?: mongoose.Types.ObjectId;
}

export interface InvitadoSimple {
  nombre?: string;
  email?: string;
}

export interface ITurno extends Document {
  fechaHora: Date;
  lugar: string;
  cupo: number;
  participantes: mongoose.Types.ObjectId[];
  enEspera: mongoose.Types.ObjectId[];
  organizador: mongoose.Types.ObjectId;
  periodicidad: 'único' | 'semanal';
  resultado?: {
    equipoA: number;
    equipoB: number;
  };
  equipos?: {
    equipoA: mongoose.Types.ObjectId[];
    equipoB: mongoose.Types.ObjectId[];
    invitadosA: Invitado[];
    invitadosB: Invitado[];
  };
  invitationToken: string;
  invitados: Invitado[];
}

const InvitadoSchema = new Schema<Invitado>({
  nombre: String,
  email: String,
  estado: { type: String, enum: ['pendiente', 'confirmado', 'cancelado'], default: 'pendiente' },
  registrado: { type: Boolean, default: false },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const TurnoSchema = new Schema<ITurno>({
  fechaHora: { type: Date, required: true },
  lugar: { type: String, required: true },
  cupo: { type: Number, required: true },
  participantes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  enEspera: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  organizador: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  periodicidad: { type: String, enum: ['único', 'semanal'], default: 'único' },
  resultado: {
    equipoA: Number,
    equipoB: Number,
  },
  equipos: {
    equipoA: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    equipoB: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    invitadosA: [ InvitadoSchema ],
    invitadosB: [ InvitadoSchema ],
  },
  invitationToken: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(8).toString('hex'),
  },
  invitados: [InvitadoSchema],
}, { timestamps: true });

export default mongoose.model<ITurno>('Turno', TurnoSchema);
