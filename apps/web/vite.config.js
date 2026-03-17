import path from 'node:path';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import { createLogger, defineConfig } from 'vite';

console.warn = () => {};

const logger = createLogger()
const loggerError = logger.error

logger.error = (msg, options) => {
	if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
		return;
	}

	loggerError(msg, options);
}

export default defineConfig({
	customLogger: logger,
	plugins: [
		react(),
		vike(),
	],
	server: {
		port: 3000,
		cors: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
		},
		allowedHosts: true,
		proxy: {
			'/hcgi/platform': {
				target: 'http://localhost:8090',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/hcgi\/platform/, ''),
				ws: true,
			},
			'/api/ai/openai': {
				target: 'https://api.openai.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/ai\/openai/, ''),
				secure: true,
			},
			'/api/ai/openrouter': {
				target: 'https://openrouter.ai/api',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/ai\/openrouter/, ''),
				secure: true,
			},
		},
	},
	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	build: {
		rollupOptions: {
			external: [
				'@babel/parser',
				'@babel/traverse',
				'@babel/generator',
				'@babel/types'
			],
			output: {
				manualChunks(id) {
					if (
						id.includes('node_modules/react/') ||
						id.includes('node_modules/react-dom/') ||
						id.includes('node_modules/scheduler/')
					) {
						return 'vendor-react';
					}
					if (
						id.includes('node_modules/react-router') ||
						id.includes('node_modules/@remix-run/')
					) {
						return 'vendor-router';
					}
					if (id.includes('node_modules/framer-motion/')) {
						return 'vendor-motion';
					}
					if (id.includes('node_modules/pocketbase/')) {
						return 'vendor-pocketbase';
					}
					if (id.includes('node_modules/react-helmet')) {
						return 'vendor-helmet';
					}
					if (id.includes('node_modules/@tiptap/') || id.includes('node_modules/prosemirror-')) {
						return 'vendor-tiptap';
					}
					if (id.includes('node_modules/lucide-react/')) {
						return 'vendor-icons';
					}
					if (id.includes('node_modules/@radix-ui/')) {
						return 'vendor-radix';
					}
					if (id.includes('node_modules/zod/') || id.includes('node_modules/react-hook-form/')) {
						return 'vendor-forms';
					}
				}
			}
		}
	}
});
