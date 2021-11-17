import { LightningElement, track, api } from 'lwc';
import { validate, require } from 'c/validationController';

export default class Hot_requestForm_request extends LightningElement {
    @track fieldValues = {
        Subject__c: '',
        StartTime__c: '',
        EndTime__c: '',
        MeetingStreet__c: '',
        MeetingPostalCity__c: '',
        MeetingPostalCode__c: '',
        InterpretationStreet__c: '',
        InterpretationPostalCode__c: '',
        InterpretationPostalCity__c: '',
        Description__c: '',
        IsFileConsent__c: false,
        Source__c: 'Community'
    };
    @api isGetAll;
    @api requestIds;
    @api recordId;
    @api parentFieldValues;
    connectedCallback() {
        for (let field in this.parentFieldValues) {
            if (this.fieldValues[field] != null) {
                this.fieldValues[field] = this.parentFieldValues[field];
            }
        }
        this.sameLocation = this.fieldValues.MeetingStreet__c === this.fieldValues.InterpretationStreet__c;
        if (!this.sameLocation) {
            this.value = 'no';
        }
    }

    @api
    setFieldValues() {
        console.log('setFieldValues request');
        this.template.querySelectorAll('c-input').forEach((element) => {
            this.fieldValues[element.name] = element.getValue();
        });
        console.log('hallo');
        console.log(JSON.stringify(this.fieldValues));
        this.setDependentFields();
    }

    @api
    getFieldValues() {
        return this.fieldValues;
    }

    setDependentFields() {
        this.fieldValues.IsFileConsent__c = this.fileConsent;
        if (this.sameLocation) {
            this.fieldValues.InterpretationStreet__c = this.fieldValues.MeetingStreet__c;
            this.fieldValues.InterpretationPostalCode__c = this.fieldValues.MeetingPostalCode__c;
            this.fieldValues.InterpretationPostalCity__c = this.fieldValues.MeetingPostalCity__c;
        }
    }

    @api
    getTimeInput() {
        return this.template.querySelector('c-hot_recurring-time-input').getTimeInput();
    }

    @api
    handleFileUpload(recordId) {
        if (this.hasFiles) {
            this.template.querySelector('c-upload-files').handleFileUpload(recordId);
        }
    }
    hasFiles = false;
    checkFileDataLength(event) {
        this.hasFiles = event.detail > 0;
        console.log(this.hasFiles);
    }

    attemptedSubmit = false;
    @api
    validateFields() {
        this.attemptedSubmit = true;
        let hasErrors = false;
        this.template.querySelectorAll('.tolk-skjema-input').forEach((element) => {
            if (element.required) {
                hasErrors = hasErrors + validate(element, [require]);
            }
        });
        this.template.querySelectorAll('c-input').forEach((element) => {
            if (element.validationHandler()) {
                hasErrors += 1;
            }
        });
        // TODO: Add textarea component validation here too
        hasErrors = hasErrors + this.validateCheckbox();
        hasErrors = hasErrors + this.template.querySelector('c-hot_recurring-time-input').validateFields();
        return hasErrors;
    }
    validateCheckbox() {
        if (this.hasFiles) {
            return this.template.querySelector('c-upload-files').validateCheckbox();
        }
        return false;
    }
    fileConsent = false;
    getFileConsent(event) {
        this.fileConsent = event.detail;
    }
    checkPostalCode(event) {
        //check postal code ExpReg
        //TODO
    }

    @track sameLocation = true;
    value = 'yes';
    get options() {
        return [
            { label: 'Ja', value: 'yes', checked: true },
            { label: 'Nei', value: 'no' }
        ];
    }
    toggled() {
        this.sameLocation = !this.sameLocation;
    }
}
