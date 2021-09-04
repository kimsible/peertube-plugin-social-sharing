import { resolve } from 'path'
import { loadEnv } from 'vite'
import pkg from './package.json'

// npx vite build -m development - build and watch without minifying in PeerTube environment
// npx vite build -m staging - build without minifying
// npx vite build [-m production] - build and minify

export default async ({ mode }) => {
  const buildPeerTubeDistPath = () => {
    const env = loadEnv(mode, process.cwd(), 'PEERTUBE_')
    return env.PEERTUBE_PATH && resolve(env.PEERTUBE_PATH, `./storage/plugins/node_modules/${pkg.name}/`)
  }

  return {
    build: {
      outDir: resolve((mode === 'development' && buildPeerTubeDistPath()) || './', 'dist'),
      watch: mode === 'development',
      minify: mode === 'production' && 'terser',
      lib: {
        entry: 'client/common-client-plugin.js',
        name: pkg.name,
        formats: ['es'],
        fileName: () => 'common-client-plugin.js'
      }
    }
  }
}
