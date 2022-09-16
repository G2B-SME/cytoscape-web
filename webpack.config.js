const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './src/index.tsx',
  devtool: 'inline-source-map',
  module: {
    rules: [
      // look for tsx files to transform into the bundle
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // look for css files to transform into the bundle
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  // use content hash for cache busting
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  // watch the dist file for changes when using the dev server
  devServer: {
    static: './dist',
  },
  // generate html that points to the bundle with the updated hash
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
  ],
  // split bundle into two chunks, node modules(vendor code) in one bundle and app source code in the other
  // when source code changes, only the source code bundle will need to be updated, not the vendor code
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
}
