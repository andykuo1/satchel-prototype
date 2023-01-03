import alias from '@rollup/plugin-alias';
import html from '@web/rollup-plugin-html';
import eslint from '@rollup/plugin-eslint';
import { fromRollup } from '@web/dev-server-rollup';

import { PLUGIN_OPTIONS } from './rollup.config.js';

export default {
  plugins: [
    fromRollup(alias)(PLUGIN_OPTIONS.alias),
    fromRollup(html)(PLUGIN_OPTIONS.html),
    fromRollup(eslint)(PLUGIN_OPTIONS.eslint),
  ],
};
