import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upload, getQRStatus, uploadQR, deleteQR } from '../controllers/SettingsController.js';

const router = Router();

router.use(authMiddleware);

// Obtener estado de QR subidos
router.get('/qr', getQRStatus);

// Subir QR (yape | plin | tarjeta)
router.post('/qr/:tipo', upload.single('qr'), uploadQR);

// Eliminar QR
router.delete('/qr/:tipo', deleteQR);

export default router;
