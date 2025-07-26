/**
 * Options for port finding operations
 */
export interface PortFinderOptions {
  start?: number;
  end?: number;
  exclude?: number[];
  host?: string;
  consecutive?: boolean;
  validators?: string[];
}

/**
 * Custom error class for port finder operations
 */
export class PortFinderError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = 'PortFinderError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, PortFinderError.prototype);
  }
}

/**
 * Function type for port validators
 * @param port - The port number to validate
 * @returns True if the port is valid, false otherwise
 */
export type PortValidator = (port: number) => boolean;

/**
 * Registry for storing port validators
 */
export interface ValidatorRegistry {
  [name: string]: PortValidator;
}