import { PortFinderError } from '../src/types';

describe('PortFinderError', () => {
  it('should create error with message and code', () => {
    const error = new PortFinderError('Test error', 'TEST_CODE');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PortFinderError);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('PortFinderError');
    expect(error.details).toBeUndefined();
  });

  it('should create error with details', () => {
    const details = { port: 3000, reason: 'occupied' };
    const error = new PortFinderError('Port unavailable', 'PORT_UNAVAILABLE', details);
    expect(error.details).toEqual(details);
  });

  it('should have correct prototype chain', () => {
    const error = new PortFinderError('Test', 'TEST');
    expect(error instanceof PortFinderError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should have stack trace', () => {
    const error = new PortFinderError('Test', 'TEST');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('PortFinderError');
  });
});