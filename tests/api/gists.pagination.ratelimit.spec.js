const { test, expect } = require('@playwright/test');
const { generatePaginationParams } = require('../../src/utils/data');

test.describe('Gist Pagination and Rate Limiting', () => {
  test('API should handle different pagination parameters', async ({ request }) => {
    
    // Test different pagination parameters
    const paginationTests = [
      { perPage: 5, page: 1 },
      { perPage: 10, page: 1 },
      { perPage: 3, page: 2 }
    ];
    
    for (const params of paginationTests) {
      const paginationParams = generatePaginationParams(params);
      const response = await request.get(`/gists?${new URLSearchParams(paginationParams).toString()}`);
      
      // Validate response is OK
      expect(response).toBeOK();
      
      // Verify response contains gists
      const gists = await response.json();
      expect(gists.length).toBeLessThanOrEqual(params.perPage);
    }
  });

  test('API should validate rate limit headers and track consumption across requests', async ({ request }) => {
    
    // First request - validate rate limiting headers
    const response = await request.get('/gists?per_page=1');
    expect(response.ok(), 'API should be accessible').toBeTruthy();
    
    // Check rate limiting headers
    const rateLimitLimit = response.headers()['x-ratelimit-limit'];
    const rateLimitRemaining = response.headers()['x-ratelimit-remaining'];
    const rateLimitReset = response.headers()['x-ratelimit-reset'];
    
    expect(rateLimitLimit).toBeTruthy();
    expect(rateLimitRemaining).toBeTruthy();
    expect(rateLimitReset).toBeTruthy();
    
    // Verify rate limit headers are valid numbers
    expect(parseInt(rateLimitLimit), 'Rate limit should be a valid number').toBeGreaterThan(0);
    expect(parseInt(rateLimitRemaining), 'Rate remaining should be a valid number').toBeGreaterThanOrEqual(0);
    expect(parseInt(rateLimitReset), 'Rate reset should be a valid timestamp').toBeGreaterThan(0);
    
    // Second request - track rate limit consumption
    const secondResponse = await request.get('/gists?per_page=1');
    const secondRemaining = parseInt(secondResponse.headers()['x-ratelimit-remaining']);
    // Verify rate limit consumption
    expect(secondRemaining).toBeLessThanOrEqual(parseInt(rateLimitRemaining));

  });

  test('API should handle large page sizes gracefully', async ({ request }) => {
    
    // Test with a large page size (GitHub typically limits this)
    const response = await request.get('/gists?per_page=100');
    expect(response.ok(), 'Large page size should be handled gracefully').toBeTruthy();
    
    const gists = await response.json();

    // Verify pagination
    expect(Array.isArray(gists)).toBeTruthy();
    expect(gists.length, 'Should return reasonable number of gists').toBeLessThanOrEqual(100);
  });

  test('API should validate pagination with different endpoints', async ({ request }) => {
    
    const endpoints = [
      '/gists',
      '/gists/public',
      '/gists/starred'
    ];
    
    for (const endpoint of endpoints) {
      const response = await request.get(`${endpoint}?per_page=5&page=1`);
      
        expect(response).toBeOK(); // Validate response is OK
        const data = await response.json();
        // Verify pagination
        expect(Array.isArray(data), `${endpoint} should return an array`).toBeTruthy();
        expect(data.length).toBeLessThanOrEqual(5);
   
    }
  });

  test('API should handle invalid pagination parameters', async ({ request }) => {
    
    const invalidParams = [
      'per_page=0',
      'per_page=-1',
      'page=0',
      'page=-1',
      'per_page=abc',
      'page=xyz'
    ];
    
    for (const param of invalidParams) {
      const response = await request.get(`/gists?${param}`);
      
      // GitHub API should handle invalid parameters gracefully or return 400 or ignore invalid params and use defaults
      expect([200, 400]).toContain(response.status());
    }
  });
});


