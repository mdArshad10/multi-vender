import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import expressProxy from 'express-http-proxy';
// import swaggerUI from 'swagger-ui-express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(morgan('dev'));
app.use(
  cors({
    origin: 'http://localhost:3000',
    allowedHeaders: ['Content-type', 'authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);
app.use(helmet());
app.use(cookieParser());
app.set('trust proxy', 1);

// apply rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: any) => (req.user ? 1000 : 100),
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: true,
  // keyGenerator: (req: any) => req.ip,
});

app.use(limiter);

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});

app.use('/api/auth', expressProxy('http://localhost:8001'));

const port = process.env.API_GATEWAY_PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
