const WebpackBeforeBuildPlugin = require('before-build-webpack');
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const execAsync = cmd => {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, result) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

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
        test: /\.(rpgscript|txt)$/i,
        use: 'raw-loader',
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  plugins: [
    new WebpackBeforeBuildPlugin(async (stats, callback) => {
      const result = await execAsync(`cd ${__dirname}/dist/voice && find . -type f`);
      const exp = JSON.stringify(
        result
          .split('\n')
          .sort()
          .map(url => url.slice(2))
          .reduce((prev, curr) => {
            prev[curr] = true;
            return prev;
          }, {}),
        null,
        2
      );
      fs.writeFileSync(`${__dirname}/dist/voice.json`, `${exp}`);
      // try {
      //   await execAsync(`cp -r ${__dirname}/../tiled/props/* ${__dirname}/dist/img/`);
      // } catch (e) {
      //   return;
      // }
      // try {
      //   await execAsync(`cp -r ${__dirname}/../tiled/stages/* ${__dirname}/dist/img/`);
      // } catch (e) {
      //   return;
      // }
      callback();
    }),
  ],
  devServer: {
    port: 8082,
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    hot: true,
    liveReload: true,
    open: true,
    openPage: 'index.dev.html',
  },
};
