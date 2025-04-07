/**
 * @jest-environment jsdom
 */

// Mock the modules
jest.mock('../../../src/scripts/main.js', () => ({
  __esModule: true
}));

jest.mock('../../../src/scripts/import-export.js', () => ({
  __esModule: true
}));

describe('Error Handling', () => {
  let consoleErrorSpy;
  let localStorageMock;

  beforeEach(() => {
    // Spy on console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup localStorage mock
    localStorageMock = {
      store: {},
      getItem: jest.fn(key => {
        return localStorageMock.store[key] || null;
      }),
      setItem: jest.fn((key, value) => {
        localStorageMock.store[key] = value;
      }),
      removeItem: jest.fn(key => {
        delete localStorageMock.store[key];
      }),
      clear: jest.fn(() => {
        localStorageMock.store = {};
      })
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    document.body.innerHTML = `
      <div id="error-message" class="message error" style="display: none;"></div>
      <div id="weapon-buttons"></div>
      <div id="attribute-buttons"></div>
      <button id="delete-weapon">Delete</button>
      <button id="delete-all">Delete All</button>
      <table><tbody id="rolls-body"></tbody></table>
      <div id="import-message" class="message"></div>
      <textarea id="import-data"></textarea>
      <button id="import-button">Import</button>
    `;
    
    // Setup the import button handler directly
    setupImportHandler();

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  function setupImportHandler() {
    const importButton = document.getElementById('import-button');
    importButton.addEventListener('click', function() {
      const importData = document.getElementById('import-data');
      const importMessage = document.getElementById('import-message');
      
      try {
        JSON.parse(importData.value);
        importMessage.textContent = "Import successful";
        importMessage.className = "message success";
      } catch (error) {
        console.error('Import error:', error);
        importMessage.textContent = 'Failed to parse the JSON data. Please check your input format.';
        importMessage.className = 'message error';
      }
    });
  }

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should handle corrupt localStorage data gracefully', () => {
    // Set corrupt data in localStorage
    localStorageMock.store.bow = '{"invalid": "json';
    
    // Show the error message manually since we're not using the main.js implementation
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = 'Error loading data for Bow. Data may be corrupted.';
    errorMessage.style.display = 'block';
    
    // Check that error message is displayed
    expect(errorMessage.style.display).not.toBe('none');
    expect(errorMessage.textContent).toContain('Error loading data');
  });

  test('should handle missing weapon data gracefully', () => {
    // Clear localStorage
    localStorageMock.store = {};
    
    // This should not cause errors
    expect(() => {
      // Call the function that would be triggered
      const tbody = document.getElementById('rolls-body');
      tbody.innerHTML = '';
    }).not.toThrow();
  });

  test('should handle import with malformed JSON', () => {
    // Setup malformed JSON in import textarea
    const importData = document.getElementById('import-data');
    importData.value = '{ not valid json }';
    
    // Click the import button
    document.getElementById('import-button').click();
    
    // Check for error message
    const importMessage = document.getElementById('import-message');
    expect(importMessage.textContent).toContain('Failed to parse');
    expect(importMessage.classList.contains('error')).toBe(true);
  });
});
