// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock DOMContentLoaded
Object.defineProperty(document, 'readyState', {
  value: 'complete',
  writable: true
});

// Create fake DOM elements that might be accessed before our test setup
document.body.innerHTML = `
  <div id="weapon-buttons"></div>
  <div id="attribute-buttons"></div>
  <table><tbody id="rolls-body"></tbody></table>
  <button id="delete-weapon">Delete Weapon Data</button>
  <button id="delete-all">Delete All Data</button>
`;

// Dispatch DOMContentLoaded event
document.dispatchEvent(new Event('DOMContentLoaded'));