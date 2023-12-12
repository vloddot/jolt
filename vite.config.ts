import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import path from 'path';
export default defineConfig({
	plugins: [solid()],
	base: process.env.NODE_ENV == 'production' ? '/jolt' : '',

	css: {
		modules: {
			generateScopedName(name) {
				return name; // for custom CSS to be easier
			}
		}
	},
	resolve: {
		alias: [
			{ find: '@lib', replacement: path.resolve(__dirname, 'src', 'lib') },
			{ find: '@components', replacement: path.resolve(__dirname, 'src', 'components') }
		]
	},
	// prevent vite from obscuring rust errors
	clearScreen: false,
	// Tauri expects a fixed port, fail if that port is not available
	server: {
		strictPort: true
	},
	// to access the Tauri environment variables set by the CLI with information about the current target
	envPrefix: [
		'VITE_',
		'TAURI_PLATFORM',
		'TAURI_ARCH',
		'TAURI_FAMILY',
		'TAURI_PLATFORM_VERSION',
		'TAURI_PLATFORM_TYPE',
		'TAURI_DEBUG'
	],
	build: {
		// Tauri uses Chromium on Windows and WebKit on macOS and Linux
		target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
		// don't minify for debug builds
		minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
		// produce sourcemaps for debug builds
		sourcemap: !!process.env.TAURI_DEBUG
	}
});
