import { Request, Response } from 'express';
import { exameController } from '../exameController';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    exame: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    pedido: {
      update: jest.fn(),
    },
    documento: {
      updateMany: jest.fn(),
    },
  };

  return { PrismaClient: jest.fn(() => mPrisma) };
});

const prisma = new PrismaClient();

describe('ExameController - Unit Tests', () => {
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

  it('Objetivo: salvar o exame isolado quando não houver pedido cadastrado', async () => {
    const req = mockRequest({
      AccessionNumber: 'ACC-123',
      NomePaciente: 'JOAO SILVA',
      Modalidade: 'CR',
      CodigoItemPedido: null,
      NomeProcedimento: null,
    });
    const res = mockResponse();

    (prisma.exame.upsert as any).mockResolvedValue({
      accessionNumber: 'ACC-123',
      nomePaciente: 'JOAO SILVA',
      modalidade: 'CR',
      codigoPedido: null,
    });

    await exameController.cadastrar(req, res);

    expect(prisma.exame.upsert).toHaveBeenCalledWith({
      where: { accessionNumber: 'ACC-123' },
      update: {
        nomePaciente: 'JOAO SILVA',
        status: undefined,
      },
      create: {
        accessionNumber: 'ACC-123',
        nomePaciente: 'JOAO SILVA',
        modalidade: 'CR',
        status: undefined,
      },
    });

    expect(prisma.pedido.update).not.toHaveBeenCalled();
    expect(prisma.documento.updateMany).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Exame recebido com sucesso.',
      integradoAoPedido: false,
    });
  });

  it('Objetivo: sincronizar pedido e documentos pendentes se o pedido já existir', async () => {
    const req = mockRequest({
      AccessionNumber: 'ACC-123',
      NomePaciente: 'JOAO SILVA',
      Modalidade: 'CR',
      CodigoItemPedido: 930,
      NomeProcedimento: 'RX',
      CodigoPedido: 500,
    });
    const res = mockResponse();

    (prisma.exame.upsert as any).mockResolvedValue({
      accessionNumber: 'ACC-123',
      codigoPedido: 500,
    });

    await exameController.cadastrar(req, res);

    expect(prisma.pedido.update).toHaveBeenCalledWith({
      where: { codigoPedido: 500 },
      data: { integrado: true },
    });

    expect(prisma.documento.updateMany).toHaveBeenCalledWith({
      where: { codigoPedido: 500, integrado: false },
      data: { integrado: true },
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Exame recebido com sucesso.',
      integradoAoPedido: true,
    });
  });

  it('Objetivo: retornar erro 409 caso o outro sistema envie um exame que já existe', async () => {
    const req = mockRequest({
      AccessionNumber: 'ACC-123',
      Modalidade: 'CR',
    });
    const res = mockResponse();

    (prisma.exame.upsert as any).mockRejectedValue({ code: 'P2002' });

    await exameController.cadastrar(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});