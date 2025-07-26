import * as path from 'path';
import { spawn } from 'child_process';

const cliPath = path.join(__dirname, '..', 'src', 'cli.ts');

describe('CLI', () => {
  function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
      const proc = spawn('node', ['-r', 'ts-node/register', cliPath, ...args]);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({ stdout, stderr, code: code || 0 });
      });
    });
  }

  describe('help', () => {
    it('should show help with -h flag', async () => {
      const { stdout, code } = await runCLI(['-h']);
      expect(code).toBe(0);
      expect(stdout).toContain('port-finder - Find available network ports');
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('Options:');
      expect(stdout).toContain('Examples:');
    });

    it('should show help with --help flag', async () => {
      const { stdout, code } = await runCLI(['--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('port-finder - Find available network ports');
    });
  });

  describe('find single port', () => {
    it('should find a single port with default options', async () => {
      const { stdout, code } = await runCLI([]);
      expect(code).toBe(0);
      const port = parseInt(stdout.trim(), 10);
      expect(port).toBeGreaterThanOrEqual(3000);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should find port with start option', async () => {
      const { stdout, code } = await runCLI(['-s', '40000']);
      expect(code).toBe(0);
      const port = parseInt(stdout.trim(), 10);
      expect(port).toBeGreaterThanOrEqual(40000);
    });

    it('should find port with start and end options', async () => {
      const { stdout, code } = await runCLI(['--start', '41000', '--end', '41100']);
      expect(code).toBe(0);
      const port = parseInt(stdout.trim(), 10);
      expect(port).toBeGreaterThanOrEqual(41000);
      expect(port).toBeLessThanOrEqual(41100);
    });

    it('should exclude specified ports', async () => {
      const { stdout, code } = await runCLI(['-s', '42000', '-e', '42005', '-x', '42000,42001,42002']);
      expect(code).toBe(0);
      const port = parseInt(stdout.trim(), 10);
      expect([42000, 42001, 42002]).not.toContain(port);
    });

    it('should use specified host', async () => {
      const { stdout, code } = await runCLI(['-H', '127.0.0.1', '-s', '43000', '-e', '43010']);
      expect(code).toBe(0);
      const port = parseInt(stdout.trim(), 10);
      expect(port).toBeGreaterThanOrEqual(43000);
    });

    it('should apply validators', async () => {
      const { stdout, code } = await runCLI(['-v', 'privileged', '-s', '1000', '-e', '2000']);
      expect(code).toBe(0);
      const port = parseInt(stdout.trim(), 10);
      expect(port).toBeGreaterThanOrEqual(1024);
    });

    it('should output JSON format', async () => {
      const { stdout, code } = await runCLI(['-j', '-s', '44000', '-e', '44100']);
      expect(code).toBe(0);
      const result = JSON.parse(stdout);
      expect(result).toHaveProperty('port');
      expect(result.port).toBeGreaterThanOrEqual(44000);
    });

    it('should handle error when no port available', async () => {
      const { stderr, code } = await runCLI(['-s', '45000', '-e', '45000', '-x', '45000']);
      expect(code).toBe(1);
      expect(stderr).toContain('Error:');
    });

    it('should handle error in JSON format', async () => {
      const { stderr, code } = await runCLI(['-j', '-s', '45000', '-e', '45000', '-x', '45000']);
      expect(code).toBe(1);
      const result = JSON.parse(stderr);
      expect(result).toHaveProperty('error');
      expect(result.error).toHaveProperty('message');
      expect(result.error).toHaveProperty('code');
    });
  });

  describe('find multiple ports', () => {
    it('should find multiple ports', async () => {
      const { stdout, code } = await runCLI(['-c', '3', '-s', '46000', '-e', '46100']);
      expect(code).toBe(0);
      const ports = stdout.trim().split(' ').map(p => parseInt(p, 10));
      expect(ports).toHaveLength(3);
      expect(new Set(ports).size).toBe(3);
    });

    it('should find consecutive ports', async () => {
      const { stdout, code } = await runCLI(['--count', '3', '--consecutive', '-s', '47000', '-e', '47100']);
      expect(code).toBe(0);
      const ports = stdout.trim().split(' ').map(p => parseInt(p, 10));
      expect(ports).toHaveLength(3);
      expect(ports[1]).toBe(ports[0]! + 1);
      expect(ports[2]).toBe(ports[0]! + 2);
    });

    it('should output multiple ports in JSON format', async () => {
      const { stdout, code } = await runCLI(['-j', '-c', '3', '-s', '48000', '-e', '48100']);
      expect(code).toBe(0);
      const result = JSON.parse(stdout);
      expect(result).toHaveProperty('ports');
      expect(result.ports).toHaveLength(3);
    });

    it('should handle insufficient ports error', async () => {
      const { stderr, code } = await runCLI(['-c', '10', '-s', '49000', '-e', '49002']);
      expect(code).toBe(1);
      expect(stderr).toContain('Error:');
    });
  });

  describe('check port', () => {
    it('should check if port is available', async () => {
      const { stdout, code } = await runCLI(['--check', '50000']);
      // Exit code 0 if available, 1 if in use
      expect([0, 1]).toContain(code);
      expect(stdout).toMatch(/Port 50000 is (available|in use)/);
    });

    it('should check port with custom host', async () => {
      const { stdout, code } = await runCLI(['--check', '50001', '-H', '127.0.0.1']);
      expect([0, 1]).toContain(code);
      expect(stdout).toMatch(/Port 50001 is (available|in use)/);
    });

    it('should check port in JSON format', async () => {
      const { stdout, code } = await runCLI(['--check', '50002', '-j']);
      expect([0, 1]).toContain(code);
      const result = JSON.parse(stdout);
      expect(result).toHaveProperty('port', 50002);
      expect(result).toHaveProperty('available');
      expect(typeof result.available).toBe('boolean');
    });

    it('should handle invalid port in check', async () => {
      const { stderr, code } = await runCLI(['--check', '0']);
      expect(code).toBe(1);
      expect(stderr).toContain('Error:');
    });
  });

  describe('error handling', () => {
    it('should handle invalid start port', async () => {
      const { stderr, code } = await runCLI(['-s', '0']);
      expect(code).toBe(1);
      expect(stderr).toContain('Error:');
    });

    it('should handle invalid end port', async () => {
      const { stderr, code } = await runCLI(['-e', '70000']);
      expect(code).toBe(1);
      expect(stderr).toContain('Error:');
    });

    it('should handle invalid count', async () => {
      const { stderr, code } = await runCLI(['-c', '-1']);
      expect(code).toBe(1);
      expect(stderr).toContain('Error:');
    });

    it('should handle non-numeric port in exclude', async () => {
      // NaN values are filtered out, so this won't cause an error
      const { stdout, code } = await runCLI(['-x', 'abc,123', '-s', '51000', '-e', '51010']);
      expect(code).toBe(0);
      const port = parseInt(stdout.trim(), 10);
      expect(port).toBeGreaterThanOrEqual(51000);
    });

    it('should handle unknown validator', async () => {
      const { stderr, code } = await runCLI(['-v', 'unknown-validator']);
      expect(code).toBe(1);
      expect(stderr).toContain('Error:');
    });

    it('should handle multiple validators', async () => {
      const { stdout, code } = await runCLI(['-v', 'common-ports,privileged', '-s', '1000', '-e', '2000']);
      expect(code).toBe(0);
      const port = parseInt(stdout.trim(), 10);
      expect(port).toBeGreaterThanOrEqual(1024);
    });

    it('should handle generic errors in JSON format', async () => {
      // Force a generic error by using invalid options combination
      const { stderr, code } = await runCLI(['-j', '-s', '65536']);
      expect(code).toBe(1);
      const result = JSON.parse(stderr);
      expect(result).toHaveProperty('error');
      expect(result.error).toHaveProperty('message');
    });
  });
});