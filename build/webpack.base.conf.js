const path = require('path')


module.exports = {
    context: path.resolve(__dirname, '../'),
    entry: {
      'chart-playground': path.resolve(__dirname, '../src/demo1'),
    },
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: '[name].js',
        publicPath: '/',
        libraryTarget: 'umd',
        library: 'CommonUtil'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    module: {
        rules: [
          {
            test: /\.(js|jsx|ts|tsx)$/,
            include: [
              path.resolve(__dirname, '../src')
            ],
            use: [
              {
                loader: 'babel-loader',
              },
              {
                loader: 'ts-loader',
              }
            ]
          },
          {
            test: /\.less$/,
            use: [
              {
                loader: 'style-loader',
              },
              {
                loader: 'css-loader',
              },
              {
                loader: 'less-loader',
                options: {
                  javascriptEnabled: true,
                }
              }
            ]
          },
          {
            test: /\.(png|jpg)$/,
            use: [
              {
                loader: 'url-loader',
              }
            ]
          },
          { 
            test: /\.coffee$/,
            include: [/psd/],  
            loader: 'coffee-loader' 
          },
          { 
            test: /\.(coffee\.md|litcoffee)$/, 
            include: [/psd/],
            loader: 'coffee-loader?literate' 
          },
          { 
            test: /\.json$/, 
            include: [/psd/],
            loader: 'json-loader' 
          },
        ]
    },
    node: {
      setImmediate: false,
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty',
      path: 'empty',
    }
}