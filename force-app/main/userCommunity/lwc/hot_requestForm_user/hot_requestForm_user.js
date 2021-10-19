import { LightningElement, track, api } from 'lwc';

export default class Hot_requestForm_user extends LightningElement {
    @api fieldValues = {
        UserName__c: '',
        UserPersonNumber__c: ''
    };

    @track isPersonNumberValid = true;
    checkPersonNumber() {
        let inputComponent = this.template.querySelector('.personNumber');
        this.fieldValues.UserPersonNumber__c = inputComponent.value;
        let regExp = RegExp('[0-7][0-9][0-1][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]');
        this.isPersonNumberValid = regExp.test(inputComponent.value);
    }
    reportValidityPersonNumberField() {
        let inputComponent = this.template.querySelector('.personNumber');
        if (!this.isPersonNumberValid) {
            inputComponent.setCustomValidity('Fødselsnummeret er ikke gyldig');
            inputComponent.focus();
        } else {
            inputComponent.setCustomValidity('');
        }
        inputComponent.reportValidity();
    }

    @api
    validateFields() {}
}
