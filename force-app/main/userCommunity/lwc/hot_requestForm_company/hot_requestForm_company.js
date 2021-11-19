import { LightningElement, track, api } from 'lwc';
import { organizationNumberValidationRules } from './hot_validationRules';
import { validate } from 'c/validationController';

export default class Hot_requestForm_company extends LightningElement {
    @api checkboxValue = false;
    @track fieldValues = {
        OrganizationNumber__c: '',
        InvoiceReference__c: '',
        IsOtherEconomicProvicer__c: false,
        AdditionalInvoiceText__c: ''
    };
    choices = [
        { name: 'Placeholder', label: 'Velg et alternativ', selected: true },
        { name: 'NAV', label: 'NAV betaler' },
        { name: 'Virksomhet', label: 'Virksomhet betaler' }
    ];

    currentPicklistName;
    handlePicklist(event) {
        this.fieldValues.IsOtherEconomicProvicer__c = event.detail.name === 'Virksomhet';
        this.currentPicklistName = event.detail.name;
        this.sendPicklistValue();
    }

    handleUserCheckbox(event) {
        const selectedEvent = new CustomEvent('usercheckboxclicked', {
            detail: event.detail
        });
        this.dispatchEvent(selectedEvent);
    }

    @api
    setFieldValues() {
        this.template.querySelectorAll('c-input').forEach((element) => {
            this.fieldValues[element.name] = element.getValue();
        });
    }

    sendPicklistValue() {
        const selectedEvent = new CustomEvent('getpicklistvalue', {
            detail: this.currentPicklistName
        });
        this.dispatchEvent(selectedEvent);
    }

    setPicklistValue() {
        if (this.picklistValuePreviouslySet === undefined) {
            return;
        }
        this.choices.forEach((element) => {
            element.selected = false;
            if (element.name === this.picklistValuePreviouslySet) {
                element.selected = true;
            }
        });
    }

    attemptedSubmit = false;
    @api
    validateFields() {
        this.attemptedSubmit = true;
        // TODO: Fix org number validation
        let hasErrors = validate(
            this.template.querySelector('[data-id="orgnumber"]'),
            organizationNumberValidationRules
        );
        if (this.template.querySelector('c-picklist').validationHandler()) {
            hasErrors += 1;
        }
        return hasErrors;
    }

    @api
    getFieldValues() {
        return this.fieldValues;
    }

    @api picklistValuePreviouslySet;
    @api parentFieldValues;
    connectedCallback() {
        for (let field in this.parentFieldValues) {
            if (this.fieldValues[field] != null) {
                this.fieldValues[field] = this.parentFieldValues[field];
            }
        }
        this.setPicklistValue();
    }
}
