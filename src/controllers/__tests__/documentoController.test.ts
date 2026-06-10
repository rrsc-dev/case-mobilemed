import { Request, Response } from 'express';
import { documentoController } from '../documentoController';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    pedido: {
      findUnique: jest.fn(),
    },
    documento: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  return { PrismaClient: jest.fn(() => mPrisma) };
});

const prisma = new PrismaClient();

describe('DocumentoController - Unit Tests', () => {
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

  it('Objetivo: salvar o documento como NÃO integrado se o pedido ainda não existir ou não estiver integrado', async () => {
    const req = mockRequest({
      CodigoDocumento: 251,
      CodigoPedido: 615,
      NomeDocumento: 'PEDIDO',
      Documento: 'base64',
    });
    const res = mockResponse();

    (prisma.pedido.findUnique as any).mockResolvedValue(null);

    await documentoController.cadastrar(req, res);

    expect(prisma.pedido.findUnique).toHaveBeenCalledWith({
      where: { codigoPedido: 615 },
    });

    expect(prisma.documento.create).toHaveBeenCalledWith({
      data: {
        codigoDocumento: 251,
        codigoPedido: 615,
        nomeDocumento: 'PEDIDO',
        documento: 'base64',
        integrado: false,
      },
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Documento recebido com sucesso.',
      integrado: false,
    });
  });

  it('Objetivo: salvar o documento como NÃO integrado se o pedido existir mas ainda não estiver integrado', async () => {
    const req = mockRequest({
      CodigoDocumento: 253,
      CodigoPedido: 617,
      NomeDocumento: 'LAUDO',
      Documento: 'base64',
    });
    const res = mockResponse();

    (prisma.pedido.findUnique as any).mockResolvedValue({ integrado: false });

    await documentoController.cadastrar(req, res);

    expect(prisma.documento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ integrado: false }),
      })
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ integrado: false })
    );
  });

  it('Objetivo: trazer o status de integrado (true) se o pedido associado já estiver integrado', async () => {
    const req = mockRequest({
      CodigoDocumento: 252,
      CodigoPedido: 616,
      NomeDocumento: 'ENCAMINHAMENTO',
      Documento: 'base64',
    });
    const res = mockResponse();

    (prisma.pedido.findUnique as any).mockResolvedValue({ integrado: true });

    await documentoController.cadastrar(req, res);

    expect(prisma.documento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ integrado: true }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ integrado: true })
    );
  });

  it('Objetivo: retornar erro 409 caso seja enviado um documento duplicado (mesmo CodigoDocumento e CodigoPedido)', async () => {
    const req = mockRequest({
      CodigoDocumento: 251,
      CodigoPedido: 615,
      NomeDocumento: 'PEDIDO',
      Documento: 'base64',
    });
    const res = mockResponse();

    (prisma.pedido.findUnique as any).mockResolvedValue(null);

    (prisma.documento.create as any).mockRejectedValue({ code: 'P2002' });

    await documentoController.cadastrar(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Erro de duplicidade: Documento já recebido.',
    });
  });
});