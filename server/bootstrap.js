'use strict';

import fs from 'fs';

import isEmpty from 'lodash/isEmpty';
import ConfigType from './config/type';
import defaultTypes from './config/types';
import { logMessage } from './utils';

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/v3.x/concepts/configurations.html#bootstrap
 */

export default async () => {
  // Register config types.
  const registerTypes = () => {
    const types = {};

    // The default types provided by the plugin.
    defaultTypes(strapi).map((type) => {
      const shouldInclude = isEmpty(strapi.config.get('plugin::config-sync.includedTypes')) || strapi.config.get('plugin::config-sync.includedTypes').includes(type.configName);
      const shouldExclude = strapi.config.get('plugin::config-sync.excludedTypes').includes(type.configName);
      if (shouldInclude && !shouldExclude) {
        types[type.configName] = new ConfigType(type);
      }
    });

    // The types provided by other plugins.
    strapi.plugin('config-sync').pluginTypes.map((type) => {
      const shouldInclude = isEmpty(strapi.config.get('plugin::config-sync.includedTypes')) || strapi.config.get('plugin::config-sync.includedTypes').includes(type.configName);
      const shouldExclude = strapi.config.get('plugin::config-sync.excludedTypes').includes(type.configName);
      if (shouldInclude && !shouldExclude) {
        types[type.configName] = new ConfigType(type);
      }
    });

    // The custom types provided by the user.
    strapi.config.get('plugin::config-sync.customTypes').map((type) => {
      const shouldInclude = isEmpty(strapi.config.get('plugin::config-sync.includedTypes')) || strapi.config.get('plugin::config-sync.includedTypes').includes(type.configName);
      const shouldExclude = strapi.config.get('plugin::config-sync.excludedTypes').includes(type.configName);
      if (shouldInclude && !shouldExclude) {
        types[type.configName] = new ConfigType(type);
      }
    });

    return types;
  };
  strapi.plugin('config-sync').types = registerTypes();

  // Import on bootstrap.
  if (strapi.config.get('plugin::config-sync.importOnBootstrap')) {
    if (strapi.server.app.env === 'development') {
      strapi.log.warn(logMessage(`You can't use the 'importOnBootstrap' setting in the development env.`));
    } else if (process.env.CONFIG_SYNC_CLI === 'true') {
      strapi.log.warn(logMessage(`The 'importOnBootstrap' setting was ignored because Strapi was started from the config-sync CLI itself.`));
    } else if (fs.existsSync(strapi.config.get('plugin::config-sync.syncDir'))) {
      await strapi.plugin('config-sync').service('main').importAllConfig();
    }
  }

  // Register permission actions.
  const actions = [
    {
      section: 'plugins',
      displayName: 'Access the plugin settings',
      uid: 'settings.read',
      pluginName: 'config-sync',
    },
    {
      section: 'plugins',
      displayName: 'Menu link to plugin settings',
      uid: 'menu-link',
      pluginName: 'config-sync',
    },
  ];
  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};
