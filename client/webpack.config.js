'use strict';

const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'js', 'app.js')
  },

  output: {
    path: path.resolve(__dirname, '../dist/js'),
    filename: '[name].min.js'
  },

  devtool: 'source-map',

  resolve: {
    modules: ['../node_modules'],
    extensions: ['.js']
  },

  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader'
    }]
  }
};
