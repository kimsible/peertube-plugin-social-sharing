const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')

module.exports = async env => {
  let mode, output, watch

  if (env.prod) {
    mode = 'production'

    output = {
      path: path.resolve(__dirname, '.')
    }
  }

  if (env.dev) {
    dotenv.config()

    mode = 'development'

    const { PEERTUBE_PATH } = process.env

    await fs.promises.access(PEERTUBE_PATH, fs.constants.R_OK | fs.constants.W_OK)

    output = {
      path: path.resolve(PEERTUBE_PATH, './storage/plugins/node_modules/peertube-plugin-social-sharing')
    }

    watch = true
  }

  return {
    mode,
    watch,
    entry: './client/common-client-plugin.js',
    output: {
      ...output,
      filename: 'dist/common-client-plugin.js',
      chunkFilename: 'dist/[name].js',
      library: {
        type: 'module'
      }
    },
    module: {
      rules: [
        {
          test: /\.svg$/,
          type: 'asset/source'
        }
      ]
    },
    experiments: {
      outputModule: true
    }
  }
}
