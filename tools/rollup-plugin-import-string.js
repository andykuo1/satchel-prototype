import { createFilter } from '@rollup/pluginutils';

/**
 * @param {object} opts 
 * @param {string | RegExp | (string | RegExp)[]} opts.include
 * @param {string | RegExp | (string | RegExp)[]} [opts.exclude]
 * @returns {import('rollup').Plugin}
 */
export default function importString(opts) {
    if (!opts.include) {
        throw new Error('Must define include option.');
    }
    const filter = createFilter(opts.include, opts.exclude);
    return {
        name: 'import-string',
        transform(code, id) {
            if (!filter(id)) return null;
            return {
                code: `export default ${JSON.stringify(code)}`,
                map: { mappings: '' },
            };
        }
    }
};
