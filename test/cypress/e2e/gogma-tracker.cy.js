describe('Gogma Roll Tracker', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearLocalStorage()
  })

  describe('Tab Navigation', () => {
    it('should have both Artian and Gogma tabs', () => {
      cy.get('[data-tab="artian"]').should('exist').and('contain', 'Artian')
      cy.get('[data-tab="gogma"]').should('exist').and('contain', 'Gogma')
    })

    it('should show Artian content by default', () => {
      cy.get('#artian-content').should('have.class', 'active')
      cy.get('#gogma-content').should('not.have.class', 'active')
    })

    it('should switch to Gogma tab when clicked', () => {
      cy.get('[data-tab="gogma"]').click()

      cy.get('[data-tab="gogma"]').should('have.class', 'active')
      cy.get('[data-tab="artian"]').should('not.have.class', 'active')
      cy.get('#gogma-content').should('have.class', 'active')
      cy.get('#artian-content').should('not.have.class', 'active')
    })

    it('should preserve weapon selection when switching tabs', () => {
      // Select a weapon
      cy.get('[data-weapon-id="bow"]').click()
      cy.get('[data-weapon-id="bow"]').should('have.class', 'selected')

      // Switch to Gogma tab
      cy.get('[data-tab="gogma"]').click()

      // Weapon should still be selected
      cy.get('[data-weapon-id="bow"]').should('have.class', 'selected')

      // Switch back to Artian
      cy.get('[data-tab="artian"]').click()
      cy.get('[data-weapon-id="bow"]').should('have.class', 'selected')
    })
  })

  describe('Gogma Skill Buttons', () => {
    beforeEach(() => {
      cy.get('[data-tab="gogma"]').click()
    })

    it('should display group skills section', () => {
      cy.get('#gogma-skill-buttons').should('exist')
      cy.contains('Group Skills').should('exist')
    })

    it('should display set bonus skills section', () => {
      cy.contains('Set Bonus Skills').should('exist')
    })

    it('should have 4 group skill buttons', () => {
      cy.get('[data-skill-id="lords-soul"]').should('exist')
      cy.get('[data-skill-id="lords-fury"]').should('exist')
      cy.get('[data-skill-id="fortifying-pelt"]').should('exist')
      cy.get('[data-skill-id="guardians-pulse"]').should('exist')
    })

    it('should have 18 set bonus skill buttons', () => {
      cy.get('[data-skill-id="gore-magala"]').should('exist')
      cy.get('[data-skill-id="mizutsune"]').should('exist')
      cy.get('[data-skill-id="rey-dau"]').should('exist')
    })

    it('should show error when clicking skill without weapon selected', () => {
      cy.get('[data-skill-id="lords-soul"]').click()
      cy.get('[data-skill-id="lords-soul"]').should('have.class', 'error')
    })
  })

  describe('Gogma Roll Creation', () => {
    beforeEach(() => {
      cy.get('[data-tab="gogma"]').click()
      cy.get('[data-weapon-id="bow"]').click()
    })

    it('should create a roll with group skill and set bonus', () => {
      cy.get('[data-skill-id="lords-soul"]').click()
      cy.get('[data-skill-id="gore-magala"]').click()

      // Should display the roll in the table
      cy.get('#gogma-rolls-body tr').should('have.length', 1)
      cy.get('#gogma-rolls-body tr:first-child').within(() => {
        cy.get('td').eq(1).should('contain', "Lord's Soul")
        cy.get('td').eq(2).should('contain', "Gore Magala's Tyranny")
      })
    })

    it('should replace group skill when selecting another group skill', () => {
      cy.get('[data-skill-id="lords-soul"]').click()
      cy.get('[data-skill-id="lords-fury"]').click() // Replace with another group skill

      cy.get('#gogma-rolls-body tr:first-child').within(() => {
        cy.get('td').eq(1).should('contain', "Lord's Fury")
      })
    })

    it('should create multiple rolls', () => {
      // First roll
      cy.get('[data-skill-id="lords-soul"]').click()
      cy.get('[data-skill-id="gore-magala"]').click()

      // Second roll
      cy.get('[data-skill-id="lords-fury"]').click()
      cy.get('[data-skill-id="mizutsune"]').click()

      cy.get('#gogma-rolls-body tr').should('have.length', 2)
    })

    it('should apply correct color classes', () => {
      cy.get('[data-skill-id="lords-soul"]').click() // Red
      cy.get('[data-skill-id="mizutsune"]').click() // Green

      cy.get('#gogma-rolls-body tr:first-child').within(() => {
        cy.get('td').eq(1).should('have.class', 'gogma-red')
        cy.get('td').eq(2).should('have.class', 'gogma-green')
      })
    })
  })

  describe('Gogma Roll Editing', () => {
    beforeEach(() => {
      cy.get('[data-tab="gogma"]').click()
      cy.get('[data-weapon-id="bow"]').click()
      // Create a roll
      cy.get('[data-skill-id="lords-soul"]').click()
      cy.get('[data-skill-id="gore-magala"]').click()
    })

    it('should allow clicking on a cell to select it', () => {
      cy.get('#gogma-rolls-body tr:first-child td[data-slot-type="group"]').click()
      cy.get('#gogma-rolls-body tr:first-child td[data-slot-type="group"]').should('have.class', 'selected')
    })

    it('should update cell when selecting a new skill of same class', () => {
      cy.get('#gogma-rolls-body tr:first-child td[data-slot-type="group"]').click()
      cy.get('[data-skill-id="lords-fury"]').click()

      cy.get('#gogma-rolls-body tr:first-child td[data-slot-type="group"]').should('contain', "Lord's Fury")
    })

    it('should not update cell when selecting wrong skill class', () => {
      cy.get('#gogma-rolls-body tr:first-child td[data-slot-type="group"]').click()
      cy.get('[data-skill-id="mizutsune"]').click() // This is a set bonus, not group

      // Should still show original value
      cy.get('#gogma-rolls-body tr:first-child td[data-slot-type="group"]').should('contain', "Lord's Soul")
    })
  })

  describe('Gogma Roll Deletion', () => {
    beforeEach(() => {
      cy.get('[data-tab="gogma"]').click()
      cy.get('[data-weapon-id="bow"]').click()
      // Create two rolls
      cy.get('[data-skill-id="lords-soul"]').click()
      cy.get('[data-skill-id="gore-magala"]').click()
      cy.get('[data-skill-id="lords-fury"]').click()
      cy.get('[data-skill-id="mizutsune"]').click()
    })

    it('should enter delete mode on first click of number cell', () => {
      cy.get('#gogma-rolls-body tr:first-child .number-cell').click()
      cy.get('#gogma-rolls-body tr:first-child .number-cell').should('have.class', 'delete-mode')
      cy.get('#gogma-rolls-body tr:first-child .number-cell').should('contain', 'Delete')
    })

    it('should delete row on second click', () => {
      cy.get('#gogma-rolls-body tr:first-child .number-cell').click()
      cy.get('#gogma-rolls-body tr:first-child .number-cell').click()

      cy.get('#gogma-rolls-body tr').should('have.length', 1)
    })
  })

  describe('Gogma Delete Weapon Data', () => {
    beforeEach(() => {
      cy.get('[data-tab="gogma"]').click()
      cy.get('[data-weapon-id="bow"]').click()
      cy.get('[data-skill-id="lords-soul"]').click()
      cy.get('[data-skill-id="gore-magala"]').click()
    })

    it('should require confirmation to delete weapon data', () => {
      cy.get('#gogma-delete-weapon').click()
      cy.get('#gogma-delete-weapon').should('have.class', 'confirm')
    })

    it('should delete gogma data on confirmation', () => {
      cy.get('#gogma-delete-weapon').click()
      cy.get('#gogma-delete-weapon').click()

      cy.get('#gogma-rolls-body').should('be.empty')
    })
  })

  describe('Gogma Sort Toggle', () => {
    beforeEach(() => {
      cy.get('[data-tab="gogma"]').click()
      cy.get('[data-weapon-id="bow"]').click()
      // Create multiple rolls
      cy.get('[data-skill-id="lords-soul"]').click()
      cy.get('[data-skill-id="gore-magala"]').click()
      cy.get('[data-skill-id="lords-fury"]').click()
      cy.get('[data-skill-id="mizutsune"]').click()
      cy.get('[data-skill-id="fortifying-pelt"]').click()
      cy.get('[data-skill-id="doshaguma"]').click()
    })

    it('should toggle sort direction on click', () => {
      cy.get('#gogma-sort-direction').should('contain', 'Ascending')

      cy.get('#gogma-sort-toggle').click()
      cy.get('#gogma-sort-direction').should('contain', 'Descending')

      cy.get('#gogma-sort-toggle').click()
      cy.get('#gogma-sort-direction').should('contain', 'Ascending')
    })

    it('should display rolls in correct order', () => {
      // Ascending - first roll should be #1
      cy.get('#gogma-rolls-body tr:first-child .number-cell').should('contain', '1')

      // Switch to descending
      cy.get('#gogma-sort-toggle').click()

      // First row should now be #3
      cy.get('#gogma-rolls-body tr:first-child .number-cell').should('contain', '3')
    })
  })

  describe('Data Persistence', () => {
    it('should persist gogma data in localStorage', () => {
      cy.get('[data-tab="gogma"]').click()
      cy.get('[data-weapon-id="bow"]').click()
      cy.get('[data-skill-id="lords-soul"]').click()
      cy.get('[data-skill-id="gore-magala"]').click()

      cy.window().then((win) => {
        const data = JSON.parse(win.localStorage.getItem('bow'))
        expect(data.gogma[0].groupSkill).to.equal('lords-soul')
        expect(data.gogma[0].setBonus).to.equal('gore-magala')
      })
    })

    it('should preserve artian data when modifying gogma data', () => {
      // Add artian data first
      cy.get('[data-weapon-id="bow"]').click()
      cy.get('[data-attribute-id="attack-I"]').click()
      cy.get('[data-attribute-id="affinity-I"]').click()

      // Switch to gogma and add data
      cy.get('[data-tab="gogma"]').click()
      cy.get('[data-skill-id="lords-soul"]').click()
      cy.get('[data-skill-id="gore-magala"]').click()

      // Verify both are preserved
      cy.window().then((win) => {
        const data = JSON.parse(win.localStorage.getItem('bow'))
        expect(data.artian[0].attributes).to.include('attack-I')
        expect(data.gogma[0].groupSkill).to.equal('lords-soul')
      })
    })
  })
})
