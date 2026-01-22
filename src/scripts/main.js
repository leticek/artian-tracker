// Add this import at the top of main.js
import { attributes, migrateAttributeId } from './attributes.js';

// Data version for migration
const DATA_VERSION = 3;

// Current active tab
let currentTab = 'artian';

// Add this helper function at the top of the file
function getAttributeById(id) {
    return attributes.find(attr => attr.id === id) || null;
}

// Helper functions for v3 data format
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

// Tab switching function
function switchTab(tabName) {
    currentTab = tabName;

    // Toggle active class on tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Toggle active class on tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === `${tabName}-content`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    // Reload weapon data for the appropriate tab
    if (selectedWeapon) {
        loadWeaponRolls();
    }
}

let selectedWeapon = null;
let currentRoll = {
    number: 1,
    attributes: []
};
let selectedAttributeCell = null;
let deleteWeaponClickTimeout = null;
let deleteAllClickTimeout = null;
let sortAscending = true; // Default sort order is ascending

// Add error message element reference for better handling
let errorMessageElement = null;

// Listen for weapon selection
document.addEventListener('weaponSelected', (event) => {
    selectedWeapon = event.detail;
    loadWeaponRolls();
});

// Listen for data import event
document.addEventListener('dataImported', (event) => {
    // Get the list of imported weapons
    const importedWeapons = event.detail?.importedWeapons || [];
    
    // If a weapon is selected and it's one of the imported weapons, reload its data
    if (selectedWeapon && importedWeapons.includes(selectedWeapon.id)) {
        // Force reload the weapon data
        loadWeaponRolls();
    }
});

// Replace the entire attributeSelected event listener
document.addEventListener('attributeSelected', (event) => {
    const attribute = event.detail;
    const clickedButton = document.querySelector(`.attribute-btn[data-attribute-id="${attribute.id}"]`);
    
    if (!selectedWeapon) {
        clickedButton.classList.add('error');
        // Remove the error class after animation completes
        setTimeout(() => {
            clickedButton.classList.remove('error');
        }, 500);
        return;
    }

    // If a cell is selected, update it
    if (selectedAttributeCell) {
        const rollNumber = parseInt(selectedAttributeCell.dataset.roll);
        const position = parseInt(selectedAttributeCell.dataset.position);
        
        // Handle the current incomplete roll differently
        if (rollNumber === currentRoll.number) {
            currentRoll.attributes[position] = attribute.id;
            saveIncompleteRoll(); // Save immediately
            // Only reset current roll if it's complete
            if (currentRoll.attributes.length === 5) {
                currentRoll = {
                    number: currentRoll.number + 1,
                    attributes: []
                };
            }
        } else {
            // Handle completed rolls in localStorage
            try {
                const weaponData = getWeaponData(selectedWeapon.id);
                const roll = weaponData.artian.find(r => r.number === rollNumber);

                if (roll) {
                    roll.attributes[position] = attribute.id;
                    saveWeaponData(selectedWeapon.id, weaponData);
                }
            } catch (error) {
                showError(`Error updating roll: ${error.message}`);
            }
        }
        
        selectedAttributeCell.classList.remove('selected');
        selectedAttributeCell = null;
        updateDisplay();
        return;
    }

    // Add new attribute to current roll
    if (currentRoll.attributes.length < 5) {
        currentRoll.attributes.push(attribute.id);
        saveIncompleteRoll(); // Save immediately
        
        if (currentRoll.attributes.length === 5) {
            currentRoll = {
                number: currentRoll.number + 1,
                attributes: []
            };
        }
        
        updateDisplay();
    }
});

// Migrate localStorage data from old format to new format
function migrateData() {
    const currentVersion = parseInt(localStorage.getItem('DATA_VERSION') || '1');

    if (currentVersion < 3) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key === 'DATA_VERSION') continue;

            try {
                const data = JSON.parse(localStorage.getItem(key));

                // Handle flat array (v1 or v2 format)
                if (Array.isArray(data)) {
                    const migratedArtian = data.map(roll => ({
                        ...roll,
                        attributes: roll.attributes.map(attr => migrateAttributeId(attr))
                    }));
                    localStorage.setItem(key, JSON.stringify({
                        artian: migratedArtian,
                        gogma: []
                    }));
                }
            } catch (e) {
                console.warn(`Failed to migrate ${key}:`, e);
            }
        }
    }

    localStorage.setItem('DATA_VERSION', String(DATA_VERSION));
}

// Helper function to show error messages
function showError(message) {
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorMessageElement.style.display = 'none';
        }, 5000);
    } else {
        console.error(message);
    }
}

// Add this new function to handle display updates
function updateDisplay() {
    if (!selectedWeapon) return;

    try {
        const weaponData = getWeaponData(selectedWeapon.id);
        let rolls = weaponData.artian;

        // If no data exists, just clear the table and return
        if (!rolls || rolls.length === 0) {
            const tbody = document.getElementById('rolls-body');
            tbody.innerHTML = '';
            return;
        }

        // Filter out any null or undefined entries or empty attribute arrays
        rolls = rolls.filter(roll => roll && roll.attributes && roll.attributes.length > 0);

        // If after filtering there are no rolls with attributes, update the weapon data
        if (rolls.length === 0) {
            weaponData.artian = [];
            saveWeaponData(selectedWeapon.id, weaponData);
            const tbody = document.getElementById('rolls-body');
            tbody.innerHTML = '';
            return;
        }

        // Reorder roll numbers including incomplete rolls
        let nextNumber = 1;
        rolls.sort((a, b) => a.number - b.number).forEach(roll => {
            roll.number = nextNumber++;
        });

        // Save reordered rolls back to storage
        weaponData.artian = rolls;
        saveWeaponData(selectedWeapon.id, weaponData);

        const tbody = document.getElementById('rolls-body');
        tbody.innerHTML = '';

        // Sort rolls based on the current sort direction
        const displayRolls = [...rolls];
        if (!sortAscending) {
            displayRolls.sort((a, b) => b.number - a.number);
        }

        // Display all rolls
        displayRolls.forEach(roll => {
            tbody.appendChild(createRollRow(roll));
        });

        // Reset current roll number if needed
        if (currentRoll.attributes.length === 0) {
            currentRoll.number = nextNumber;
        }

        // Update sort direction text and attributes without animations
        const sortToggle = document.getElementById('sort-toggle');
        const sortDirectionEl = document.getElementById('sort-direction');

        if (sortToggle && sortDirectionEl) {
            sortDirectionEl.textContent = sortAscending ? 'Ascending' : 'Descending';
            sortToggle.setAttribute('data-order', sortAscending ? 'ascending' : 'descending');
        }
    } catch (error) {
        showError(`Error updating display: ${error.message}`);
    }
}

function loadWeaponRolls() {
    if (!selectedWeapon) return;

    try {
        const weaponData = getWeaponData(selectedWeapon.id);
        const rolls = weaponData.artian;

        // Find incomplete roll if it exists
        const incompleteRoll = rolls.find(r => r.attributes && r.attributes.length < 5);

        if (incompleteRoll) {
            currentRoll = incompleteRoll;
        } else {
            currentRoll = {
                number: (rolls.length > 0 ? rolls[rolls.length - 1].number + 1 : 1),
                attributes: []
            };
        }

        // Only update display if there are rolls with data
        if (rolls.length > 0) {
            updateDisplay();
        } else {
            // Clear the table if there's no data
            const tbody = document.getElementById('rolls-body');
            tbody.innerHTML = '';
        }
    } catch (error) {
        showError(`Error loading weapon data: ${error.message}`);
    }
}

// Update the createRollRow function
function createRollRow(roll) {
    const row = document.createElement('tr');
    
    // Add the roll number cell
    const numberCell = document.createElement('td');
    numberCell.className = 'number-cell';
    numberCell.textContent = roll.number;
    
    // Add click handler for the number cell
    numberCell.addEventListener('click', (e) => {
        const allNumberCells = document.querySelectorAll('.number-cell');

        if (numberCell.classList.contains('delete-mode')) {
            // Delete the roll
            try {
                const weaponData = getWeaponData(selectedWeapon.id);

                // If this is the current incomplete roll, reset it
                if (roll.number === currentRoll.number) {
                    currentRoll = {
                        number: roll.number,
                        attributes: []
                    };
                }

                // Remove the roll and save (only affects artian data)
                weaponData.artian = weaponData.artian.filter(r => r.number !== roll.number);
                saveWeaponData(selectedWeapon.id, weaponData);

                updateDisplay();
            } catch (error) {
                showError(`Error deleting roll: ${error.message}`);
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
    
    // Add the attribute cells
    for (let i = 0; i < 5; i++) {
        const cell = document.createElement('td');
        cell.className = 'attribute-cell';
        cell.setAttribute('data-roll', roll.number);
        cell.setAttribute('data-position', i);
        
        const attributeId = roll.attributes[i];
        if (attributeId) {
            const attribute = getAttributeById(attributeId);
            if (attribute) {
                // Apply level-specific CSS class for coloring
                if (attribute.cssClass) {
                    cell.classList.add(attribute.cssClass);
                }
                const content = document.createElement('div');
                content.className = 'attribute-content';
                content.innerHTML = `
                    <img src="${attribute.icon}" alt="${attribute.name}"
                         onerror="this.style.display='none'">
                    <span>${attribute.name}</span>
                `;
                cell.appendChild(content);
            }
        }
        
        cell.addEventListener('click', () => {
            if (selectedAttributeCell) {
                selectedAttributeCell.classList.remove('selected');
            }
            cell.classList.add('selected');
            selectedAttributeCell = cell;
        });
        
        row.appendChild(cell);
    }
    
    return row;
}

function saveIncompleteRoll() {
    if (!selectedWeapon || !currentRoll.attributes.length) return;

    try {
        const weaponData = getWeaponData(selectedWeapon.id);
        const rolls = weaponData.artian;

        const existingRollIndex = rolls.findIndex(r => r.number === currentRoll.number);

        if (existingRollIndex >= 0) {
            rolls[existingRollIndex] = currentRoll;
        } else {
            rolls.push(currentRoll);
        }

        // Only save if there's actual data
        if (rolls.some(roll => roll.attributes.length > 0)) {
            weaponData.artian = rolls;
            saveWeaponData(selectedWeapon.id, weaponData);
        }
    } catch (error) {
        showError(`Error saving roll: ${error.message}`);
    }
}

// At the end of the file, wrap the delete button event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Run data migration first
    migrateData();

    // Initialize the error message element reference
    errorMessageElement = document.getElementById('error-message');

    const deleteWeaponBtn = document.getElementById('delete-weapon');
    if (deleteWeaponBtn) {
        deleteWeaponBtn.addEventListener('click', function() {
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
                // Second click - perform deletion (only artian data)
                const weaponData = getWeaponData(selectedWeapon.id);
                weaponData.artian = [];
                saveWeaponData(selectedWeapon.id, weaponData);
                currentRoll = {
                    number: 1,
                    attributes: []
                };
                updateDisplay();
                this.classList.remove('confirm');
                this.textContent = 'Delete Weapon Data';
                if (deleteWeaponClickTimeout) {
                    clearTimeout(deleteWeaponClickTimeout);
                }
            } else {
                // First click - show confirmation state
                this.classList.add('confirm');
                this.textContent = `Click again to delete ${selectedWeapon.name}`;
                
                // Reset after 3 seconds
                deleteWeaponClickTimeout = setTimeout(() => {
                    this.classList.remove('confirm');
                    this.textContent = 'Delete Weapon Data';
                }, 3000);
            }
        });
    }

    const deleteAllBtn = document.getElementById('delete-all');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', function() {
            if (this.classList.contains('confirm')) {
                // Second click - perform deletion
                // Store the selected weapon reference before clearing localStorage
                const currentWeaponId = selectedWeapon ? selectedWeapon.id : null;
                
                localStorage.clear();
                
                // Reset current roll
                currentRoll = {
                    number: 1,
                    attributes: []
                };
                
                // Do NOT clear selectedWeapon

                // Clear the table
                const tbody = document.getElementById('rolls-body');
                tbody.innerHTML = '';

                this.classList.remove('confirm');
                this.textContent = 'Delete All Data';
                if (deleteAllClickTimeout) {
                    clearTimeout(deleteAllClickTimeout);
                }
            } else {
                // First click - show confirmation state
                this.classList.add('confirm');
                this.textContent = 'Click again to delete ALL data';
                
                // Reset after 3 seconds
                deleteAllClickTimeout = setTimeout(() => {
                    this.classList.remove('confirm');
                    this.textContent = 'Delete All Data';
                }, 3000);
            }
        });
    }

    // Add the sort toggle button event listener with proper sorting implementation
    const sortToggle = document.getElementById('sort-toggle');
    if (sortToggle) {
        sortToggle.addEventListener('click', function() {
            sortAscending = !sortAscending;

            // Make sure sort direction is immediately updated for tests
            const sortDirectionEl = document.getElementById('sort-direction');
            if (sortDirectionEl) {
                sortDirectionEl.textContent = sortAscending ? 'Ascending' : 'Descending';
            }

            this.setAttribute('data-order', sortAscending ? 'ascending' : 'descending');

            // Update the display with the new sort order
            updateDisplay();
        });
    }

    // Add tab button click listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            if (tabName) {
                switchTab(tabName);
            }
        });
    });
});