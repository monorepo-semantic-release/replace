const {forEach} = require('lodash');
const debug = require('debug')('semantic-release:monnorepo-git');
const micromatch = require('micromatch');
const replace = require('@google/semantic-release-replace-plugin');

async function prepareAll(pluginConfig, context) {
  const {pkgContexts} = context;

  const nextReleases = [];
  forEach(pkgContexts, ({name, nextRelease}) => {
    if (nextRelease) {
      nextReleases.push(name);
    }
  });
  debug('Found release packages:', nextReleases);

  const cwd = process.cwd();
  for (const pkg of pluginConfig.packages || []) {
    const {includes, ...config} = pkg;
    const packages = micromatch(nextReleases, includes);

    if (packages.length) {
      debug('Replace packages %o with config %O', packages, config);
    } else {
      debug('No packages found for pattern', includes);
    }

    try {
      for (const pkg of packages) {
        process.chdir(pkgContexts[pkg].cwd);
        await replace.prepare(config, pkgContexts[pkg]);
      }
    } finally {
      process.chdir(cwd);
    }
  }
  process.chdir(cwd);
}

module.exports = {prepareAll};