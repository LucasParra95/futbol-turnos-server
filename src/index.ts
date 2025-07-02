import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import protectedRoutes from './routes/protected';
import turnosRoutes from './routes/turnos';
import usuariosRoutes from './routes/usuarios';
import invitacionRoutes from './routes/invitacion';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || '';
const CLIENT_URL = process.env.CLIENT_URL || '';

// Middlewares
app.use(cors({
  origin: `${CLIENT_URL}`,
  credentials: true
}));
app.use(express.json());

// Rutas de prueba
app.get('/', (req, res) => {
  res.send('API Fútbol 5 - ¡Funciona!');
});

// Conexión a MongoDB y arranque del servidor
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al conectar con MongoDB:', err);
  });

app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/invitacion', invitacionRoutes);
