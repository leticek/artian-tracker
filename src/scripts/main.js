let selectedWeapon = null;
let currentRoll = {
    number: 1,
    attributes: []
};
let selectedAttributeCell = null;

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
    
    const rolls = JSON.parse(localStorage.getItem(selectedWeapon.id) || '[]');
    const tbody = document.getElementById('rolls-body');
    tbody.innerHTML = '';
    
    // Display completed rolls
    rolls.filter(roll => roll.attributes.length === 5).forEach(roll => {
        tbody.appendChild(createRollRow(roll));
    });
    
    // Display current incomplete roll
    if (currentRoll.attributes.length > 0) {
        tbody.appendChild(createRollRow(currentRoll));
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

function createRollRow(roll) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${roll.number}</td>
        ${Array(5).fill().map((_, i) => `
            <td class="attribute-cell" data-roll="${roll.number}" data-position="${i}">
                ${roll.attributes[i] || ''}
            </td>
        `).join('')}
    `;
    
    // Add click listeners to attribute cells
    row.querySelectorAll('.attribute-cell').forEach(cell => {
        cell.addEventListener('click', () => {
            if (selectedAttributeCell) {
                selectedAttributeCell.classList.remove('selected');
            }
            cell.classList.add('selected');
            selectedAttributeCell = cell;
        });
    });
    
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