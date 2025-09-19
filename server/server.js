import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

app.use(cors());
app.use(express.json());

// Servimos la carpeta 'public' para archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Definimos la ruta principal index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
})

app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});