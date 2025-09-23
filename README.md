# GitHub Gist API and UI Test Suite 

A Playwright-based test suite for testing GitHub Gist API functionality including CRUD operations, file management, pagination, and boundary value analysis.

## Project Structure

```
src/
  utils/
    data.js                   # Test data generation and cleanup utilities
tests/
  api/
    gists.crud.spec.js        # CRUD operations tests
    gists.files.spec.js       # File operations within gists
    gists.pagination.ratelimit.spec.js # Pagination and rate limiting
    gists.boundry.value.checks.spec.js # File size boundary tests
    gists.edge.cases.spec.js  # Edge case testing
  ui/
    gist.ui.smoke.spec.js     # Basic UI smoke tests
.env.example                  # Environment variables template
package.json                  # Dependencies and scripts
playwright.config.js          # Playwright configuration
```

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- GitHub Personal Access Token with Gists permissions

### Installation

1. Clone and install dependencies:
   ```bash
   git clone <repository-url>
   cd destribution_technologies_take_home
   npm install
   ```

2. Set up environment variables:
   ```bash
   # Add .env with your GitHub token.
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Environment Setup

Create a `.env` file with the following variables:

```bash

GITHUB_TOKEN=ghp_your_token_here
GIST_UI_USER_PASSWORD=credential_for_gist_ui_test
GIST_UI_USER_EMAIL=credential_for_gist_ui_test
GH_API_VERSION=2022-11-28
API_BASE_URL=https://api.github.com
```

### Creating GitHub Token

1. Go to GitHub Settings > Personal Access Tokens
2. Create a token with `gists:read` and `gists:write` permissions
3. Copy the token to your `.env` file

## Running Tests

### All Tests
```bash
npx playwright test
```

### API Tests Only
```bash
npx playwright test --project=api
```

### UI Tests Only
```bash
npx playwright test --project=ui
```

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

