import esbuild, { BuildOptions } from 'esbuild';
import { solidPlugin } from 'esbuild-plugin-solid'
import * as path from 'path';

export const ROOT = path.join(__dirname, '../');
export const SOURCE = path.join(ROOT, 'src');
export const OUTDIR = path.join(ROOT, 'dist');
export const STATIC = path.join(ROOT, 'static');

export const getBuildConfig = ():BuildOptions => {
    const entry = path.join(SOURCE, 'index.tsx');
    return {
        entryPoints: [entry],
        entryNames: 'bundle',
        bundle: true,
        jsx: 'preserve',
        jsxImportSource: 'solid-js',
        outdir: OUTDIR,
        plugins: [
            solidPlugin(),
        ]
    }
}

export const getBuildContext = async (options: BuildOptions) => {
    const context = esbuild.context(options);
    return context;
}