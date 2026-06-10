import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const salvarOuAtualizarExame = async (dadosExame: any) => {
  const { AccessionNumber, NomePaciente, Modalidade, Status } = dadosExame;
  
  return await prisma.exame.upsert({
    where: { accessionNumber: AccessionNumber },
    update: {
      nomePaciente: NomePaciente,
      status: Status
    },
    create: {
      accessionNumber: AccessionNumber,
      nomePaciente: NomePaciente,
      modalidade: Modalidade,
      status: Status
    }
  });
};

const sincronizarPedidoEDocumentos = async (codigoPedido: number) => {
  await prisma.pedido.update({
    where: { codigoPedido },
    data: { integrado: true }
  });

  await prisma.documento.updateMany({
    where: { codigoPedido, integrado: false },
    data: { integrado: true }
  });
};

export const exameService = {
  
  cadastrarExame: async (dadosExame: any) => {
    const exame = await salvarOuAtualizarExame(dadosExame);

    let integradoAoPedido = false;

    if (exame.codigoPedido) {
      await sincronizarPedidoEDocumentos(exame.codigoPedido);
      integradoAoPedido = true;
    }

    return { message: 'Exame recebido com sucesso.', integradoAoPedido };
  },

  buscarExame: async (accessionNumber: string) => {
    const exame = await prisma.exame.findUnique({
      where: { accessionNumber }
    });

    if (exame) {
      const { codigoPedido, ...exameSemChaveInterna } = exame;
      return exameSemChaveInterna;
    }
    
    return null;
  },

  listarExames: async () => {
    const exames = await prisma.exame.findMany({
      orderBy: { accessionNumber: 'desc' },
    });

    return exames;
  }

};