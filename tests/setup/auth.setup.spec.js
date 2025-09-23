const { test: setup } = require('@playwright/test');

const authFile = 'playwright/.auth/user.json';

setup('Authenticate UI Test', async ({ page }) => {
  await page.goto('https://github.com/login');
  const userEmail = process.env.GIST_UI_USER_EMAIL || 'paulbansah3@gmail.com';
  const userPassword = process.env.GIST_UI_USER_PASSWORD || 'Samuel@632';
  await page.getByRole('textbox', { name: 'Username or email address' }).fill(userEmail);
  await page.getByRole('textbox', { name: 'Password' }).fill(userPassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/github.com/**');
  await page.context().storageState({ path: authFile });
  
  console.log('Authentication state saved to:', authFile);
});
