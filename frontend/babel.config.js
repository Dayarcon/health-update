module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-paper/babel',
      [
        'module-resolver',
        {
          alias: {
            '@': './app',
            '@components': './components',
            '@screens': './screens',
            '@services': './services',
            '@hooks': './hooks',
            '@store': './store',
            '@utils': './utils',
          },
        },
      ],
    ],
  };
};
