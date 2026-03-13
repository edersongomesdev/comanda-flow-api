import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { createApp } from './src/bootstrap-app';

const expressServer = express();
const appPromise = createApp(expressServer)
  .then((app) => app.init())
  .catch((error) => {
    console.error('Failed to initialize Nest app for Vercel.', error);
    throw error;
  });

expressServer.use(
  async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      await appPromise;
      next();
    } catch (error) {
      next(error);
    }
  },
);

expressServer.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    console.error('API bootstrap failed before handling the request.', error);
    res.status(500).json({
      statusCode: 500,
      message: 'API bootstrap failed.',
      error: 'Internal Server Error',
    });
  },
);

export default expressServer;
