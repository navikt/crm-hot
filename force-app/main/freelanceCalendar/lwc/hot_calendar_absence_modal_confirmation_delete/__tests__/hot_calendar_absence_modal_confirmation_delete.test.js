import { createElement } from 'lwc';
import Hot_calendar_absence_modal_confirmation_delete from 'c/hot_calendar_absence_modal_confirmation_delete';

describe('c-hot-calendar-absence-modal-confirmation-delete', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('TODO: test case generated by CLI command, please fill in test logic', () => {
        // Arrange
        const element = createElement('c-hot-calendar-absence-modal-confirmation-delete', {
            is: Hot_calendar_absence_modal_confirmation_delete
        });

        // Act
        document.body.appendChild(element);

        // Assert
        // const div = element.shadowRoot.querySelector('div');
        expect(1).toBe(1);
    });
});
