import { findPort, findPorts, isPortAvailable } from '../src/index';
import { PortFinderError } from '../src/types';
import { createServer } from 'net';

describe('Main API Functions', () => {
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

  describe('isPortAvailable', () => {
    it('should return true for available port', async () => {
      const available = await isPortAvailable(45678);
      expect(available).toBe(true);
    });

    it('should return false for occupied port', async () => {
      const server = createServer();
      servers.push(server);
      
      await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', () => resolve());
      });
      
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Failed to get server address');
      }
      const port = address.port;
      const available = await isPortAvailable(port, '127.0.0.1');
      expect(available).toBe(false);
    });

    it('should validate port number', async () => {
      await expect(isPortAvailable(0)).rejects.toThrow(PortFinderError);
      await expect(isPortAvailable(70000)).rejects.toThrow(PortFinderError);
    });

    it('should work with custom host', async () => {
      const available = await isPortAvailable(45678, '127.0.0.1');
      expect(typeof available).toBe('boolean');
    });
  });

  describe('findPort', () => {
    it('should find an available port with default options', async () => {
      const port = await findPort();
      expect(port).toBeGreaterThanOrEqual(3000);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should respect start and end options', async () => {
      const port = await findPort({ start: 20000, end: 20100 });
      expect(port).toBeGreaterThanOrEqual(20000);
      expect(port).toBeLessThanOrEqual(20100);
    });

    it('should exclude specified ports', async () => {
      const exclude = [25000, 25001, 25002];
      const port = await findPort({ start: 25000, end: 25005, exclude });
      expect(exclude.includes(port)).toBe(false);
    });

    it('should apply validators', async () => {
      const port = await findPort({ 
        start: 1000, 
        end: 2000, 
        validators: ['privileged'] 
      });
      expect(port).toBeGreaterThanOrEqual(1024);
    });

    it('should throw when no port is available', async () => {
      await expect(findPort({ 
        start: 30000, 
        end: 30000, 
        exclude: [30000] 
      })).rejects.toThrow(PortFinderError);
    });

    it('should throw with correct error code', async () => {
      try {
        await findPort({ start: 30000, end: 30000, exclude: [30000] });
      } catch (error) {
        expect(error).toBeInstanceOf(PortFinderError);
        expect((error as PortFinderError).code).toBe('NO_AVAILABLE_PORT');
      }
    });

    it('should validate port range', async () => {
      await expect(findPort({ start: 100, end: 50 })).rejects.toThrow(PortFinderError);
    });
  });

  describe('findPorts', () => {
    it('should find multiple ports', async () => {
      const ports = await findPorts(3);
      expect(ports).toHaveLength(3);
      expect(new Set(ports).size).toBe(3);
    });

    it('should validate count parameter', async () => {
      await expect(findPorts(0)).rejects.toThrow(PortFinderError);
      await expect(findPorts(-1)).rejects.toThrow(PortFinderError);
      await expect(findPorts(1.5)).rejects.toThrow(PortFinderError);
    });

    it('should find consecutive ports when requested', async () => {
      const ports = await findPorts(3, { 
        start: 35000, 
        end: 35100, 
        consecutive: true 
      });
      
      expect(ports).toHaveLength(3);
      expect(ports[1]).toBe(ports[0]! + 1);
      expect(ports[2]).toBe(ports[0]! + 2);
    });

    it('should respect all options', async () => {
      const exclude = [36000, 36002];
      const ports = await findPorts(2, {
        start: 36000,
        end: 36010,
        exclude,
        host: '127.0.0.1',
        validators: ['privileged']
      });
      
      expect(ports).toHaveLength(2);
      for (const port of ports) {
        expect(port).toBeGreaterThanOrEqual(1024);
        expect(exclude.includes(port)).toBe(false);
      }
    });

    it('should throw when not enough ports available', async () => {
      await expect(findPorts(5, { 
        start: 37000, 
        end: 37002 
      })).rejects.toThrow(PortFinderError);
    });

    it('should throw with correct error details', async () => {
      try {
        await findPorts(5, { start: 37000, end: 37002 });
      } catch (error) {
        expect(error).toBeInstanceOf(PortFinderError);
        expect((error as PortFinderError).code).toBe('INSUFFICIENT_PORTS');
        expect((error as PortFinderError).details).toHaveProperty('requested', 5);
      }
    });

    it('should handle edge case with exactly the required number of ports found', async () => {
      // Test when we find exactly the number of ports requested
      const ports = await findPorts(1, { start: 38000, end: 38100 });
      expect(ports).toHaveLength(1);
      expect(ports[0]).toBeGreaterThanOrEqual(38000);
      expect(ports[0]).toBeLessThanOrEqual(38100);
    });

    it('should handle empty exclude array', async () => {
      const port = await findPort({ 
        start: 39000, 
        end: 39100, 
        exclude: [] 
      });
      expect(port).toBeGreaterThanOrEqual(39000);
      expect(port).toBeLessThanOrEqual(39100);
    });

    it('should handle empty validators array', async () => {
      const port = await findPort({ 
        start: 40000, 
        end: 40100, 
        validators: [] 
      });
      expect(port).toBeGreaterThanOrEqual(40000);
      expect(port).toBeLessThanOrEqual(40100);
    });
  });
});