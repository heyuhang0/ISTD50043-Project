const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#da6438',
              '@max-width': '1140px',
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};