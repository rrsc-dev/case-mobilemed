import { Request, Response } from 'express';
import { exameService } from '../services/exameService';
import { logger } from '../utils/logger';

export const exameController = {
  cadastrar: async (req: Request, res: Response) => {
    try {
      const resultado = await exameService.cadastrarExame(req.body);
      logger.info({ codigoPedido: req.body.CodigoPedido }, 'Exame processado com sucesso');
      return res.status(201).json(resultado);
    } catch (error: any) {
        logger.error({ err: error, body: req.body }, 'Erro ao processar exame');
        
        if (error.code === 'P2002') {
          return res.status(409).json({ error: 'Exame já recebido anteriormente.' });
        }
        
        return res.status(500).json({ error: 'Erro interno do servidor.' });
      }
  },

  buscar: async (req: Request, res: Response) => {
    try {
      const exame = await exameService.buscarExame(req.params.accessionNumber);
      
      if (!exame) {
        logger.warn({ accessionNumber: req.params.accessionNumber }, 'Exame não encontrado');
        return res.status(404).json({ error: 'Exame não encontrado.' });
      }

      return res.status(200).json(exame);
    } catch (error) {
      logger.error({ err: error, codigoPedido: req.params.accessionNumber }, 'Erro ao buscar exame');
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  listarTodos: async (req: Request, res: Response) => {
    try {
      const exames = await exameService.listarExames();
      
      if (exames.length === 0) {
        logger.info('Nenhum exame cadastrado');
        return res.status(404).json({ error: 'Nenhum exame cadastrado.' });
      } else {
        logger.info({ totalPedidos: exames.length }, 'Exames listados com sucesso');
      }

      return res.status(200).json(exames);
    } catch (error) {
      logger.error({ err: error}, 'Erro ao listar todos os exames');
      return res.status(500).json({ error: 'Erro interno.' });
    }
  }
};