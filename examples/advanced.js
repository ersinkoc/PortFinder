const { findPort, findPorts, addValidator, removeValidator } = require('../dist/cjs');
const { createServer } = require('net');

async function advancedExamples() {
  console.log('=== Advanced Port Finder Examples ===\n');

  // Example 1: Development server with fallback ports
  console.log('1. Development Server Example:');
  try {
    const preferredPorts = [3000, 3001, 8080, 8081, 9000];
    let port = null;

    for (const preferred of preferredPorts) {
      try {
        const available = await isPortAvailable(preferred);
        if (available) {
          port = preferred;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!port) {
      port = await findPort({ start: 3000 });
    }

    console.log(`   Starting development server on port ${port}`);
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Example 2: Microservices port allocation
  console.log('\n2. Microservices Port Allocation:');
  try {
    const services = ['api', 'auth', 'database', 'cache', 'queue'];
    const servicePorts = {};

    // Find ports for all services
    const ports = await findPorts(services.length, {
      start: 4000,
      end: 5000,
      validators: ['privileged']
    });

    services.forEach((service, index) => {
      servicePorts[service] = ports[index];
    });

    console.log('   Service ports:', JSON.stringify(servicePorts, null, 2));
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Example 3: Port range preferences
  console.log('\n3. Port Range Preferences:');
  try {
    // Add custom validator for specific ranges
    addValidator('dev-range', (port) => 
      (port >= 3000 && port <= 3999) || 
      (port >= 8000 && port <= 8999)
    );

    const port = await findPort({
      validators: ['dev-range', 'privileged']
    });

    console.log(`   Found port in development ranges: ${port}`);
    
    // Clean up
    removeValidator('dev-range');
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Example 4: Cluster mode with consecutive ports
  console.log('\n4. Cluster Mode Example:');
  try {
    const workerCount = 4;
    const ports = await findPorts(workerCount, {
      start: 5000,
      consecutive: true
    });

    console.log(`   Master process port: ${ports[0]}`);
    console.log(`   Worker ports: ${ports.slice(1).join(', ')}`);
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Example 5: CI/CD environment port allocation
  console.log('\n5. CI/CD Environment:');
  try {
    // In CI, avoid common ports and use higher ranges
    addValidator('ci-safe', (port) => 
      port >= 10000 && 
      port <= 20000 && 
      !COMMON_CI_PORTS.has(port)
    );

    const testPorts = await findPorts(3, {
      validators: ['ci-safe'],
      exclude: [10080, 10443] // Exclude any known CI service ports
    });

    console.log(`   Test server ports: ${testPorts.join(', ')}`);
    
    removeValidator('ci-safe');
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Example 6: Docker-style port mapping
  console.log('\n6. Docker Port Mapping:');
  try {
    const containerPorts = {
      web: 80,
      api: 3000,
      db: 5432
    };

    const hostPorts = {};
    for (const [service, containerPort] of Object.entries(containerPorts)) {
      const hostPort = await findPort({
        start: containerPort,
        exclude: Object.values(hostPorts)
      });
      hostPorts[service] = hostPort;
    }

    console.log('   Port mappings:');
    for (const [service, containerPort] of Object.entries(containerPorts)) {
      console.log(`     ${service}: ${hostPorts[service]}:${containerPort}`);
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Example 7: Load balancer with health check port
  console.log('\n7. Load Balancer Setup:');
  try {
    // Find main port and health check port
    const [mainPort, healthPort] = await findPorts(2, {
      start: 8000,
      end: 9000
    });

    console.log(`   Main service port: ${mainPort}`);
    console.log(`   Health check port: ${healthPort}`);

    // Simulate finding backend ports
    const backendCount = 3;
    const backendPorts = await findPorts(backendCount, {
      start: 9001,
      validators: ['privileged']
    });

    console.log(`   Backend ports: ${backendPorts.join(', ')}`);
  } catch (error) {
    console.error('   Error:', error.message);
  }
}

// Common CI ports to avoid
const COMMON_CI_PORTS = new Set([
  10080, 10443, 11211, 15672, 16379, 19000, 19001
]);

// Run examples
if (require.main === module) {
  advancedExamples().catch(console.error);
}