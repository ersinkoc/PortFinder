# @oxog/port-finder

Zero-dependency port finder for Node.js applications with plugin support.

## Features

- **Zero runtime dependencies** - Pure Node.js implementation
- **TypeScript support** - Full type safety with strict mode
- **Dual package support** - Works with both CommonJS and ESM
- **Plugin system** - Extensible validator system
- **CLI tool** - Command-line interface included
- **High performance** - Efficient parallel port scanning
- **100% test coverage** - Comprehensive test suite

## Installation

```bash
npm install @oxog/port-finder
```

## Usage

### Programmatic API

#### Finding a single port

```javascript
const { findPort } = require('@oxog/port-finder');
// or
import { findPort } from '@oxog/port-finder';

// Find any available port starting from 3000
const port = await findPort();
console.log(`Found available port: ${port}`);

// Find port with options
const port = await findPort({
  start: 8000,
  end: 9000,
  exclude: [8080, 8443],
  host: '127.0.0.1'
});
```

#### Finding multiple ports

```javascript
const { findPorts } = require('@oxog/port-finder');

// Find 3 available ports
const ports = await findPorts(3);
console.log(`Found ports: ${ports.join(', ')}`);

// Find 3 consecutive ports
const consecutivePorts = await findPorts(3, {
  start: 4000,
  consecutive: true
});
console.log(`Found consecutive ports: ${consecutivePorts.join(', ')}`);
```

#### Checking port availability

```javascript
const { isPortAvailable } = require('@oxog/port-finder');

const available = await isPortAvailable(3000);
console.log(`Port 3000 is ${available ? 'available' : 'in use'}`);
```

### CLI Usage

```bash
# Find a single available port
port-finder

# Find 3 consecutive ports starting from 8000
port-finder --start 8000 --count 3 --consecutive

# Check if port 3000 is available
port-finder --check 3000

# Find ports excluding common ports
port-finder --validators common-ports,privileged

# JSON output
port-finder --count 5 --json
```

### CLI Options

- `-h, --help` - Show help message
- `-s, --start <port>` - Starting port (default: 3000)
- `-e, --end <port>` - Ending port (default: 65535)
- `-x, --exclude <ports>` - Comma-separated list of ports to exclude
- `-H, --host <host>` - Host to bind (default: 0.0.0.0)
- `-c, --count <n>` - Number of ports to find (default: 1)
- `--consecutive` - Find consecutive ports
- `-v, --validators <names>` - Comma-separated list of validators
- `--check <port>` - Check if a specific port is available
- `-j, --json` - Output in JSON format

## Validators

### Built-in Validators

- `common-ports` - Excludes commonly used ports (80, 443, 3306, etc.)
- `privileged` - Only allows non-privileged ports (>=1024)

### Custom Validators

```javascript
const { addValidator, findPort } = require('@oxog/port-finder');

// Add a custom validator
addValidator('even-only', (port) => port % 2 === 0);

// Use the validator
const port = await findPort({
  validators: ['even-only', 'privileged']
});

// Remove validator when done
removeValidator('even-only');
```

## API Reference

### Functions

#### `findPort(options?: PortFinderOptions): Promise<number>`

Finds a single available port.

#### `findPorts(count: number, options?: PortFinderOptions): Promise<number[]>`

Finds multiple available ports.

#### `isPortAvailable(port: number, host?: string): Promise<boolean>`

Checks if a specific port is available.

#### `addValidator(name: string, validate: (port: number) => boolean): void`

Adds a custom validator.

#### `removeValidator(name: string): void`

Removes a validator.

### Types

```typescript
interface PortFinderOptions {
  start?: number;       // Starting port (default: 3000)
  end?: number;         // Ending port (default: 65535)
  exclude?: number[];   // Ports to exclude from search
  host?: string;        // Host to bind (default: '0.0.0.0')
  consecutive?: boolean; // For findPorts, whether ports must be consecutive
  validators?: string[]; // Named validators to apply
}

class PortFinderError extends Error {
  code: string;
  details?: any;
}
```

## Error Handling

All errors thrown by this package are instances of `PortFinderError` with specific error codes:

- `INVALID_PORT` - Invalid port number
- `INVALID_RANGE` - Invalid port range
- `INVALID_COUNT` - Invalid count parameter
- `NO_AVAILABLE_PORT` - No available port found
- `INSUFFICIENT_PORTS` - Not enough available ports found

```javascript
try {
  const port = await findPort({ start: 80, end: 80 });
} catch (error) {
  if (error.code === 'NO_AVAILABLE_PORT') {
    console.error('No available port found in the specified range');
  }
}
```

## Performance

This package uses efficient parallel scanning for finding multiple ports:

- Sequential scanning for consecutive port requirements
- Parallel scanning with configurable concurrency for non-consecutive ports
- Early termination when enough ports are found
- Minimal resource usage with proper cleanup

## Platform Support

- Node.js >= 14.0.0
- Windows, macOS, and Linux
- IPv4 and IPv6 support

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
- All tests pass
- 100% test coverage is maintained
- Code follows the existing style
- No external runtime dependencies are added