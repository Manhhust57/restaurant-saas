import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    // Keep CSS module class names stable between client build and prerender SSR build.
    css: {
        modules: {
            generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
    },
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                ws: true,
            },
        },
    },
    preview: {
        host: true,
        port: 4173,
    },
});
