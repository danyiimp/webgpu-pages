import 'webpack-dev-server'
import webpack from "webpack";
import path from "path";

const config: webpack.Configuration = {
  mode: "development",
  entry: path.resolve(__dirname, "./src/index.ts"),
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: "bundle.min.js",
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules']
  },
  module: {
    rules: [
      {
        test: /\.wgsl/,
        type: "asset/source",
      },
      {
        test: /\.ts/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
    ],
  },
  optimization: {
    minimize: true
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, "public"),
      watch: true
    },
    compress: true,
    port: 9000,
    devMiddleware: {
      writeToDisk: true
    }
  },
  devtool: "source-map",
};

export default config;