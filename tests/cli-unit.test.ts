import { parseArgs, printHelp, main } from '../src/cli';

describe('CLI Unit Tests', () => {
  describe('parseArgs', () => {
    it('should parse help flags', () => {
      expect(parseArgs(['-h'])).toEqual({ help: true });
      expect(parseArgs(['--help'])).toEqual({ help: true });
    });

    it('should parse start port', () => {
      expect(parseArgs(['-s', '3000'])).toEqual({ start: 3000 });
      expect(parseArgs(['--start', '4000'])).toEqual({ start: 4000 });
    });

    it('should parse end port', () => {
      expect(parseArgs(['-e', '5000'])).toEqual({ end: 5000 });
      expect(parseArgs(['--end', '6000'])).toEqual({ end: 6000 });
    });

    it('should parse exclude ports', () => {
      expect(parseArgs(['-x', '3000,3001,3002'])).toEqual({ exclude: [3000, 3001, 3002] });
      expect(parseArgs(['--exclude', '4000,4001'])).toEqual({ exclude: [4000, 4001] });
    });

    it('should parse host', () => {
      expect(parseArgs(['-H', '127.0.0.1'])).toEqual({ host: '127.0.0.1' });
      expect(parseArgs(['--host', '0.0.0.0'])).toEqual({ host: '0.0.0.0' });
    });

    it('should parse count', () => {
      expect(parseArgs(['-c', '5'])).toEqual({ count: 5 });
      expect(parseArgs(['--count', '10'])).toEqual({ count: 10 });
    });

    it('should parse consecutive flag', () => {
      expect(parseArgs(['--consecutive'])).toEqual({ consecutive: true });
    });

    it('should parse validators', () => {
      expect(parseArgs(['-v', 'privileged,common-ports'])).toEqual({ validators: ['privileged', 'common-ports'] });
      expect(parseArgs(['--validators', 'privileged'])).toEqual({ validators: ['privileged'] });
    });

    it('should parse check port', () => {
      expect(parseArgs(['--check', '3000'])).toEqual({ check: 3000 });
    });

    it('should parse json flag', () => {
      expect(parseArgs(['-j'])).toEqual({ json: true });
      expect(parseArgs(['--json'])).toEqual({ json: true });
    });

    it('should parse multiple options', () => {
      const result = parseArgs(['-s', '3000', '-e', '4000', '-c', '5', '--consecutive', '-j']);
      expect(result).toEqual({
        start: 3000,
        end: 4000,
        count: 5,
        consecutive: true,
        json: true
      });
    });

    it('should handle empty args', () => {
      expect(parseArgs([])).toEqual({});
    });

    it('should handle NaN values for numeric options', () => {
      const result = parseArgs(['-s', 'not-a-number', '-c', 'abc']);
      expect(result.start).toBeNaN();
      expect(result.count).toBeNaN();
    });
  });

  describe('printHelp', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should print help message', () => {
      printHelp();
      expect(consoleLogSpy).toHaveBeenCalled();
      const helpText = consoleLogSpy.mock.calls[0][0];
      expect(helpText).toContain('port-finder - Find available network ports');
      expect(helpText).toContain('Usage:');
      expect(helpText).toContain('Options:');
      expect(helpText).toContain('Examples:');
      expect(helpText).toContain('-h, --help');
      expect(helpText).toContain('-s, --start');
      expect(helpText).toContain('-e, --end');
      expect(helpText).toContain('-x, --exclude');
      expect(helpText).toContain('-H, --host');
      expect(helpText).toContain('-c, --count');
      expect(helpText).toContain('--consecutive');
      expect(helpText).toContain('-v, --validators');
      expect(helpText).toContain('--check');
      expect(helpText).toContain('-j, --json');
    });
  });

  describe('main', () => {
    // Test that main function exists and is exported
    it('should export main function', () => {
      expect(typeof main).toBe('function');
    });

  });
});