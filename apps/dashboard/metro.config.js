const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Copie unique forcée de react-query, react et react-native.
const forcedSingletons = {
  "@tanstack/react-query": path.resolve(projectRoot, "node_modules/@tanstack/react-query"),
  "react": path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Si on importe un des singletons (ou un sous-chemin), on force la copie unique.
  for (const [pkg, location] of Object.entries(forcedSingletons)) {
    if (moduleName === pkg || moduleName.startsWith(pkg + "/")) {
      const subPath = moduleName.slice(pkg.length);
      return context.resolveRequest(
        context,
        location + subPath,
        platform
      );
    }
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;