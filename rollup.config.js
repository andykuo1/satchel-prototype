import alias from '@rollup/plugin-alias';
import html from '@web/rollup-plugin-html';
import eslint from '@rollup/plugin-eslint';
import del from 'rollup-plugin-delete';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const PLUGIN_OPTIONS = {
  alias: {
    entries: [{ find: '@satchel', replacement: path.resolve(__dirname, 'src') }],
  },
  html: {},
  eslint: {},
};

export default {
  input: ['index.html', 'app.html'],
  output: { dir: 'dist' },
  plugins: [
    alias(PLUGIN_OPTIONS.alias),
    html(PLUGIN_OPTIONS.html),
    eslint(PLUGIN_OPTIONS.eslint),
    del({ targets: 'dist/*' }),
  ],
};
