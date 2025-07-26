import { validatePort, validatePortRange, checkPort, scanPorts, scanPortsParallel } from '../src/core';
import { PortFinderError } from '../src/types';
import { createServer } from 'net';

describe('Core Functions', () => {
  describe('validatePort', () => {
    it('should accept valid ports', () => {
      expect(() => validatePort(1)).not.toThrow();
      expect(() => validatePort(80)).not.toThrow();
      expect(() => validatePort(3000)).not.toThrow();
      expect(() => validatePort(65535)).not.toThrow();
    });

    it('should reject invalid ports', () => {
      expect(() => validatePort(0)).toThrow(PortFinderError);
      expect(() => validatePort(-1)).toThrow(PortFinderError);
      expect(() => validatePort(65536)).toThrow(PortFinderError);
      expect(() => validatePort(1.5)).toThrow(PortFinderError);
      expect(() => validatePort(NaN)).toThrow(PortFinderError);
    });

    it('should throw error with correct code', () => {
      try {
        validatePort(0);
      } catch (error) {
        expect(error).toBeInstanceOf(PortFinderError);
        expect((error as PortFinderError).code).toBe('INVALID_PORT');
      }
    });
  });

  describe('validatePortRange', () => {
    it('should accept valid ranges', () => {
      expect(() => validatePortRange(1, 100)).not.toThrow();
      expect(() => validatePortRange(3000, 3000)).not.toThrow();
      expect(() => validatePortRange(1, 65535)).not.toThrow();
    });

    it('should reject invalid ranges', () => {
      expect(() => validatePortRange(100, 50)).toThrow(PortFinderError);
      expect(() => validatePortRange(0, 100)).toThrow(PortFinderError);
      expect(() => validatePortRange(100, 70000)).toThrow(PortFinderError);
    });

    it('should throw error with correct code for invalid range', () => {
      try {
        validatePortRange(100, 50);
      } catch (error) {
        expect(error).toBeInstanceOf(PortFinderError);
        expect((error as PortFinderError).code).toBe('INVALID_RANGE');
      }
    });
  });

  describe('checkPort', () => {
    let server: any;

    afterEach((done) => {
      if (server && server.listening) {
        server.close(() => done());
      } else {
        done();
      }
    });

    it('should return true for available port', async () => {
      const result = await checkPort(0);
      expect(result).toBe(true);
    });

    it('should return false for occupied port', async () => {
      server = createServer();
      await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', () => resolve());
      });
      
      const port = server.address().port;
      const result = await checkPort(port, '127.0.0.1');
      expect(result).toBe(false);
    });

    it('should handle different hosts', async () => {
      const result1 = await checkPort(0, '127.0.0.1');
      const result2 = await checkPort(0, '0.0.0.0');
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should handle server listen errors gracefully', async () => {
      const result = await checkPort(80, '255.255.255.255');
      expect(result).toBe(false);
    });

    it('should handle synchronous server.listen exceptions', async () => {
      // Mock createServer to throw when listen is called
      const net = require('net');
      const originalCreateServer = net.createServer;
      
      net.createServer = jest.fn(() => ({
        listen: jest.fn(() => {
          throw new Error('Synchronous listen error');
        }),
        once: jest.fn(),
        removeAllListeners: jest.fn(),
        close: jest.fn()
      }));

      const result = await checkPort(12345, '127.0.0.1');
      expect(result).toBe(false);

      // Restore original function
      net.createServer = originalCreateServer;
    });

    it('should use default host when not specified', async () => {
      const result = await checkPort(54321);
      expect(result).toBe(true);
    });
  });

  describe('scanPorts', () => {
    let servers: any[] = [];

    afterEach(async () => {
      await Promise.all(servers.map(server => 
        new Promise<void>((resolve) => {
          if (server.listening) {
            server.close(() => resolve());
          } else {
            resolve();
          }
        })
      ));
      servers = [];
    });

    it('should find available ports', async () => {
      const results = await scanPorts(30000, 30010, '127.0.0.1');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toBeGreaterThanOrEqual(30000);
      expect(results[0]).toBeLessThanOrEqual(30010);
    });

    it('should respect exclude set', async () => {
      const exclude = new Set([30000, 30001, 30002]);
      const results = await scanPorts(30000, 30005, '127.0.0.1', exclude);
      
      for (const port of results) {
        expect(exclude.has(port)).toBe(false);
      }
    });

    it('should apply validator function', async () => {
      const validator = (port: number) => port % 2 === 0;
      const results = await scanPorts(30000, 30010, '127.0.0.1', new Set(), validator);
      
      for (const port of results) {
        expect(port % 2).toBe(0);
      }
    });

    it('should find consecutive ports when requested', async () => {
      const results = await scanPorts(30000, 30020, '127.0.0.1', new Set(), undefined, 3, true);
      
      if (results.length === 3) {
        expect(results[1]).toBe(results[0]! + 1);
        expect(results[2]).toBe(results[0]! + 2);
      }
    });

    it('should limit results to count', async () => {
      const results = await scanPorts(30000, 30100, '127.0.0.1', new Set(), undefined, 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should handle no available ports', async () => {
      const validator = () => false;
      const results = await scanPorts(30000, 30005, '127.0.0.1', new Set(), validator);
      expect(results).toEqual([]);
    });

    it('should reset consecutive count when port is unavailable', async () => {
      // Create a server to block a port in the middle of a range
      const server = createServer();
      servers.push(server);
      
      await new Promise<void>((resolve) => {
        server.listen(30200, '127.0.0.1', () => resolve());
      });

      // Try to find 3 consecutive ports including the blocked one
      const results = await scanPorts(30199, 30205, '127.0.0.1', new Set(), undefined, 3, true);
      
      // Should find consecutive ports after the blocked one if available
      if (results.length === 3) {
        expect(results[0]).toBeGreaterThan(30200);
        expect(results[1]).toBe(results[0]! + 1);
        expect(results[2]).toBe(results[0]! + 2);
      }
    });

    it('should use default parameters', async () => {
      // Test with minimal parameters to cover default values
      const results = await scanPorts(31000, 31010);
      expect(results.length).toBe(1); // default count is 1
      expect(results[0]).toBeGreaterThanOrEqual(31000);
      expect(results[0]).toBeLessThanOrEqual(31010);
    });

    it('should use default exclude set when not provided', async () => {
      const results = await scanPorts(32000, 32010, '127.0.0.1');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should use default consecutive flag', async () => {
      const results = await scanPorts(33000, 33010, '127.0.0.1', new Set(), undefined, 2);
      expect(results.length).toBe(2);
      // Without consecutive flag, ports don't need to be consecutive
    });
  });

  describe('scanPortsParallel', () => {
    it('should find available ports in parallel', async () => {
      const results = await scanPortsParallel(40000, 40100, '127.0.0.1', new Set(), undefined, 10);
      expect(results.length).toBe(10);
      
      for (const port of results) {
        expect(port).toBeGreaterThanOrEqual(40000);
        expect(port).toBeLessThanOrEqual(40100);
      }
    });

    it('should respect maxConcurrency', async () => {
      const start = Date.now();
      const results = await scanPortsParallel(50000, 50020, '127.0.0.1', new Set(), undefined, 5, 5);
      const duration = Date.now() - start;
      
      expect(results.length).toBeLessThanOrEqual(5);
      expect(duration).toBeLessThan(5000);
    });

    it('should apply exclude and validator', async () => {
      const exclude = new Set([50000, 50002, 50004]);
      const validator = (port: number) => port % 2 === 1;
      
      const results = await scanPortsParallel(50000, 50020, '127.0.0.1', exclude, validator, 5);
      
      for (const port of results) {
        expect(exclude.has(port)).toBe(false);
        expect(port % 2).toBe(1);
      }
    });

    it('should use default parameters', async () => {
      // Test with minimal parameters to cover default values
      const results = await scanPortsParallel(52000, 52010);
      expect(results.length).toBe(1); // default count is 1
      expect(results[0]).toBeGreaterThanOrEqual(52000);
      expect(results[0]).toBeLessThanOrEqual(52010);
    });

    it('should use default exclude set when not provided', async () => {
      const results = await scanPortsParallel(53000, 53010, '127.0.0.1');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should use default maxConcurrency when not provided', async () => {
      const results = await scanPortsParallel(54000, 54010, '127.0.0.1', new Set(), undefined, 3);
      expect(results.length).toBe(3);
    });
  });
});