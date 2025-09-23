const { test, expect } = require('@playwright/test');
const { generateGistPayload, generateTestId, cleanupGistsAfterAll } = require('../../src/utils/data');

// Track created gists for cleanup
const createdGists = [];


test.afterAll(cleanupGistsAfterAll(createdGists));

test.describe('Gist CRUD Operations', () => {
  test('Create a secret gist', async ({ request }) => {
    const testId = generateTestId('create');
    const gistPayload = generateGistPayload({
      description: `Create test - ${testId}`,
      public: false,
      files: [
        { name: 'test-file.txt', content: 'Initial content for creation testing' }
      ]
    });
    
    const createResponse = await request.post('/gists', {
      data: gistPayload,
    });
    expect(createResponse.ok(), 'Gist creation should succeed').toBeTruthy();
    
    expect(createResponse).toBeOK();
    const gistData = await createResponse.json();
    createdGists.push(gistData.id);
    
    // Verify gist description
    expect(gistData.description).toBe(gistPayload.description);

    // Verify gist is private
    expect(gistData.public).toBe(false);

    // Verify file is present
    expect(gistData.files['test-file.txt']).toBeDefined();
  });

  test('Read a gist by ID', async ({ request }) => {
    const testId = generateTestId('read');
    const gistPayload = generateGistPayload({
      description: `Read test - ${testId}`,
      public: false,
      files: [
        { name: 'read-test.txt', content: 'Content for read testing' }
      ]
    });
    
    // Create gist first
    const createResponse = await request.post('/gists', {
      data: gistPayload,
    });
    expect(createResponse).toBeOK();
    const gistData = await createResponse.json();
    createdGists.push(gistData.id);
    
    // Read the gist
    const readResponse = await request.get(`/gists/${gistData.id}`, {
    });
    expect(readResponse).toBeOK();;
    
    const readData = await readResponse.json();
    expect(readData.id).toBe(gistData.id);
    expect(readData.description).toBe(gistPayload.description);
    expect(readData.files['read-test.txt']).toBeDefined();
  });

  test('Update a gist', async ({ request }) => {
    const testId = generateTestId('update');
    const gistPayload = generateGistPayload({
      description: `Update test - ${testId}`,
      public: false,
      files: [
        { name: 'update-test.txt', content: 'Initial content' }
      ]
    });
    
    // Create gist first
    const createResponse = await request.post('/gists', { data: gistPayload });
    expect(createResponse).toBeOK();
    const gistData = await createResponse.json();
    createdGists.push(gistData.id);
    
    // Update the gist - must include all existing files
    const updatePayload = {
      description: `${gistPayload.description} - Updated`,
      files: {
        'update-test.txt': {
          content: 'Updated content for testing'
        },
        'new-file.md': {
          content: '# New Markdown File\n\nThis is a new file added during update.'
        }
      }
    };
    
    const updateResponse = await request.patch(`/gists/${gistData.id}`, { data: updatePayload });
    expect(updateResponse).toBeOK(); // Validate response is OK

    // Verify updated gist
    const updateData = await updateResponse.json();
    expect(updateData.description).toContain('Updated');
    expect(updateData.files['update-test.txt'].content).toBe('Updated content for testing');
    expect(updateData.files['new-file.md']).toBeDefined();
    expect(updateData.files['old-file.txt']).toBeUndefined();
  });

  test('Delete a gist', async ({ request }) => {
    const testId = generateTestId('delete');
    const gistPayload = generateGistPayload({
      description: `Delete test - ${testId}`,
      public: false,
      files: [
        { name: 'delete-test.txt', content: 'Content for deletion testing' }
      ]
    });
    
    // Create gist first
    const createResponse = await request.post('/gists', { data: gistPayload });
    expect(createResponse).toBeOK();
    const gistData = await createResponse.json();
    
    // Delete the gist
    const deleteResponse = await request.delete(`/gists/${gistData.id}`);
    expect(deleteResponse.status()).toBe(204);
    
    // Verify gist is deleted by trying to read it
    const readResponse = await request.get(`/gists/${gistData.id}`);
    expect(readResponse.status()).toBe(404);
  });

  test('APIs should handle complete CRUD workflow', async ({ request }) => {
    const testId = generateTestId('workflow');
    
    // Create
    const createPayload = generateGistPayload({
      description: `Complete workflow test - ${testId}`,
      public: false,
      files: [
        { name: 'workflow.txt', content: 'Step 1: Create' }
      ]
    });
    
    const createResponse = await request.post('/gists', { data: createPayload });
    expect(createResponse).toBeOK();
    const gistData = await createResponse.json();
    createdGists.push(gistData.id);
    
    // Read
    const readResponse = await request.get(`/gists/${gistData.id}`);
    expect(readResponse).toBeOK();
    
    // Update
    const updatePayload = {
      description: `${createPayload.description} - Modified`,
      files: {
        'workflow.txt': {
          content: 'Step 2: Update'
        },
        'additional.txt': {
          content: 'Step 3: Add file'
        }
      }
    };
    
    const updateResponse = await request.patch(`/gists/${gistData.id}`, { data: updatePayload });
    expect(updateResponse).toBeOK();
    
    // Final read to verify changes
    const finalReadResponse = await request.get(`/gists/${gistData.id}`);
    const finalData = await finalReadResponse.json();
    expect(finalData.description).toContain('Modified');
    expect(finalData.files['workflow.txt'].content).toBe('Step 2: Update');
    expect(finalData.files['additional.txt']).toBeDefined();
  });
});

