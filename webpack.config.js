const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const stylesHandler = MiniCssExtractPlugin.loader;

const dist = isProduction ? 'dist-prod' : 'dist-dev';

const config = {
  entry: {
    main: path.resolve(__dirname, 'main.mjs'),
  },
  devtool: 'eval-source-map',
  output: {
    path: path.resolve(__dirname, dist),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', 'jsx', '...'],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, dist),
    },
    port: process.env.PORT ?? 3000,
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new ESLintPlugin({
      extensions: ['jsx', 'mjs', 'js', 'ts', 'tsx'],
      failOnError: true,
      fix: false,
      emitError: true,
      emitWarning: true,
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),

    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  optimization: {
    minimizer: [new CssMinimizerPlugin(), new TerserPlugin()],
  },
  module: {
    rules: [
      // css
      {
        test: /\.css$/i,
        exclude: /node_modules/,
        use: [stylesHandler, 'css-loader', 'postcss-loader'],
      },

      // scss
      {
        test: /\.s[ac]ss$/i,
        exclude: /node_modules/,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
      },

      // img
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        exclude: /node_modules/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]',
        },
      },

      // html
      {
        test: /\.html$/i,
        exclude: /node_modules/,
        loader: 'html-loader',
      },

      // font
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        exclude: /node_modules/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',
        },
      },

      // babel
      {
        test: /\.(js|jsx|tsx|ts|mjs)$/,
        exclude: /(node_modules|bower_components)/,
        use: 'babel-loader',
      },
      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = 'production';
    config.devtool = false;
  } else {
    config.mode = 'development';
  }
  return config;
};
