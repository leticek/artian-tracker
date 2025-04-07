import { attributes } from '../attributes';
import '../main';

describe('Weapon Roll Tracker', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Reset localStorage
    localStorage.clear();
    // Reset DOM
    document.body.innerHTML = `
      <div id="weapon-buttons"></div>
      <div id="attribute-buttons"></div>
      <table>
        <tbody id="rolls-body"></tbody>
      </table>
      <button id="delete-weapon">Delete Weapon Data</button>
      <button id="delete-all">Delete All Data</button>
    `;
  });

  test('getAttributeById returns correct attribute', () => {
    const attack = attributes.find(attr => attr.id === 'attack');
    const event = new CustomEvent('attributeSelected', { 
      detail: attack 
    });
    document.dispatchEvent(event);
    
    expect(localStorage.getItem).toHaveBeenCalled();
  });

  test('delete weapon button shows error when no weapon selected', () => {
    const deleteBtn = document.getElementById('delete-weapon');
    deleteBtn.click();
    
    expect(deleteBtn.classList.contains('error')).toBe(true);
    expect(deleteBtn.textContent).toBe('Select a weapon first');
  });

  test('delete all button requires confirmation', () => {
    const deleteAllBtn = document.getElementById('delete-all');
    deleteAllBtn.click();
    
    expect(deleteAllBtn.classList.contains('confirm')).toBe(true);
    expect(deleteAllBtn.textContent).toBe('Click again to delete ALL data');
  });
});