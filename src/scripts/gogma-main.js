// Import from gogma-skills.js
import {
    GOGMA_COLORS,
    groupSkills,
    setBonusSkills,
    getGogmaSkillById,
    getSkillClass
} from './gogma-skills.js';

// State tracking
let selectedWeapon = null;
let currentGogmaRoll = {
    number: 1,
    groupSkill: null,
    setBonus: null
};
let selectedGogmaCell = null;
let gogmaSortAscending = true;
let deleteGogmaWeaponClickTimeout = null;
let deleteGogmaAllClickTimeout = null;

// Error message element reference
let gogmaErrorMessageElement = null;

// Helper functions (duplicate of main.js since separate module)
function getWeaponData(weaponId) {
    const storedData = localStorage.getItem(weaponId);
    if (!storedData) return { artian: [], gogma: [] };

    try {
        const data = JSON.parse(storedData);
        if (data.artian !== undefined) return data;
        // Legacy format (flat array) - treat as artian data
        return { artian: data, gogma: [] };
    } catch (e) {
        return { artian: [], gogma: [] };
    }
}

function saveWeaponData(weaponId, data) {
    if (data.artian.length === 0 && data.gogma.length === 0) {
        localStorage.removeItem(weaponId);
    } else {
        localStorage.setItem(weaponId, JSON.stringify(data));
    }
}

function isRollComplete(roll) {
    return roll.groupSkill !== null && roll.setBonus !== null;
}

// Helper function to show error messages
function showGogmaError(message) {
    if (gogmaErrorMessageElement) {
        gogmaErrorMessageElement.textContent = message;
        gogmaErrorMessageElement.style.display = 'block';

        // Hide error after 5 seconds
        setTimeout(() => {
            gogmaErrorMessageElement.style.display = 'none';
        }, 5000);
    } else {
        console.error(message);
    }
}

// Handle gogma skill selection
function handleGogmaSkillSelected(skillId) {
    const clickedButton = document.querySelector(`.gogma-skill-btn[data-skill-id="${skillId}"]`);

    if (!selectedWeapon) {
        if (clickedButton) {
            clickedButton.classList.add('error');
            // Remove the error class after animation completes
            setTimeout(() => {
                clickedButton.classList.remove('error');
            }, 500);
        }
        return;
    }

    // Determine skill class (group or setBonus)
    const skillClass = getSkillClass(skillId);
    if (!skillClass) {
        showGogmaError('Unknown skill type');
        return;
    }

    // If a cell is selected, update it
    if (selectedGogmaCell) {
        const rollNumber = parseInt(selectedGogmaCell.dataset.roll);
        const slotType = selectedGogmaCell.dataset.slotType; // 'group' or 'setBonus'

        // Verify skill class matches slot type
        if (skillClass !== slotType) {
            if (clickedButton) {
                clickedButton.classList.add('error');
                setTimeout(() => {
                    clickedButton.classList.remove('error');
                }, 500);
            }
            return;
        }

        // Handle the current incomplete roll differently
        if (rollNumber === currentGogmaRoll.number) {
            if (slotType === 'group') {
                currentGogmaRoll.groupSkill = skillId;
            } else {
                currentGogmaRoll.setBonus = skillId;
            }
            saveGogmaRoll();
            // Advance to next roll if complete
            if (isRollComplete(currentGogmaRoll)) {
                currentGogmaRoll = {
                    number: currentGogmaRoll.number + 1,
                    groupSkill: null,
                    setBonus: null
                };
            }
        } else {
            // Handle completed rolls in localStorage
            try {
                const weaponData = getWeaponData(selectedWeapon.id);
                const roll = weaponData.gogma.find(r => r.number === rollNumber);

                if (roll) {
                    if (slotType === 'group') {
                        roll.groupSkill = skillId;
                    } else {
                        roll.setBonus = skillId;
                    }
                    saveWeaponData(selectedWeapon.id, weaponData);
                }
            } catch (error) {
                showGogmaError(`Error updating roll: ${error.message}`);
            }
        }

        selectedGogmaCell.classList.remove('selected');
        selectedGogmaCell = null;
        updateGogmaDisplay();
        return;
    }

    // No cell selected - add to current roll (replacing behavior)
    if (skillClass === 'group') {
        currentGogmaRoll.groupSkill = skillId;
    } else {
        currentGogmaRoll.setBonus = skillId;
    }

    saveGogmaRoll();

    // Advance to next roll if complete
    if (isRollComplete(currentGogmaRoll)) {
        currentGogmaRoll = {
            number: currentGogmaRoll.number + 1,
            groupSkill: null,
            setBonus: null
        };
    }

    updateGogmaDisplay();
}

// Render gogma skill buttons
function renderGogmaSkillButtons() {
    const container = document.getElementById('gogma-skill-buttons');
    if (!container) return;

    container.innerHTML = '';

    // Create Group Skills section
    const groupSection = document.createElement('div');
    groupSection.className = 'gogma-skill-section';

    const groupTitle = document.createElement('h3');
    groupTitle.className = 'gogma-section-title';
    groupTitle.textContent = 'Group Skills';
    groupSection.appendChild(groupTitle);

    const groupButtonsContainer = document.createElement('div');
    groupButtonsContainer.className = 'gogma-buttons-container';

    groupSkills.forEach(skill => {
        const btn = document.createElement('button');
        btn.className = `gogma-skill-btn ${GOGMA_COLORS[skill.color].cssClass}`;
        btn.dataset.skillId = skill.id;
        btn.textContent = skill.name;
        btn.addEventListener('click', () => handleGogmaSkillSelected(skill.id));
        groupButtonsContainer.appendChild(btn);
    });

    groupSection.appendChild(groupButtonsContainer);
    container.appendChild(groupSection);

    // Create Set Bonus Skills section
    const setBonusSection = document.createElement('div');
    setBonusSection.className = 'gogma-skill-section';

    const setBonusTitle = document.createElement('h3');
    setBonusTitle.className = 'gogma-section-title';
    setBonusTitle.textContent = 'Set Bonus Skills';
    setBonusSection.appendChild(setBonusTitle);

    const setBonusButtonsContainer = document.createElement('div');
    setBonusButtonsContainer.className = 'gogma-buttons-container';

    setBonusSkills.forEach(skill => {
        const btn = document.createElement('button');
        btn.className = `gogma-skill-btn ${GOGMA_COLORS[skill.color].cssClass}`;
        btn.dataset.skillId = skill.id;
        btn.textContent = skill.name;
        btn.addEventListener('click', () => handleGogmaSkillSelected(skill.id));
        setBonusButtonsContainer.appendChild(btn);
    });

    setBonusSection.appendChild(setBonusButtonsContainer);
    container.appendChild(setBonusSection);
}

// Load gogma rolls for selected weapon
function loadGogmaRolls() {
    if (!selectedWeapon) return;

    try {
        const weaponData = getWeaponData(selectedWeapon.id);
        const rolls = weaponData.gogma;

        // Find incomplete roll if it exists
        const incompleteRoll = rolls.find(r => !isRollComplete(r));

        if (incompleteRoll) {
            currentGogmaRoll = incompleteRoll;
        } else {
            currentGogmaRoll = {
                number: (rolls.length > 0 ? rolls[rolls.length - 1].number + 1 : 1),
                groupSkill: null,
                setBonus: null
            };
        }

        updateGogmaDisplay();
    } catch (error) {
        showGogmaError(`Error loading gogma data: ${error.message}`);
    }
}

// Update gogma display
function updateGogmaDisplay() {
    if (!selectedWeapon) return;

    try {
        const weaponData = getWeaponData(selectedWeapon.id);
        let rolls = weaponData.gogma;

        // If no data exists, just clear the table and return
        if (!rolls || rolls.length === 0) {
            const tbody = document.getElementById('gogma-rolls-body');
            if (tbody) tbody.innerHTML = '';
            return;
        }

        // Filter out empty rolls (both slots null)
        rolls = rolls.filter(roll => roll && (roll.groupSkill !== null || roll.setBonus !== null));

        // If after filtering there are no rolls with data, update the weapon data
        if (rolls.length === 0) {
            weaponData.gogma = [];
            saveWeaponData(selectedWeapon.id, weaponData);
            const tbody = document.getElementById('gogma-rolls-body');
            if (tbody) tbody.innerHTML = '';
            return;
        }

        // Reorder roll numbers
        let nextNumber = 1;
        rolls.sort((a, b) => a.number - b.number).forEach(roll => {
            roll.number = nextNumber++;
        });

        // Save reordered rolls back to storage
        weaponData.gogma = rolls;
        saveWeaponData(selectedWeapon.id, weaponData);

        const tbody = document.getElementById('gogma-rolls-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        // Sort rolls based on the current sort direction
        const displayRolls = [...rolls];
        if (!gogmaSortAscending) {
            displayRolls.sort((a, b) => b.number - a.number);
        }

        // Display all rolls
        displayRolls.forEach(roll => {
            tbody.appendChild(createGogmaRollRow(roll));
        });

        // Reset current roll number if needed
        if (currentGogmaRoll.groupSkill === null && currentGogmaRoll.setBonus === null) {
            currentGogmaRoll.number = nextNumber;
        }

        // Update sort toggle UI
        const sortToggle = document.getElementById('gogma-sort-toggle');
        const sortDirectionEl = document.getElementById('gogma-sort-direction');

        if (sortToggle && sortDirectionEl) {
            sortDirectionEl.textContent = gogmaSortAscending ? 'Ascending' : 'Descending';
            sortToggle.setAttribute('data-order', gogmaSortAscending ? 'ascending' : 'descending');
        }
    } catch (error) {
        showGogmaError(`Error updating display: ${error.message}`);
    }
}

// Create a gogma roll row
function createGogmaRollRow(roll) {
    const row = document.createElement('tr');

    // Number cell with delete mode toggle
    const numberCell = document.createElement('td');
    numberCell.className = 'number-cell';
    numberCell.textContent = roll.number;

    numberCell.addEventListener('click', () => {
        const allNumberCells = document.querySelectorAll('#gogma-rolls-body .number-cell');

        if (numberCell.classList.contains('delete-mode')) {
            // Delete the roll
            try {
                const weaponData = getWeaponData(selectedWeapon.id);

                // If this is the current incomplete roll, reset it
                if (roll.number === currentGogmaRoll.number) {
                    currentGogmaRoll = {
                        number: roll.number,
                        groupSkill: null,
                        setBonus: null
                    };
                }

                // Remove the roll and save (only affects gogma data)
                weaponData.gogma = weaponData.gogma.filter(r => r.number !== roll.number);
                saveWeaponData(selectedWeapon.id, weaponData);

                updateGogmaDisplay();
            } catch (error) {
                showGogmaError(`Error deleting roll: ${error.message}`);
            }
        } else {
            // Toggle delete mode
            allNumberCells.forEach(cell => {
                if (cell !== numberCell && cell.classList.contains('delete-mode')) {
                    cell.classList.remove('delete-mode');
                    cell.textContent = cell.dataset.rollNumber;
                }
            });
            numberCell.dataset.rollNumber = roll.number;
            numberCell.textContent = 'Delete';
            numberCell.classList.add('delete-mode');
        }
    });

    row.appendChild(numberCell);

    // Group skill cell
    const groupCell = document.createElement('td');
    groupCell.className = 'gogma-skill-cell';
    groupCell.setAttribute('data-roll', roll.number);
    groupCell.setAttribute('data-slot-type', 'group');

    if (roll.groupSkill) {
        const skill = getGogmaSkillById(roll.groupSkill);
        if (skill) {
            groupCell.classList.add(GOGMA_COLORS[skill.color].cssClass);
            groupCell.textContent = skill.name;
        }
    }

    groupCell.addEventListener('click', () => {
        if (selectedGogmaCell) {
            selectedGogmaCell.classList.remove('selected');
        }
        groupCell.classList.add('selected');
        selectedGogmaCell = groupCell;
    });

    row.appendChild(groupCell);

    // Set bonus cell
    const setBonusCell = document.createElement('td');
    setBonusCell.className = 'gogma-skill-cell';
    setBonusCell.setAttribute('data-roll', roll.number);
    setBonusCell.setAttribute('data-slot-type', 'setBonus');

    if (roll.setBonus) {
        const skill = getGogmaSkillById(roll.setBonus);
        if (skill) {
            setBonusCell.classList.add(GOGMA_COLORS[skill.color].cssClass);
            setBonusCell.textContent = skill.name;
        }
    }

    setBonusCell.addEventListener('click', () => {
        if (selectedGogmaCell) {
            selectedGogmaCell.classList.remove('selected');
        }
        setBonusCell.classList.add('selected');
        selectedGogmaCell = setBonusCell;
    });

    row.appendChild(setBonusCell);

    return row;
}

// Save the current gogma roll
function saveGogmaRoll() {
    if (!selectedWeapon || (currentGogmaRoll.groupSkill === null && currentGogmaRoll.setBonus === null)) return;

    try {
        const weaponData = getWeaponData(selectedWeapon.id);
        const rolls = weaponData.gogma;

        const existingRollIndex = rolls.findIndex(r => r.number === currentGogmaRoll.number);

        if (existingRollIndex >= 0) {
            rolls[existingRollIndex] = currentGogmaRoll;
        } else {
            rolls.push(currentGogmaRoll);
        }

        // Only save if there's actual data
        if (rolls.some(roll => roll.groupSkill !== null || roll.setBonus !== null)) {
            weaponData.gogma = rolls;
            saveWeaponData(selectedWeapon.id, weaponData);
        }
    } catch (error) {
        showGogmaError(`Error saving roll: ${error.message}`);
    }
}

// Event listeners
document.addEventListener('weaponSelected', (event) => {
    selectedWeapon = event.detail;
    loadGogmaRolls();
});

// Listen for data import event
document.addEventListener('dataImported', (event) => {
    // Get the list of imported weapons
    const importedWeapons = event.detail?.importedWeapons || [];

    // If a weapon is selected and it's one of the imported weapons, reload its data
    if (selectedWeapon && importedWeapons.includes(selectedWeapon.id)) {
        // Force reload the gogma data
        loadGogmaRolls();
    }
});

// DOMContentLoaded initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the error message element reference
    gogmaErrorMessageElement = document.getElementById('gogma-error-message');

    // Render gogma skill buttons
    renderGogmaSkillButtons();

    // Set up delete-weapon button (clears only gogma data)
    const deleteGogmaWeaponBtn = document.getElementById('gogma-delete-weapon');
    if (deleteGogmaWeaponBtn) {
        deleteGogmaWeaponBtn.addEventListener('click', function() {
            if (!selectedWeapon) {
                this.classList.add('error');
                this.textContent = 'Select a weapon first';

                setTimeout(() => {
                    this.classList.remove('error');
                    this.textContent = 'Delete Weapon Data';
                }, 2000);
                return;
            }

            if (this.classList.contains('confirm')) {
                // Second click - perform deletion (only gogma data)
                const weaponData = getWeaponData(selectedWeapon.id);
                weaponData.gogma = [];
                saveWeaponData(selectedWeapon.id, weaponData);
                currentGogmaRoll = {
                    number: 1,
                    groupSkill: null,
                    setBonus: null
                };
                updateGogmaDisplay();
                this.classList.remove('confirm');
                this.textContent = 'Delete Weapon Data';
                if (deleteGogmaWeaponClickTimeout) {
                    clearTimeout(deleteGogmaWeaponClickTimeout);
                }
            } else {
                // First click - show confirmation state
                this.classList.add('confirm');
                this.textContent = `Click again to delete ${selectedWeapon.name}`;

                // Reset after 3 seconds
                deleteGogmaWeaponClickTimeout = setTimeout(() => {
                    this.classList.remove('confirm');
                    this.textContent = 'Delete Weapon Data';
                }, 3000);
            }
        });
    }

    // Set up delete-all button (clears all gogma data across weapons)
    const deleteGogmaAllBtn = document.getElementById('gogma-delete-all');
    if (deleteGogmaAllBtn) {
        deleteGogmaAllBtn.addEventListener('click', function() {
            if (this.classList.contains('confirm')) {
                // Second click - perform deletion of all gogma data
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key === 'DATA_VERSION') continue;

                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data && data.gogma !== undefined) {
                            data.gogma = [];
                            saveWeaponData(key, data);
                        }
                    } catch (e) {
                        // Skip non-JSON items
                    }
                }

                // Reset current roll
                currentGogmaRoll = {
                    number: 1,
                    groupSkill: null,
                    setBonus: null
                };

                // Clear the table
                const tbody = document.getElementById('gogma-rolls-body');
                if (tbody) tbody.innerHTML = '';

                this.classList.remove('confirm');
                this.textContent = 'Delete All Data';
                if (deleteGogmaAllClickTimeout) {
                    clearTimeout(deleteGogmaAllClickTimeout);
                }
            } else {
                // First click - show confirmation state
                this.classList.add('confirm');
                this.textContent = 'Click again to delete ALL gogma data';

                // Reset after 3 seconds
                deleteGogmaAllClickTimeout = setTimeout(() => {
                    this.classList.remove('confirm');
                    this.textContent = 'Delete All Data';
                }, 3000);
            }
        });
    }

    // Set up sort toggle
    const sortToggle = document.getElementById('gogma-sort-toggle');
    if (sortToggle) {
        sortToggle.addEventListener('click', function() {
            gogmaSortAscending = !gogmaSortAscending;

            // Make sure sort direction is immediately updated
            const sortDirectionEl = document.getElementById('gogma-sort-direction');
            if (sortDirectionEl) {
                sortDirectionEl.textContent = gogmaSortAscending ? 'Ascending' : 'Descending';
            }

            this.setAttribute('data-order', gogmaSortAscending ? 'ascending' : 'descending');

            // Update the display with the new sort order
            updateGogmaDisplay();
        });
    }
});
