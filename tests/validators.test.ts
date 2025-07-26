import { addValidator, removeValidator, getValidator, applyValidators, builtInValidators } from '../src/validators';

describe('Validators', () => {
  afterEach(() => {
    // Clean up any added validators
    removeValidator('test-validator');
  });

  describe('builtInValidators', () => {
    it('should have common-ports validator', () => {
      const validator = builtInValidators['common-ports'];
      expect(validator).toBeDefined();
      expect(validator!(80)).toBe(false);
      expect(validator!(443)).toBe(false);
      expect(validator!(3000)).toBe(false);
      expect(validator!(12345)).toBe(true);
    });

    it('should have privileged validator', () => {
      const validator = builtInValidators['privileged'];
      expect(validator).toBeDefined();
      expect(validator!(80)).toBe(false);
      expect(validator!(1023)).toBe(false);
      expect(validator!(1024)).toBe(true);
      expect(validator!(8080)).toBe(true);
    });
  });

  describe('addValidator', () => {
    it('should add a custom validator', () => {
      const customValidator = (port: number) => port > 5000;
      addValidator('test-validator', customValidator);
      
      const retrieved = getValidator('test-validator');
      expect(retrieved).toBe(customValidator);
    });

    it('should throw for invalid name', () => {
      expect(() => addValidator('', () => true)).toThrow('Validator name must be a non-empty string');
      expect(() => addValidator(null as any, () => true)).toThrow('Validator name must be a non-empty string');
    });

    it('should throw for invalid validator function', () => {
      expect(() => addValidator('test', null as any)).toThrow('Validator must be a function');
      expect(() => addValidator('test', 'not a function' as any)).toThrow('Validator must be a function');
    });
  });

  describe('removeValidator', () => {
    it('should remove a validator', () => {
      addValidator('test-validator', () => true);
      removeValidator('test-validator');
      expect(getValidator('test-validator')).toBeUndefined();
    });

    it('should throw for invalid name', () => {
      expect(() => removeValidator('')).toThrow('Validator name must be a non-empty string');
      expect(() => removeValidator(null as any)).toThrow('Validator name must be a non-empty string');
    });

    it('should not throw when removing non-existent validator', () => {
      expect(() => removeValidator('non-existent')).not.toThrow();
    });
  });

  describe('getValidator', () => {
    it('should return custom validator if exists', () => {
      const customValidator = () => true;
      addValidator('test-validator', customValidator);
      expect(getValidator('test-validator')).toBe(customValidator);
    });

    it('should return built-in validator if no custom exists', () => {
      expect(getValidator('common-ports')).toBe(builtInValidators['common-ports']);
    });

    it('should return undefined for non-existent validator', () => {
      expect(getValidator('non-existent')).toBeUndefined();
    });
  });

  describe('applyValidators', () => {
    it('should apply all validators successfully', () => {
      const result = applyValidators(2000, ['privileged']);
      expect(result).toBe(true);
    });

    it('should return false if any validator fails', () => {
      const result = applyValidators(80, ['privileged', 'common-ports']);
      expect(result).toBe(false);
    });

    it('should work with custom validators', () => {
      addValidator('test-validator', (port) => port === 1234);
      const result1 = applyValidators(1234, ['test-validator']);
      const result2 = applyValidators(5678, ['test-validator']);
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should throw for unknown validator', () => {
      expect(() => applyValidators(1234, ['unknown-validator'])).toThrow('Unknown validator: unknown-validator');
    });

    it('should work with empty validator list', () => {
      const result = applyValidators(1234, []);
      expect(result).toBe(true);
    });
  });
});