/**
 * Simple smoke tests for frontend
 * Verifies components can be imported without errors
 */

// Test that ApiTest component exists
const fs = require('fs');
const path = require('path');

describe('Frontend Smoke Tests', () => {
  it('should have ApiTest component', () => {
    const componentPath = path.join(__dirname, 'ApiTest.js');
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('should have API service', () => {
    const servicePath = path.join(__dirname, '../services/api.js');
    expect(fs.existsSync(servicePath)).toBe(true);
  });

  it('should have useApi hooks', () => {
    const hooksPath = path.join(__dirname, '../hooks/useApi.js');
    expect(fs.existsSync(hooksPath)).toBe(true);
  });

  it('should export API methods', () => {
    const apiModule = require('../services/api');
    const api = apiModule.default || apiModule;
    expect(api.agents).toBeDefined();
    expect(api.tasks).toBeDefined();
    expect(api.humans).toBeDefined();
    expect(api.health).toBeDefined();
  });

  it('should have required API methods', () => {
    const apiModule = require('../services/api');
    const api = apiModule.default || apiModule;
    
    // Agents
    expect(typeof api.agents.getById).toBe('function');
    expect(typeof api.agents.getByWallet).toBe('function');
    expect(typeof api.agents.register).toBe('function');
    
    // Tasks
    expect(typeof api.tasks.getById).toBe('function');
    expect(typeof api.tasks.getActive).toBe('function');
    expect(typeof api.tasks.create).toBe('function');
    
    // Humans
    expect(typeof api.humans.getById).toBe('function');
    expect(typeof api.humans.getLevel).toBe('function');
    expect(typeof api.humans.getPermissions).toBe('function');
    
    // Health
    expect(typeof api.health.check).toBe('function');
  });
});
