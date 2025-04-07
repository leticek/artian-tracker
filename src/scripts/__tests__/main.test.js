/**
 * @jest-environment jsdom
 */

import { attributes } from '../attributes';
import '../main';

describe('Weapon Roll Tracker', () => {
  let mainModule;

  beforeEach(() => {
    // Clear the DOM first
    document.body.innerHTML = `
      <div id="weapon-buttons"></div>
      <div id="attribute-buttons"></div>
      <table>
        <tbody id="rolls-body"></tbody>
      </table>
      <button id="delete-weapon">Delete Weapon Data</button>
      <button id="delete-all">Delete All Data</button>
    `;

    // Reset modules before importing
    jest.resetModules();

    // Import modules in correct order
    require('../attributes.js');
    require('../weapons.js');
    mainModule = require('../main.js');

    // Manually trigger DOMContentLoaded since Jest doesn't do it automatically
    const domContentLoadedEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domContentLoadedEvent);
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  test('delete weapon button shows error when no weapon selected', () => {
    const deleteBtn = document.getElementById('delete-weapon');
    deleteBtn.click();
    
    // Add a small delay to allow for the DOM updates
    return new Promise(resolve => setTimeout(() => {
      expect(deleteBtn.classList.contains('error')).toBe(true);
      expect(deleteBtn.textContent).toBe('Select a weapon first');
      resolve();
    }, 0));
  });

  test('delete all button requires confirmation', () => {
    const deleteAllBtn = document.getElementById('delete-all');
    deleteAllBtn.click();
    
    // Add a small delay to allow for the DOM updates
    return new Promise(resolve => setTimeout(() => {
      expect(deleteAllBtn.classList.contains('confirm')).toBe(true);
      expect(deleteAllBtn.textContent).toBe('Click again to delete ALL data');
      resolve();
    }, 0));
  });

  test('selecting a weapon updates the UI', () => {
    const weaponEvent = new CustomEvent('weaponSelected', {
      detail: { id: 'bow', name: 'Bow' }
    });
    document.dispatchEvent(weaponEvent);
    
    expect(localStorage.getItem).toHaveBeenCalled();
  });

  test('attribute selection works with selected weapon', () => {
    // First select a weapon
    const weaponEvent = new CustomEvent('weaponSelected', {
      detail: { id: 'bow', name: 'Bow' }
    });
    document.dispatchEvent(weaponEvent);

    // Then select an attribute
    const attributeEvent = new CustomEvent('attributeSelected', {
      detail: { id: 'attack', name: 'Attack Boost' }
    });
    document.dispatchEvent(attributeEvent);

    expect(localStorage.setItem).toHaveBeenCalled();
  });
});