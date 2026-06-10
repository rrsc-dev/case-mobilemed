import { Request, Response } from 'express';
import { pedidoService } from '../services/pedidoService';
import { logger } from '../utils/logger';

export const pedidoController = {
  cadastrar: async (req: Request, res: Response) => {
    try {
      const resultado = await pedidoService.cadastrarPedido(req.body);
      logger.info({ codigoPedido: req.body.CodigoPedido }, 'Pedido processado com sucesso');
      return res.status(201).json(resultado);
    } catch (error) {
      logger.error({ err: error, body: req.body }, 'Erro ao processar pedido');
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  buscar: async (req: Request, res: Response) => {
    try {
      const codigoPedido = parseInt(req.params.codigoPedido);
      const pedido = await pedidoService.buscarPedido(codigoPedido);

      if (!pedido) {
        logger.warn({ codigoPedido }, 'Tentativa de buscar um pedido inexistente');
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }

      return res.status(200).json(pedido);
    } catch (error) {
      logger.error({ err: error, codigoPedido: req.params.codigoPedido }, 'Erro ao buscar pedido');
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  listarTodos: async (req: Request, res: Response) => {
    try {
      const { tipo } = req.query;

      const pedidos = await pedidoService.listarPedidos(tipo as string);
      
      if (pedidos.length === 0) {
        logger.info('Nenhum pedido cadastrado');
        return res.status(404).json({ error: 'Nenhum pedido cadastrado.' });
      } else {
        logger.info({ totalPedidos: pedidos.length }, 'Pedidos listados com sucesso');
      }

      return res.status(200).json(pedidos);
    } catch (error) {
      logger.error({ err: error, codigoPedido: req.params.codigoPedido }, 'Erro ao listar todos os pedids');
      return res.status(500).json({ error: 'Erro interno.' });
    }
  }
};