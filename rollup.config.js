import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

export default {
  entry: 'src/index.js',
  dest: 'dist/live-blob.js',
  plugins: [
    babel(babelrc())
  ]
};
