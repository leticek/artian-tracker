/**
 * @jest-environment jsdom
 */

const mockWeapons = [
  { id: 'bow', name: 'Bow', icon: 'bow_icon.webp' },
  { id: 'sword', name: 'Sword', icon: 'sword_icon.webp' }
];

const mockAttributes = [
  { id: 'attack', name: 'Attack Boost', icon: 'attack_icon.png' },
  { id: 'affinity', name: 'Affinity Boost', icon: 'affinity_icon.png' },
  { id: 'element', name: 'Element Boost', icon: 'element_icon.png' },
  { id: 'sharpness', name: 'Sharpness Boost', icon: 'sharpness_icon.webp' }
];

// Simple mocks without DOM manipulation
jest.mock('../../../src/scripts/weapons', () => ({
  weapons: mockWeapons,
  setupWeaponButtons: jest.fn()
}));

jest.mock('../../../src/scripts/attributes', () => ({
  attributes: mockAttributes
}));

describe('Weapon Roll Tracker', () => {
  let localStorageMock;

  beforeEach(() => {
    // Setup localStorage mock
    localStorageMock = {
      store: {},
      getItem: jest.fn(key => localStorageMock.store[key] || null),
      setItem: jest.fn((key, value) => localStorageMock.store[key] = value),
      removeItem: jest.fn(key => delete localStorageMock.store[key]),
      clear: jest.fn(() => localStorageMock.store = {})
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Setup DOM
    document.body.innerHTML = `
      <div id="weapon-buttons">
        ${mockWeapons.map(w => `<button class="weapon-btn" data-weapon-id="${w.id}">${w.name}</button>`).join('')}
      </div>
      <div id="attribute-buttons">
        ${mockAttributes.map(a => `<button class="attribute-btn" data-attribute-id="${a.id}">${a.name}</button>`).join('')}
      </div>
      <table><tbody id="rolls-body"></tbody></table>
      <button id="delete-weapon">Delete Weapon Data</button>
      <button id="delete-all">Delete All Data</button>
    `;

    // Reset modules
    jest.resetModules();
    
    // Setup weapon button click handlers
    document.querySelectorAll('.weapon-btn').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.weapon-btn').forEach(btn => {
          btn.classList.remove('selected');
        });
        button.classList.add('selected');
        
        const weaponId = button.getAttribute('data-weapon-id');
        const weapon = mockWeapons.find(w => w.id === weaponId);
        const event = new CustomEvent('weaponSelected', { detail: weapon });
        document.dispatchEvent(event);
      });
    });

    // Initialize main.js
    require('../../../src/scripts/main.js');

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('selecting a weapon updates the UI and storage', () => {
    // Get the weapon button and click it
    const weaponBtn = document.querySelector('[data-weapon-id="bow"]');
    weaponBtn.click();

    // Verify the updates
    expect(weaponBtn.classList.contains('selected')).toBe(true);
    expect(document.querySelectorAll('.weapon-btn.selected').length).toBe(1);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('bow');
  });

  test('attribute selection stores proper data structure', () => {
    // Select weapon first
    document.dispatchEvent(new CustomEvent('weaponSelected', {
      detail: mockWeapons[0]
    }));

    // Select attribute
    const attributeData = mockAttributes[0];
    document.dispatchEvent(new CustomEvent('attributeSelected', {
      detail: attributeData
    }));

    const expectedData = [{
      number: 1,
      attributes: [attributeData.id]
    }];

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'bow',
      JSON.stringify(expectedData)
    );
  });

  test('can add up to 5 attributes to a single roll', () => {
    // Select weapon first
    document.dispatchEvent(new CustomEvent('weaponSelected', {
      detail: mockWeapons[0]
    }));

    // Add all 4 attributes first
    mockAttributes.forEach(attr => {
      document.dispatchEvent(new CustomEvent('attributeSelected', {
        detail: attr
      }));
    });

    // Add the first attribute again to reach 5
    document.dispatchEvent(new CustomEvent('attributeSelected', {
      detail: mockAttributes[0]
    }));

    // Get the last setItem call arguments
    const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
    const storedData = JSON.parse(lastCall[1]);
    
    expect(storedData[0].attributes.length).toBe(5);
    
    // Try adding 6th attribute
    document.dispatchEvent(new CustomEvent('attributeSelected', {
      detail: mockAttributes[0]
    }));

    // Verify it didn't add a 6th attribute
    const finalCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
    const finalData = JSON.parse(finalCall[1]);
    expect(finalData[0].attributes.length).toBe(5);
  });

  test('delete weapon data only affects selected weapon', () => {
    // Setup initial data
    localStorageMock.store = {
      bow: JSON.stringify([{ number: 1, attributes: [] }]),
      sword: JSON.stringify([{ number: 1, attributes: [] }])
    };

    // Select and delete bow data
    document.dispatchEvent(new CustomEvent('weaponSelected', {
      detail: mockWeapons[0]
    }));
    
    const deleteBtn = document.getElementById('delete-weapon');
    deleteBtn.click(); // First click
    deleteBtn.click(); // Confirmation click

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('bow');
    expect(localStorageMock.store.sword).toBeTruthy();
  });

  test('delete all data clears entire localStorage', () => {
    // Setup initial data
    localStorageMock.store = {
      bow: 'test',
      sword: 'test'
    };
    
    const deleteAllBtn = document.getElementById('delete-all');
    deleteAllBtn.click(); // First click
    deleteAllBtn.click(); // Confirmation click

    expect(localStorageMock.clear).toHaveBeenCalled();
    expect(document.querySelectorAll('.weapon-btn.selected').length).toBe(0);
  });

  test('localStorage schema validation', () => {
    const validSchema = [{
      number: 1,
      attributes: [mockAttributes[0].id]
    }];

    localStorageMock.store = {
      bow: JSON.stringify(validSchema)
    };

    expect(() => {
      const data = JSON.parse(localStorageMock.store.bow);
      data.forEach(roll => {
        if (!roll.number || !Array.isArray(roll.attributes)) {
          throw new Error('Invalid schema');
        }
      });
    }).not.toThrow();

    // Test invalid schema
    localStorageMock.store.bow = JSON.stringify([{ invalid: 'data' }]);
    
    expect(() => {
      const data = JSON.parse(localStorageMock.store.bow);
      data.forEach(roll => {
        if (!roll.number || !Array.isArray(roll.attributes)) {
          throw new Error('Invalid schema');
        }
      });
    }).toThrow('Invalid schema');
  });
});