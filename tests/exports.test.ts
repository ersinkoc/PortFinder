import * as portFinder from '../src/index';

describe('Exported Functions', () => {
  it('should export all expected functions', () => {
    // Main functions
    expect(typeof portFinder.isPortAvailable).toBe('function');
    expect(typeof portFinder.findPort).toBe('function');
    expect(typeof portFinder.findPorts).toBe('function');
    
    // Validator functions
    expect(typeof portFinder.addValidator).toBe('function');
    expect(typeof portFinder.removeValidator).toBe('function');
    expect(typeof portFinder.getValidator).toBe('function');
    expect(typeof portFinder.applyValidators).toBe('function');
    expect(typeof portFinder.builtInValidators).toBe('object');
    
    // Core functions
    expect(typeof portFinder.validatePort).toBe('function');
    expect(typeof portFinder.validatePortRange).toBe('function');
    expect(typeof portFinder.checkPort).toBe('function');
    expect(typeof portFinder.scanPorts).toBe('function');
    expect(typeof portFinder.scanPortsParallel).toBe('function');
    
    // Types
    expect(typeof portFinder.PortFinderError).toBe('function');
  });

  it('should use exported validators correctly', () => {
    // Test getValidator
    const privilegedValidator = portFinder.getValidator('privileged');
    expect(privilegedValidator).toBeDefined();
    expect(privilegedValidator!(1024)).toBe(true);
    expect(privilegedValidator!(80)).toBe(false);
    
    // Test builtInValidators
    expect(portFinder.builtInValidators['privileged']).toBeDefined();
    expect(portFinder.builtInValidators['common-ports']).toBeDefined();
    
    // Test applyValidators
    const result = portFinder.applyValidators(2000, ['privileged']);
    expect(result).toBe(true);
  });

  it('should validate ports using exported functions', () => {
    // Test validatePort
    expect(() => portFinder.validatePort(3000)).not.toThrow();
    expect(() => portFinder.validatePort(0)).toThrow(portFinder.PortFinderError);
    
    // Test validatePortRange
    expect(() => portFinder.validatePortRange(1000, 2000)).not.toThrow();
    expect(() => portFinder.validatePortRange(2000, 1000)).toThrow(portFinder.PortFinderError);
  });

  it('should check port using exported function', async () => {
    // Test checkPort
    const isAvailable = await portFinder.checkPort(55555);
    expect(typeof isAvailable).toBe('boolean');
  });

  it('should scan ports using exported functions', async () => {
    // Test scanPorts
    const sequentialPorts = await portFinder.scanPorts(56000, 56010);
    expect(Array.isArray(sequentialPorts)).toBe(true);
    expect(sequentialPorts.length).toBeGreaterThanOrEqual(1);
    
    // Test scanPortsParallel
    const parallelPorts = await portFinder.scanPortsParallel(57000, 57010);
    expect(Array.isArray(parallelPorts)).toBe(true);
    expect(parallelPorts.length).toBeGreaterThanOrEqual(1);
  });
});