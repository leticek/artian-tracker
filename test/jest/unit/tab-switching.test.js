/**
 * @jest-environment jsdom
 */

describe('Tab Switching', () => {
    let localStorageMock;

    beforeEach(() => {
        // Setup localStorage mock
        localStorageMock = {
            store: { DATA_VERSION: '3' },
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

        // Setup DOM with tab structure
        document.body.innerHTML = `
            <nav class="tab-bar">
                <button class="tab-btn active" data-tab="artian">Artian Rolls</button>
                <button class="tab-btn" data-tab="gogma">Gogma Rolls</button>
            </nav>
            <div id="artian-content" class="tab-content active">
                <div id="attribute-buttons"></div>
                <table><tbody id="rolls-body"></tbody></table>
                <button id="delete-weapon">Delete Weapon Data</button>
                <button id="delete-all">Delete All Data</button>
                <button id="sort-toggle"><span id="sort-direction">Ascending</span></button>
            </div>
            <div id="gogma-content" class="tab-content">
                <div id="gogma-skill-buttons"></div>
                <table><tbody id="gogma-rolls-body"></tbody></table>
            </div>
            <div id="weapon-buttons">
                <button class="weapon-btn" data-weapon-id="bow">Bow</button>
                <button class="weapon-btn" data-weapon-id="hammer">Hammer</button>
            </div>
        `;

        jest.resetModules();
    });

    afterEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
    });

    describe('Tab Button Functionality', () => {
        test('clicking tab button switches active class', () => {
            require('../../../src/scripts/main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const artianTab = document.querySelector('[data-tab="artian"]');
            const gogmaTab = document.querySelector('[data-tab="gogma"]');

            expect(artianTab.classList.contains('active')).toBe(true);
            expect(gogmaTab.classList.contains('active')).toBe(false);

            gogmaTab.click();

            expect(artianTab.classList.contains('active')).toBe(false);
            expect(gogmaTab.classList.contains('active')).toBe(true);
        });

        test('clicking tab button shows corresponding content', () => {
            require('../../../src/scripts/main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const artianContent = document.getElementById('artian-content');
            const gogmaContent = document.getElementById('gogma-content');
            const gogmaTab = document.querySelector('[data-tab="gogma"]');

            expect(artianContent.classList.contains('active')).toBe(true);
            expect(gogmaContent.classList.contains('active')).toBe(false);

            gogmaTab.click();

            expect(artianContent.classList.contains('active')).toBe(false);
            expect(gogmaContent.classList.contains('active')).toBe(true);
        });

        test('switching back to artian tab shows artian content', () => {
            require('../../../src/scripts/main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            const artianTab = document.querySelector('[data-tab="artian"]');
            const gogmaTab = document.querySelector('[data-tab="gogma"]');
            const artianContent = document.getElementById('artian-content');

            gogmaTab.click();
            artianTab.click();

            expect(artianContent.classList.contains('active')).toBe(true);
        });
    });

    describe('Weapon Selection Persistence', () => {
        test('selected weapon persists when switching tabs', () => {
            require('../../../src/scripts/main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Setup weapon button click handler
            const weaponBtn = document.querySelector('[data-weapon-id="bow"]');
            weaponBtn.addEventListener('click', () => {
                document.querySelectorAll('.weapon-btn').forEach(btn => btn.classList.remove('selected'));
                weaponBtn.classList.add('selected');
                document.dispatchEvent(new CustomEvent('weaponSelected', {
                    detail: { id: 'bow', name: 'Bow' }
                }));
            });

            // Select weapon
            weaponBtn.click();
            expect(weaponBtn.classList.contains('selected')).toBe(true);

            // Switch tabs
            const gogmaTab = document.querySelector('[data-tab="gogma"]');
            gogmaTab.click();

            // Weapon should still be selected
            expect(weaponBtn.classList.contains('selected')).toBe(true);

            // Switch back
            const artianTab = document.querySelector('[data-tab="artian"]');
            artianTab.click();

            expect(weaponBtn.classList.contains('selected')).toBe(true);
        });
    });

    describe('Tab-Specific Data Loading', () => {
        test('switching to artian tab loads artian data', () => {
            require('../../../src/scripts/main.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            // Setup data
            localStorageMock.store.bow = JSON.stringify({
                artian: [{ number: 1, attributes: ['attack-I', 'affinity-I'] }],
                gogma: [{ number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' }]
            });

            // Select weapon
            document.dispatchEvent(new CustomEvent('weaponSelected', {
                detail: { id: 'bow', name: 'Bow' }
            }));

            // localStorage.getItem should be called with 'bow'
            expect(localStorageMock.getItem).toHaveBeenCalledWith('bow');
        });
    });

    describe('Tab State Independence', () => {
        test('artian and gogma tabs have separate content areas', () => {
            const artianContent = document.getElementById('artian-content');
            const gogmaContent = document.getElementById('gogma-content');

            expect(artianContent).not.toBe(gogmaContent);
            expect(artianContent.querySelector('#rolls-body')).not.toBeNull();
            expect(gogmaContent.querySelector('#gogma-rolls-body')).not.toBeNull();
        });

        test('artian and gogma tabs have separate skill button containers', () => {
            const artianButtons = document.getElementById('attribute-buttons');
            const gogmaButtons = document.getElementById('gogma-skill-buttons');

            expect(artianButtons).not.toBe(gogmaButtons);
        });
    });
});
