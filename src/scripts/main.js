// Main application logic
(function() {
    // Access globals
    var attributes = window.AttributeData.attributes;
    var GogmaMain = window.GogmaMain;

    // Helper function to get attribute by ID
    function getAttributeById(id) {
        return attributes.find(function(attr) { return attr.id === id; }) || null;
    }

    var selectedWeapon = null;
    var currentRoll = {
        number: 1,
        attributes: []
    };
    var selectedAttributeCell = null;
    var deleteWeaponClickTimeout = null;
    var deleteAllClickTimeout = null;
    var sortAscending = true;
    var errorMessageElement = null;
    var currentGogmaConfig = null;

    // Listen for weapon selection
    document.addEventListener('weaponSelected', function(event) {
        selectedWeapon = event.detail;

        // Show/hide gogma config panel based on mode
        var gogmaConfig = document.getElementById('gogma-config');
        if (gogmaConfig) {
            if (GogmaMain.isGogmaMode()) {
                gogmaConfig.style.display = 'block';
                loadGogmaConfigPanel();
            } else {
                gogmaConfig.style.display = 'none';
            }
        }

        loadWeaponRolls();
    });

    // Listen for data import event
    document.addEventListener('dataImported', function(event) {
        var importedWeapons = (event.detail && event.detail.importedWeapons) || [];

        if (selectedWeapon) {
            var standardKey = selectedWeapon.id;
            var gogmaKey = 'gogma-' + selectedWeapon.id;

            if (importedWeapons.indexOf(standardKey) !== -1 || importedWeapons.indexOf(gogmaKey) !== -1) {
                if (GogmaMain.isGogmaMode()) {
                    loadGogmaConfigPanel();
                }
                loadWeaponRolls();
            }
        }
    });

    // Listen for attribute selection
    document.addEventListener('attributeSelected', function(event) {
        var attribute = event.detail;
        var clickedButton = document.querySelector('.attribute-btn[data-attribute-id="' + attribute.id + '"]');

        if (!selectedWeapon) {
            clickedButton.classList.add('error');
            setTimeout(function() {
                clickedButton.classList.remove('error');
            }, 500);
            return;
        }

        // In Gogma mode, require focus type to be selected first
        if (GogmaMain.isGogmaMode() && currentGogmaConfig && !currentGogmaConfig.focusType) {
            showError('Please select a Focus Type before adding rolls');
            clickedButton.classList.add('error');
            setTimeout(function() {
                clickedButton.classList.remove('error');
            }, 500);
            return;
        }

        // If a cell is selected, update it (but only for complete saved rolls, not the current incomplete roll)
        if (selectedAttributeCell) {
            var rollNumber = parseInt(selectedAttributeCell.dataset.roll);
            var position = parseInt(selectedAttributeCell.dataset.position);

            // For the current incomplete roll, don't edit - fall through to add new attribute
            if (rollNumber === currentRoll.number && currentRoll.attributes.length < 5) {
                selectedAttributeCell.classList.remove('selected');
                selectedAttributeCell = null;
                // Fall through to add new attribute below
            } else if (rollNumber === currentRoll.number) {
                // Only allow editing current roll if it's complete (5 attributes)
                if (GogmaMain.isGogmaMode()) {
                    var existingTier = (currentRoll.attributes[position] && currentRoll.attributes[position].tier) || 'I';
                    currentRoll.attributes[position] = { id: attribute.id, tier: existingTier };
                } else {
                    currentRoll.attributes[position] = attribute.id;
                }
                saveIncompleteRoll();
                selectedAttributeCell.classList.remove('selected');
                selectedAttributeCell = null;
                updateDisplay();
                return;
            } else {
                try {
                    var storageKey = GogmaMain.getStorageKey(selectedWeapon.id);

                    if (GogmaMain.isGogmaMode()) {
                        var config = GogmaMain.initGogmaConfig(selectedWeapon.id);
                        var roll = config.rolls.find(function(r) { return r.number === rollNumber; });

                        if (roll) {
                            var existTier = (roll.attributes[position] && roll.attributes[position].tier) || 'I';
                            roll.attributes[position] = { id: attribute.id, tier: existTier };
                            GogmaMain.saveGogmaConfig(selectedWeapon.id, config);
                        }
                    } else {
                        var rolls = JSON.parse(localStorage.getItem(storageKey) || '[]');
                        var stdRoll = rolls.find(function(r) { return r.number === rollNumber; });

                        if (stdRoll) {
                            stdRoll.attributes[position] = attribute.id;
                            localStorage.setItem(storageKey, JSON.stringify(rolls));
                        }
                    }
                } catch (error) {
                    showError('Error updating roll: ' + error.message);
                }
                selectedAttributeCell.classList.remove('selected');
                selectedAttributeCell = null;
                updateDisplay();
                return;
            }
            // If we reach here, it's the fall-through case for incomplete current roll
            // selectedAttributeCell was already cleared above, continue to add new attribute
        }

        // Add new attribute to current roll
        if (currentRoll.attributes.length < 5) {
            if (GogmaMain.isGogmaMode()) {
                currentRoll.attributes.push({ id: attribute.id, tier: 'I' });
            } else {
                currentRoll.attributes.push(attribute.id);
            }
            saveIncompleteRoll();

            if (currentRoll.attributes.length === 5) {
                currentRoll = {
                    number: currentRoll.number + 1,
                    attributes: []
                };
            }

            updateDisplay();
        }
    });

    function showError(message) {
        if (errorMessageElement) {
            errorMessageElement.textContent = message;
            errorMessageElement.style.display = 'block';
            setTimeout(function() {
                errorMessageElement.style.display = 'none';
            }, 5000);
        } else {
            console.error(message);
        }
    }

    function updateDisplay() {
        if (!selectedWeapon) return;

        updateTableHeaders();

        try {
            var storageKey = GogmaMain.getStorageKey(selectedWeapon.id);
            var rolls;

            if (GogmaMain.isGogmaMode()) {
                var config = GogmaMain.initGogmaConfig(selectedWeapon.id);
                rolls = config.rolls || [];
            } else {
                var storedData = localStorage.getItem(storageKey);
                if (!storedData) {
                    var tbody = document.getElementById('rolls-body');
                    tbody.innerHTML = '';
                    selectedAttributeCell = null;
                    return;
                }

                try {
                    rolls = JSON.parse(storedData);
                } catch (error) {
                    showError('Error loading data for ' + selectedWeapon.name + '. Data may be corrupted.');
                    var tbody = document.getElementById('rolls-body');
                    tbody.innerHTML = '';
                    selectedAttributeCell = null;
                    return;
                }
            }

            rolls = rolls.filter(function(roll) {
                return roll && roll.attributes && roll.attributes.length > 0;
            });

            if (rolls.length === 0) {
                if (!GogmaMain.isGogmaMode()) {
                    localStorage.removeItem(storageKey);
                }
                var tbody = document.getElementById('rolls-body');
                tbody.innerHTML = '';
                selectedAttributeCell = null;
                return;
            }

            var nextNumber = 1;
            rolls.sort(function(a, b) { return a.number - b.number; }).forEach(function(roll) {
                roll.number = nextNumber++;
            });

            if (GogmaMain.isGogmaMode()) {
                var config = GogmaMain.initGogmaConfig(selectedWeapon.id);
                config.rolls = rolls;
                GogmaMain.saveGogmaConfig(selectedWeapon.id, config);
            } else {
                localStorage.setItem(storageKey, JSON.stringify(rolls));
            }

            var tbody = document.getElementById('rolls-body');
            tbody.innerHTML = '';
            selectedAttributeCell = null;

            var displayRolls = rolls.slice();
            if (!sortAscending) {
                displayRolls.sort(function(a, b) { return b.number - a.number; });
            }

            displayRolls.forEach(function(roll) {
                tbody.appendChild(createRollRow(roll));
            });

            if (currentRoll.attributes.length === 0) {
                currentRoll.number = nextNumber;
            }

            var sortToggle = document.getElementById('sort-toggle');
            var sortDirectionEl = document.getElementById('sort-direction');

            if (sortToggle && sortDirectionEl) {
                sortDirectionEl.textContent = sortAscending ? 'Ascending' : 'Descending';
                sortToggle.setAttribute('data-order', sortAscending ? 'ascending' : 'descending');
            }
        } catch (error) {
            showError('Error updating display: ' + error.message);
        }
    }

    function updateTableHeaders() {
        var thead = document.querySelector('#rolls-table thead tr');
        if (!thead) return;

        if (GogmaMain.isGogmaMode()) {
            document.body.classList.add('gogma-mode');
            thead.innerHTML =
                '<th>Num.</th>' +
                '<th>Attr 1</th><th>Tier</th>' +
                '<th>Attr 2</th><th>Tier</th>' +
                '<th>Attr 3</th><th>Tier</th>' +
                '<th>Attr 4</th><th>Tier</th>' +
                '<th>Attr 5</th><th>Tier</th>';
        } else {
            document.body.classList.remove('gogma-mode');
            thead.innerHTML =
                '<th>Num.</th>' +
                '<th>Attribute 1</th>' +
                '<th>Attribute 2</th>' +
                '<th>Attribute 3</th>' +
                '<th>Attribute 4</th>' +
                '<th>Attribute 5</th>';
        }
    }

    function loadWeaponRolls() {
        if (!selectedWeapon) return;

        try {
            var rolls = [];

            if (GogmaMain.isGogmaMode()) {
                currentGogmaConfig = GogmaMain.initGogmaConfig(selectedWeapon.id);
                rolls = currentGogmaConfig.rolls || [];
            } else {
                var storageKey = GogmaMain.getStorageKey(selectedWeapon.id);
                var storedData = localStorage.getItem(storageKey);

                if (storedData) {
                    try {
                        rolls = JSON.parse(storedData);
                    } catch (error) {
                        showError('Error loading data for ' + selectedWeapon.name + '. Data may be corrupted.');
                        return;
                    }
                }
            }

            var incompleteRoll = rolls.find(function(r) { return r.attributes.length < 5; });

            if (incompleteRoll) {
                currentRoll = incompleteRoll;
            } else {
                currentRoll = {
                    number: (rolls.length > 0 ? rolls[rolls.length - 1].number + 1 : 1),
                    attributes: []
                };
            }

            updateTableHeaders();

            if (rolls.length > 0) {
                updateDisplay();
            } else {
                var tbody = document.getElementById('rolls-body');
                tbody.innerHTML = '';
                selectedAttributeCell = null;
            }
        } catch (error) {
            showError('Error loading weapon data: ' + error.message);
        }
    }

    function createRollRow(roll) {
        var row = document.createElement('tr');

        var numberCell = document.createElement('td');
        numberCell.className = 'number-cell';
        numberCell.textContent = roll.number;

        numberCell.addEventListener('click', function() {
            var allNumberCells = document.querySelectorAll('.number-cell');

            if (numberCell.classList.contains('delete-mode')) {
                try {
                    if (roll.number === currentRoll.number) {
                        currentRoll = {
                            number: roll.number,
                            attributes: []
                        };
                    }

                    if (GogmaMain.isGogmaMode()) {
                        var config = GogmaMain.initGogmaConfig(selectedWeapon.id);
                        config.rolls = config.rolls.filter(function(r) { return r.number !== roll.number; });
                        GogmaMain.saveGogmaConfig(selectedWeapon.id, config);
                    } else {
                        var storageKey = GogmaMain.getStorageKey(selectedWeapon.id);
                        var rolls = JSON.parse(localStorage.getItem(storageKey) || '[]');
                        var updatedRolls = rolls.filter(function(r) { return r.number !== roll.number; });
                        localStorage.setItem(storageKey, JSON.stringify(updatedRolls));
                    }

                    updateDisplay();
                } catch (error) {
                    showError('Error deleting roll: ' + error.message);
                }
            } else {
                allNumberCells.forEach(function(cell) {
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

        for (var i = 0; i < 5; i++) {
            var cell = document.createElement('td');
            cell.className = 'attribute-cell';
            cell.setAttribute('data-roll', roll.number);
            cell.setAttribute('data-position', i);

            var attributeId = null;
            var tier = null;

            if (GogmaMain.isGogmaMode()) {
                var attrData = roll.attributes[i];
                if (attrData) {
                    attributeId = attrData.id;
                    tier = attrData.tier || 'I';
                }
            } else {
                attributeId = roll.attributes[i] || null;
            }

            if (attributeId) {
                var attribute = getAttributeById(attributeId);
                if (attribute) {
                    var content = document.createElement('div');
                    content.className = 'attribute-content';
                    content.innerHTML =
                        '<img src="' + attribute.icon + '" alt="' + attribute.name + '" onerror="this.style.display=\'none\'">' +
                        '<span>' + attribute.name + '</span>';
                    cell.appendChild(content);
                }
            }

            (function(cellRef) {
                cellRef.addEventListener('click', function() {
                    if (selectedAttributeCell) {
                        selectedAttributeCell.classList.remove('selected');
                    }
                    cellRef.classList.add('selected');
                    selectedAttributeCell = cellRef;
                });
            })(cell);

            row.appendChild(cell);

            if (GogmaMain.isGogmaMode()) {
                var tierCell = document.createElement('td');
                tierCell.className = 'tier-cell';

                if (attributeId) {
                    var tierSelect = document.createElement('select');
                    tierSelect.className = 'tier-select';
                    tierSelect.setAttribute('data-roll', roll.number);
                    tierSelect.setAttribute('data-position', i);

                    // Get available tiers for this attribute (filter out null values)
                    var attrTierValues = window.GogmaData.tierValues[attributeId] || {};
                    var availableTiers = GogmaMain.reinforcementTiers.filter(function(t) {
                        return attrTierValues[t] !== null && attrTierValues[t] !== undefined;
                    });

                    // If saved tier is not valid for this attribute, use first available tier
                    var selectedTier = tier;
                    if (availableTiers.indexOf(tier) === -1 && availableTiers.length > 0) {
                        selectedTier = availableTiers[0];
                    }

                    availableTiers.forEach(function(t) {
                        var option = document.createElement('option');
                        option.value = t;
                        option.textContent = t;
                        if (selectedTier === t) {
                            option.selected = true;
                        }
                        tierSelect.appendChild(option);
                    });

                    tierSelect.addEventListener('change', function(e) {
                        var newTier = e.target.value;
                        var rollNum = parseInt(e.target.getAttribute('data-roll'));
                        var pos = parseInt(e.target.getAttribute('data-position'));

                        if (rollNum === currentRoll.number) {
                            if (currentRoll.attributes[pos]) {
                                currentRoll.attributes[pos].tier = newTier;
                                saveIncompleteRoll();
                            }
                        } else {
                            GogmaMain.updateGogmaTier(selectedWeapon.id, rollNum, pos, newTier);
                        }
                    });

                    tierCell.appendChild(tierSelect);
                }

                row.appendChild(tierCell);
            }
        }

        return row;
    }

    function saveIncompleteRoll() {
        if (!selectedWeapon || !currentRoll.attributes.length) return;

        try {
            if (GogmaMain.isGogmaMode()) {
                var config = GogmaMain.initGogmaConfig(selectedWeapon.id);
                var rolls = config.rolls || [];

                var existingRollIndex = rolls.findIndex(function(r) { return r.number === currentRoll.number; });

                if (existingRollIndex >= 0) {
                    rolls[existingRollIndex] = currentRoll;
                } else {
                    rolls.push(currentRoll);
                }

                config.rolls = rolls;
                GogmaMain.saveGogmaConfig(selectedWeapon.id, config);
            } else {
                var storageKey = GogmaMain.getStorageKey(selectedWeapon.id);
                var storedData = localStorage.getItem(storageKey);
                var rolls = storedData ? JSON.parse(storedData) : [];

                var existingRollIndex = rolls.findIndex(function(r) { return r.number === currentRoll.number; });

                if (existingRollIndex >= 0) {
                    rolls[existingRollIndex] = currentRoll;
                } else {
                    rolls.push(currentRoll);
                }

                if (rolls.some(function(roll) { return roll.attributes.length > 0; })) {
                    localStorage.setItem(storageKey, JSON.stringify(rolls));
                }
            }
        } catch (error) {
            showError('Error saving roll: ' + error.message);
        }
    }

    function loadGogmaConfigPanel() {
        if (!selectedWeapon) return;

        currentGogmaConfig = GogmaMain.initGogmaConfig(selectedWeapon.id);

        var focusButtonsContainer = document.getElementById('focus-buttons');
        var setBonusSelect = document.getElementById('set-bonus-select');
        var groupSkillSelect = document.getElementById('group-skill-select');

        if (focusButtonsContainer) {
            GogmaMain.populateFocusButtons(focusButtonsContainer, currentGogmaConfig.focusType, function(focusId) {
                if (currentGogmaConfig.focusType && currentGogmaConfig.rolls && currentGogmaConfig.rolls.length > 0) {
                    if (!confirm('Changing focus type will not affect existing rolls. Continue?')) {
                        return;
                    }
                }

                currentGogmaConfig.focusType = focusId;
                GogmaMain.saveGogmaConfig(selectedWeapon.id, currentGogmaConfig);

                focusButtonsContainer.querySelectorAll('.focus-btn').forEach(function(btn) {
                    btn.classList.toggle('selected', btn.getAttribute('data-focus') === focusId);
                });
            });
        }

        if (setBonusSelect && groupSkillSelect) {
            GogmaMain.populateSkillDropdowns(setBonusSelect, groupSkillSelect, currentGogmaConfig, function(field, value) {
                currentGogmaConfig[field] = value;
                GogmaMain.saveGogmaConfig(selectedWeapon.id, currentGogmaConfig);
            });
        }
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        errorMessageElement = document.getElementById('error-message');

        var savedMode = GogmaMain.loadSavedMode();
        var modeStandard = document.getElementById('mode-standard');
        var modeGogma = document.getElementById('mode-gogma');
        var gogmaConfig = document.getElementById('gogma-config');

        if (savedMode && modeGogma && modeStandard) {
            modeGogma.classList.add('selected');
            modeStandard.classList.remove('selected');
        }

        if (modeStandard) {
            modeStandard.addEventListener('click', function() {
                GogmaMain.setGogmaMode(false);
                modeStandard.classList.add('selected');
                modeGogma.classList.remove('selected');
                if (gogmaConfig) {
                    gogmaConfig.style.display = 'none';
                }
                updateTableHeaders();
                if (selectedWeapon) {
                    loadWeaponRolls();
                }
            });
        }

        if (modeGogma) {
            modeGogma.addEventListener('click', function() {
                GogmaMain.setGogmaMode(true);
                modeGogma.classList.add('selected');
                modeStandard.classList.remove('selected');
                if (selectedWeapon && gogmaConfig) {
                    gogmaConfig.style.display = 'block';
                    loadGogmaConfigPanel();
                }
                updateTableHeaders();
                if (selectedWeapon) {
                    loadWeaponRolls();
                }
            });
        }

        var deleteWeaponBtn = document.getElementById('delete-weapon');
        if (deleteWeaponBtn) {
            deleteWeaponBtn.addEventListener('click', function() {
                var btn = this;
                if (!selectedWeapon) {
                    btn.classList.add('error');
                    btn.textContent = 'Select a weapon first';
                    setTimeout(function() {
                        btn.classList.remove('error');
                        btn.textContent = 'Delete Weapon Data';
                    }, 2000);
                    return;
                }

                if (btn.classList.contains('confirm')) {
                    var storageKey = GogmaMain.getStorageKey(selectedWeapon.id);
                    localStorage.removeItem(storageKey);

                    currentRoll = {
                        number: 1,
                        attributes: []
                    };

                    if (GogmaMain.isGogmaMode()) {
                        currentGogmaConfig = {
                            focusType: null,
                            setBonusSkill: null,
                            groupSkill: null,
                            rolls: []
                        };
                        loadGogmaConfigPanel();
                    }

                    updateDisplay();
                    btn.classList.remove('confirm');
                    btn.textContent = 'Delete Weapon Data';
                    if (deleteWeaponClickTimeout) {
                        clearTimeout(deleteWeaponClickTimeout);
                    }
                } else {
                    btn.classList.add('confirm');
                    btn.textContent = 'Click again to delete ' + selectedWeapon.name;
                    deleteWeaponClickTimeout = setTimeout(function() {
                        btn.classList.remove('confirm');
                        btn.textContent = 'Delete Weapon Data';
                    }, 3000);
                }
            });
        }

        var deleteAllBtn = document.getElementById('delete-all');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', function() {
                var btn = this;
                if (btn.classList.contains('confirm')) {
                    localStorage.clear();

                    currentRoll = {
                        number: 1,
                        attributes: []
                    };

                    currentGogmaConfig = null;

                    var tbody = document.getElementById('rolls-body');
                    tbody.innerHTML = '';
                    selectedAttributeCell = null;

                    if (GogmaMain.isGogmaMode() && selectedWeapon) {
                        loadGogmaConfigPanel();
                    }

                    btn.classList.remove('confirm');
                    btn.textContent = 'Delete All Data';
                    if (deleteAllClickTimeout) {
                        clearTimeout(deleteAllClickTimeout);
                    }
                } else {
                    btn.classList.add('confirm');
                    btn.textContent = 'Click again to delete ALL data';
                    deleteAllClickTimeout = setTimeout(function() {
                        btn.classList.remove('confirm');
                        btn.textContent = 'Delete All Data';
                    }, 3000);
                }
            });
        }

        var sortToggle = document.getElementById('sort-toggle');
        if (sortToggle) {
            sortToggle.addEventListener('click', function() {
                sortAscending = !sortAscending;

                var sortDirectionEl = document.getElementById('sort-direction');
                if (sortDirectionEl) {
                    sortDirectionEl.textContent = sortAscending ? 'Ascending' : 'Descending';
                }

                this.setAttribute('data-order', sortAscending ? 'ascending' : 'descending');
                updateDisplay();
            });
        }
    });
})();
