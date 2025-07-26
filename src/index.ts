import { PortFinderOptions, PortFinderError } from './types';
import { checkPort, validatePort, validatePortRange, scanPorts, scanPortsParallel } from './core';
import { applyValidators } from './validators';

const DEFAULT_START_PORT = 3000;
const DEFAULT_END_PORT = 65535;
const DEFAULT_HOST = '0.0.0.0';

/**
 * Checks if a specific port is available
 * @param port - The port number to check
 * @param host - The host to bind to (default: '0.0.0.0')
 * @returns Promise resolving to true if port is available, false otherwise
 */
export async function isPortAvailable(port: number, host: string = DEFAULT_HOST): Promise<boolean> {
  validatePort(port);
  return checkPort(port, host);
}

/**
 * Finds a single available port
 * @param options - Port finder options
 * @returns Promise resolving to an available port number
 * @throws {PortFinderError} If no available port is found
 */
export async function findPort(options: PortFinderOptions = {}): Promise<number> {
  const {
    start = DEFAULT_START_PORT,
    end = DEFAULT_END_PORT,
    exclude = [],
    host = DEFAULT_HOST,
    validators = []
  } = options;

  validatePortRange(start, end);

  const excludeSet = new Set(exclude);
  const validator = validators.length > 0 
    ? (port: number): boolean => applyValidators(port, validators)
    : undefined;

  const results = await scanPortsParallel(start, end, host, excludeSet, validator, 1);

  if (results.length === 0) {
    throw new PortFinderError(
      `No available port found between ${start} and ${end}`,
      'NO_AVAILABLE_PORT',
      { start, end, exclude, validators }
    );
  }

  return results[0] as number;
}

/**
 * Finds multiple available ports
 * @param count - Number of ports to find
 * @param options - Port finder options
 * @returns Promise resolving to an array of available port numbers
 * @throws {PortFinderError} If not enough available ports are found
 */
export async function findPorts(count: number, options: PortFinderOptions = {}): Promise<number[]> {
  if (!Number.isInteger(count) || count <= 0) {
    throw new PortFinderError(
      'Count must be a positive integer',
      'INVALID_COUNT',
      { count }
    );
  }

  const {
    start = DEFAULT_START_PORT,
    end = DEFAULT_END_PORT,
    exclude = [],
    host = DEFAULT_HOST,
    validators = [],
    consecutive = false
  } = options;

  validatePortRange(start, end);

  const excludeSet = new Set(exclude);
  const validator = validators.length > 0 
    ? (port: number): boolean => applyValidators(port, validators)
    : undefined;

  const results = consecutive
    ? await scanPorts(start, end, host, excludeSet, validator, count, true)
    : await scanPortsParallel(start, end, host, excludeSet, validator, count);

  if (results.length < count) {
    throw new PortFinderError(
      `Could only find ${results.length} available ports out of ${count} requested`,
      'INSUFFICIENT_PORTS',
      { requested: count, found: results.length, ports: results }
    );
  }

  return results;
}

export { addValidator, removeValidator, getValidator, applyValidators, builtInValidators } from './validators';
export { validatePort, validatePortRange, checkPort, scanPorts, scanPortsParallel } from './core';
export * from './types';