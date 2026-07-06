import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import analyzePrescription from './api/analyze-prescription.js';

const LOCAL_API_PATH = '/api/analyze-prescription';
const MAX_LOCAL_API_BODY_SIZE = 5_500_000;

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_LOCAL_API_BODY_SIZE) {
      const error = new Error('The local API request is too large.');
      error.statusCode = 413;
      error.code = 'request_too_large';
      throw error;
    }
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

function addVercelResponseHelpers(response) {
  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };
  response.json = (payload) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(payload));
    return response;
  };
}

function localApiPlugin() {
  return {
    name: 'medilens-local-api',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.url?.split('?')[0] !== LOCAL_API_PATH) return next();

        addVercelResponseHelpers(response);
        try {
          if (request.method === 'POST') request.body = await readJsonBody(request);
          await analyzePrescription(request, response);
        } catch (error) {
          if (response.writableEnded) return;
          const statusCode = error.statusCode || (error instanceof SyntaxError ? 400 : 500);
          response.status(statusCode).json({
            error: statusCode === 400 ? 'The request body must be valid JSON.' : error.message,
            code: error.code || (statusCode === 400 ? 'invalid_json' : 'local_api_error'),
          });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.GEMINI_MODEL) process.env.GEMINI_MODEL = env.GEMINI_MODEL;
  if (!process.env.NODE_ENV) process.env.NODE_ENV = mode === 'production' ? 'production' : 'development';

  return {
    plugins: [localApiPlugin(), react(), tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      watch: {
        ignored: ['**/work/**', '**/outputs/**'],
      },
    },
  };
});
