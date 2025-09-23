const fs = require('fs');
const path = require('path');

// Generates a unique test identifier with timestamp and random suffix

function generateTestId(prefix = 'qa') {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

//Generates sample file content based on file type

function generateFileContent(type = 'text') {
  const contents = {
    text: 'This is a sample text file for testing purposes.',
    markdown: '# Sample Markdown\n\nThis is a **markdown** file for testing.\n\n- Item 1\n- Item 2',
    json: JSON.stringify({ test: true, timestamp: Date.now(), data: 'sample' }, null, 2),
    code: 'function hello() {\n  console.log("Hello, World!");\n  return "success";\n}'
  };
  
  return contents[type] || contents.text;
}

// Generates a gist payload object for API requests

function generateGistPayload(options = {}) {
  const {
    description = `Test gist - ${generateTestId()}`,
    public: isPublic = false,
    files = [
      { name: 'test.txt', content: generateFileContent('text') }
    ]
  } = options;

  const gistFiles = {};
  files.forEach(file => {
    gistFiles[file.name] = {
      content: file.content !== undefined ? file.content : generateFileContent(file.type || 'text')
    };
  });

  return {
    description,
    public: isPublic,
    files: gistFiles
  };
}

//Generates pagination parameters for API requests

function generatePaginationParams(options = {}) {
  const {
    perPage = 10,
    page = 1,
    since = null
  } = options;

  const params = {
    per_page: perPage,
    page: page
  };

  return params;
}

// Boundary test sizes based on GitHub Gist API limits
const SIZE_1MB_BELOW = 800 * 1024;        // 819,200 bytes
const SIZE_1MB_EXACT = 1024 * 1024;       // 1,048,576 bytes - exactly 1MB
const SIZE_1MB_ABOVE = 1024 * 1024 + 1;   // 1,048,577 bytes - just over 1MB
const SIZE_10MB_BELOW = 10 * 1024 * 1024 - 1024;    // 10,485,760 bytes - 1KB under 10MB

// Generates a string of repeated ASCII characters
 
function genAsciiBytes(byteLen, char = 'a') {
  if (!Number.isInteger(byteLen) || byteLen < 0) {
    throw new Error('byteLen must be a non-negative integer');
  }
  if (char.length !== 1 || char.charCodeAt(0) > 127) {
    throw new Error('char must be a single ASCII character');
  }
  return char.repeat(byteLen);
}

// Creates test files with specified size and content

function createTestFile(filename, size, testDir = null) {
  const dir = testDir || path.join(process.cwd(), 'test-files');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const filePath = path.join(dir, filename);
  const content = genAsciiBytes(size);
  fs.writeFileSync(filePath, content);
  return filePath;
}

//Reads the content of test file

function readTestFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Cleans up test files and removes empty directories

function cleanupTestFiles(filePaths = [], testDir = null) {
  const dir = testDir || path.join(process.cwd(), 'test-files');
  
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`Error cleaning up file ${filePath}:`, error.message);
    }
  }
  
  try {
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
    }
  } catch (error) {
    console.warn(`Error cleaning up test directory:`, error.message);
  }
}

//Deletes test gists 

async function cleanupGists(request, gistIds = [], options = {}) {
  const { verbose = true, prefix = '' } = options;
  
  if (gistIds.length === 0) return;
  
  if (verbose) {
    console.log(`\n${prefix} Cleaning up ${gistIds.length} test gists...`);
  }
  
  for (const gistId of gistIds) {
    try {
      const response = await request.delete(`/gists/${gistId}`);
      
      if (response.ok()) {
        if (verbose) {
          console.log(`✓ Cleaned up gist: ${gistId}`);
        }
      } else {
        console.warn(`⚠ Failed to cleanup gist ${gistId}: ${response.status()}`);
      }
    } catch (error) {
      console.warn(`⚠ Error cleaning up gist ${gistId}:`, error.message);
    }
  }
}


// Returns a cleanup function 

function cleanupGistsAfterAll(gistIds = [], options = {}) {
  return async ({ request }) => {
    await cleanupGists(request, gistIds, options);
  };
}


//  Returns a cleanup function for test files 

function cleanupFilesAfterAll(filePaths = [], options = {}) {
  return async () => {
    if (filePaths.length > 0) {
      if (options.verbose !== false) {
        console.log(`\n${options.prefix || ''} Cleaning up ${filePaths.length} test files...`);
      }
      cleanupTestFiles(filePaths);
    }
  };
}

module.exports = {
  generateTestId,
  generateFileContent,
  generateGistPayload,
  generatePaginationParams,
  SIZE_1MB_BELOW,
  SIZE_1MB_EXACT,
  SIZE_1MB_ABOVE,
  SIZE_10MB_BELOW,
  createTestFile,
  readTestFile,
  cleanupGistsAfterAll,
  cleanupFilesAfterAll
};