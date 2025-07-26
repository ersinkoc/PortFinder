#!/usr/bin/env node

import { findPort, findPorts, isPortAvailable } from './index';
import { PortFinderError } from './types';

interface CLIOptions {
  start?: number;
  end?: number;
  exclude?: number[];
  host?: string;
  count?: number;
  consecutive?: boolean;
  validators?: string[];
  check?: number;
  json?: boolean;
  help?: boolean;
}

export function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    
    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-s':
      case '--start':
        options.start = parseInt(next as string, 10);
        i++;
        break;
      case '-e':
      case '--end':
        options.end = parseInt(next as string, 10);
        i++;
        break;
      case '-x':
      case '--exclude':
        options.exclude = (next as string).split(',').map(p => parseInt(p, 10));
        i++;
        break;
      case '-H':
      case '--host':
        options.host = next;
        i++;
        break;
      case '-c':
      case '--count':
        options.count = parseInt(next as string, 10);
        i++;
        break;
      case '--consecutive':
        options.consecutive = true;
        break;
      case '-v':
      case '--validators':
        options.validators = (next as string).split(',');
        i++;
        break;
      case '--check':
        options.check = parseInt(next as string, 10);
        i++;
        break;
      case '-j':
      case '--json':
        options.json = true;
        break;
    }
  }
  
  return options;
}

export function printHelp(): void {
  console.log(`
port-finder - Find available network ports

Usage:
  port-finder [options]

Options:
  -h, --help           Show this help message
  -s, --start <port>   Starting port (default: 3000)
  -e, --end <port>     Ending port (default: 65535)
  -x, --exclude <ports> Comma-separated list of ports to exclude
  -H, --host <host>    Host to bind (default: 0.0.0.0)
  -c, --count <n>      Number of ports to find (default: 1)
  --consecutive        Find consecutive ports
  -v, --validators <names> Comma-separated list of validators
  --check <port>       Check if a specific port is available
  -j, --json           Output in JSON format

Examples:
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
`);
}

export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  if (options.help) {
    printHelp();
    process.exit(0);
  }
  
  try {
    if (options.check !== undefined) {
      const available = await isPortAvailable(options.check, options.host);
      if (options.json) {
        console.log(JSON.stringify({ port: options.check, available }));
      } else {
        console.log(`Port ${options.check} is ${available ? 'available' : 'in use'}`);
      }
      process.exit(available ? 0 : 1);
    }
    
    const count = options.count || 1;
    
    if (count === 1) {
      const port = await findPort({
        start: options.start,
        end: options.end,
        exclude: options.exclude,
        host: options.host,
        validators: options.validators
      });
      
      if (options.json) {
        console.log(JSON.stringify({ port }));
      } else {
        console.log(port);
      }
    } else {
      const ports = await findPorts(count, {
        start: options.start,
        end: options.end,
        exclude: options.exclude,
        host: options.host,
        validators: options.validators,
        consecutive: options.consecutive
      });
      
      if (options.json) {
        console.log(JSON.stringify({ ports }));
      } else {
        console.log(ports.join(' '));
      }
    }
    
    process.exit(0);
  } catch (error) {
    if (error instanceof PortFinderError) {
      if (options.json) {
        console.error(JSON.stringify({
          error: {
            message: error.message,
            code: error.code,
            details: error.details
          }
        }));
      } else {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
    
    if (options.json) {
      console.error(JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } else {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}