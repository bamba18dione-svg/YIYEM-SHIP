import { Router } from 'express';
import { getProducts } from '../controllers/catalogue.controller.js';

export const catalogueRouter = Router();

catalogueRouter.get('/api', getProducts);
