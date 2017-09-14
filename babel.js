const nextBabel = require('next/babel');

const babelCopy = {...nextBabel};
const plugins = [...babelCopy.plugins];
const babelModuleResolverIndex = plugins.findIndex((plugin) => {
  if(Array.isArray(plugin)) {
    return plugin.find(subPlugin => subPlugin.includes('babel-plugin-module-resolver'));
  }
  return false;
});

// Remove babel-module-resolver because Next uses his local babel-runtime, but we need it to grab just the one that's available.
plugins.splice(babelModuleResolverIndex, 1);

babelCopy.plugins = plugins;

module.exports = babelCopy;
