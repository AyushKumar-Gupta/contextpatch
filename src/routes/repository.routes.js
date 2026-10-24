import { Router } from 'express';
import { analyzeRepository } from '../analyzers/repository.analyzer.js';
import { addModelExplanation } from '../services/explanation.service.js';

const router = Router();
router.post('/analyze', async (req, res, next) => {
  try {
    const repositoryPath = typeof req.body?.repositoryPath === 'string' ? req.body.repositoryPath.trim() : '';
    if (!repositoryPath) return res.status(400).json({ error: 'repositoryPath is required.' });
    const report = analyzeRepository(repositoryPath);
    res.json(await addModelExplanation(report));
  } catch (error) { next(error); }
});
export default router;
