import { Request, Response } from 'express';
import { pedidoController } from '../pedidoController';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    exame: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    pedido: {
      upsert: jest.fn(),
    },
  };

  return { PrismaClient: jest.fn(() => mPrisma) };
});

const prisma = new PrismaClient();

describe('PedidoController - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  const mockRequest = (body: any) => ({ body } as Request);

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  it('Objetivo: criar um pedido novo e salvar os exames', async () => {
    const req = mockRequest({
      CodigoPedido: 1001,
      NomePaciente: 'ALEFHER',
      DataNascimento: '19970601',
      Sexo: 'M',
      CodUnidade: 104,
      Exames: [
        {
          AccessionNumber: 'ACC-930',
          Modalidade: 'CR',
          CodigoItemPedido: 930,
          NomeProcedimento: 'RX',
        },
      ],
    });
    const res = mockResponse();

    (prisma.exame.findMany as any).mockResolvedValue([]);
    (prisma.pedido.upsert as any).mockResolvedValue({});
    (prisma.exame.upsert as any).mockResolvedValue({});

    await pedidoController.cadastrar(req, res);

    expect(prisma.exame.findMany).toHaveBeenCalledWith({
      where: { 
        accessionNumber: { in: ['ACC-930'] },
        status: { not: null }
      },
    });

    expect(prisma.pedido.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { codigoPedido: 1001 },
        create: expect.objectContaining({
          codigoPedido: 1001,
          integrado: false,
        }),
      })
    );

    expect(prisma.exame.upsert).toHaveBeenCalledWith({
      where: { accessionNumber: 'ACC-930' },
      update: {
        codigoItemPedido: 930,
        nomeProcedimento: 'RX',
        codigoPedido: 1001,
      },
      create: {
        accessionNumber: 'ACC-930',
        modalidade: 'CR',
        codigoItemPedido: 930,
        nomeProcedimento: 'RX',
        codigoPedido: 1001,
      }
    });

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('Objetivo: marcar o pedido como integrado (true) se o exame já existir', async () => {
    const req = mockRequest({
      CodigoPedido: 1002,
      NomePaciente: 'MARIA',
      DataNascimento: '19900101',
      Sexo: 'F',
      CodUnidade: 101,
      Exames: [
        {
          AccessionNumber: 'ACC-999',
          Modalidade: 'CT',
          CodigoItemPedido: 800,
          NomeProcedimento: 'TOMOGRAFIA',
        },
      ],
    });
    const res = mockResponse();

    (prisma.exame.findMany as any).mockResolvedValue([
      { accessionNumber: 'ACC-999', status: 'CONCLUIDO' },
    ]);

    await pedidoController.cadastrar(req, res);

    expect(prisma.pedido.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ integrado: true }),
        update: expect.objectContaining({ integrado: true }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });
});