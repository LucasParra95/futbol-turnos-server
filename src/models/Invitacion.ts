import mongoose, { Schema, Document } from 'mongoose';

export interface IInvitacion extends Document {
  email: string;
  turno: mongoose.Types.ObjectId;
  usado: boolean;
  creadoEn: Date;
}

const InvitacionSchema = new Schema<IInvitacion>({
  email: { type: String, required: true },
  turno: { type: Schema.Types.ObjectId, ref: 'Turno', required: true },
  usado: { type: Boolean, default: false },
  creadoEn: { type: Date, default: Date.now },
});

export default mongoose.model<IInvitacion>('Invitacion', InvitacionSchema);
