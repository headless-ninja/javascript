const nextBabel = require('next/babel');

const babelCopy = {...nextBabel};
const plugins = [...babelCopy.plugins];
const babelModuleResolverIndex = plugins.findIndex((plugin) => {
  if(Array.isArray(plugin)) {
    return plugin.find(subPlugin => subPlugin.includes('babel-plugin-module-resolver'));
  }
  return false;
});

const babelModuleResolver = plugins[babelModuleResolverIndex];

const babelModulesResolverAlias = {...[...babelModuleResolver][1].alias};

// Remove babel-runtime alias because Next uses his local babel-runtime, but we need it to grab just the one that's available.
delete babelModulesResolverAlias['babel-runtime'];

babelModuleResolver[1].alias = babelModulesResolverAlias;

plugins[babelModuleResolverIndex] = babelModuleResolver;

babelCopy.plugins = plugins;

module.exports = babelCopy;
