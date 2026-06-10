import { Request, Response } from 'express';
import { documentoService } from '../services/documentoService';
import { logger } from '../utils/logger';

export const documentoController = {
  cadastrar: async (req: Request, res: Response) => {
    try {
      const resultado = await documentoService.cadastrarDocumento(req.body);
      logger.info({ codigoDocumento: req.body.codigoDocumento }, 'documento recebido com sucesso');
      return res.status(201).json(resultado);
    } catch (error: any) {
      logger.error({ err: error, body: req.body }, 'Erro ao receber documento');
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Erro de duplicidade: Documento já recebido.' });
      }
      
      if (error.code === 'P2003') {
        return res.status(400).json({ error: 'O pedido informado não existe no sistema.' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  buscar: async (req: Request, res: Response) => {
    try {
      const codigoPedido = parseInt(req.params.codigoPedido);
      const documentos = await documentoService.buscarDocumentos(codigoPedido);
      return res.status(200).json(documentos);
    } catch (error) {
      logger.error({ err: error, codigoDocumento: req.body.codigoDocumento }, 'Erro ao buscar documento');
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  listarTodos: async (req: Request, res: Response) => {
      try {
        const documentos = await documentoService.listarDocumentos();
        
        if (documentos.length === 0) {
          logger.info('Nenhum documento cadastrado');
          return res.status(404).json({ error: 'Nenhum documento cadastrado.' });
        } else {
          logger.info({ totalPedidos: documentos.length }, 'documentos listados com sucesso');
        }
  
        return res.status(200).json(documentos);
      } catch (error) {
        logger.error({ err: error}, 'Erro ao listar todos os documentos');
        return res.status(500).json({ error: 'Erro interno.' });
      }
    }
};