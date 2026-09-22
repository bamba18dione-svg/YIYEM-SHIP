import { Router } from 'express';
import { deleteProduct, getDashboard, saveProduct, updateOrderStatus } from '../controllers/manager.controller.js';
import { requireManager } from '../middleware/manager-auth.js';
import { upload } from '../middleware/upload.js';

export const managerRouter = Router();

managerRouter.get('/api/dashboard', requireManager, getDashboard);
managerRouter.post('/api/product', requireManager, upload.single('image'), saveProduct);
managerRouter.delete('/api/product/:id', requireManager, deleteProduct);
managerRouter.patch('/api/order/:id/status', requireManager, updateOrderStatus);
managerRouter.post('/api/order/:id/status', requireManager, updateOrderStatus);
