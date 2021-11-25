import replace from '@rollup/plugin-replace';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import htmlTemplate from 'rollup-plugin-generate-html-template';

import importString from './tools/rollup-plugin-import-string.js';
import watchExternal from './tools/rollup-plugin-watch-external.js';

import PackageJson from './package.json';

export default args => /** @type {import('rollup').RollupOptions} */({
    input: 'src/main.js',
    output: {
        file: args.dev ? './out/bundle.js' : './bundle.js',
        format: 'es',
    },
    plugins: [
        replace({
            '__BUILD_ENV__': JSON.stringify(args.dev ? 'development' : 'production'),
            '__BUILD_VERSION__': JSON.stringify(PackageJson.version),
        }),
        importString({
            include: ['**/*.template.html', '**/*.module.css'],
        }),
        watchExternal({
            include: ['src/template.html', '**/*.template.html', '**/*.module.css'],
        }),
        htmlTemplate({
            template: 'src/template.html',
            target: args.dev ? './out/index.html' : './index.html',
            attrs: ['type="module"']
        }),
        !args.dev && terser(),
        args.dev && serve({
            contentBase: ['./out', './'],
            open: true,
        }),
        args.dev && livereload('./out')
    ].filter(Boolean)
});
