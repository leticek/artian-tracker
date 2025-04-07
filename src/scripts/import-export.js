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

    function handleImport() {
        try {
            const dataToImport = JSON.parse(importData.value);
            
            if (!dataToImport || typeof dataToImport !== 'object') {
                showImportMessage('Invalid JSON data format. Please check your input.', 'error');
                return;
            }

            let importedCount = 0;
            let skippedCount = 0;
            let importedWeapons = []; // Keep track of successfully imported weapons

            Object.keys(dataToImport).forEach(weaponId => {
                // Get the weapon data to be imported
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
                    
                    // Check if weapon already has meaningful data (not just an empty array)
                    const existingData = localStorage.getItem(weaponId);
                    if (existingData) {
                        try {
                            const parsedData = JSON.parse(existingData);
                            // Skip only if there's actual attribute data
                            if (Array.isArray(parsedData) && parsedData.some(roll => roll.attributes.length > 0)) {
                                skippedCount++;
                                return;
                            }
                        } catch (e) {
                            // If parsing fails, treat as if no data exists
                            console.warn(`Failed to parse existing data for ${weaponId}, will overwrite.`, e);
                        }
                    }

                    // Data is valid, save it
                    localStorage.setItem(weaponId, JSON.stringify(weaponData));
                    importedCount++;
                    importedWeapons.push(weaponId); // Add to successful imports list
                } catch (validationError) {
                    console.error(`Invalid data for weapon ${weaponId}:`, validationError);
                    skippedCount++;
                }
            });

            if (importedCount > 0) {
                const successMessage = `Successfully imported data for ${importedCount} weapon(s)` +
                                      (skippedCount > 0 ? `, skipped ${skippedCount} weapon(s) that already had data.` : '.');
                showImportMessage(successMessage, 'success');
                importData.value = ''; // Clear the input
                
                // Custom event to notify the app of new data
                document.dispatchEvent(new CustomEvent('dataImported', {
                    detail: { importedWeapons }
                }));
            } else if (skippedCount > 0) {
                showImportMessage(`No data was imported. ${skippedCount} weapon(s) were skipped because they already had data.`, 'error');
            } else {
                showImportMessage('No valid weapon data found to import.', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            showImportMessage('Failed to parse the JSON data. Please check your input format.', 'error');
        }
    }

    function handleExport() {
        // Generate export data from localStorage
        const exportObj = {};
        
        // Iterate through localStorage to collect all weapon data
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            try {
                const value = JSON.parse(localStorage.getItem(key));
                
                // Only include valid weapon data (arrays)
                if (Array.isArray(value) && value.length > 0) {
                    exportObj[key] = value;
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
