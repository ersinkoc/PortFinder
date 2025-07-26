const { findPort, findPorts, isPortAvailable, PortFinderError } = require('../dist/cjs');

async function errorHandlingExamples() {
  console.log('=== Error Handling Examples ===\n');

  // Example 1: Handle invalid port number
  console.log('1. Invalid Port Number:');
  try {
    await isPortAvailable(70000);
  } catch (error) {
    if (error instanceof PortFinderError) {
      console.log(`   Error code: ${error.code}`);
      console.log(`   Error message: ${error.message}`);
      console.log(`   Error details:`, error.details);
    }
  }

  // Example 2: Handle invalid range
  console.log('\n2. Invalid Port Range:');
  try {
    await findPort({ start: 5000, end: 4000 });
  } catch (error) {
    if (error instanceof PortFinderError) {
      console.log(`   Error code: ${error.code}`);
      console.log(`   Error message: ${error.message}`);
    }
  }

  // Example 3: Handle no available ports
  console.log('\n3. No Available Ports:');
  try {
    await findPort({ 
      start: 30000, 
      end: 30000, 
      exclude: [30000] 
    });
  } catch (error) {
    if (error instanceof PortFinderError && error.code === 'NO_AVAILABLE_PORT') {
      console.log(`   No ports available in the specified range`);
      console.log(`   Attempted range:`, error.details);
    }
  }

  // Example 4: Handle insufficient ports
  console.log('\n4. Insufficient Ports:');
  try {
    await findPorts(10, { 
      start: 40000, 
      end: 40002 
    });
  } catch (error) {
    if (error instanceof PortFinderError && error.code === 'INSUFFICIENT_PORTS') {
      console.log(`   Could not find enough ports`);
      console.log(`   Requested: ${error.details.requested}`);
      console.log(`   Found: ${error.details.found}`);
      console.log(`   Available ports:`, error.details.ports);
    }
  }

  // Example 5: Handle invalid validator
  console.log('\n5. Invalid Validator:');
  try {
    await findPort({ validators: ['non-existent-validator'] });
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Example 6: Graceful fallback strategy
  console.log('\n6. Graceful Fallback Strategy:');
  try {
    let port;
    const strategies = [
      { start: 3000, end: 3000 },
      { start: 8080, end: 8080 },
      { start: 9000, end: 9010 },
      { start: 10000, end: 11000 }
    ];

    for (const strategy of strategies) {
      try {
        port = await findPort(strategy);
        console.log(`   Found port using strategy:`, strategy);
        break;
      } catch (err) {
        console.log(`   Strategy failed:`, strategy);
        continue;
      }
    }

    if (port) {
      console.log(`   Final port: ${port}`);
    } else {
      console.log(`   All strategies failed`);
    }
  } catch (error) {
    console.error('   Unexpected error:', error);
  }

  // Example 7: Error recovery with retries
  console.log('\n7. Error Recovery with Retries:');
  async function findPortWithRetry(options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await findPort(options);
      } catch (error) {
        console.log(`   Attempt ${i + 1} failed: ${error.message}`);
        if (i === maxRetries - 1) throw error;
        
        // Expand search range on each retry
        options = {
          ...options,
          start: options.start - 1000,
          end: options.end + 1000
        };
      }
    }
  }

  try {
    const port = await findPortWithRetry({ start: 50000, end: 50000 });
    console.log(`   Found port after retries: ${port}`);
  } catch (error) {
    console.log(`   Failed after all retries: ${error.message}`);
  }

  // Example 8: Comprehensive error handling
  console.log('\n8. Comprehensive Error Handling:');
  async function safePortFinder(options) {
    try {
      return await findPort(options);
    } catch (error) {
      if (error instanceof PortFinderError) {
        switch (error.code) {
          case 'INVALID_PORT':
            console.log('   Invalid port configuration');
            break;
          case 'INVALID_RANGE':
            console.log('   Invalid port range specified');
            break;
          case 'NO_AVAILABLE_PORT':
            console.log('   No ports available in range');
            break;
          default:
            console.log('   Port finder error:', error.code);
        }
        return null;
      }
      
      // Re-throw unexpected errors
      throw error;
    }
  }

  const result = await safePortFinder({ start: 60000, end: 60000, exclude: [60000] });
  console.log(`   Safe port finder result: ${result}`);
}

// Run examples
if (require.main === module) {
  errorHandlingExamples().catch(console.error);
}