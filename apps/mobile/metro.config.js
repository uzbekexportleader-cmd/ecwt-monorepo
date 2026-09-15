// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

/*
 * Monorepo: paketlar ildizda (`node-linker=hoisted`), shuning uchun
 * Metro ikkala `node_modules` ni ham kuzatishi kerak.
 */
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

/*
 * DIQQAT: `server.unstable_serverRoot` ni O'ZGARTIRMANG.
 *
 * Telefondagi development build bundle'ni monorepo ildiziga nisbatan
 * so'raydi: `./apps/mobile/node_modules/expo-router/entry`. Server
 * ildizi `apps/mobile` ga o'zgartirilsa, yo'l ikki marta takrorlanadi
 * (`apps/mobile/apps/mobile/...`) va telefonda "Unable to load script"
 * xatosi chiqadi. Bu xato brauzerdagi preview'da ko'rinmaydi.
 */

module.exports = config;
