var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');

module.exports = {
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js'
  },
  plugins: [new HtmlWebpackPlugin({
    template: path.resolve(__dirname, './src/index.ejs'),
  })]
};
