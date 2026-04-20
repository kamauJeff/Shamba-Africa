const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch only what Metro actually needs — fixes Windows file handle limit crash
config.watchFolders = [
  projectRoot,
  path.resolve(workspaceRoot, 'packages/shared/src'),
]

// Resolve modules from project first, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Resolve @/* alias to ./src/* and @shamba/shared to shared package
config.resolver.extraNodeModules = new Proxy(
  {
    '@shamba/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
  },
  {
    get: (target, name) => {
      if (name in target) return target[name]
      // Fall through to node_modules for everything else
      return path.join(projectRoot, 'node_modules', name)
    },
  }
)

// Alias @ to ./src
const { resolver } = config
const originalResolveRequest = resolver.resolveRequest
resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    const resolved = moduleName.replace('@/', path.resolve(projectRoot, 'src') + '/')
    return { filePath: resolved, type: 'sourceFile' }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

// Force polling instead of native watchers (slower but reliable on Windows)
config.watcher = {
  watchman: { deferStates: [] },
  additionalExts: ['mjs', 'cjs'],
}

module.exports = config
