import { Router, Request, Response } from 'express';
import { pedidoController } from '../controllers/pedidoController';
import { documentoController } from '../controllers/documentoController';
import { exameController } from '../controllers/exameController';

const routes = Router();

routes.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'online', 
    message: 'API em funcionamento' 
  });
});

routes.post('/pedidos', pedidoController.cadastrar);
routes.get('/pedidos/:codigoPedido', pedidoController.buscar);
routes.get('/pedidos', pedidoController.listarTodos);

routes.post('/documentos', documentoController.cadastrar);
routes.get('/documentos/:codigoPedido', documentoController.buscar);
routes.get('/documentos', documentoController.listarTodos);

routes.post('/exames', exameController.cadastrar);
routes.get('/exames/:accessionNumber', exameController.buscar);
routes.get('/exames', exameController.listarTodos);

export { routes };