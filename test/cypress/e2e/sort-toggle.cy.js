describe('Sort Toggle Feature', () => {
  beforeEach(() => {
    // Clear localStorage and visit the app
    cy.clearLocalStorage();
    cy.visit('/');
    
    // Setup test data - select weapon and add some rolls
    cy.window().then((win) => {
      // Add some dummy attributes to localStorage
      win.localStorage.setItem('attributes', JSON.stringify([
        { id: 'attack', name: 'Attack', icon: 'path/to/attack.png' },
        { id: 'element', name: 'Element', icon: 'path/to/element.png' },
        { id: 'sharpness', name: 'Sharpness', icon: 'path/to/sharpness.png' }
      ]));
      
      // Dispatch a weapon selection event
      const weaponSelectedEvent = new CustomEvent('weaponSelected', {
        detail: { id: 'test-weapon', name: 'Test Weapon' }
      });
      win.document.dispatchEvent(weaponSelectedEvent);
      
      // Add test rolls
      win.localStorage.setItem('test-weapon', JSON.stringify([
        { number: 1, attributes: ['attack', 'element', 'sharpness', 'attack', 'element'] },
        { number: 2, attributes: ['element', 'attack', 'sharpness', 'element', 'attack'] },
        { number: 3, attributes: ['sharpness', 'element', 'attack', 'element', 'sharpness'] }
      ]));
      
      // Dispatch another event to force a table update
      win.document.dispatchEvent(weaponSelectedEvent);
    });
  });
  
  it('displays sort toggle with initial ascending state', () => {
    cy.get('#sort-toggle').should('exist');
    cy.get('#sort-direction').should('have.text', 'Ascending');
    cy.get('#sort-toggle').should('have.attr', 'data-order', 'ascending');
  });
  
  it('changes sort direction when clicked', () => {
    // Initially ascending
    cy.get('#sort-direction').should('have.text', 'Ascending');
    cy.get('#sort-toggle').should('have.attr', 'data-order', 'ascending');
    
    // Click to change to descending
    cy.get('#sort-toggle').click();
    cy.get('#sort-direction').should('have.text', 'Descending');
    cy.get('#sort-toggle').should('have.attr', 'data-order', 'descending');
    
    // Click again to change back to ascending
    cy.get('#sort-toggle').click();
    cy.get('#sort-direction').should('have.text', 'Ascending');
    cy.get('#sort-toggle').should('have.attr', 'data-order', 'ascending');
  });
  
  it('displays rolls in correct order when toggled', () => {
    // Check initial ascending order (1,2,3)
    cy.get('#rolls-body tr').should('have.length', 3);
    cy.get('#rolls-body tr:nth-child(1) td.number-cell').should('contain', '1');
    cy.get('#rolls-body tr:nth-child(2) td.number-cell').should('contain', '2');
    cy.get('#rolls-body tr:nth-child(3) td.number-cell').should('contain', '3');
    
    // Click to change to descending
    cy.get('#sort-toggle').click();
    
    // Check descending order (3,2,1)
    cy.get('#rolls-body tr').should('have.length', 3);
    cy.get('#rolls-body tr:nth-child(1) td.number-cell').should('contain', '3');
    cy.get('#rolls-body tr:nth-child(2) td.number-cell').should('contain', '2');
    cy.get('#rolls-body tr:nth-child(3) td.number-cell').should('contain', '1');
    
    // Click to change back to ascending
    cy.get('#sort-toggle').click();
    
    // Check ascending order again (1,2,3)
    cy.get('#rolls-body tr').should('have.length', 3);
    cy.get('#rolls-body tr:nth-child(1) td.number-cell').should('contain', '1');
    cy.get('#rolls-body tr:nth-child(2) td.number-cell').should('contain', '2');
    cy.get('#rolls-body tr:nth-child(3) td.number-cell').should('contain', '3');
  });
});
