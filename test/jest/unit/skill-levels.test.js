/**
 * @jest-environment jsdom
 */

import {
    LEVELS,
    baseSkills,
    attributes,
    parseAttributeId,
    migrateAttributeId
} from '../../../src/scripts/attributes.js';

describe('Skill Levels Feature', () => {
    describe('LEVELS configuration', () => {
        test('should have all four levels defined', () => {
            expect(LEVELS).toHaveProperty('I');
            expect(LEVELS).toHaveProperty('II');
            expect(LEVELS).toHaveProperty('III');
            expect(LEVELS).toHaveProperty('EX');
        });

        test('each level should have order, label, and cssClass', () => {
            Object.values(LEVELS).forEach(level => {
                expect(level).toHaveProperty('order');
                expect(level).toHaveProperty('label');
                expect(level).toHaveProperty('cssClass');
            });
        });

        test('levels should have correct order', () => {
            expect(LEVELS.I.order).toBe(1);
            expect(LEVELS.II.order).toBe(2);
            expect(LEVELS.III.order).toBe(3);
            expect(LEVELS.EX.order).toBe(4);
        });

        test('levels should have correct CSS classes', () => {
            expect(LEVELS.I.cssClass).toBe('level-I');
            expect(LEVELS.II.cssClass).toBe('level-II');
            expect(LEVELS.III.cssClass).toBe('level-III');
            expect(LEVELS.EX.cssClass).toBe('level-EX');
        });
    });

    describe('baseSkills configuration', () => {
        test('should have four base skills', () => {
            expect(baseSkills).toHaveLength(4);
        });

        test('should have attack, affinity, element, and sharpness', () => {
            const skillIds = baseSkills.map(s => s.id);
            expect(skillIds).toContain('attack');
            expect(skillIds).toContain('affinity');
            expect(skillIds).toContain('element');
            expect(skillIds).toContain('sharpness');
        });

        test('attack should have levels I, II, III, EX', () => {
            const attack = baseSkills.find(s => s.id === 'attack');
            expect(attack.levels).toEqual(['I', 'II', 'III', 'EX']);
        });

        test('affinity should have levels I, II, III, EX', () => {
            const affinity = baseSkills.find(s => s.id === 'affinity');
            expect(affinity.levels).toEqual(['I', 'II', 'III', 'EX']);
        });

        test('element should have levels I, II, III, EX', () => {
            const element = baseSkills.find(s => s.id === 'element');
            expect(element.levels).toEqual(['I', 'II', 'III', 'EX']);
        });

        test('sharpness should only have levels I and EX', () => {
            const sharpness = baseSkills.find(s => s.id === 'sharpness');
            expect(sharpness.levels).toEqual(['I', 'EX']);
        });
    });

    describe('generated attributes array', () => {
        test('should have correct total count (4*4 + special sharpness = 14)', () => {
            // attack: 4, affinity: 4, element: 4, sharpness: 2 = 14
            expect(attributes).toHaveLength(14);
        });

        test('each attribute should have required properties', () => {
            attributes.forEach(attr => {
                expect(attr).toHaveProperty('id');
                expect(attr).toHaveProperty('baseId');
                expect(attr).toHaveProperty('level');
                expect(attr).toHaveProperty('name');
                expect(attr).toHaveProperty('icon');
                expect(attr).toHaveProperty('cssClass');
            });
        });

        test('attribute IDs should follow format baseId-level', () => {
            attributes.forEach(attr => {
                expect(attr.id).toBe(`${attr.baseId}-${attr.level}`);
            });
        });

        test('should have attack-I, attack-II, attack-III, attack-EX', () => {
            const attackIds = attributes.filter(a => a.baseId === 'attack').map(a => a.id);
            expect(attackIds).toContain('attack-I');
            expect(attackIds).toContain('attack-II');
            expect(attackIds).toContain('attack-III');
            expect(attackIds).toContain('attack-EX');
        });

        test('should only have sharpness-I and sharpness-EX', () => {
            const sharpnessAttrs = attributes.filter(a => a.baseId === 'sharpness');
            expect(sharpnessAttrs).toHaveLength(2);
            expect(sharpnessAttrs.map(a => a.id)).toEqual(['sharpness-I', 'sharpness-EX']);
        });

        test('attribute names should be abbreviated with level', () => {
            const attackI = attributes.find(a => a.id === 'attack-I');
            expect(attackI.name).toBe('Attack I');

            const sharpnessEX = attributes.find(a => a.id === 'sharpness-EX');
            expect(sharpnessEX.name).toBe('Sharpness EX');
        });

        test('attributes should have correct cssClass based on level', () => {
            const attackI = attributes.find(a => a.id === 'attack-I');
            expect(attackI.cssClass).toBe('level-I');

            const affinityEX = attributes.find(a => a.id === 'affinity-EX');
            expect(affinityEX.cssClass).toBe('level-EX');
        });
    });

    describe('parseAttributeId', () => {
        test('should parse new format attribute IDs correctly', () => {
            expect(parseAttributeId('attack-I')).toEqual({ baseId: 'attack', level: 'I' });
            expect(parseAttributeId('affinity-II')).toEqual({ baseId: 'affinity', level: 'II' });
            expect(parseAttributeId('element-III')).toEqual({ baseId: 'element', level: 'III' });
            expect(parseAttributeId('sharpness-EX')).toEqual({ baseId: 'sharpness', level: 'EX' });
        });

        test('should handle legacy format by defaulting to level I', () => {
            expect(parseAttributeId('attack')).toEqual({ baseId: 'attack', level: 'I' });
            expect(parseAttributeId('affinity')).toEqual({ baseId: 'affinity', level: 'I' });
            expect(parseAttributeId('element')).toEqual({ baseId: 'element', level: 'I' });
            expect(parseAttributeId('sharpness')).toEqual({ baseId: 'sharpness', level: 'I' });
        });
    });

    describe('migrateAttributeId', () => {
        test('should convert legacy format to level I', () => {
            expect(migrateAttributeId('attack')).toBe('attack-I');
            expect(migrateAttributeId('affinity')).toBe('affinity-I');
            expect(migrateAttributeId('element')).toBe('element-I');
            expect(migrateAttributeId('sharpness')).toBe('sharpness-I');
        });

        test('should leave new format unchanged', () => {
            expect(migrateAttributeId('attack-I')).toBe('attack-I');
            expect(migrateAttributeId('attack-II')).toBe('attack-II');
            expect(migrateAttributeId('attack-III')).toBe('attack-III');
            expect(migrateAttributeId('attack-EX')).toBe('attack-EX');
            expect(migrateAttributeId('sharpness-EX')).toBe('sharpness-EX');
        });
    });
});

describe('Data Migration', () => {
    let localStorageMock;

    beforeEach(() => {
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

        document.body.innerHTML = `
            <nav class="tab-bar">
                <button class="tab-btn active" data-tab="artian">Artian Rolls</button>
                <button class="tab-btn" data-tab="gogma">Gogma Rolls</button>
            </nav>
            <div id="artian-content" class="tab-content active"></div>
            <div id="gogma-content" class="tab-content"></div>
            <div id="weapon-buttons"></div>
            <div id="attribute-buttons"></div>
            <table><tbody id="rolls-body"></tbody></table>
            <button id="delete-weapon">Delete Weapon Data</button>
            <button id="delete-all">Delete All Data</button>
            <button id="sort-toggle"><span id="sort-direction">Ascending</span></button>
        `;

        jest.resetModules();
    });

    afterEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
    });

    test('should migrate legacy data to new format on load', () => {
        // Setup legacy data without DATA_VERSION
        localStorageMock.store = {
            bow: JSON.stringify([
                { number: 1, attributes: ['attack', 'affinity', 'element', 'sharpness', 'attack'] }
            ])
        };

        // Load main.js which should trigger migration
        require('../../../src/scripts/main.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // Check that DATA_VERSION was set to 3 (current version)
        expect(localStorageMock.setItem).toHaveBeenCalledWith('DATA_VERSION', '3');

        // Check that data was migrated to v3 nested format with attribute migration
        const migratedData = JSON.parse(localStorageMock.store.bow);
        expect(migratedData.artian[0].attributes).toEqual([
            'attack-I', 'affinity-I', 'element-I', 'sharpness-I', 'attack-I'
        ]);
        expect(migratedData.gogma).toEqual([]);
    });

    test('should not re-migrate if DATA_VERSION is current', () => {
        // Setup data with current version (v3 nested format)
        localStorageMock.store = {
            DATA_VERSION: '3',
            bow: JSON.stringify({
                artian: [
                    { number: 1, attributes: ['attack-II', 'affinity-III'] }
                ],
                gogma: []
            })
        };

        require('../../../src/scripts/main.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // Data should remain unchanged
        const data = JSON.parse(localStorageMock.store.bow);
        expect(data.artian[0].attributes).toEqual(['attack-II', 'affinity-III']);
    });

    test('should handle mixed format data during migration', () => {
        localStorageMock.store = {
            bow: JSON.stringify([
                { number: 1, attributes: ['attack', 'attack-II', 'element'] }
            ])
        };

        require('../../../src/scripts/main.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const migratedData = JSON.parse(localStorageMock.store.bow);
        expect(migratedData.artian[0].attributes).toEqual([
            'attack-I', 'attack-II', 'element-I'
        ]);
        expect(migratedData.gogma).toEqual([]);
    });
});

describe('Import Migration', () => {
    let localStorageMock;

    beforeEach(() => {
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
        document.execCommand = jest.fn();

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

        jest.resetModules();
    });

    afterEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
    });

    test('should migrate legacy format on import', () => {
        require('../../../src/scripts/import-export.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const legacyData = {
            bow: [
                { number: 1, attributes: ['attack', 'affinity', 'sharpness'] }
            ]
        };

        const importDataElem = document.getElementById('import-data');
        importDataElem.value = JSON.stringify(legacyData);

        document.getElementById('import-button').click();

        // Check that data was migrated to v3 nested format
        const storedData = JSON.parse(localStorageMock.store.bow);
        expect(storedData.artian[0].attributes).toEqual(['attack-I', 'affinity-I', 'sharpness-I']);
        expect(storedData.gogma).toEqual([]);
    });

    test('should preserve new format on import', () => {
        require('../../../src/scripts/import-export.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const newFormatData = {
            bow: [
                { number: 1, attributes: ['attack-II', 'affinity-EX', 'sharpness-I'] }
            ]
        };

        const importDataElem = document.getElementById('import-data');
        importDataElem.value = JSON.stringify(newFormatData);

        document.getElementById('import-button').click();

        // Check that data was converted to v3 nested format
        const storedData = JSON.parse(localStorageMock.store.bow);
        expect(storedData.artian[0].attributes).toEqual(['attack-II', 'affinity-EX', 'sharpness-I']);
        expect(storedData.gogma).toEqual([]);
    });

    test('should handle mixed format on import', () => {
        require('../../../src/scripts/import-export.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const mixedData = {
            bow: [
                { number: 1, attributes: ['attack', 'affinity-III', 'element', 'sharpness-EX'] }
            ]
        };

        const importDataElem = document.getElementById('import-data');
        importDataElem.value = JSON.stringify(mixedData);

        document.getElementById('import-button').click();

        // Check that data was converted to v3 nested format with attribute migration
        const storedData = JSON.parse(localStorageMock.store.bow);
        expect(storedData.artian[0].attributes).toEqual(['attack-I', 'affinity-III', 'element-I', 'sharpness-EX']);
        expect(storedData.gogma).toEqual([]);
    });
});

describe('Data Migration v2 to v3', () => {
    let localStorageMock;

    beforeEach(() => {
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

        document.body.innerHTML = `
            <nav class="tab-bar">
                <button class="tab-btn active" data-tab="artian">Artian Rolls</button>
                <button class="tab-btn" data-tab="gogma">Gogma Rolls</button>
            </nav>
            <div id="artian-content" class="tab-content active"></div>
            <div id="gogma-content" class="tab-content"></div>
            <div id="weapon-buttons"></div>
            <div id="attribute-buttons"></div>
            <table><tbody id="rolls-body"></tbody></table>
            <button id="delete-weapon">Delete Weapon Data</button>
            <button id="delete-all">Delete All Data</button>
            <button id="sort-toggle"><span id="sort-direction">Ascending</span></button>
        `;

        jest.resetModules();
    });

    afterEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
    });

    test('should migrate v2 flat data to v3 nested format', () => {
        // Setup v2 data (flat array with leveled attributes)
        localStorageMock.store = {
            DATA_VERSION: '2',
            bow: JSON.stringify([
                { number: 1, attributes: ['attack-II', 'affinity-III', 'element-I', 'sharpness-EX', 'attack-I'] }
            ])
        };

        require('../../../src/scripts/main.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // Check that DATA_VERSION was updated to 3
        expect(localStorageMock.setItem).toHaveBeenCalledWith('DATA_VERSION', '3');

        // Check that data was migrated to nested format
        const migratedData = JSON.parse(localStorageMock.store.bow);
        expect(migratedData).toHaveProperty('artian');
        expect(migratedData).toHaveProperty('gogma');
        expect(migratedData.artian).toHaveLength(1);
        expect(migratedData.gogma).toEqual([]);
        expect(migratedData.artian[0].attributes).toEqual([
            'attack-II', 'affinity-III', 'element-I', 'sharpness-EX', 'attack-I'
        ]);
    });

    test('should migrate v1 data directly to v3 format', () => {
        // Setup v1 data (flat array with legacy attribute format, no DATA_VERSION)
        localStorageMock.store = {
            bow: JSON.stringify([
                { number: 1, attributes: ['attack', 'affinity', 'element', 'sharpness', 'attack'] }
            ])
        };

        require('../../../src/scripts/main.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // Check that DATA_VERSION was set to 3
        expect(localStorageMock.setItem).toHaveBeenCalledWith('DATA_VERSION', '3');

        // Check that data was migrated to v3 nested format with attribute migration
        const migratedData = JSON.parse(localStorageMock.store.bow);
        expect(migratedData).toHaveProperty('artian');
        expect(migratedData).toHaveProperty('gogma');
        expect(migratedData.artian).toHaveLength(1);
        expect(migratedData.gogma).toEqual([]);
        expect(migratedData.artian[0].attributes).toEqual([
            'attack-I', 'affinity-I', 'element-I', 'sharpness-I', 'attack-I'
        ]);
    });

    test('should not re-migrate if DATA_VERSION is 3', () => {
        // Setup v3 data (nested format)
        localStorageMock.store = {
            DATA_VERSION: '3',
            bow: JSON.stringify({
                artian: [
                    { number: 1, attributes: ['attack-II', 'affinity-III', 'element-I', 'sharpness-EX', 'attack-I'] }
                ],
                gogma: [
                    { number: 1, groupSkill: 'skill-1', setBonus: 'bonus-1' }
                ]
            })
        };

        require('../../../src/scripts/main.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // Data should remain unchanged
        const data = JSON.parse(localStorageMock.store.bow);
        expect(data.artian[0].attributes).toEqual(['attack-II', 'affinity-III', 'element-I', 'sharpness-EX', 'attack-I']);
        expect(data.gogma[0]).toEqual({ number: 1, groupSkill: 'skill-1', setBonus: 'bonus-1' });
    });
});
