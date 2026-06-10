# API de Integração de Pedidos, Exames e Documentos Médicos

API RESTful desenvolvida em **Node.js** com **TypeScript** para realizar a integração entre plataformas e sistemas hospitalares.

O principal objetivo é sincronizar as informações de pedidos, exames e documentos que podem chegar ao servidor em momentos diferentes.

---

# Tecnologias Utilizadas

* **Node.js (v20 LTS) & TypeScript**
* **Express**
* **PostgreSQL**
* **Prisma ORM**
* **Pino (Logger)**
* **Docker & Docker Compose**
* **Jest**

---

# Decisões Técnicas e Arquitetura


## 1. Separação de Camadas (Service Pattern)

### Controllers

Responsáveis exclusivamente pela camada HTTP:

* Receber requisições
* Extrair parâmetros
* Realizar serviços
* Retornar respostas

### Services

Concentram toda a regra de negócio:

* Integrações
* Validações
* Persistência de dados
* Sincronização entre entidades

---

## 2. Logs Estruturados

Utilizei o **Pino** para substituir o `console.log` e melhorar a apresentação dos logs.

### Produção

Logs estruturados em JSON:

```json
{
  "level": "info",
  "msg": "Pedido integrado com sucesso"
}
```

### Desenvolvimento

Utilização do:

```bash
pino-pretty
```

para uma leitura mais facilitada dos logs.

---

## 4. Tratamento de Exceções Nativas do Banco

Utilização das exceções próprias do PostgreSQL para lidar com concorrência.

---

# Fluxo de Funcionamento

## 1. Processamento de Pedidos (`pedidoService.ts`)

### Entrada

* Dados do paciente
* Lista de exames previstos

### Processamento

O sistema verifica se já existem exames recebidos para os mesmos:

```text
AccessionNumbers
```

### Resultado

Se o exame já existir:

```text
integrado = true
```

O pedido é atualizado e associado aos exames previamente recebidos.

---

## 2. Chegada de Exames (`exameService.ts`)

### Entrada

Dados recebidos diretamente do maquinário:

* Status
* Modalidade
* AccessionNumber

### Processamento

É realizado um Upsert na tabela de exames.

### Resultado

Caso o exame já esteja vinculado a um pedido:

* Pedido é marcado como integrado
* Todos os documentos pendentes são atualizados automaticamente

---

## 3. Anexação de Documentos (`documentoService.ts`)

### Entrada

Documento em Base64 vinculado a:

```text
CodigoPedido
```

### Processamento

Valida a existência do pedido relacionado.

### Resultado

O documento herda automaticamente o status do pedido.

Exemplos:

#### Pedido integrado

```text
Documento integrado = true
```

#### Pedido pendente

```text
Documento integrado = false
```

---

# Como Executar o Projeto

## Pré-requisitos

Instale:

* Docker (Versão mais recente)
* Docker Compose (Versão mais recente)

---

## 1. Clonar o repositório

* SSH
```bash
git clone git@github.com:rrsc-dev/case-mobilemed.git
```

ou 

* HTTPS:
```bash
git clone https://github.com/rrsc-dev/case-mobilemed.git
```

```bash
cd case-mobilemed
```

* renomeie o **.env-example** para **.env**

---

## 2. Subir a infraestrutura

```bash
docker compose up -d --build
```

---

## 3. Executar as migrations

Acesse o container:

```bash
docker exec -it integracao_api sh
```

Execute:

```bash
npx prisma migrate deploy
```

Saia do container:

```bash
exit
```

---

## 4. Verificar a aplicação

A API estará disponível em:

```text
http://localhost:3000
```

Acesse a rota raiz:

```text
GET /
```

para validar se a API está executando corretamente.

---

# 🧪 Testes Automatizados

Os testes validam:

* Integração
* Sincronização
* Tratamento de duplicidade
* Controle de concorrência

## Executar os testes

```bash
npm install

npm run test
```

---

# Endpoints

## Pedidos

### Criar ou atualizar pedido

```http
POST /pedidos
```

### Buscar pedido

```http
GET /pedidos/:codigoPedido
```

### Listar todos os pedidos

```http
GET /pedidos/
```

para trazer todos os pedidos cadastros, **SEM** o relacionamento com Exames e Documentos

ou

```http
GET /pedidos?tipo=completo
```

para trazer todos os pedidos cadastros, **COM** o relacionamento com Exames e Documentos

---

## Exames

### Registrar exame

```http
POST /exames
```

### Consultar exame

```http
GET /exames/:accessionNumber
```

### Listar todos os exames

```http
GET /exames
```

---

## Documentos

### Vincular documento

```http
POST /documentos
```

### Listar documentos de um pedido

```http
GET /documentos/:codigoPedido
```

### Listar todos os documentos

```http
GET /documentos
```

---

# Regras de Negócio

* Pedidos podem chegar antes dos exames.
* Exames podem chegar antes dos pedidos.
* Documentos dependem da existência do pedido.
* Integração ocorre automaticamente quando os dados convergem pelo `AccessionNumber`.
* Duplicidades são bloqueadas pelo PostgreSQL.
* O sistema utiliza Upserts para garantir idempotência.

---

# Testes Manuais

## Cenário 1 - Pedido chega e não existe exame correspondente

### Requisição

**POST /pedidos**

```json
{
  "CodigoPedido": 3001,
  "NomePaciente": "José Almeida",
  "DataNascimento": "19800115",
  "Sexo": "M",
  "CodUnidade": 101,
  "Exames": [
    {
      "CodigoItemPedido": 7001,
      "AccessionNumber": "ACC3001",
      "Modalidade": "CR",
      "NomeProcedimento": "RX TORAX"
    }
  ]
}
```

### Validação

```http
GET /pedidos/3001
```

### Resultado Esperado

```json
{
  "codigoPedido": 3001,
  "integrado": false
}
```

## Cenário 2 - Pedido chega e já existe exame com mesmo Accession Number

### Passo 1 - Criar exame primeiro

**POST /exames**

```json
{
  "AccessionNumber": "ACC3002",
  "NomePaciente": "Maria Oliveira",
  "Modalidade": "CT",
  "Status": "NOVO"
}
```

### Passo 2 - Criar pedido

**POST /pedidos**

```json
{
  "CodigoPedido": 3002,
  "NomePaciente": "Maria Oliveira",
  "DataNascimento": "19850210",
  "Sexo": "F",
  "CodUnidade": 102,
  "Exames": [
    {
      "CodigoItemPedido": 7002,
      "AccessionNumber": "ACC3002",
      "Modalidade": "CT",
      "NomeProcedimento": "TOMOGRAFIA CRANIO"
    }
  ]
}
```
### Resultado Esperado

```json
{
  "codigoPedido": 3002,
  "integrado": true
}
```
## Cenário 3 - Documento chega para pedido ainda não integrado

### Passo 1 - Criar pedido sem exame correspondente

POST /pedidos

```json
{
  "CodigoPedido": 3003,
  "NomePaciente": "Carlos Mendes",
  "DataNascimento": "19900120",
  "Sexo": "M",
  "CodUnidade": 103,
  "Exames": [
    {
      "CodigoItemPedido": 7003,
      "AccessionNumber": "ACC3003",
      "Modalidade": "MR",
      "NomeProcedimento": "RESSONANCIA JOELHO"
    }
  ]
}
```

### Passo 2 - Criar documento

**POST /documentos**

```json
{
  "CodigoDocumento": 8001,
  "CodigoPedido": 3003,
  "NomeDocumento": "PEDIDO_MEDICO",
  "Documento": "dGVzdGU="
}
```

Resultado Esperado

```json
{
  "codigoDocumento": 8001,
  "integrado": false
}
```

## Cenário 4 - Depois chega um exame referente a esse pedido
### Requisição

**POST /exames**

```json
{
  "AccessionNumber": "ACC3003",
  "NomePaciente": "Carlos Mendes",
  "Modalidade": "MR",
  "Status": "FINALIZADO"
}
```

### Validação

```http
GET /pedidos/3003
```

### Resultado Esperado

```json
{
  "codigoPedido": 3003,
  "integrado": true,
  "documentos": [
    {
      "codigoDocumento": 8001,
      "integrado": true
    }
  ]
}
```
## Cenário 5 - Pedido chega novamente com novo exame

### Pedido inicial

**POST /pedidos**

```json
{
  "CodigoPedido": 3004,
  "NomePaciente": "Fernanda Costa",
  "DataNascimento": "19950405",
  "Sexo": "F",
  "CodUnidade": 104,
  "Exames": [
    {
      "CodigoItemPedido": 7004,
      "AccessionNumber": "ACC3004A",
      "Modalidade": "CR",
      "NomeProcedimento": "RX MAO"
    }
  ]
}
```

### Atualização do mesmo pedido com exame adicional

**POST /pedidos**

```json
{
  "CodigoPedido": 3004,
  "NomePaciente": "Fernanda Costa",
  "DataNascimento": "19950405",
  "Sexo": "F",
  "CodUnidade": 104,
  "Exames": [
    {
      "CodigoItemPedido": 7004,
      "AccessionNumber": "ACC3004A",
      "Modalidade": "CR",
      "NomeProcedimento": "RX MAO"
    },
    {
      "CodigoItemPedido": 7005,
      "AccessionNumber": "ACC3004B",
      "Modalidade": "CR",
      "NomeProcedimento": "RX PUNHO"
    }
  ]
}
```

### Resultado Esperado

O pedido deve possuir apenas dois exames.

```json
{
  "codigoPedido": 3004,
  "exames": [
    {
      "AccessionNumber": "ACC3004A"
    },
    {
      "AccessionNumber": "ACC3004B"
    }
  ]
}
```

Sem duplicação do exame ACC3004A.

## Cenário 6 - Documento duplicado chega novamente

### Primeiro envio

**POST /documentos**

```json
{
  "CodigoDocumento": 8002,
  "CodigoPedido": 3004,
  "NomeDocumento": "LAUDO",
  "Documento": "dGVzdGU="
}
```

### Segundo envio (idêntico)

**POST /documentos**

```json
{
  "CodigoDocumento": 8002,
  "CodigoPedido": 3004,
  "NomeDocumento": "LAUDO",
  "Documento": "dGVzdGU="
}
```

### Resultado Esperado

```http
409 Conflict
```

```json
{
  "error": "Documento já cadastrado para este pedido."
}
```