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
