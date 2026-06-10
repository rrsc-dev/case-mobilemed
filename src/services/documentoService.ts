import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getIntegracaoPedido = async (codigoPedido: number): Promise<boolean> => {
  const pedidoExistente = await prisma.pedido.findUnique({
    where: { codigoPedido }
  });

  return pedidoExistente ? pedidoExistente.integrado : false;
};

const salvarDocumento = async (dadosDocumento: any, isIntegrado: boolean) => {
  const { CodigoDocumento, CodigoPedido, 'Nome Documento': nomeDocumentoEspaco, NomeDocumento, Documento } = dadosDocumento;
  const nomeFinal = nomeDocumentoEspaco || NomeDocumento;

  await prisma.documento.create({
    data: {
      codigoDocumento: CodigoDocumento,
      codigoPedido: CodigoPedido,
      nomeDocumento: nomeFinal,
      documento: Documento,
      integrado: isIntegrado
    }
  });
};

export const documentoService = {
  
  cadastrarDocumento: async (dadosDocumento: any) => {
    const { CodigoPedido } = dadosDocumento;

    const isIntegrado = await getIntegracaoPedido(CodigoPedido);

    await salvarDocumento(dadosDocumento, isIntegrado);

    return { message: 'Documento recebido com sucesso.', integrado: isIntegrado };
  },

  buscarDocumentos: async (codigoPedido: number) => {
    return prisma.documento.findMany({
      where: { codigoPedido }
    });
  },

  listarDocumentos: async () => {
    const documentos = await prisma.documento.findMany({
      orderBy: { codigoDocumento: 'desc' },
    });

    return documentos;
  }
};