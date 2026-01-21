document.addEventListener('DOMContentLoaded', () => {
    const importButton = document.getElementById('import-button');
    const exportButton = document.getElementById('export-button');
    const copyButton = document.getElementById('copy-button');
    const downloadButton = document.getElementById('download-button');
    const importData = document.getElementById('import-data');
    const exportData = document.getElementById('export-data');
    const importMessage = document.getElementById('import-message');
    const exportOutputContainer = document.querySelector('.export-output-container');

    if (importButton) {
        importButton.addEventListener('click', handleImport);
    }

    if (exportButton) {
        exportButton.addEventListener('click', handleExport);
    }

    if (copyButton) {
        copyButton.addEventListener('click', copyToClipboard);
    }

    if (downloadButton) {
        downloadButton.addEventListener('click', downloadAsJson);
    }

    // Helper to check if a storage key has existing meaningful data
    function hasExistingData(key) {
        const existing = localStorage.getItem(key);
        if (!existing) return false;
        try {
            const parsed = JSON.parse(existing);
            if (Array.isArray(parsed)) {
                // Standard format - check for rolls with attributes
                return parsed.some(roll => roll.attributes && roll.attributes.length > 0);
            }
            // Gogma config format - check if rolls array has data
            return parsed.rolls && parsed.rolls.some(roll => roll.attributes && roll.attributes.length > 0);
        } catch (e) {
            return false;
        }
    }

    // Import legacy format (no version field - standard data only)
    function importLegacyFormat(dataToImport) {
        let importedCount = 0;
        let skippedCount = 0;
        let importedWeapons = [];

        Object.keys(dataToImport).forEach(weaponId => {
            const weaponData = dataToImport[weaponId];

            try {
                // Validate data structure before importing
                if (!Array.isArray(weaponData)) throw new Error('Weapon data must be an array');

                // Validate each roll in the weapon data
                weaponData.forEach(roll => {
                    if (typeof roll !== 'object') throw new Error('Each roll must be an object');
                    if (typeof roll.number !== 'number') throw new Error('Roll number must be a number');
                    if (!Array.isArray(roll.attributes)) throw new Error('Roll attributes must be an array');
                });

                // Check if weapon already has meaningful data
                if (hasExistingData(weaponId)) {
                    skippedCount++;
                    return;
                }

                // Data is valid, save it
                localStorage.setItem(weaponId, JSON.stringify(weaponData));
                importedCount++;
                importedWeapons.push(weaponId);
            } catch (validationError) {
                console.error(`Invalid data for weapon ${weaponId}:`, validationError);
                skippedCount++;
            }
        });

        return { importedCount, skippedCount, importedWeapons };
    }

    // Import v2 format (has standard and gogma sections)
    function importV2Format(dataToImport) {
        let importedStandard = 0;
        let importedGogma = 0;
        let skippedCount = 0;
        let importedWeapons = [];

        // Import standard data
        if (dataToImport.standard) {
            Object.entries(dataToImport.standard).forEach(([weaponId, rolls]) => {
                try {
                    // Validate rolls array
                    if (!Array.isArray(rolls)) throw new Error('Standard weapon data must be an array');

                    if (hasExistingData(weaponId)) {
                        skippedCount++;
                        return;
                    }

                    localStorage.setItem(weaponId, JSON.stringify(rolls));
                    importedStandard++;
                    importedWeapons.push(weaponId);
                } catch (error) {
                    console.error(`Invalid standard data for ${weaponId}:`, error);
                    skippedCount++;
                }
            });
        }

        // Import gogma data
        if (dataToImport.gogma) {
            Object.entries(dataToImport.gogma).forEach(([weaponId, config]) => {
                try {
                    const key = `gogma-${weaponId}`;

                    if (hasExistingData(key)) {
                        skippedCount++;
                        return;
                    }

                    localStorage.setItem(key, JSON.stringify(config));
                    importedGogma++;
                    importedWeapons.push(key);
                } catch (error) {
                    console.error(`Invalid gogma data for ${weaponId}:`, error);
                    skippedCount++;
                }
            });
        }

        return {
            importedCount: importedStandard + importedGogma,
            importedStandard,
            importedGogma,
            skippedCount,
            importedWeapons
        };
    }

    function handleImport() {
        try {
            const dataToImport = JSON.parse(importData.value);

            if (!dataToImport || typeof dataToImport !== 'object') {
                showImportMessage('Invalid JSON data format. Please check your input.', 'error');
                return;
            }

            let result;

            // Check for version 2 format
            if (dataToImport.version === 2) {
                result = importV2Format(dataToImport);

                if (result.importedCount > 0) {
                    let message = 'Successfully imported: ';
                    const parts = [];
                    if (result.importedStandard > 0) {
                        parts.push(`${result.importedStandard} standard weapon(s)`);
                    }
                    if (result.importedGogma > 0) {
                        parts.push(`${result.importedGogma} Gogma weapon(s)`);
                    }
                    message += parts.join(', ');
                    if (result.skippedCount > 0) {
                        message += `. Skipped ${result.skippedCount} weapon(s) that already had data.`;
                    }
                    showImportMessage(message, 'success');
                    importData.value = '';

                    document.dispatchEvent(new CustomEvent('dataImported', {
                        detail: { importedWeapons: result.importedWeapons }
                    }));
                } else if (result.skippedCount > 0) {
                    showImportMessage(`No data was imported. ${result.skippedCount} weapon(s) were skipped because they already had data.`, 'error');
                } else {
                    showImportMessage('No valid weapon data found to import.', 'error');
                }
            } else {
                // Legacy format (no version field)
                result = importLegacyFormat(dataToImport);

                if (result.importedCount > 0) {
                    const successMessage = `Successfully imported data for ${result.importedCount} weapon(s) (legacy format)` +
                                          (result.skippedCount > 0 ? `, skipped ${result.skippedCount} weapon(s) that already had data.` : '.');
                    showImportMessage(successMessage, 'success');
                    importData.value = '';

                    document.dispatchEvent(new CustomEvent('dataImported', {
                        detail: { importedWeapons: result.importedWeapons }
                    }));
                } else if (result.skippedCount > 0) {
                    showImportMessage(`No data was imported. ${result.skippedCount} weapon(s) were skipped because they already had data.`, 'error');
                } else {
                    showImportMessage('No valid weapon data found to import.', 'error');
                }
            }
        } catch (error) {
            console.error('Import error:', error);
            showImportMessage('Failed to parse the JSON data. Please check your input format.', 'error');
        }
    }

    function handleExport() {
        // Generate export data from localStorage in v2 format
        const exportObj = {
            version: 2,
            exportDate: new Date().toISOString(),
            standard: {},
            gogma: {}
        };

        // Iterate through localStorage to collect all weapon data
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            // Skip non-weapon keys
            if (key === 'tracker-mode') continue;

            try {
                const value = JSON.parse(localStorage.getItem(key));

                if (key.startsWith('gogma-')) {
                    // Gogma data - extract weapon ID and store config
                    const weaponId = key.replace('gogma-', '');
                    // Only include if there's meaningful data
                    if (value && (value.focusType || (value.rolls && value.rolls.length > 0))) {
                        exportObj.gogma[weaponId] = value;
                    }
                } else if (Array.isArray(value) && value.length > 0) {
                    // Standard weapon data (arrays)
                    exportObj.standard[key] = value;
                }
            } catch (e) {
                // Skip any non-JSON values
                console.log(`Skipping non-JSON item: ${key}`);
            }
        }

        // Format the JSON nicely
        exportData.value = JSON.stringify(exportObj, null, 2);
        exportOutputContainer.style.display = 'block';
    }

    function copyToClipboard() {
        exportData.select();
        document.execCommand('copy');
        
        // Visual feedback
        copyButton.classList.add('copied');
        copyButton.textContent = 'Copied!';
        
        setTimeout(() => {
            copyButton.classList.remove('copied');
            copyButton.textContent = 'Copy to Clipboard';
        }, 2000);
    }

    function downloadAsJson() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportData.value);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "weapon-rolls-export.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    function showImportMessage(message, type) {
        importMessage.textContent = message;
        importMessage.className = `message ${type}`;
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                importMessage.className = 'message';
            }, 5000);
        }
    }
});
