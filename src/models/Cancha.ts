// models/Cancha.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICancha extends Document {
  nombre: string;
  direccion: string;
  localidad: string;
  provincia: string;
  telefono?: string;
  sitioWeb?: string;
}

const CanchaSchema = new Schema<ICancha>({
  nombre: { type: String, required: true },
  direccion: { type: String, required: true },
  localidad: { type: String, required: true },
  provincia: { type: String, required: true },
  telefono: { type: String },
  sitioWeb: { type: String }
});

export default mongoose.model<ICancha>('Cancha', CanchaSchema);