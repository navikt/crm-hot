import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.FirstName';
import checkAssignedPermissionSet from '@salesforce/apex/HOT_Utility.checkAssignedPermissionSet'
import isProd from '@salesforce/apex/GlobalCommunityHeaderFooterController.isProd';

export default class Hot_home extends NavigationMixin(LightningElement) {

	//@track isProd = window.location.toString().includes("tolkebestilling.nav.no/");
	@wire(isProd) isProd;


	@track name;
	@track error;
	@wire(getRecord, {
		recordId: USER_ID,
		fields: [NAME_FIELD]
	}) wireuser({
		error,
		data
	}) {
		if (error) {
			this.error = error;
		} else if (data) {
			this.name = data.fields.FirstName.value;

		}
	}


	goToMyRequests(event) {
		console.log("goToMyRequests");
		if (!this.isProd) {
			event.preventDefault();
			console.log("is NOT prod");
			this[NavigationMixin.Navigate]({
				type: 'comm__namedPage',
				attributes: {
					pageName: 'mine-bestillinger'
				}
			});
		}
	}

	goToNewRequest(event) {
		console.log("goToNewRequest");
		if (!this.isProd) {
			event.preventDefault();
			console.log("is NOT prod");
			this[NavigationMixin.Navigate]({
				type: 'comm__namedPage',
				attributes: {
					pageName: 'ny-bestilling'
				},
			});
		}
	}
	goToHome(event) {
		console.log("goToHome");
		if (!this.isProd) {
			event.preventDefault();
			console.log("is NOT prod");
			this[NavigationMixin.Navigate]({
				type: 'comm__namedPage',
				attributes: {
					pageName: 'home'
				},
			});
		}
	}



}
