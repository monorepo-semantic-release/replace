const test = require('ava');
const clearModule = require('clear-module');
const {stub} = require('sinon');
const tempy = require('tempy');
const {outputFile, readFile} = require('fs-extra');
const path = require('path');

test.beforeEach(t => {
  // Clear npm cache to refresh the module state
  clearModule('..');
  t.context.m = require('..');
  // Stub the logger
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Empty config', async t => {
  await t.context.m.prepareAll({}, {});
  t.pass();
});

test('Replace', async t => {
  const cwd = tempy.directory();
  const file = path.resolve(cwd, 'foo/__init__.py');
  await outputFile(file, '__VERSION__ = "0.0.1"');

  const pluginConfig = {
    packages: [
      {
        includes: ['@test/pkg1'],
        replacements: [
          {
            files: ['foo/__init__.py'],
            from: '__VERSION__ = ".*"',
            to: '__VERSION__ = "${nextRelease.version}"',
            results: [
              {
                file: 'foo/__init__.py',
                hasChanged: true,
                numMatches: 1,
                numReplacements: 1,
              },
            ],
            countMatches: true,
          },
        ],
      },
    ],
  };

  const context = {
    pkgContexts: {
      '@test/pkg1': {
        cwd,
        name: '@test/pkg1',
        nextRelease: {
          version: '0.1.0',
        },
      },
    },
  };

  await t.context.m.prepareAll(pluginConfig, context);

  const content = (await readFile(file)).toString();
  t.deepEqual('__VERSION__ = "0.1.0"', content);
});
