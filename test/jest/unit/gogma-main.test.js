/**
 * @jest-environment jsdom
 */

import {
    groupSkills,
    setBonusSkills,
    getGogmaSkillById,
    getSkillClass,
    GOGMA_COLORS
} from '../../../src/scripts/gogma-skills.js';

describe('Gogma Main Module', () => {
    let localStorageMock;

    beforeEach(() => {
        // Setup localStorage mock
        localStorageMock = {
            store: {},
            getItem: jest.fn(key => localStorageMock.store[key] || null),
            setItem: jest.fn((key, value) => localStorageMock.store[key] = value),
            removeItem: jest.fn(key => delete localStorageMock.store[key]),
            clear: jest.fn(() => localStorageMock.store = {}),
            key: jest.fn(i => Object.keys(localStorageMock.store)[i])
        };

        Object.defineProperty(localStorageMock, 'length', {
            get: function() { return Object.keys(this.store).length; }
        });

        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // Setup DOM with gogma-specific elements
        document.body.innerHTML = `
            <div id="gogma-skill-buttons"></div>
            <table id="gogma-rolls-table">
                <tbody id="gogma-rolls-body"></tbody>
            </table>
            <button id="gogma-delete-weapon">Delete Weapon Data</button>
            <button id="gogma-delete-all">Delete All Data</button>
            <button id="gogma-sort-toggle" data-order="ascending">
                <span id="gogma-sort-direction">Ascending</span>
            </button>
            <div id="gogma-error-message" style="display: none;"></div>
        `;

        jest.resetModules();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        document.body.innerHTML = '';
    });

    describe('Gogma Skill Button Rendering', () => {
        test('should render group skills section', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const container = document.getElementById('gogma-skill-buttons');
            const sections = container.querySelectorAll('.gogma-skill-section');
            expect(sections.length).toBe(2); // Group Skills + Set Bonus Skills
        });

        test('should render all 4 group skill buttons', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const groupButtons = document.querySelectorAll('.gogma-skill-btn[data-skill-id="lords-soul"], .gogma-skill-btn[data-skill-id="lords-fury"], .gogma-skill-btn[data-skill-id="fortifying-pelt"], .gogma-skill-btn[data-skill-id="guardians-pulse"]');
            expect(groupButtons.length).toBe(4);
        });

        test('should render all 18 set bonus skill buttons', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Total buttons should be 22 (4 group + 18 set bonus)
            const allButtons = document.querySelectorAll('.gogma-skill-btn');
            expect(allButtons.length).toBe(22);
        });

        test('should apply correct color classes to skill buttons', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const lordsSoulBtn = document.querySelector('[data-skill-id="lords-soul"]');
            const lordsFuryBtn = document.querySelector('[data-skill-id="lords-fury"]');
            const fortifyingPeltBtn = document.querySelector('[data-skill-id="fortifying-pelt"]');

            expect(lordsSoulBtn.classList.contains('gogma-red')).toBe(true);
            expect(lordsFuryBtn.classList.contains('gogma-yellow')).toBe(true);
            expect(fortifyingPeltBtn.classList.contains('gogma-green')).toBe(true);
        });
    });

    describe('Gogma Skill Selection', () => {
        test('clicking skill without weapon selected shows error animation', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const skillBtn = document.querySelector('[data-skill-id="lords-soul"]');
            skillBtn.click();

            expect(skillBtn.classList.contains('error')).toBe(true);

            // After timeout, error class should be removed
            jest.advanceTimersByTime(500);
            expect(skillBtn.classList.contains('error')).toBe(false);
        });

        test('selecting group skill stores it in current roll', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Select a weapon first
            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            // Click a group skill
            const skillBtn = document.querySelector('[data-skill-id="lords-soul"]');
            skillBtn.click();

            // Check localStorage
            const stored = JSON.parse(localStorageMock.store.bow);
            expect(stored.gogma[0].groupSkill).toBe('lords-soul');
        });

        test('selecting set bonus skill stores it in current roll', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Select a weapon
            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            // Click a set bonus skill
            const skillBtn = document.querySelector('[data-skill-id="gore-magala"]');
            skillBtn.click();

            // Check localStorage
            const stored = JSON.parse(localStorageMock.store.bow);
            expect(stored.gogma[0].setBonus).toBe('gore-magala');
        });

        test('selecting both group and set bonus creates complete roll', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Select a weapon
            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            // Select group skill then set bonus
            document.querySelector('[data-skill-id="lords-soul"]').click();
            document.querySelector('[data-skill-id="gore-magala"]').click();

            const stored = JSON.parse(localStorageMock.store.bow);
            expect(stored.gogma[0].groupSkill).toBe('lords-soul');
            expect(stored.gogma[0].setBonus).toBe('gore-magala');
        });

        test('selecting same class skill replaces existing', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Select a weapon
            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            // Select first group skill
            document.querySelector('[data-skill-id="lords-soul"]').click();

            // Select another group skill (should replace)
            document.querySelector('[data-skill-id="lords-fury"]').click();

            const stored = JSON.parse(localStorageMock.store.bow);
            expect(stored.gogma[0].groupSkill).toBe('lords-fury');
        });

        test('completing a roll advances to next roll number', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Select a weapon
            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            // Complete first roll
            document.querySelector('[data-skill-id="lords-soul"]').click();
            document.querySelector('[data-skill-id="gore-magala"]').click();

            // Start second roll
            document.querySelector('[data-skill-id="lords-fury"]').click();

            const stored = JSON.parse(localStorageMock.store.bow);
            expect(stored.gogma.length).toBe(2);
            expect(stored.gogma[1].number).toBe(2);
            expect(stored.gogma[1].groupSkill).toBe('lords-fury');
        });
    });

    describe('Gogma Delete Functionality', () => {
        test('delete weapon button requires weapon selection', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const deleteBtn = document.getElementById('gogma-delete-weapon');
            deleteBtn.click();

            expect(deleteBtn.classList.contains('error')).toBe(true);
            expect(deleteBtn.textContent).toBe('Select a weapon first');

            // After timeout, should reset
            jest.advanceTimersByTime(2000);
            expect(deleteBtn.classList.contains('error')).toBe(false);
            expect(deleteBtn.textContent).toBe('Delete Weapon Data');
        });

        // Note: delete confirmation with two clicks is tested in e2e tests (gogma-tracker.cy.js)
        // The unit test was flaky due to JSDOM event listener accumulation across tests

        // Note: delete confirmation timeout is tested in e2e tests (gogma-tracker.cy.js)
        // The unit test was flaky due to JSDOM event listener accumulation across tests

        test('delete all clears gogma data from all weapons', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Setup data for multiple weapons
            localStorageMock.store = {
                bow: JSON.stringify({
                    artian: [{ number: 1, attributes: ['attack-I'] }],
                    gogma: [{ number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' }]
                }),
                hammer: JSON.stringify({
                    artian: [],
                    gogma: [{ number: 1, groupSkill: 'lords-fury', setBonus: 'mizutsune' }]
                })
            };

            const deleteAllBtn = document.getElementById('gogma-delete-all');

            // Two clicks to confirm
            deleteAllBtn.click();
            deleteAllBtn.click();

            // Check both weapons have empty gogma but preserved artian
            const bowData = JSON.parse(localStorageMock.store.bow);
            expect(bowData.gogma).toEqual([]);
            expect(bowData.artian[0].attributes).toEqual(['attack-I']);
        });
    });

    describe('Gogma Sort Toggle', () => {
        test('sort toggle changes direction on click', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const sortToggle = document.getElementById('gogma-sort-toggle');
            const sortDirection = document.getElementById('gogma-sort-direction');

            expect(sortDirection.textContent).toBe('Ascending');

            sortToggle.click();

            expect(sortDirection.textContent).toBe('Descending');
            expect(sortToggle.getAttribute('data-order')).toBe('descending');

            sortToggle.click();

            expect(sortDirection.textContent).toBe('Ascending');
            expect(sortToggle.getAttribute('data-order')).toBe('ascending');
        });
    });

    describe('Gogma Roll Display', () => {
        test('should display rolls in table', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Setup data
            localStorageMock.store.bow = JSON.stringify({
                artian: [],
                gogma: [
                    { number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' },
                    { number: 2, groupSkill: 'lords-fury', setBonus: 'mizutsune' }
                ]
            });

            // Select weapon to trigger display
            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            const rows = document.querySelectorAll('#gogma-rolls-body tr');
            expect(rows.length).toBe(2);
        });

        test('should display skill names in cells', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            localStorageMock.store.bow = JSON.stringify({
                artian: [],
                gogma: [{ number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' }]
            });

            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            const groupCell = document.querySelector('[data-slot-type="group"]');
            const setBonusCell = document.querySelector('[data-slot-type="setBonus"]');

            expect(groupCell.textContent).toBe("Lord's Soul");
            expect(setBonusCell.textContent).toBe("Gore Magala's Tyranny");
        });

        test('should apply color classes to skill cells', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            localStorageMock.store.bow = JSON.stringify({
                artian: [],
                gogma: [{ number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' }]
            });

            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            const groupCell = document.querySelector('[data-slot-type="group"]');
            const setBonusCell = document.querySelector('[data-slot-type="setBonus"]');

            expect(groupCell.classList.contains('gogma-red')).toBe(true);
            expect(setBonusCell.classList.contains('gogma-red')).toBe(true);
        });
    });

    describe('Gogma Row Deletion', () => {
        test('clicking number cell enters delete mode', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            localStorageMock.store.bow = JSON.stringify({
                artian: [],
                gogma: [{ number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' }]
            });

            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            const numberCell = document.querySelector('#gogma-rolls-body .number-cell');
            numberCell.click();

            expect(numberCell.classList.contains('delete-mode')).toBe(true);
            expect(numberCell.textContent).toBe('Delete');
        });

        test('clicking number cell twice deletes the row', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            localStorageMock.store.bow = JSON.stringify({
                artian: [],
                gogma: [
                    { number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' },
                    { number: 2, groupSkill: 'lords-fury', setBonus: 'mizutsune' }
                ]
            });

            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            const numberCell = document.querySelector('#gogma-rolls-body .number-cell');
            numberCell.click(); // Enter delete mode
            numberCell.click(); // Confirm deletion

            const stored = JSON.parse(localStorageMock.store.bow);
            expect(stored.gogma.length).toBe(1);
            expect(stored.gogma[0].groupSkill).toBe('lords-fury');
        });
    });

    describe('Gogma Cell Selection', () => {
        test('clicking a skill cell selects it', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            localStorageMock.store.bow = JSON.stringify({
                artian: [],
                gogma: [{ number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' }]
            });

            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            const groupCell = document.querySelector('[data-slot-type="group"]');
            groupCell.click();

            expect(groupCell.classList.contains('selected')).toBe(true);
        });

        test('selecting a cell then clicking skill updates that cell', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            localStorageMock.store.bow = JSON.stringify({
                artian: [],
                gogma: [{ number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' }]
            });

            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            // Select the group cell
            const groupCell = document.querySelector('[data-slot-type="group"]');
            groupCell.click();

            // Click a different group skill
            document.querySelector('[data-skill-id="lords-fury"]').click();

            const stored = JSON.parse(localStorageMock.store.bow);
            expect(stored.gogma[0].groupSkill).toBe('lords-fury');
        });

        test('selecting wrong skill class for cell shows error', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            localStorageMock.store.bow = JSON.stringify({
                artian: [],
                gogma: [{ number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' }]
            });

            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            // Select the group cell
            const groupCell = document.querySelector('[data-slot-type="group"]');
            groupCell.click();

            // Try to click a set bonus skill (wrong class)
            const setBonusBtn = document.querySelector('[data-skill-id="mizutsune"]');
            setBonusBtn.click();

            expect(setBonusBtn.classList.contains('error')).toBe(true);

            // Original value should be unchanged
            const stored = JSON.parse(localStorageMock.store.bow);
            expect(stored.gogma[0].groupSkill).toBe('lords-soul');
        });
    });

    describe('Data Import Event', () => {
        test('dataImported event reloads gogma data for selected weapon', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Select weapon
            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            // Setup imported data
            localStorageMock.store.bow = JSON.stringify({
                artian: [],
                gogma: [{ number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' }]
            });

            // Dispatch import event
            document.dispatchEvent(new CustomEvent('dataImported', {
                detail: { importedWeapons: ['bow'] }
            }));

            // Check that data is displayed
            const rows = document.querySelectorAll('#gogma-rolls-body tr');
            expect(rows.length).toBe(1);
        });
    });

    describe('Incomplete Roll Handling', () => {
        test('should resume incomplete roll on weapon selection', () => {
            require('../../../src/scripts/gogma-main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Setup data with incomplete roll
            localStorageMock.store.bow = JSON.stringify({
                artian: [],
                gogma: [{ number: 1, groupSkill: 'lords-soul', setBonus: null }]
            });

            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            // Complete the roll by adding set bonus
            document.querySelector('[data-skill-id="gore-magala"]').click();

            const stored = JSON.parse(localStorageMock.store.bow);
            expect(stored.gogma[0].setBonus).toBe('gore-magala');
        });
    });
});
