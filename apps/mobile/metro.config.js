const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

// Monorepo root
const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot]

// 2. Resolve from project root first, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// 3. Resolve the @/* alias to ./src/*
config.resolver.extraNodeModules = {
  '@': path.resolve(projectRoot, 'src'),
  '@shamba/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
}

module.exports = config
