// Vercel Serverless Function Entry Point
import app from '../src/index';

export const config = {
  runtime: 'nodejs20.x',
};

export default app;
