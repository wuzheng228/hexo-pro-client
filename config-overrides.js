/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const {
  override,
  addWebpackModuleRule,
  addWebpackPlugin,
  addWebpackAlias,
  overrideDevServer,
  setWebpackPublicPath
} = require('customize-cra');
const ArcoWebpackPlugin = require('@arco-plugins/webpack-react');
const addLessLoader = require('customize-cra-less-loader');
const setting = require('./src/settings.json');
const devServerConfig = () => config => {
  return {
    ...config,
    proxy: {
      '/hexopro/api': {
        target: 'http://localhost:4000',
        timeout: 10000,
        pathRewrite: {
          '/hexopro/api': '/hexopro/api'
        },
        changeOrigin: true,
        secure: false
      },
      '/images/': {
        target: 'http://localhost:4000',
        timeout: 10000,
        pathRewrite: {
          '/images/': '/images/'
        },
        changeOrigin: true,
        secure: false
      }
    }
  }
}

module.exports = {
  webpack: override(
    addLessLoader({
      lessLoaderOptions: {
        lessOptions: {},
      },
    }),
    addWebpackModuleRule({
      test: /\.svg$/,
      loader: '@svgr/webpack',
    }),
    addWebpackPlugin(
      new ArcoWebpackPlugin({
        theme: '@arco-themes/react-arco-pro',
        modifyVars: {
          'arcoblue-6': setting.themeColor,
        },
      })
    ),
    addWebpackAlias({
      '@': path.resolve(__dirname, 'src'),
    }),
    // setWebpackPublicPath('/pro/')
  ),
  devServer: overrideDevServer(
    devServerConfig()
  ),

};
