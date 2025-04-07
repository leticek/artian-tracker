describe('Weapon Roll Tracker', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('loads successfully', () => {
    cy.get('#weapon-buttons').should('exist')
    cy.get('#attribute-buttons').should('exist')
  })

  it('should load weapon buttons', () => {
    cy.get('#weapon-buttons button').should('have.length.greaterThan', 0);
  });

  it('should load attribute buttons', () => {
    cy.get('#attribute-buttons button').should('have.length', 4);
  });

  it('should select weapon and show attributes', () => {
    cy.get('[data-weapon-id="bow"]').click();
    cy.get('[data-weapon-id="bow"]').should('have.class', 'selected');
  });

  it('should require weapon selection before attributes', () => {
    cy.get('[data-attribute-id="attack"]').click();
    cy.get('.attribute-btn.error').should('exist');
  });

  it('should allow deleting weapon data', () => {
    cy.get('[data-weapon-id="bow"]').click();
    cy.get('#delete-weapon').click();
    cy.get('#delete-weapon').should('have.class', 'confirm');
    cy.get('#delete-weapon').click();
    cy.get('#rolls-body').should('be.empty');
  });
});