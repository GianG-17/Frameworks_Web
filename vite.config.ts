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
		// Libera qualquer host no dev (túneis ngrok http/tcp mudam de URL).
		// Afeta só o `vite dev` — produção (adapter-node) não usa isto.
		allowedHosts: true
	}
});
