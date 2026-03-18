import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QR_DIR = path.join(__dirname, '../../uploads/qr');

// Asegurar que exista la carpeta
if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, QR_DIR),
  filename: (req, file, cb) => {
    // Nombre fijo según el tipo: yape.png, plin.png, tarjeta.png
    const tipo = req.params.tipo?.toLowerCase();
    const allowed = ['yape', 'plin', 'tarjeta'];
    if (!allowed.includes(tipo)) return cb(new Error('Tipo inválido'));
    cb(null, `${tipo}.png`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo se permiten imágenes'), false);
  cb(null, true);
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/settings/qr — devuelve qué QR están subidos
export async function getQRStatus(req, res) {
  const tipos = ['yape', 'plin', 'tarjeta'];
  const BASE = `${req.protocol}://${req.get('host')}`;
  const result = {};
  for (const t of tipos) {
    const file = path.join(QR_DIR, `${t}.png`);
    result[t] = fs.existsSync(file) ? `${BASE}/uploads/qr/${t}.png` : null;
  }
  res.json({ success: true, data: result });
}

// POST /api/settings/qr/:tipo — sube o reemplaza el QR
export async function uploadQR(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
  const BASE = `${req.protocol}://${req.get('host')}`;
  res.json({
    success: true,
    message: `QR de ${req.params.tipo} actualizado`,
    data: { url: `${BASE}/uploads/qr/${req.params.tipo.toLowerCase()}.png` }
  });
}

// DELETE /api/settings/qr/:tipo — elimina el QR
export async function deleteQR(req, res) {
  const tipo = req.params.tipo?.toLowerCase();
  const file = path.join(QR_DIR, `${tipo}.png`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ success: true, message: `QR de ${tipo} eliminado` });
}
