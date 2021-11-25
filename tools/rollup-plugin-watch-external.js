import glob from 'glob';
import path from 'path';

/**
 * @param {object} opts 
 * @param {Array<string>} opts.include
 * @returns {import('rollup').Plugin}
 */
export default function watchExternal(opts) {
    if (!opts.include) {
        throw new Error('Must define include option.');
    }
    const items = Array.isArray(opts.include) ? opts.include : [opts.include];
    return {
        name: 'watch-external',
        buildStart() {
            for(let item of items) {
                glob.sync(path.resolve(item)).forEach(filename => {
                    this.addWatchFile(filename);
                });
            }
        }
    };
};
