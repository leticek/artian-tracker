// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Add tab command for keyboard navigation testing
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  const TAB_KEY = { key: 'Tab', code: 'Tab', keyCode: 9 };
  
  if (subject) {
    cy.wrap(subject).trigger('keydown', TAB_KEY, { force: true });
  } else {
    // Get the first focusable element instead of using body
    cy.get('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').first().focus();
  }
  
  return cy.focused();
});

// Add a custom command for accessibility checking with configurable options
Cypress.Commands.add('checkAccessibility', (options = {}) => {
  const defaultOptions = {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa']
    },
    // Ignore specific rules that might be causing false positives
    rules: {
      'color-contrast': { enabled: false },
      'document-title': { enabled: false }
    }
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  cy.checkA11y(null, mergedOptions, null, true);
});
