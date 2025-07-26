const { findPort, findPorts, isPortAvailable, addValidator } = require('../dist/cjs');

async function basicExamples() {
  console.log('=== Basic Port Finder Examples ===\n');

  // Example 1: Find a single available port
  try {
    const port = await findPort();
    console.log(`1. Found available port: ${port}`);
  } catch (error) {
    console.error('Error finding port:', error.message);
  }

  // Example 2: Find port in specific range
  try {
    const port = await findPort({ start: 4000, end: 5000 });
    console.log(`2. Found port between 4000-5000: ${port}`);
  } catch (error) {
    console.error('Error finding port in range:', error.message);
  }

  // Example 3: Check if specific port is available
  try {
    const available = await isPortAvailable(3000);
    console.log(`3. Port 3000 is ${available ? 'available' : 'in use'}`);
  } catch (error) {
    console.error('Error checking port:', error.message);
  }

  // Example 4: Find multiple ports
  try {
    const ports = await findPorts(3);
    console.log(`4. Found 3 available ports: ${ports.join(', ')}`);
  } catch (error) {
    console.error('Error finding multiple ports:', error.message);
  }

  // Example 5: Find consecutive ports
  try {
    const ports = await findPorts(3, { consecutive: true, start: 8000 });
    console.log(`5. Found 3 consecutive ports: ${ports.join(', ')}`);
  } catch (error) {
    console.error('Error finding consecutive ports:', error.message);
  }

  // Example 6: Use built-in validators
  try {
    const port = await findPort({ validators: ['privileged'] });
    console.log(`6. Found non-privileged port (>=1024): ${port}`);
  } catch (error) {
    console.error('Error with validator:', error.message);
  }

  // Example 7: Exclude specific ports
  try {
    const port = await findPort({ 
      start: 3000, 
      end: 3010, 
      exclude: [3000, 3001, 3002] 
    });
    console.log(`7. Found port excluding 3000-3002: ${port}`);
  } catch (error) {
    console.error('Error with exclusions:', error.message);
  }

  // Example 8: Custom validator
  try {
    // Add validator that only allows ports divisible by 1000
    addValidator('thousand-only', (port) => port % 1000 === 0);
    
    const port = await findPort({ 
      start: 3000, 
      end: 10000,
      validators: ['thousand-only'] 
    });
    console.log(`8. Found port divisible by 1000: ${port}`);
  } catch (error) {
    console.error('Error with custom validator:', error.message);
  }
}

// Run examples
if (require.main === module) {
  basicExamples().catch(console.error);
}