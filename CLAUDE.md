# CLAUDE.md - Obsidian Plugin Development Guide

## Project Overview
This is an Obsidian plugin project based on the official sample plugin template. The project demonstrates core Obsidian plugin capabilities and serves as a foundation for building custom plugins.

## Project Structure

```
obsidian-sample-plugin/
├── main.ts              # Main plugin entry point
├── manifest.json        # Plugin metadata and configuration
├── package.json         # Node.js dependencies and scripts
├── tsconfig.json        # TypeScript compiler configuration
├── esbuild.config.mjs   # Build configuration (esbuild bundler)
├── version-bump.mjs     # Version management script
├── versions.json        # Plugin version to Obsidian version mapping
└── README.md            # Documentation
```

## Key Files Explained

### manifest.json
Plugin metadata file required by Obsidian:
- `id`: Unique plugin identifier (currently: "sample-plugin")
- `name`: Display name shown in Obsidian
- `version`: Current plugin version
- `minAppVersion`: Minimum Obsidian version required
- `description`: Brief description of plugin functionality
- `author`, `authorUrl`, `fundingUrl`: Plugin author information
- `isDesktopOnly`: Set to `true` if plugin requires desktop-only features

### main.ts
The core plugin code structure:
- **Plugin Class** (`MyPlugin extends Plugin`): Main plugin class
  - `onload()`: Called when plugin is loaded - register commands, ribbons, events
  - `onunload()`: Called when plugin is disabled - cleanup logic
  - `loadSettings()` / `saveSettings()`: Persist plugin settings

- **Modal Class** (`SampleModal extends Modal`): Pop-up dialog windows
  - `onOpen()`: Display modal content
  - `onClose()`: Clean up modal content

- **Settings Tab** (`SampleSettingTab extends PluginSettingTab`): Plugin settings UI
  - `display()`: Render settings interface

### Key Obsidian API Patterns

1. **Commands**: Add actions to command palette
   ```typescript
   this.addCommand({
     id: 'unique-command-id',
     name: 'Command Name',
     callback: () => { /* action */ }
   })
   ```

2. **Ribbon Icons**: Add buttons to left sidebar
   ```typescript
   this.addRibbonIcon('icon-name', 'Tooltip', (evt) => { /* action */ })
   ```

3. **Status Bar**: Add items to bottom status bar
   ```typescript
   const statusBarItem = this.addStatusBarItem()
   statusBarItem.setText('Status text')
   ```

4. **Settings**: Persist data between sessions
   ```typescript
   await this.loadData()  // Load saved data
   await this.saveData(data)  // Save data
   ```

5. **Event Handling**: Register DOM events and intervals
   ```typescript
   this.registerDomEvent(element, 'click', handler)
   this.registerInterval(window.setInterval(callback, interval))
   ```

## Build System (esbuild)

The plugin uses **esbuild** for fast bundling and compilation:

### Build Configuration (esbuild.config.mjs)
- **Entry**: `main.ts` → compiled to `main.js`
- **Bundle**: All TypeScript files bundled into single `main.js`
- **External**: Obsidian API, Electron, CodeMirror marked as external (not bundled)
- **Format**: CommonJS (cjs)
- **Target**: ES2018
- **Development Mode**: Watch mode + inline sourcemaps
- **Production Mode**: Minified output, no sourcemaps

### Build Scripts (package.json)
```bash
npm run dev      # Development mode: watch for changes, auto-rebuild
npm run build    # Production build: TypeScript check + minified bundle
npm version      # Bump version and update manifest/versions.json
```

### TypeScript Configuration (tsconfig.json)
- **Module System**: ESNext with Node resolution
- **Target**: ES6
- **Strict Mode**: Enabled (strictNullChecks, noImplicitAny)
- **Source Maps**: Inline
- **Libs**: DOM, ES5, ES6, ES7

## Development Workflow

1. **Setup**:
   ```bash
   npm install
   npm run dev
   ```

2. **Development**:
   - Edit `main.ts` or create new `.ts` files
   - esbuild auto-compiles changes to `main.js`
   - Reload Obsidian to test changes (Ctrl/Cmd+R)

3. **Testing**:
   - Copy `main.js`, `manifest.json`, `styles.css` to vault's `.obsidian/plugins/your-plugin-name/`
   - Enable plugin in Obsidian settings
   - Test functionality

4. **Building for Production**:
   ```bash
   npm run build
   ```

## Plugin Capabilities Demonstrated

The sample plugin shows:
- ✓ Ribbon icon with click handler
- ✓ Status bar item
- ✓ Command palette integration
- ✓ Editor commands (text manipulation)
- ✓ Conditional commands (checkCallback)
- ✓ Modal dialogs
- ✓ Settings tab with persistent storage
- ✓ DOM event registration
- ✓ Interval registration

## Important Development Notes

1. **Plugin API**: Latest API available via `npm install obsidian@latest`
2. **Hot Reload**: Changes require Obsidian reload (no true hot module replacement)
3. **Debugging**: Use browser DevTools (Ctrl/Cmd+Shift+I)
4. **Mobile Support**: Set `isDesktopOnly: false` for mobile compatibility
5. **External Dependencies**: Must be bundled or marked as external in esbuild config

## Release Process

1. Update `manifest.json` version
2. Update `versions.json` with version mapping
3. Run `npm run build`
4. Create GitHub release with tag matching version
5. Upload `manifest.json`, `main.js`, `styles.css` as release assets
6. Submit to Obsidian community plugins (first release only)

## Resources

- **Obsidian API Docs**: https://github.com/obsidianmd/obsidian-api
- **Plugin Guidelines**: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- **Community Plugins**: https://obsidian.md/plugins
- **Sample Plugin Repo**: https://github.com/obsidianmd/obsidian-sample-plugin

## Current Status

This is a clean sample plugin template ready for customization. All example code is functional and demonstrates best practices for Obsidian plugin development.
