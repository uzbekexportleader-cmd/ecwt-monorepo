// Metro sozlamalari — pnpm monorepo uchun.
//
// Ikki narsa muhim:
//   1. watchFolders — Metro monorepo ildizini ham kuzatishi kerak,
//      aks holda @ecwt/contracts o'zgarganda ilova yangilanmaydi.
//   2. nodeModulesPaths — paketlar ildizdagi node_modules'da turadi
//      (.npmrc dagi node-linker=hoisted tufayli).

const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Bitta paketning ikki nusxasi yuklanmasligi uchun
config.resolver.disableHierarchicalLookup = true;

// Metro ildizni kuzatadi, ya'ni BOSHQA ilovalarning `node_modules`
// papkalariga ham kirib boradi. Mobil ilovaga ular umuman kerak emas,
// lekin ular tufayli yig'ish to'xtab qolishi mumkin:
//
//   EINVAL: readlink 'apps\web\node_modules\@types\react-dom'
//
// Sabab — o'rnatish turi o'zgarganda (izolyatsiyalangan -> hoisted)
// o'sha papkalarda eski symlink bilan yangi haqiqiy papka aralashib
// qoladi, Metro esa ularni symlink deb o'ylab o'qimoqchi bo'ladi.
//
// Ularni chetlab o'tamiz: tezroq ham bo'ladi, xato ham chiqmaydi.
config.resolver.blockList = [
  /[\\/]apps[\\/](web|api)[\\/]node_modules[\\/].*/,
];

module.exports = config;
