const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js'
  },
  devtool: 'source-map',
  plugins: [new HtmlWebpackPlugin({
    template: path.resolve(__dirname, './src/index.ejs'),
  }),
    new CopyPlugin(
      {
        patterns: [
        { from: 'arrows/', to: 'arrows/' },
        { from: '*.png' },
        { from: '*.bin'},
        { from: 'metadata.json' },
      ]
    }),
  ]
};
