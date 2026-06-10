import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const verificarIntegracao = async (exames: any[]): Promise<boolean> => {
  if (!exames || exames.length === 0) return false;

  const accessionNumbers = exames.map((e: any) => e.AccessionNumber);
  
  const examesPrevios = await prisma.exame.findMany({
    where: {
      accessionNumber: { in: accessionNumbers },
      status: { not: null }
    }
  });

  return examesPrevios.length > 0;
};

const salvarPedido = async (dadosPedido: any, isIntegrado: boolean) => {
  const { CodigoPedido, NomePaciente, DataNascimento, Sexo, CodUnidade } = dadosPedido;

  await prisma.pedido.upsert({
    where: { codigoPedido: CodigoPedido },
    update: { integrado: isIntegrado ? true : false },
    create: {
      codigoPedido: CodigoPedido,
      nomePaciente: NomePaciente,
      dataNascimento: DataNascimento,
      sexo: Sexo,
      codUnidade: CodUnidade,
      integrado: isIntegrado,
    }
  });
};

const salvarExames = async (exames: any[], codigoPedido: number) => {
  if (!exames || exames.length === 0) return;

  for (const exame of exames) {
    await prisma.exame.upsert({
      where: { accessionNumber: exame.AccessionNumber },
      update: {
        codigoItemPedido: exame.CodigoItemPedido,
        nomeProcedimento: exame.NomeProcedimento,
        codigoPedido: codigoPedido
      },
      create: {
        accessionNumber: exame.AccessionNumber,
        modalidade: exame.Modalidade,
        codigoItemPedido: exame.CodigoItemPedido,
        nomeProcedimento: exame.NomeProcedimento,
        codigoPedido: codigoPedido
      }
    });
  }
};

export const pedidoService = {
  cadastrarPedido: async (dadosPedido: any) => {
    const { CodigoPedido, Exames } = dadosPedido;

    const isIntegrado = await verificarIntegracao(Exames);

    await salvarPedido(dadosPedido, isIntegrado);

    await salvarExames(Exames, CodigoPedido);

    return { message: 'Pedido processado com sucesso.', integrado: isIntegrado };
  },

  buscarPedido: async (codigoPedido: number) => {
    const pedido = await prisma.pedido.findUnique({
      where: { codigoPedido },
      include: { exames: true, documentos: true }
    });

    if (pedido && pedido.exames) {
      pedido.exames = pedido.exames.map(({ codigoPedido, ...exameLimpo }) => exameLimpo) as any;
    }

    return pedido;
  },

  listarPedidos: async (tipo?: string) => {
    const params: any = {
      include: {
        exames: false,
        documentos: false
      }
    };

    if (tipo === 'completo') {
      params.include.exames = true;
      params.include.documentos = true;
    }

    const pedidos = await prisma.pedido.findMany(params);

    return pedidos;
  }
};