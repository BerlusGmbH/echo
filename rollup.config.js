import typescript from "rollup-plugin-typescript";
import babel from "rollup-plugin-babel";
import builtins from "rollup-plugin-node-builtins";

export default {
    entry: './src/echo.ts',
    dest: './dist/echo.js',
    plugins: [
        builtins(),
        typescript(),
        babel({
            exclude: 'node_modules/**',
            presets: ['es2015-rollup', 'stage-2'],
            plugins: ['transform-object-assign']
        })
    ]
}
