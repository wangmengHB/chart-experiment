const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const merge = require('webpack-merge')
const path = require('path');
const base = require('./webpack.base.conf.js')

const config = merge(base, {
    mode: 'development',
    watch: true,
    devtool: 'none',
    devServer: {
        clientLogLevel: 'warning',
        hot: true,
        contentBase: path.join(__dirname, "../dist"), 
        compress: true,
        host: '0.0.0.0',
        port: 8082,
        useLocalIp: true,
        open: true,
        overlay: { 
            warnings: false, 
            errors: true 
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
          title: 'chart playground',
          inject: 'body',
          template: path.join(__dirname, './index.html'),
        }),
        new webpack.HotModuleReplacementPlugin()
    ]
})

module.exports = config