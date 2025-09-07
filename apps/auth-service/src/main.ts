import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
// import swaggerUI from 'swagger-ui-express';
import { ApiResponse } from '@multi-venden/backend-utils';
import userRoutes from './routes/user.route.js';

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(morgan('dev'));
app.use(helmet());
app.use(
  cors({
    origin: [''],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'authorization'],
  })
);
app.use(cookieParser());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json(
    new ApiResponse(200, 'health checkup of API', {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
    })
  );
});
// app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
// app.get('/docs-json', (req: Request, res: Response) => {
//   res.status(200).json(swaggerDocument);
// });

app.use('/api/v1', userRoutes);

const port = process.env.API_AUTH_SERVICE_PORT
  ? Number(process.env.API_AUTH_SERVICE_PORT)
  : 3000;

app.listen(port, () => {
  console.log(`Auth Services is running at http://localhost:${port}/api`);
  console.log(`Swagger Docs Available at http://localhost:${port}/api-doc`);
});
