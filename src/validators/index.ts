import { PortValidator, ValidatorRegistry } from '../types';

const validators: ValidatorRegistry = {};

const COMMON_PORTS = new Set([
  20, 21, 22, 23, 25, 53, 67, 68, 69, 80, 110, 119, 123, 143, 161, 162,
  179, 194, 389, 443, 445, 465, 514, 515, 587, 636, 873, 902, 989, 990,
  993, 995, 1080, 1194, 1433, 1434, 1521, 1723, 2049, 2082, 2083, 2086,
  2087, 2095, 2096, 2181, 3000, 3001, 3128, 3306, 3389, 3690, 4000, 4001,
  4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 5000, 5001, 5060, 5061,
  5432, 5900, 5984, 5985, 6379, 6666, 6667, 6668, 6669, 7000, 7001, 7002,
  8000, 8001, 8008, 8009, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087,
  8088, 8089, 8090, 8091, 8092, 8093, 8094, 8095, 8096, 8097, 8098, 8099,
  8443, 8444, 8880, 8888, 9000, 9001, 9090, 9091, 9200, 9300, 9418, 9999,
  10000, 10001, 10002, 10003, 10004, 10005, 11211, 15672, 25565, 25575,
  27017, 27018, 27019, 28017, 33848, 35357
]);

export const builtInValidators: ValidatorRegistry = {
  'common-ports': (port: number): boolean => !COMMON_PORTS.has(port),
  'privileged': (port: number): boolean => port >= 1024
};

/**
 * Adds a custom validator to the registry
 * @param name - Unique name for the validator
 * @param validate - Validator function that returns true if port is valid
 * @throws {Error} If name is invalid or validate is not a function
 */
export function addValidator(name: string, validate: PortValidator): void {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('Validator name must be a non-empty string');
  }
  if (typeof validate !== 'function') {
    throw new Error('Validator must be a function');
  }
  validators[name] = validate;
}

/**
 * Removes a validator from the registry
 * @param name - Name of the validator to remove
 * @throws {Error} If name is invalid
 */
export function removeValidator(name: string): void {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('Validator name must be a non-empty string');
  }
  delete validators[name];
}

/**
 * Gets a validator by name (custom or built-in)
 * @param name - Name of the validator
 * @returns The validator function or undefined if not found
 */
export function getValidator(name: string): PortValidator | undefined {
  return validators[name] || builtInValidators[name];
}

/**
 * Applies multiple validators to a port
 * @param port - The port to validate
 * @param validatorNames - Array of validator names to apply
 * @returns True if all validators pass, false otherwise
 * @throws {Error} If any validator name is unknown
 */
export function applyValidators(port: number, validatorNames: string[]): boolean {
  for (const name of validatorNames) {
    const validator = getValidator(name);
    if (!validator) {
      throw new Error(`Unknown validator: ${name}`);
    }
    if (!validator(port)) {
      return false;
    }
  }
  return true;
}