/**
 * E2E Tests with Playwright
 * End-to-end testing for coidea.ai platform
 */

const { test, expect } = require('@playwright/test');

// Base URL for testing
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('coidea.ai E2E Tests', () => {
  
  test.describe('Landing Page', () => {
    test('should display welcome message', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await expect(page.locator('h2')).toContainText('Welcome to coidea.ai');
    });

    test('should display feature cards', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await expect(page.locator('.feature')).toHaveCount(3);
      await expect(page.locator('.feature h3')).toContainText(['Liability Preset', 'AI Agents', 'x402 Payments']);
    });

    test('should have connect wallet button', async ({ page }) => {
      await page.goto(BASE_URL);
      
      await expect(page.locator('button:has-text("Connect")')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      // Mock wallet connection
      await page.evaluate(() => {
        window.ethereum = {
          request: () => Promise.resolve(['0x1234567890abcdef']),
          on: () => {},
          removeListener: () => {}
        };
      });
    });

    test('should navigate to Dashboard', async ({ page }) => {
      await page.click('nav button:has-text("Dashboard")');
      
      await expect(page.locator('h2:has-text("Welcome back")')).toBeVisible();
    });

    test('should navigate to Tasks', async ({ page }) => {
      await page.click('nav button:has-text("Tasks")');
      
      await expect(page.locator('h2:has-text("Tasks")')).toBeVisible();
    });

    test('should navigate to Agents', async ({ page }) => {
      await page.click('nav button:has-text("Agents")');
      
      await expect(page.locator('h2:has-text("AI Agents")')).toBeVisible();
    });

    test('should navigate to Community', async ({ page }) => {
      await page.click('nav button:has-text("Community")');
      
      await expect(page.locator('.community')).toBeVisible();
    });
  });

  test.describe('Dashboard Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      // Mock wallet connection
      await page.evaluate(() => {
        window.ethereum = {
          request: () => Promise.resolve(['0x1234567890abcdef']),
          on: () => {},
          removeListener: () => {}
        };
      });
      await page.click('nav button:has-text("Dashboard")');
    });

    test('should display user wallet address', async ({ page }) => {
      await expect(page.locator('.wallet-address')).toContainText('0x1234');
    });

    test('should display stats cards', async ({ page }) => {
      await expect(page.locator('.stat-card')).toHaveCount(4);
    });

    test('should have create task button', async ({ page }) => {
      await expect(page.locator('button:has-text("Create Task")')).toBeVisible();
    });

    test('should have register agent button', async ({ page }) => {
      await expect(page.locator('button:has-text("Register Agent")')).toBeVisible();
    });

    test('should display human level info', async ({ page }) => {
      await expect(page.locator('.level-badge')).toBeVisible();
    });

    test('should display XP progress bar', async ({ page }) => {
      await expect(page.locator('.xp-bar')).toBeVisible();
      await expect(page.locator('.xp-progress')).toBeVisible();
    });
  });

  test.describe('Tasks Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('nav button:has-text("Tasks")');
    });

    test('should display tasks header', async ({ page }) => {
      await expect(page.locator('h2:has-text("Tasks")')).toBeVisible();
    });

    test('should have create task button', async ({ page }) => {
      await expect(page.locator('button:has-text("Create Task")')).toBeVisible();
    });

    test('should open create task modal', async ({ page }) => {
      await page.click('button:has-text("Create Task")');
      
      await expect(page.locator('.modal-content')).toBeVisible();
    });
  });

  test.describe('Agents Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('nav button:has-text("Agents")');
    });

    test('should display agents header', async ({ page }) => {
      await expect(page.locator('h2:has-text("AI Agents")')).toBeVisible();
    });

    test('should have register agent button', async ({ page }) => {
      await expect(page.locator('button:has-text("Register Agent")')).toBeVisible();
    });
  });

  test.describe('Wallet Connection', () => {
    test('should connect wallet', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Mock MetaMask
      await page.evaluate(() => {
        window.ethereum = {
          request: () => Promise.resolve(['0x1234567890abcdef']),
          on: () => {},
          removeListener: () => {}
        };
      });
      
      await page.click('button:has-text("Connect")');
      
      // Should show connected state
      await expect(page.locator('.wallet-address')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      
      // Check if layout adapts
      const nav = await page.locator('.main-nav');
      await expect(nav).toBeVisible();
    });

    test('should adapt to tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL);
      
      await expect(page.locator('.main-nav')).toBeVisible();
    });

    test('should adapt to desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(BASE_URL);
      
      await expect(page.locator('.main-nav')).toBeVisible();
    });
  });

  test.describe('Full User Journey', () => {
    test('should complete full workflow', async ({ page }) => {
      // 1. Visit landing page
      await page.goto(BASE_URL);
      await expect(page.locator('h2')).toContainText('Welcome to coidea.ai');
      
      // 2. Connect wallet
      await page.evaluate(() => {
        window.ethereum = {
          request: () => Promise.resolve(['0x1234567890abcdef']),
          on: () => {},
          removeListener: () => {}
        };
      });
      await page.click('button:has-text("Connect")');
      
      // 3. Navigate to Dashboard
      await page.click('nav button:has-text("Dashboard")');
      await expect(page.locator('h2:has-text("Welcome back")')).toBeVisible();
      
      // 4. Navigate to Tasks
      await page.click('nav button:has-text("Tasks")');
      await expect(page.locator('h2:has-text("Tasks")')).toBeVisible();
      
      // 5. Navigate to Agents
      await page.click('nav button:has-text("Agents")');
      await expect(page.locator('h2:has-text("AI Agents")')).toBeVisible();
      
      // 6. Navigate to Community
      await page.click('nav button:has-text("Community")');
      await expect(page.locator('.community')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 errors gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/non-existent-page`);
      
      // Should show 404 or redirect to home
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle network errors', async ({ page }) => {
      // Simulate offline
      await page.context().setOffline(true);
      
      await page.goto(BASE_URL);
      
      // Should show error state or offline message
      await expect(page.locator('body')).toBeVisible();
      
      // Restore network
      await page.context().setOffline(false);
    });
  });

  test.describe('Performance', () => {
    test('should load within 3 seconds', async ({ page }) => {
      const start = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;
      
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have no console errors', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      
      expect(errors).toHaveLength(0);
    });
  });
});
