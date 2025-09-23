const { test, expect } = require('@playwright/test');
const {
  SIZE_1MB_BELOW, SIZE_1MB_EXACT, SIZE_1MB_ABOVE, SIZE_10MB_BELOW,
  createTestFile,
  readTestFile,
  cleanupGistsAfterAll,
  cleanupFilesAfterAll
} = require('../../src/utils/data');

// Track created gists and files for cleanup
const createdGists = [];
const testFiles = [];

test.afterAll(cleanupGistsAfterAll(createdGists));
test.afterAll(cleanupFilesAfterAll(testFiles));

test.describe('Gist File Size Boundaries', () => {
  test('API should handle content under GitHub boundary without truncation', async ({ request }) => {
    const filename = 'under-boundary.txt';
    const filePath = createTestFile(filename, SIZE_1MB_BELOW);
    testFiles.push(filePath);
    const expectedContent = readTestFile(filePath);

    const response = await request.post('/gists', {
      data: {
        description: `File under GitHub boundary (${SIZE_1MB_BELOW} bytes)`,
        public: false,
        files: { [filename]: { content: expectedContent } }
      }
    });
    expect(response).toBeOK();
    const gistData = await response.json();
    createdGists.push(gistData.id);

    const file = gistData.files[filename];
    expect(file).toBeDefined();
    
    // Validate truncation based on API response
    expect(file.truncated).toBe(false);
    
    // Verify content is available inline when not truncated
    expect(file.content).toBeDefined();
    // Verify content is available inline when not truncated
    expect(file.content).toBe(expectedContent);
  });

  test('API should truncate content at GitHub 1mb boundary', async ({ request }) => {
    const filename = 'around-boundary.txt';
    const filePath = createTestFile(filename, SIZE_1MB_EXACT);
    testFiles.push(filePath);
    const expectedContent = readTestFile(filePath);

    const response = await request.post('/gists', {
      data: {
        description: `File around GitHub boundary (${SIZE_1MB_EXACT} bytes)`,
        public: false,
        files: { [filename]: { content: expectedContent } }
      }
    });
    expect(response).toBeOK();
    const gistData = await response.json();
    createdGists.push(gistData.id);

    const file = gistData.files[filename];
    expect(file.truncated).toBe(true);
    
    // Verify raw_url is provided when truncated
    expect(file.raw_url).toBeDefined();
    expect(typeof file.raw_url).toBe('string');


    // Verify full content via raw_url
    const rawResponse = await request.get(file.raw_url);
    expect(rawResponse).toBeOK();
    const text = await rawResponse.text();

    expect(text).toBe(expectedContent);
  });

  test('API should truncate content over GitHub boundary and provide raw_url', async ({ request }) => {
    const filename = 'over-boundary.txt';
    const filePath = createTestFile(filename, SIZE_1MB_ABOVE);
    testFiles.push(filePath);
    const expectedContent = readTestFile(filePath);

    const response = await request.post('/gists', {
      data: {
        description: `File over GitHub boundary (${SIZE_1MB_ABOVE} bytes)`,
        public: false,
        files: { [filename]: { content: expectedContent } }
      }
    });
    expect(response).toBeOK();
    const gistData = await response.json();
    createdGists.push(gistData.id);

    const file = gistData.files[filename];
    expect(file).toBeDefined();
    
    // Validate truncation based on API response, not content length
    expect(file.truncated, 'Files over GitHub boundary should be truncated').toBe(true);
    
    // Verify raw_url is provided when truncated
    expect(file.raw_url).toBeDefined();
    expect(typeof file.raw_url).toBe('string');


    // Verify full content via raw_url
    const rawResponse = await request.get(file.raw_url);
    expect(rawResponse).toBeOK();
    const text = await rawResponse.text();

    expect(text).toBe(expectedContent);
  });


  test('API should handle large content but under 10MB via raw_url', async ({ request }) => {
    const filename = 'large-file.txt';
    const filePath = createTestFile(filename, SIZE_10MB_BELOW);
    testFiles.push(filePath);
    const expectedContent = readTestFile(filePath);

    const response = await request.post('/gists', {
      data: {
        description: `Large file under 10MB (${SIZE_10MB_BELOW} bytes)`,
        public: false,
        files: { [filename]: { content: expectedContent } }
      },
    });
    expect(response).toBeOK();
    const gistData = await response.json();
    createdGists.push(gistData.id);

    const file = gistData.files[filename];
    expect(file).toBeDefined();
    
    // Validate truncation based on API response
    expect(file.truncated, 'Large files should be truncated').toBe(true);
    
    // Verify raw_url is provided for large content
    expect(file.raw_url).toBeDefined();
    expect(typeof file.raw_url).toBe('string');
    
    // Verify full content via raw_url- should work for files under 10MB
    const rawResponse = await request.get(file.raw_url);
    expect(rawResponse).toBeOK();
    const text = await rawResponse.text();
    expect(text).toBe(expectedContent);
    }
  );
});
