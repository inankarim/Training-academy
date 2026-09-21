import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
var dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@components': path.resolve(dirname, 'src/components'),
            '@layouts': path.resolve(dirname, 'src/layouts'),
            '@pages': path.resolve(dirname, 'src/pages'),
            '@features': path.resolve(dirname, 'src/features'),
            '@services': path.resolve(dirname, 'src/services'),
            '@hooks': path.resolve(dirname, 'src/hooks'),
            '@stores': path.resolve(dirname, 'src/stores'),
            '@types': path.resolve(dirname, 'src/types'),
            '@utils': path.resolve(dirname, 'src/utils'),
            '@config': path.resolve(dirname, 'src/config'),
            '@assets': path.resolve(dirname, 'src/assets'),
        },
    },
    server: {
        port: 5173,
    },
});
