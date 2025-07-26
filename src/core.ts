import { createServer } from 'net';
import { PortFinderError } from './types';

const DEFAULT_HOST = '0.0.0.0';
const MIN_PORT = 1;
const MAX_PORT = 65535;

/**
 * Validates that a port number is within the valid range (1-65535)
 * @param port - The port number to validate
 * @throws {PortFinderError} If the port is invalid
 */
export function validatePort(port: number): void {
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new PortFinderError(
      `Port must be an integer between ${MIN_PORT} and ${MAX_PORT}`,
      'INVALID_PORT',
      { port }
    );
  }
}

/**
 * Validates that a port range is valid
 * @param start - The starting port number
 * @param end - The ending port number
 * @throws {PortFinderError} If the range is invalid
 */
export function validatePortRange(start: number, end: number): void {
  validatePort(start);
  validatePort(end);
  if (start > end) {
    throw new PortFinderError(
      'Start port must be less than or equal to end port',
      'INVALID_RANGE',
      { start, end }
    );
  }
}

/**
 * Checks if a port is available by attempting to create a server
 * @param port - The port to check
 * @param host - The host to bind to
 * @returns Promise resolving to true if available, false otherwise
 */
export async function checkPort(port: number, host: string = DEFAULT_HOST): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    const cleanup = (): void => {
      server.removeAllListeners();
      server.close();
    };

    server.once('error', (err: NodeJS.ErrnoException) => {
      cleanup();
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      cleanup();
      resolve(true);
    });

    try {
      server.listen(port, host);
    } catch (err) {
      cleanup();
      resolve(false);
    }
  });
}

/**
 * Scans ports sequentially to find available ones
 * @param start - Starting port number
 * @param end - Ending port number
 * @param host - Host to bind to
 * @param exclude - Set of ports to exclude
 * @param validator - Optional validator function
 * @param count - Number of ports to find
 * @param consecutive - Whether to find consecutive ports
 * @returns Promise resolving to array of available ports
 */
export async function scanPorts(
  start: number,
  end: number,
  host: string = DEFAULT_HOST,
  exclude: Set<number> = new Set(),
  validator?: (port: number) => boolean,
  count: number = 1,
  consecutive: boolean = false
): Promise<number[]> {
  const found: number[] = [];
  let consecutiveStart = -1;
  let consecutiveCount = 0;

  for (let port = start; port <= end && found.length < count; port++) {
    if (exclude.has(port)) {
      consecutiveCount = 0;
      continue;
    }

    if (validator && !validator(port)) {
      consecutiveCount = 0;
      continue;
    }

    const available = await checkPort(port, host);
    
    if (available) {
      if (consecutive) {
        if (consecutiveCount === 0) {
          consecutiveStart = port;
        }
        consecutiveCount++;
        
        if (consecutiveCount === count) {
          for (let i = 0; i < count; i++) {
            found.push(consecutiveStart + i);
          }
          break;
        }
      } else {
        found.push(port);
      }
    } else {
      consecutiveCount = 0;
    }
  }

  return found;
}

/**
 * Scans ports in parallel for better performance
 * @param start - Starting port number
 * @param end - Ending port number
 * @param host - Host to bind to
 * @param exclude - Set of ports to exclude
 * @param validator - Optional validator function
 * @param count - Number of ports to find
 * @param maxConcurrency - Maximum concurrent port checks
 * @returns Promise resolving to array of available ports
 */
export async function scanPortsParallel(
  start: number,
  end: number,
  host: string = DEFAULT_HOST,
  exclude: Set<number> = new Set(),
  validator?: (port: number) => boolean,
  count: number = 1,
  maxConcurrency: number = 100
): Promise<number[]> {
  const found: number[] = [];
  const ports: number[] = [];

  for (let port = start; port <= end; port++) {
    if (!exclude.has(port) && (!validator || validator(port))) {
      ports.push(port);
    }
  }

  for (let i = 0; i < ports.length && found.length < count; i += maxConcurrency) {
    const batch = ports.slice(i, i + maxConcurrency);
    const results = await Promise.all(
      batch.map(async (port) => ({
        port,
        available: await checkPort(port, host)
      }))
    );

    for (const { port, available } of results) {
      if (available && found.length < count) {
        found.push(port);
      }
    }
  }

  return found;
}