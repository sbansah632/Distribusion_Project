const { test, expect } = require('@playwright/test');
const { generateGistPayload, generateFileContent, generateTestId, cleanupGistsAfterAll } = require('../../src/utils/data');

// Track created gists for cleanup
const createdGists = [];


test.afterAll(cleanupGistsAfterAll(createdGists));

test.describe('Gist File Operations', () => {
  test('Add multiple file types to gist', async ({ request }) => {
    const testId = generateTestId('files-add');
    
    // Create gist with multiple files
    const gistPayload = generateGistPayload({
      description: `Files add test - ${testId}`,
      public: false,
      files: [
        { name: 'file1.txt', content: generateFileContent('text') },
        { name: 'file2.md', content: generateFileContent('markdown') },
        { name: 'file3.json', content: generateFileContent('json') },
        { name: 'file4.js', content: generateFileContent('code') }
      ]
    });
    
    const createResponse = await request.post('/gists', { data: gistPayload });
    expect(createResponse).toBeOK();
    const gistData = await createResponse.json();
    createdGists.push(gistData.id);
    
    // Verify all files are present
    expect(gistData.files['file1.txt']).toBeDefined();
    expect(gistData.files['file2.md']).toBeDefined();
    expect(gistData.files['file3.json']).toBeDefined();
    expect(gistData.files['file4.js']).toBeDefined();
    
    // Verify file contents
    expect(gistData.files['file1.txt'].content).toBe(generateFileContent('text'));
    expect(gistData.files['file2.md'].content).toBe(generateFileContent('markdown'))
    expect(gistData.files['file4.js'].content).toBe(generateFileContent('code'));
    
    // For JSON content, parse before comparing
    const expectedJson = JSON.parse(generateFileContent('json'));
    const actualJson = JSON.parse(gistData.files['file3.json'].content);
    expect(actualJson.test).toBe(expectedJson.test);
    expect(actualJson.data).toBe(expectedJson.data);
  });

  test('Add new file to existing gist', async ({ request }) => {
    const testId = generateTestId('files-add-new');
    
    // Create gist with one file
    const gistPayload = generateGistPayload({
      description: `Files add new test - ${testId}`,
      public: false,
      files: [
        { name: 'original.txt', content: 'Original file' }
      ]
    });
    
    const createResponse = await request.post('/gists', { data: gistPayload });
    expect(createResponse).toBeOK();
    const gistData = await createResponse.json();
    createdGists.push(gistData.id);
    
    // Add new file
    const updatePayload = {
      files: {
        'original.txt': {
          content: 'Original file' // Keep existing file
        },
        'new-file.md': {
          content: '# New File\n\nThis is a newly added file.'
        }
      }
    };
    
    const updateResponse = await request.patch(`/gists/${gistData.id}`, { data: updatePayload });
    expect(updateResponse.ok(), 'Adding new file should succeed').toBeTruthy();
    
    expect(updateResponse).toBeOK();
    const updatedData = await updateResponse.json();
    expect(updatedData.files['original.txt']).toBeDefined();
    expect(updatedData.files['new-file.md']).toBeDefined();
    expect(updatedData.files['new-file.md'].content).toBe('# New File\n\nThis is a newly added file.');
  });

  test('should delete single file from list of files and verify only  specified file was deleted', async ({ request }) => {
    const testId = generateTestId('files-delete');
    
    // Create gist with multiple files
    const gistPayload = generateGistPayload({
      description: `Files delete test - ${testId}`,
      public: false,
      files: [
        { name: 'keep.txt', content: 'This file should be kept' },
        { name: 'delete.txt', content: 'This file should be deleted' }
      ]
    });
    
    const createResponse = await request.post('/gists', { data: gistPayload });
    expect(createResponse).toBeOK();
    const gistData = await createResponse.json();
    createdGists.push(gistData.id);
    
    // Delete one file by setting it to null
    const updatePayload = {
      files: {
        'keep.txt': {
          content: 'This file should be kept'
        },
        'delete.txt': null // This deletes the file
      }
    };
    
    const updateResponse = await request.patch(`/gists/${gistData.id}`, { data: updatePayload });  

    expect(updateResponse).toBeOK(); // Validate response is OK
    const updatedData = await updateResponse.json();

    // Verify file deletion
    expect(updatedData.files['keep.txt']).toBeDefined();
    expect(updatedData.files['delete.txt']).toBeUndefined();
  });

  test('Handle file with special characters in name', async ({ request }) => {
    const testId = generateTestId('files-special');
    
    // Create gist with files having special characters in names
    const gistPayload = generateGistPayload({
      description: `Files special chars test - ${testId}`,
      public: false,
      files: [
        { name: 'file with spaces.txt', content: 'File with spaces in name' },
        { name: 'file-with-dashes.txt', content: 'File with dashes in name' },
        { name: 'file_with_underscores.txt', content: 'File with underscores in name' },
        { name: 'file.with.dots.txt', content: 'File with dots in name' }
      ]
    });
    
    const createResponse = await request.post('/gists', { data: gistPayload });

    expect(createResponse).toBeOK();
    const gistData = await createResponse.json();
    createdGists.push(gistData.id);
    
    // Verify all files with special characters are present
    expect(gistData.files['file with spaces.txt']).toBeDefined();
    expect(gistData.files['file-with-dashes.txt']).toBeDefined();
    expect(gistData.files['file_with_underscores.txt']).toBeDefined();
    expect(gistData.files['file.with.dots.txt']).toBeDefined();
  });
});


