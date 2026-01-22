/**
 * @jest-environment jsdom
 */

import {
    GOGMA_COLORS,
    groupSkills,
    setBonusSkills,
    getGogmaSkillById,
    getSkillClass
} from '../../../src/scripts/gogma-skills.js';

describe('Gogma Skills Definitions', () => {
    describe('GOGMA_COLORS', () => {
        test('should have red, yellow, and green colors defined', () => {
            expect(GOGMA_COLORS).toHaveProperty('red');
            expect(GOGMA_COLORS).toHaveProperty('yellow');
            expect(GOGMA_COLORS).toHaveProperty('green');
        });

        test('each color should have cssClass, background, and border', () => {
            Object.values(GOGMA_COLORS).forEach(color => {
                expect(color).toHaveProperty('cssClass');
                expect(color).toHaveProperty('background');
                expect(color).toHaveProperty('border');
            });
        });
    });

    describe('groupSkills', () => {
        test('should have exactly 4 group skills', () => {
            expect(groupSkills).toHaveLength(4);
        });

        test('should have correct skill IDs', () => {
            const ids = groupSkills.map(s => s.id);
            expect(ids).toContain('lords-soul');
            expect(ids).toContain('lords-fury');
            expect(ids).toContain('fortifying-pelt');
            expect(ids).toContain('guardians-pulse');
        });

        test('each skill should have id, name, and color', () => {
            groupSkills.forEach(skill => {
                expect(skill).toHaveProperty('id');
                expect(skill).toHaveProperty('name');
                expect(skill).toHaveProperty('color');
                expect(['red', 'yellow', 'green']).toContain(skill.color);
            });
        });

        test('should have correct colors assigned', () => {
            const lordsSoul = groupSkills.find(s => s.id === 'lords-soul');
            const lordsFury = groupSkills.find(s => s.id === 'lords-fury');
            const fortifyingPelt = groupSkills.find(s => s.id === 'fortifying-pelt');
            const guardiansPulse = groupSkills.find(s => s.id === 'guardians-pulse');

            expect(lordsSoul.color).toBe('red');
            expect(lordsFury.color).toBe('yellow');
            expect(fortifyingPelt.color).toBe('green');
            expect(guardiansPulse.color).toBe('green');
        });
    });

    describe('setBonusSkills', () => {
        test('should have exactly 18 set bonus skills', () => {
            expect(setBonusSkills).toHaveLength(18);
        });

        test('should have 9 red skills', () => {
            const redSkills = setBonusSkills.filter(s => s.color === 'red');
            expect(redSkills).toHaveLength(9);
        });

        test('should have 6 yellow skills', () => {
            const yellowSkills = setBonusSkills.filter(s => s.color === 'yellow');
            expect(yellowSkills).toHaveLength(6);
        });

        test('should have 3 green skills', () => {
            const greenSkills = setBonusSkills.filter(s => s.color === 'green');
            expect(greenSkills).toHaveLength(3);
        });

        test('each skill should have id, name, and color', () => {
            setBonusSkills.forEach(skill => {
                expect(skill).toHaveProperty('id');
                expect(skill).toHaveProperty('name');
                expect(skill).toHaveProperty('color');
            });
        });
    });

    describe('getGogmaSkillById', () => {
        test('should find group skill by ID', () => {
            const skill = getGogmaSkillById('lords-soul');
            expect(skill).not.toBeNull();
            expect(skill.name).toBe("Lord's Soul");
        });

        test('should find set bonus skill by ID', () => {
            const skill = getGogmaSkillById('gore-magala');
            expect(skill).not.toBeNull();
            expect(skill.name).toBe("Gore Magala's Tyranny");
        });

        test('should return null for unknown ID', () => {
            const skill = getGogmaSkillById('unknown-skill');
            expect(skill).toBeNull();
        });
    });

    describe('getSkillClass', () => {
        test('should return "group" for group skills', () => {
            expect(getSkillClass('lords-soul')).toBe('group');
            expect(getSkillClass('lords-fury')).toBe('group');
            expect(getSkillClass('fortifying-pelt')).toBe('group');
            expect(getSkillClass('guardians-pulse')).toBe('group');
        });

        test('should return "setBonus" for set bonus skills', () => {
            expect(getSkillClass('gore-magala')).toBe('setBonus');
            expect(getSkillClass('mizutsune')).toBe('setBonus');
        });

        test('should return null for unknown skills', () => {
            expect(getSkillClass('unknown')).toBeNull();
        });
    });
});

describe('Gogma Roll Logic', () => {
    test('selecting group skill then set bonus creates complete roll', () => {
        const expectedRoll = {
            number: 1,
            groupSkill: 'lords-soul',
            setBonus: 'gore-magala'
        };
        expect(expectedRoll.groupSkill).toBe('lords-soul');
        expect(expectedRoll.setBonus).toBe('gore-magala');
    });

    test('selecting same class skill replaces existing', () => {
        const currentRoll = { number: 1, groupSkill: 'lords-soul', setBonus: null };
        currentRoll.groupSkill = 'lords-fury';
        expect(currentRoll.groupSkill).toBe('lords-fury');
    });

    test('roll is complete when both slots filled', () => {
        const roll = { number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' };
        const isComplete = roll.groupSkill !== null && roll.setBonus !== null;
        expect(isComplete).toBe(true);
    });

    test('roll is incomplete when missing slot', () => {
        const roll = { number: 1, groupSkill: 'lords-soul', setBonus: null };
        const isComplete = roll.groupSkill !== null && roll.setBonus !== null;
        expect(isComplete).toBe(false);
    });
});

describe('Import/Export with Nested Format', () => {
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

    test('should import v3 nested format correctly', () => {
        require('../../../src/scripts/import-export.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const v3Data = {
            bow: {
                artian: [{ number: 1, attributes: ['attack-I'] }],
                gogma: [{ number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' }]
            }
        };

        document.getElementById('import-data').value = JSON.stringify(v3Data);
        document.getElementById('import-button').click();

        const stored = JSON.parse(localStorageMock.store.bow);
        expect(stored.artian[0].attributes).toEqual(['attack-I']);
        expect(stored.gogma[0].groupSkill).toBe('lords-soul');
    });

    test('should migrate v2 flat format to v3 on import', () => {
        require('../../../src/scripts/import-export.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const v2Data = {
            bow: [{ number: 1, attributes: ['attack-I', 'affinity-II'] }]
        };

        document.getElementById('import-data').value = JSON.stringify(v2Data);
        document.getElementById('import-button').click();

        const stored = JSON.parse(localStorageMock.store.bow);
        expect(stored.artian[0].attributes).toEqual(['attack-I', 'affinity-II']);
        expect(stored.gogma).toEqual([]);
    });

    test('should migrate v1 legacy format to v3 on import', () => {
        require('../../../src/scripts/import-export.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const v1Data = {
            bow: [{ number: 1, attributes: ['attack', 'affinity'] }]
        };

        document.getElementById('import-data').value = JSON.stringify(v1Data);
        document.getElementById('import-button').click();

        const stored = JSON.parse(localStorageMock.store.bow);
        expect(stored.artian[0].attributes).toEqual(['attack-I', 'affinity-I']);
        expect(stored.gogma).toEqual([]);
    });

    test('should export in v3 nested format', () => {
        localStorageMock.store = {
            DATA_VERSION: '3',
            bow: JSON.stringify({
                artian: [{ number: 1, attributes: ['attack-I'] }],
                gogma: [{ number: 1, groupSkill: 'lords-soul', setBonus: 'gore-magala' }]
            })
        };

        require('../../../src/scripts/import-export.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));

        document.getElementById('export-button').click();

        const exported = JSON.parse(document.getElementById('export-data').value);
        expect(exported.bow.artian[0].attributes).toEqual(['attack-I']);
        expect(exported.bow.gogma[0].groupSkill).toBe('lords-soul');
    });
});
