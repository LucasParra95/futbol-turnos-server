import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  nombre: string;
  email: string;
  passwordHash: string;
  turnosCreados: mongoose.Types.ObjectId[];
  turnosUnidos: mongoose.Types.ObjectId[];
  canchasAgendadas: mongoose.Types.ObjectId[];
}

const UserSchema = new Schema<IUser>({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  turnosCreados: [{ type: Schema.Types.ObjectId, ref: 'Turno' }],
  turnosUnidos: [{ type: Schema.Types.ObjectId, ref: 'Turno' }],
  canchasAgendadas: [{ type: Schema.Types.ObjectId, ref: 'Cancha' }],
});

export default mongoose.model<IUser>('User', UserSchema);
