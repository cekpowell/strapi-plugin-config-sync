'use strict';

export default async ({ strapi }) => {
  // Instantiate the pluginTypes array.
  if (!strapi.plugin('config-sync').pluginTypes) {
    strapi.plugin('config-sync').pluginTypes = [];
  }
};
