/**
 * @jest-environment jsdom
 */

import { attributes } from '../../src/scripts/attributes.js';

describe('Sort Toggle Tests', () => {
    // Mock the localStorage
    let mockLocalStorage = {};
    
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="sort-direction">Ascending</div>
            <button id="sort-toggle">Toggle Sort</button>
            <table>
                <tbody id="rolls-body"></tbody>
            </table>
        `;
        
        // Mock localStorage
        mockLocalStorage = {};
        
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(key => mockLocalStorage[key] || null),
                setItem: jest.fn((key, value) => {
                    mockLocalStorage[key] = value.toString();
                }),
                removeItem: jest.fn(key => {
                    delete mockLocalStorage[key];
                }),
                clear: jest.fn(() => {
                    mockLocalStorage = {};
                })
            },
            writable: true
        });
        
        // Import main.js to get the functionality under test
        require('../../src/scripts/main.js');
    });
    
    test('sort toggle changes direction on click', () => {
        // Mock selected weapon and rolls data
        const mockWeapon = { id: 'weapon1', name: 'Test Weapon' };
        mockLocalStorage['weapon1'] = JSON.stringify([
            { number: 1, attributes: ['attack'] },
            { number: 2, attributes: ['element'] },
            { number: 3, attributes: ['sharpness'] }
        ]);
        
        // Dispatch weapon selected event
        const weaponSelectedEvent = new CustomEvent('weaponSelected', { detail: mockWeapon });
        document.dispatchEvent(weaponSelectedEvent);
        
        // Initial state should be ascending
        expect(document.getElementById('sort-direction').textContent).toBe('Ascending');
        
        // Click the toggle
        document.getElementById('sort-toggle').click();
        
        // State should now be descending
        expect(document.getElementById('sort-direction').textContent).toBe('Descending');
        
        // Click the toggle again
        document.getElementById('sort-toggle').click();
        
        // State should now be back to ascending
        expect(document.getElementById('sort-direction').textContent).toBe('Ascending');
    });
    
    test('rolls are displayed in correct order', () => {
        // Mock selected weapon and rolls data
        const mockWeapon = { id: 'weapon1', name: 'Test Weapon' };
        mockLocalStorage['weapon1'] = JSON.stringify([
            { number: 1, attributes: ['attack'] },
            { number: 2, attributes: ['element'] },
            { number: 3, attributes: ['sharpness'] }
        ]);
        
        // Dispatch weapon selected event
        const weaponSelectedEvent = new CustomEvent('weaponSelected', { detail: mockWeapon });
        document.dispatchEvent(weaponSelectedEvent);
        
        // Helper function to get roll numbers from the DOM
        const getRollNumbers = () => {
            const cells = document.querySelectorAll('#rolls-body tr td.number-cell');
            return Array.from(cells).map(cell => parseInt(cell.textContent));
        };
        
        // Initial order should be ascending (1,2,3)
        expect(getRollNumbers()).toEqual([1, 2, 3]);
        
        // Click the toggle to switch to descending
        document.getElementById('sort-toggle').click();
        
        // Order should now be descending (3,2,1)
        expect(getRollNumbers()).toEqual([3, 2, 1]);
        
        // Click the toggle again to switch back to ascending
        document.getElementById('sort-toggle').click();
        
        // Order should now be ascending again (1,2,3)
        expect(getRollNumbers()).toEqual([1, 2, 3]);
    });
});
