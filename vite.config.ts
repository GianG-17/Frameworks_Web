import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'@': path.resolve('./src')
		}
	},
	server: {
		allowedHosts: ['finch-uniformed-thespian.ngrok-free.dev']
	}
});
