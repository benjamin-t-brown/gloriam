const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    hot: true,
    liveReload: true,
    open: true,
    openPage: 'index.html',
    proxy: {
      '/sounds': 'http://localhost:8888',
      '/spritesheets': 'http://localhost:8888',
      '/cadences': 'http://localhost:8888',
      '/cadence': 'http://localhost:8888',
      '/*.png': 'http://localhost:8888',
      '/*.wav': 'http://localhost:8888',
      '/*.json': 'http://localhost:8888',
    },
  },
};
