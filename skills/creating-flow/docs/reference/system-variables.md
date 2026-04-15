# System Variables

Global system variables available in all flows via `global.get()`. Use these to create portable flows that work across different operating systems and environments.

## Accessing System Variables

**CRITICAL: System variables can ONLY be accessed via `global.get()` inside a `Core.Programming.Function` node.** They are NOT interpolated in node properties — `Custom('$Home$/file.xlsx')` passes the literal string `$Home$/file.xlsx`, NOT the resolved path.

**Correct pattern:** Use a Function node to resolve the variable into `msg`, then pass it via `Message()`:

```typescript
// Step 1: Function node resolves system variable
f.node('a1b2c3', 'Core.Programming.Function', 'Setup Paths', {
  func: `msg.excelPath = global.get('$Home$') + '/output.xlsx'; return msg;`
})
// Step 2: Next node reads from msg
  .then('d4e5f6', 'Core.Excel.Open', 'Open Excel', {
    inPath: Message('excelPath'),   // CORRECT — resolved path
    outFileDescriptor: Message('excel_fd')
  });
```

**WRONG:** `inPath: Custom('$Home$/output.xlsx')` — this passes the literal string, not the resolved path.

In `Core.Programming.Function` nodes, use `global.get('$VariableName$')`:

```javascript
// Get home directory (works on Linux, Windows, Mac)
msg.home = global.get('$Home$');

// Build cross-platform paths
msg.outputPath = global.get('$Home$') + global.get('$PathSeparator$') + 'output';

// Use temp directory for temporary files
msg.tempFile = global.get('$TempDir$') + '/' + 'data.json';
```

## Available Variables

### File System

| Variable | Description | Example Values |
|----------|-------------|----------------|
| `$Home$` | User's home directory | `/home/user`, `C:\Users\user`, `/Users/user` |
| `$TempDir$` | System temp directory | `/tmp`, `C:\Users\user\AppData\Local\Temp` |
| `$PathSeparator$` | OS path separator | `/` (Linux/Mac), `\` (Windows) |

### Operating System

| Variable | Description | Example Values |
|----------|-------------|----------------|
| `$OS$` | Operating system | `linux`, `windows`, `darwin` |
| `$ARCH$` | CPU architecture | `amd64`, `arm64`, `386` |
| `$MachineName$` | Hostname | `my-laptop`, `server-01` |
| `$MachineUser$` | Current OS user | `john`, `Administrator` |

### Flow Information

| Variable | Description | Example Values |
|----------|-------------|----------------|
| `$FlowID$` | Current flow's unique ID | `abc123-def456` |
| `$FlowName$` | Flow display name | `My Automation Flow` |
| `$FlowVersion$` | Flow version | `1.0.0` |

### Robot Information

| Variable | Description | Example Values |
|----------|-------------|----------------|
| `$RobotID$` | Robot's unique ID | `bba7b30b-b96d-43f9-aaf5-8c01fdc8d0ca` |
| `$RobotName$` | Robot display name | `Extremis`, `Production Robot` |
| `$RobotVersion$` | Robot software version | `26.2.0` |
| `$RunType$` | Execution context | `local`, `cloud` |

### Workspace Information

| Variable | Description | Example Values |
|----------|-------------|----------------|
| `$WorkspaceID$` | Workspace unique ID | `ws-123456` |
| `$WorkspaceName$` | Workspace display name | `My Company` |
| `$WorkspaceDomain$` | Workspace domain | `mycompany.robomotion.io` |
| `$WorkspaceUserID$` | Current user's ID | `user-789` |
| `$WorkspaceUserEmail$` | Current user's email | `john@example.com` |
| `$WorkspaceUsername$` | Current user's username | `john.doe` |

### Package Information

| Variable | Description | Type |
|----------|-------------|------|
| `$PackageDependencies$` | Installed package versions | Object |

## Common Patterns

### Cross-Platform File Paths

```typescript
f.node('42ec21', 'Core.Programming.Function', 'Setup Paths', {
  func: `
// Get system directories
var home = global.get('$Home$');
var temp = global.get('$TempDir$');
var sep = global.get('$PathSeparator$');

// Build portable paths
msg.outputDir = home + sep + 'Documents' + sep + 'output';
msg.logFile = temp + sep + 'flow_' + Date.now() + '.log';

return msg;
`
});
```

### OS-Specific Logic

Use Function with `outputs: 2` and `global.get('$OS$')` to branch on `'windows'` vs `'linux'`/`'darwin'`.

### Logging with Context

Build a context object from `$FlowName$`, `$RobotName$`, `$RunType$`, `$MachineName$`, `$WorkspaceUsername$` and log with `console.log`.

### Temp File Management

Build unique temp paths: `global.get('$TempDir$') + '/' + global.get('$FlowID$') + '_' + Date.now() + '.tmp'`

### Cloud vs Local Behavior

Use Function with `outputs: 2` and `global.get('$RunType$')` to branch on `'cloud'` vs `'local'`.

## Best Practices

1. **Always use `$Home$` instead of hardcoded paths** - Makes flows portable across users and systems
2. **Use `$TempDir$` for temporary files** - Ensures proper temp directory on all OS
3. **Include `$PathSeparator$` for nested paths** - Or use `/` which works on all modern systems
4. **Log `$RobotName$` and `$FlowName$` for debugging** - Helps identify issues in multi-robot setups
5. **Check `$RunType$` for cloud/local differences** - Some features behave differently in cloud runs
