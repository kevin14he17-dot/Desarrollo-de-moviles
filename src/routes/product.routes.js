import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ProductController from '../controllers/ProductController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { productValidator, productPriceValidator, productStockValidator } from '../validators/productValidator.js';

const router = express.Router();

// Setup multer para imágenes de producto
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCT_IMG_DIR = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(PRODUCT_IMG_DIR)) fs.mkdirSync(PRODUCT_IMG_DIR, { recursive: true });

const productImgStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PRODUCT_IMG_DIR),
  filename:    (req, file, cb) => cb(null, `${req.params.id}.png`)
});
const uploadImg = multer({
  storage: productImgStorage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo imágenes'), false);
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Aplicar autenticación en todas las rutas
router.use(authMiddleware);

// GET - Obtener listado de productos con paginación y filtros (cualquier usuario autenticado)
router.get('/', ProductController.getProducts);

// GET - Obtener productos con stock bajo
router.get('/low-stock', ProductController.getLowStockProducts);

// GET - Obtener un producto por ID
router.get('/:id', ProductController.getProductById);

// POST - Crear nuevo producto (Admin, Gerente)
router.post('/', requireRole('Administrador', 'Gerente'), productValidator, ProductController.createProduct);

// PUT - Actualizar producto completo (Admin, Gerente)
router.put('/:id', requireRole('Administrador', 'Gerente'), productValidator, ProductController.updateProduct);

// PATCH - Actualizar solo los precios (Admin, Gerente)
router.patch('/:id/prices', requireRole('Administrador', 'Gerente'), productPriceValidator, ProductController.updateProductPrices);

// PATCH - Actualizar stock (Admin, Gerente)
router.patch('/:id/stock', requireRole('Administrador', 'Gerente'), productStockValidator, ProductController.updateProductStock);

// DELETE - Eliminar producto (soft delete) (Admin)
router.delete('/:id', requireRole('Administrador'), ProductController.deleteProduct);

// POST - Subir imagen de producto
router.post('/:id/image', requireRole('Administrador', 'Gerente'), uploadImg.single('image'), ProductController.uploadImage);

export default router;
