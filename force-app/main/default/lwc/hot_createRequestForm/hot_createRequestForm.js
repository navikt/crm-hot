import { LightningElement, wire, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import ACCOUNT_ID from '@salesforce/schema/User.AccountId';


export default class RecordFormCreateExample extends NavigationMixin(LightningElement) {

	@track reRender = 0;

	@track submitted = false;

	/*
		@wire(getRecord, {
			recordId: USER_ID,
			fields: [ACCOUNT_ID]
		}) UserId
		AccountId = UserId.AccountId;
	*/

	@track sameLocation = true;
	value = 'yes';
	get options() {
		return [
			{ label: 'Ja', value: 'yes' },
			{ label: 'Nei', value: 'no' },
		];
	}

	@track error;
	@track startTime;
	@track fieldValues = { Name: "", Subject__c: "", StartTime__c: "", EndTime__c: "", MeetingStreet__c: "", MeetingPostalCity__c: "", MeetingPostalCode__c: "", Description__C: "" };
	handleChange(event) {
		if (this.startTime == null) {
			this.startTime = event.detail.value;
		}
	}

	validateForm(event) {

		const allValid = this.template.querySelectorAll('lightning-input-field').reportValidity();


		console.log(JSON.stringify(allValid));
		if (allValid) {
			alert('All form entries look valid. Ready to submit!');
		} else {
			alert('Please update the invalid form entries and try again.');
		}
	}

	handleSubmit(event) {
		//this.validateForm(event);
		event.preventDefault();


		const fields = event.detail.fields;
		if (this.sameLocation) {
			fields.InterpretationStreet__c = fields.MeetingStreet__c;
			fields.InterpretationPostalCode__c = fields.MeetingPostalCode__c;
			fields.InterpretationPostalCity__c = fields.MeetingPostalCity__c;
		}
		console.log(JSON.stringify(fields));
		this.template.querySelector('lightning-record-edit-form').submit(fields);
	}

	handleError(event) {

	}

	handleSuccess(event) {
		this.submitted = !this.submitted;
	}

	toggled() {
		this.sameLocation = !this.sameLocation;
	}

	handleBack(event) {
		this.submitted = false;
	}

	previousPage;
	connectedCallback() {
		let testURL = window.location.href;
		let newURL = new URL(testURL).searchParams;
		if (JSON.parse(newURL.get("fromList")) != null) {
			this.previousPage = 'mine-bestillinger'
		}
		else {
			this.previousPage = 'home'
		}
		if (JSON.parse(newURL.get("fieldValues")) != null) {
			this.fieldValues = JSON.parse(newURL.get("fieldValues"));
			this.sameLocation = this.fieldValues.MeetingStreet__c == this.fieldValues.InterpretationStreet__c;
		}
	}

	//Navigation functions
	goToMyRequests() {
		this[NavigationMixin.Navigate]({
			type: 'comm__namedPage',
			attributes: {
				pageName: 'mine-bestillinger'
			}
		});
	}

	goHome() {
		this[NavigationMixin.Navigate]({
			type: 'comm__namedPage',
			attributes: {
				pageName: this.previousPage,
			}
		});
	}
}