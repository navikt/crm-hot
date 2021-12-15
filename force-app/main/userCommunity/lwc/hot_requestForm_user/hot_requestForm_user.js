import { LightningElement, track, api } from 'lwc';
export default class Hot_requestForm_user extends LightningElement {
    @api isEditOrCopyMode = false;
    @track fieldValues = {
        UserName__c: '',
        UserPersonNumber__c: '',
        UserPhone__c: ''
    };

    isBirthdate = true;
    @track componentValues = {
        birthdateAndPhoneRadiobuttons: [
            { label: 'Tolkbrukers fødselsnummer', value: 'birthdate', checked: true },
            { label: 'Tolkbrukers telefonnummer', value: 'phone' }
        ]
    };

    handleBirthdateOrPhone(event) {
        if (this.componentValues.birthdateAndPhoneRadiobuttons !== event.detail) {
            this.resetRadiobuttonFieldValues();
        }
        this.componentValues.birthdateAndPhoneRadiobuttons = event.detail;
        this.isBirthdate = this.componentValues.birthdateAndPhoneRadiobuttons[0].checked;
    }

    resetRadiobuttonFieldValues() {
        this.fieldValues.UserPersonNumber__c = '';
        this.fieldValues.UserPhone__c = '';
    }

    setRadiobuttonsOnConnected() {
        this.componentValues.birthdateAndPhoneRadiobuttons[0].checked = false;
        this.componentValues.birthdateAndPhoneRadiobuttons[1].checked = false;
        if (this.fieldValues.UserPhone__c !== '') {
            this.componentValues.birthdateAndPhoneRadiobuttons[1].checked = true;
        } else {
            this.componentValues.birthdateAndPhoneRadiobuttons[0].checked = true;
        }
        this.isBirthdate = this.componentValues.birthdateAndPhoneRadiobuttons[0].checked;
        if (this.isEditOrCopyMode) {
            this.componentValues.birthdateAndPhoneRadiobuttons[0].disabled = true;
            this.componentValues.birthdateAndPhoneRadiobuttons[1].disabled = true;
        }
    }

    @api
    setFieldValues() {
        this.template.querySelectorAll('c-input').forEach((element) => {
            this.fieldValues[element.name] = element.getValue();
        });
    }

    @api
    validateFields() {
        let hasErrors = 0;
        this.template.querySelectorAll('c-input').forEach((element) => {
            if (element.validationHandler()) {
                hasErrors += 1;
            }
        });

        hasErrors += this.isBirthdate
            ? this.template.querySelectorAll('c-input')[1].validatePersonNumber()
            : this.template
                  .querySelectorAll('c-input')[1]
                  .validatePhoneLength('Telefonnummer må være 8 siffer langt (ingen landskode).');
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
        this.setRadiobuttonsOnConnected();
    }
}
