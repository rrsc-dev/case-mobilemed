import express, { Request, Response } from 'express';
import { routes } from './routes';

const app = express();
app.use(express.json());

app.use(routes);

const PORT = process.env.PORT || 3000;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
};

startServer();