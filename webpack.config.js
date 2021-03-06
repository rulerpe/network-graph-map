var path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/NetworkGraph/index.js',
    output: {
        path: path.resolve('dist'),
        filename: 'index.js',
        libraryTarget: 'commonjs2'
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                use: 'babel-loader',
            }
        ]
    }
}