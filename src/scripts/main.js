// Add this import at the top of main.js
import { attributes } from './attributes.js';

// Add this helper function at the top of the file
function getAttributeById(id) {
    return attributes.find(attr => attr.id === id) || null;
}

let selectedWeapon = null;
let currentRoll = {
    number: 1,
    attributes: []
};
let selectedAttributeCell = null;
let deleteWeaponClickTimeout = null;
let deleteAllClickTimeout = null;

// Listen for weapon selection
document.addEventListener('weaponSelected', (event) => {
    console.log("Weapon selected:", event.detail);
    selectedWeapon = event.detail;
    loadWeaponRolls();
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
            const rolls = JSON.parse(localStorage.getItem(selectedWeapon.id) || '[]');
            const roll = rolls.find(r => r.number === rollNumber);
            
            if (roll) {
                roll.attributes[position] = attribute.id;
                localStorage.setItem(selectedWeapon.id, JSON.stringify(rolls));
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

// Add this new function to handle display updates
function updateDisplay() {
    if (!selectedWeapon) return;
    
    let rolls = JSON.parse(localStorage.getItem(selectedWeapon.id) || '[]');
    
    // Filter out any null or undefined entries
    rolls = rolls.filter(roll => roll && roll.attributes);
    
    // Reorder roll numbers including incomplete rolls
    let nextNumber = 1;
    rolls.sort((a, b) => a.number - b.number).forEach(roll => {
        roll.number = nextNumber++;
    });
    
    // Save reordered rolls back to storage
    localStorage.setItem(selectedWeapon.id, JSON.stringify(rolls));
    
    const tbody = document.getElementById('rolls-body');
    tbody.innerHTML = '';
    
    // Display all rolls
    rolls.forEach(roll => {
        tbody.appendChild(createRollRow(roll));
    });
    
    // Reset current roll number if needed
    if (currentRoll.attributes.length === 0) {
        currentRoll.number = nextNumber;
    }
}

function loadWeaponRolls() {
    if (!selectedWeapon) return;
    
    const rolls = JSON.parse(localStorage.getItem(selectedWeapon.id) || '[]');
    
    // Find incomplete roll if it exists
    const incompleteRoll = rolls.find(r => r.attributes.length < 5);
    
    if (incompleteRoll) {
        currentRoll = incompleteRoll;
    } else {
        currentRoll = {
            number: (rolls.length > 0 ? rolls[rolls.length - 1].number + 1 : 1),
            attributes: []
        };
    }
    
    updateDisplay();
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
            const rolls = JSON.parse(localStorage.getItem(selectedWeapon.id) || '[]');
            
            // If this is the current incomplete roll, reset it
            if (roll.number === currentRoll.number) {
                currentRoll = {
                    number: roll.number,
                    attributes: []
                };
            }
            
            // Remove the roll and save
            const updatedRolls = rolls.filter(r => r.number !== roll.number);
            localStorage.setItem(selectedWeapon.id, JSON.stringify(updatedRolls));
            
            updateDisplay();
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

function saveRoll() {
    const rolls = JSON.parse(localStorage.getItem(selectedWeapon.id) || '[]');
    rolls.push(currentRoll);
    localStorage.setItem(selectedWeapon.id, JSON.stringify(rolls));
}

function updateRollInStorage(rollNumber, position, attribute) {
    const rolls = JSON.parse(localStorage.getItem(selectedWeapon.id) || '[]');
    const roll = rolls.find(r => r.number === rollNumber);
    if (roll) {
        roll.attributes[position] = attribute;
        localStorage.setItem(selectedWeapon.id, JSON.stringify(rolls));
    }
}

function saveIncompleteRoll() {
    if (!selectedWeapon || !currentRoll.attributes.length) return;
    
    const rolls = JSON.parse(localStorage.getItem(selectedWeapon.id) || '[]');
    const existingRollIndex = rolls.findIndex(r => r.number === currentRoll.number);
    
    if (existingRollIndex >= 0) {
        rolls[existingRollIndex] = currentRoll;
    } else {
        rolls.push(currentRoll);
    }
    
    localStorage.setItem(selectedWeapon.id, JSON.stringify(rolls));
}

// Add this code at the end of the file

document.getElementById('delete-weapon').addEventListener('click', function() {
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
        // Second click - perform deletion
        localStorage.removeItem(selectedWeapon.id);
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

document.getElementById('delete-all').addEventListener('click', function() {
    if (this.classList.contains('confirm')) {
        // Second click - perform deletion
        localStorage.clear();
        currentRoll = {
            number: 1,
            attributes: []
        };
        selectedWeapon = null;
        updateDisplay();
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