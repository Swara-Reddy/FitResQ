import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const AWS_API_TARGET = 'https://qhk28b7ud2.execute-api.ap-south-1.amazonaws.com';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api/v1/ai': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/refund-requests': {
        target: AWS_API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/users': {
        target: AWS_API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/cases': {
        target: AWS_API_TARGET,
        changeOrigin: true,
        secure: true,
        bypass(req) {
          if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return '/index.html';
          }
        },
      },
      '/refunds': {
        target: AWS_API_TARGET,
        changeOrigin: true,
        secure: true,
        bypass(req) {
          if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return '/index.html';
          }
        },
      },
      '/policy': {
        target: AWS_API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/notifications': {
        target: AWS_API_TARGET,
        changeOrigin: true,
        secure: true,
        bypass(req) {
          if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return '/index.html';
          }
        },
      },
    },
  },
});

