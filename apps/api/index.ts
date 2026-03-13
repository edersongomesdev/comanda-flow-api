import express, { type Request, type Response } from 'express';
import { createApp } from './src/bootstrap-app';

const expressServer = express();
const appPromise = createApp(expressServer).then((app) => app.init());

export default async function handler(req: Request, res: Response) {
  await appPromise;
  expressServer(req, res);
}
