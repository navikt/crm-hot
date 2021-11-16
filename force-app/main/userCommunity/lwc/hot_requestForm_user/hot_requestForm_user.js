import { LightningElement, track, api } from 'lwc';
import { personNumberValidationRules } from './hot_validationRules';
import { validate } from 'c/validationController';

export default class Hot_requestForm_user extends LightningElement {
    @track fieldValues = {
        UserName__c: '',
        UserPersonNumber__c: ''
    };

    @api
    setFieldValues() {
        this.template.querySelectorAll('.tolk-skjema-input').forEach((element) => {
            this.fieldValues[element.name] = element.value;
        });
    }

    attemptedSubmit = false;
    @api
    validateFields() {
        this.attemptedSubmit = true;
        let hasErrors = validate(this.template.querySelector('[data-id="personnumber"]'), personNumberValidationRules);
        /*this.template.querySelectorAll('.tolk-skjema-input').forEach((element) => {
            if (element.required) {
                hasErrors = hasErrors + validate(element, [require]);
            }
        });*/
        this.template.querySelectorAll('c-input').forEach((element) => {
            if (element.validationHandler()) {
                hasErrors += 1;
            }
        });
        return hasErrors;
    }

    @api
    getFieldValues() {
        return this.fieldValues;
    }

    @api parentFieldValues;
    connectedCallback() {
        for (let field in this.parentFieldValues) {
            if (this.fieldValues[field] != null) {
                this.fieldValues[field] = this.parentFieldValues[field];
            }
        }
    }

    handleNextButtonClicked() {
        if (!this.validateFields()) {
            const selectedEvent = new CustomEvent('nextbuttonclicked', {
                detail: 'userformcomplete'
            });
            this.dispatchEvent(selectedEvent);
        }
    }

    handleBackButtonClicked() {
        const selectedEvent = new CustomEvent('backbuttonclicked');
        this.dispatchEvent(selectedEvent);
    }
}
