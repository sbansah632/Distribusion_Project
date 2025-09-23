const { test, expect } = require('@playwright/test');

test.describe('Gist UI Smoke Tests - Basic Path', () => {
  test('Navigate to Gist page, create a gist and verify it was created successfully', async ({ page }) => {
    await page.goto('https://gist.github.com');
    await expect(page).toHaveTitle("Create a new Gist");

    // Create a new gist
    await page.getByRole('textbox', { name: 'Gist description' }).fill("Test gist");
    await page.getByPlaceholder('Filename including extension').fill('smoke.txt');
    const content = page.locator('.CodeMirror .CodeMirror-code[contenteditable="true"]').first();
    await content.click();                    
    await content.fill('Test content \n Second line');  
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Create secret gist' }).click();

    // confirm creation
    await expect(page).toHaveTitle("Test gist");
    await expect(page.getByRole('cell', { name: 'Test content' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Second line' })).toBeVisible();

    //Delete created gist
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveTitle("Test gist");
  });
});


