/**
 * @jest-environment jsdom
 */

describe('Weapons Module', () => {
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
            <div id="weapon-buttons"></div>
        `;

        jest.resetModules();
    });

    afterEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
    });

    describe('Weapon Definitions', () => {
        test('should have 14 weapons defined', () => {
            require('../../../src/scripts/weapons.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const buttons = document.querySelectorAll('.weapon-btn');
            expect(buttons.length).toBe(14);
        });

        test('should create buttons with correct data-weapon-id attributes', () => {
            require('../../../src/scripts/weapons.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const expectedIds = [
                'bow', 'charge-blade', 'dual-blades', 'greatsword',
                'gunlance', 'hammer', 'heavy-bowgun', 'hunting-horn',
                'insect-glaive', 'lance', 'light-bowgun', 'long-sword',
                'switch-axe', 'sword-and-shield'
            ];

            expectedIds.forEach(id => {
                const button = document.querySelector(`[data-weapon-id="${id}"]`);
                expect(button).not.toBeNull();
            });
        });

        test('each weapon button should have an image and name', () => {
            require('../../../src/scripts/weapons.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const buttons = document.querySelectorAll('.weapon-btn');
            buttons.forEach(button => {
                const img = button.querySelector('img');
                const span = button.querySelector('span');
                expect(img).not.toBeNull();
                expect(span).not.toBeNull();
                expect(img.getAttribute('src')).toBeTruthy();
                expect(span.textContent).toBeTruthy();
            });
        });
    });

    describe('Weapon Selection', () => {
        test('clicking a weapon button adds selected class', () => {
            require('../../../src/scripts/weapons.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const bowButton = document.querySelector('[data-weapon-id="bow"]');
            bowButton.click();

            expect(bowButton.classList.contains('selected')).toBe(true);
        });

        test('clicking a different weapon removes selected class from previous', () => {
            require('../../../src/scripts/weapons.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const bowButton = document.querySelector('[data-weapon-id="bow"]');
            const hammerButton = document.querySelector('[data-weapon-id="hammer"]');

            bowButton.click();
            expect(bowButton.classList.contains('selected')).toBe(true);

            hammerButton.click();
            expect(bowButton.classList.contains('selected')).toBe(false);
            expect(hammerButton.classList.contains('selected')).toBe(true);
        });

        test('clicking a weapon dispatches weaponSelected event', () => {
            require('../../../src/scripts/weapons.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const eventHandler = jest.fn();
            document.addEventListener('weaponSelected', eventHandler);

            const bowButton = document.querySelector('[data-weapon-id="bow"]');
            bowButton.click();

            expect(eventHandler).toHaveBeenCalled();
            expect(eventHandler.mock.calls[0][0].detail.id).toBe('bow');
            expect(eventHandler.mock.calls[0][0].detail.name).toBe('Bow');
        });

        test('only one weapon can be selected at a time', () => {
            require('../../../src/scripts/weapons.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const buttons = document.querySelectorAll('.weapon-btn');

            // Click first three buttons
            buttons[0].click();
            buttons[1].click();
            buttons[2].click();

            const selectedButtons = document.querySelectorAll('.weapon-btn.selected');
            expect(selectedButtons.length).toBe(1);
            expect(selectedButtons[0]).toBe(buttons[2]);
        });
    });

    describe('Weapon Button Structure', () => {
        test('weapon buttons should have correct class', () => {
            require('../../../src/scripts/weapons.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const buttons = document.querySelectorAll('#weapon-buttons button');
            buttons.forEach(button => {
                expect(button.classList.contains('weapon-btn')).toBe(true);
            });
        });

        test('weapon icons should have onerror handlers', () => {
            require('../../../src/scripts/weapons.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const images = document.querySelectorAll('.weapon-btn img');
            images.forEach(img => {
                expect(img.getAttribute('onerror')).toBeTruthy();
            });
        });
    });
});
