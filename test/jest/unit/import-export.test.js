/**
 * @jest-environment jsdom
 */

// Mock data
const mockWeapons = [
  { id: 'bow', name: 'Bow', icon: 'bow_icon.webp' },
  { id: 'sword', name: 'Sword', icon: 'sword_icon.webp' }
];

// Mock local storage
let localStorageMock;

describe('Import/Export Functionality', () => {
  beforeEach(() => {
    // Setup localStorage mock
    localStorageMock = {
      store: {},
      getItem: jest.fn(key => localStorageMock.store[key] || null),
      setItem: jest.fn((key, value) => localStorageMock.store[key] = value),
      removeItem: jest.fn(key => delete localStorageMock.store[key]),
      clear: jest.fn(() => localStorageMock.store = {}),
      key: jest.fn(i => Object.keys(localStorageMock.store)[i]),
      length: 0
    };
    
    // Set length property with getter to always return updated length
    Object.defineProperty(localStorageMock, 'length', {
      get: function() { return Object.keys(this.store).length; }
    });

    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock document.execCommand for copy
    document.execCommand = jest.fn();

    // Setup DOM
    document.body.innerHTML = `
      <div id="import-message" class="message"></div>
      <textarea id="import-data"></textarea>
      <button id="import-button">Import Data</button>
      <button id="export-button">Export All Data</button>
      <div class="export-output-container" style="display: none;">
        <textarea id="export-data"></textarea>
        <button id="copy-button">Copy to Clipboard</button>
        <button id="download-button">Download as JSON</button>
      </div>
    `;

    // Reset modules
    jest.resetModules();

    // Setup mock implementations for the DOM elements
    const setupEventHandlers = () => {
      const importButton = document.getElementById('import-button');
      const exportButton = document.getElementById('export-button');
      const copyButton = document.getElementById('copy-button');
      const downloadButton = document.getElementById('download-button');
      const importData = document.getElementById('import-data');
      const exportData = document.getElementById('export-data');
      const importMessage = document.getElementById('import-message');
      const exportOutputContainer = document.querySelector('.export-output-container');
      
      if (importButton) {
        importButton.onclick = () => {
          try {
            const dataToImport = JSON.parse(importData.value);
            let importedCount = 0;
            let skippedCount = 0;
            let importedWeapons = [];
            
            Object.keys(dataToImport).forEach(weaponId => {
              const weaponData = dataToImport[weaponId];
              const existingData = localStorage.getItem(weaponId);
              
              // Skip if weapon already has meaningful data
              if (existingData && existingData !== '[]') {
                try {
                  const parsedData = JSON.parse(existingData);
                  if (Array.isArray(parsedData) && parsedData.some(roll => roll.attributes && roll.attributes.length > 0)) {
                    skippedCount++;
                    return;
                  }
                } catch (e) {
                  // If parsing fails, treat as no data
                }
              }
              
              // Save the data
              localStorage.setItem(weaponId, JSON.stringify(weaponData));
              importedCount++;
              importedWeapons.push(weaponId);
            });
            
            if (importedCount > 0) {
              importMessage.textContent = `Successfully imported data for ${importedCount} weapon(s)` +
                (skippedCount > 0 ? `, skipped ${skippedCount} weapon(s) that already had data.` : '.');
              importMessage.className = 'message success';
              
              document.dispatchEvent(new CustomEvent('dataImported', {
                detail: { importedWeapons }
              }));
            } else if (skippedCount > 0) {
              importMessage.textContent = `No data was imported. ${skippedCount} weapon(s) were skipped because they already had data.`;
              importMessage.className = 'message error';
            } else {
              importMessage.textContent = 'No valid weapon data found to import.';
              importMessage.className = 'message error';
            }
          } catch (error) {
            importMessage.textContent = 'Failed to parse the JSON data. Please check your input format.';
            importMessage.className = 'message error';
          }
        };
      }
      
      if (exportButton) {
        exportButton.onclick = () => {
          const exportObj = {};
          
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            try {
              const value = JSON.parse(localStorage.getItem(key));
              
              // Only include valid weapon data (arrays)
              if (Array.isArray(value) && value.length > 0) {
                exportObj[key] = value;
              }
            } catch (e) {
              // Skip any non-JSON values
            }
          }

          // Format the JSON nicely
          exportData.value = JSON.stringify(exportObj, null, 2);
          exportOutputContainer.style.display = 'block';
        };
      }
      
      if (copyButton) {
        copyButton.onclick = () => {
          exportData.select();
          document.execCommand('copy');
        };
      }
      
      if (downloadButton) {
        downloadButton.onclick = () => {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportData.value);
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute("href", dataStr);
          downloadAnchor.setAttribute("download", "weapon-rolls-export.json");
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
        };
      }
    };

    // Set up the handlers
    setupEventHandlers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('should import valid JSON data with validation', () => {
    const validInput = {
      bow: [
        { number: 1, attributes: ['attack', 'element'] }
      ]
    };
    
    // Set up import text area
    const importDataElem = document.getElementById('import-data');
    importDataElem.value = JSON.stringify(validInput);
    
    // Click import button
    document.getElementById('import-button').click();
    
    // Check that data was stored
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'bow',
      JSON.stringify(validInput.bow)
    );
    
    // Check success message
    const messageElem = document.getElementById('import-message');
    expect(messageElem.classList.contains('success')).toBe(true);
    expect(messageElem.textContent).toContain('Successfully imported');
  });

  test('should reject invalid JSON data', () => {
    // Set up invalid JSON in import text area
    const importDataElem = document.getElementById('import-data');
    importDataElem.value = '{ invalid: json }';
    
    // Click import button
    document.getElementById('import-button').click();
    
    // Check error message
    const messageElem = document.getElementById('import-message');
    expect(messageElem.classList.contains('error')).toBe(true);
    expect(messageElem.textContent).toContain('Failed to parse');
  });

  test('should skip importing weapon data that already exists', () => {
    // Setup existing data with actual attributes
    localStorageMock.store = {
      bow: JSON.stringify([{ number: 1, attributes: ['attack'] }])
    };
    
    const importData = {
      bow: [{ number: 2, attributes: ['element'] }],
      sword: [{ number: 1, attributes: ['affinity'] }]
    };
    
    // Set up import text area
    const importDataElem = document.getElementById('import-data');
    importDataElem.value = JSON.stringify(importData);
    
    // Click import button
    document.getElementById('import-button').click();
    
    // Check that bow data was not overwritten but sword was added
    expect(localStorageMock.store.bow).toEqual(JSON.stringify([{ number: 1, attributes: ['attack'] }]));
    expect(localStorageMock.store.sword).toEqual(JSON.stringify([{ number: 1, attributes: ['affinity'] }]));
    
    // Check message for skipped weapons
    const messageElem = document.getElementById('import-message');
    expect(messageElem.textContent).toContain('skipped 1 weapon');
  });

  test('should import data even if localStorage has empty array for weapon', () => {
    // Setup empty array in localStorage for bow
    localStorageMock.store = {
      bow: JSON.stringify([])
    };
    
    const importData = {
      bow: [{ number: 1, attributes: ['attack', 'affinity'] }]
    };
    
    // Set up import text area
    const importDataElem = document.getElementById('import-data');
    importDataElem.value = JSON.stringify(importData);
    
    // Click import button
    document.getElementById('import-button').click();
    
    // Check that bow data was imported despite having an empty array
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'bow',
      JSON.stringify(importData.bow)
    );
    
    // Check success message
    const messageElem = document.getElementById('import-message');
    expect(messageElem.textContent).toContain('Successfully imported');
  });
  
  test('should skip importing data if weapon has real data', () => {
    // Setup data with attributes in localStorage
    localStorageMock.store = {
      bow: JSON.stringify([{ number: 1, attributes: ['attack'] }])
    };
    
    const importData = {
      bow: [{ number: 2, attributes: ['affinity'] }]
    };
    
    // Set up import text area
    const importDataElem = document.getElementById('import-data');
    importDataElem.value = JSON.stringify(importData);
    
    // Click import button
    document.getElementById('import-button').click();
    
    // Verify original data was preserved
    expect(localStorageMock.store.bow).toEqual(JSON.stringify([{ number: 1, attributes: ['attack'] }]));
    
    // Check error message
    const messageElem = document.getElementById('import-message');
    expect(messageElem.textContent).toContain('skipped');
  });

  test('should export data from localStorage', () => {
    // Setup mock data in localStorage
    const mockData = {
      bow: [{ number: 1, attributes: ['attack'] }],
      sword: [{ number: 1, attributes: ['affinity'] }]
    };
    
    Object.entries(mockData).forEach(([key, value]) => {
      localStorageMock.store[key] = JSON.stringify(value);
    });
    
    // Click export button
    document.getElementById('export-button').click();
    
    // Check that export area is displayed
    const exportContainer = document.querySelector('.export-output-container');
    expect(exportContainer.style.display).toBe('block');
    
    // Check export data
    const exportDataElem = document.getElementById('export-data');
    const exportedData = JSON.parse(exportDataElem.value);
    
    expect(exportedData).toEqual(mockData);
  });

  test('should copy exported data to clipboard', () => {
    // Setup export data
    const exportDataElem = document.getElementById('export-data');
    exportDataElem.value = '{"test": "data"}';
    exportDataElem.select = jest.fn();
    
    // Click copy button
    document.getElementById('copy-button').click();
    
    // Check that select() was called on the export textarea
    expect(exportDataElem.select).toHaveBeenCalled();
    
    // Check that execCommand was called with copy
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  test('should create download link for JSON export', () => {
    // Mock document.createElement and other methods
    const mockAnchor = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      remove: jest.fn()
    };
    
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation(() => mockAnchor);
    const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    
    // Setup export data
    const exportDataElem = document.getElementById('export-data');
    exportDataElem.value = '{"test": "data"}';
    
    // Click download button
    document.getElementById('download-button').click();
    
    // Check that anchor was created and configured correctly
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockAnchor.setAttribute).toHaveBeenCalledWith('download', 'weapon-rolls-export.json');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockAnchor.remove).toHaveBeenCalled();
    
    // Restore original methods
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
  });

  test('should dispatch dataImported event with imported weapons', () => {
    // Spy on document.dispatchEvent
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    
    const validInput = {
      bow: [{ number: 1, attributes: ['attack'] }],
      sword: [{ number: 1, attributes: ['affinity'] }]
    };
    
    // Set up import text area
    const importDataElem = document.getElementById('import-data');
    importDataElem.value = JSON.stringify(validInput);
    
    // Click import button
    document.getElementById('import-button').click();
    
    // Check that the event was dispatched with the correct detail
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dataImported',
        detail: expect.objectContaining({
          importedWeapons: expect.arrayContaining(['bow', 'sword'])
        })
      })
    );
    
    // Restore the original implementation
    dispatchEventSpy.mockRestore();
  });
});
