-- CreateTable
CREATE TABLE "Pedido" (
    "codigoPedido" INTEGER NOT NULL,
    "nomePaciente" TEXT NOT NULL,
    "dataNascimento" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "codUnidade" INTEGER NOT NULL,
    "integrado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("codigoPedido")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "codigoItemPedido" INTEGER NOT NULL,
    "accessionNumber" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL,
    "nomeProcedimento" TEXT NOT NULL,
    "pedidoId" INTEGER NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("codigoItemPedido","pedidoId")
);

-- CreateTable
CREATE TABLE "ExameRecebido" (
    "accessionNumber" TEXT NOT NULL,
    "nomePaciente" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "ExameRecebido_pkey" PRIMARY KEY ("accessionNumber")
);

-- CreateTable
CREATE TABLE "Documento" (
    "codigoDocumento" INTEGER NOT NULL,
    "codigoPedido" INTEGER NOT NULL,
    "nomeDocumento" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "integrado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("codigoDocumento","codigoPedido")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemPedido_accessionNumber_key" ON "ItemPedido"("accessionNumber");

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("codigoPedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_codigoPedido_fkey" FOREIGN KEY ("codigoPedido") REFERENCES "Pedido"("codigoPedido") ON DELETE RESTRICT ON UPDATE CASCADE;
