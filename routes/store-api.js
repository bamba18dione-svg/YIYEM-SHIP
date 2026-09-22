import { Router } from 'express';
import { handleStoreAction } from '../controllers/store.controller.js';

export const storeRouter = Router();

storeRouter.post('/api', handleStoreAction);
