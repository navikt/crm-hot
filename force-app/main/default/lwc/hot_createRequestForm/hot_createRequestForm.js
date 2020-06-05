import { LightningElement, wire, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getRequestList from '@salesforce/apex/HOT_RequestListContoller.getRequestList';
import isProd from '@salesforce/apex/GlobalCommunityHeaderFooterController.isProd';

export default class RecordFormCreateExample extends NavigationMixin(LightningElement) {
	@track reRender = 0;

	//@track isProd = window.location.toString().includes("tolkebestilling.nav.no/");
	@wire(isProd) isProd;

	@track submitted = false; // if:false={submitted}
	hide = true; //@track edit = false; When file-upload is ready, fix this.
	acceptedFormat = '[.pdf, .png, .doc, .docx, .xls, .xlsx, .ppt, pptx, .txt, .rtf]';

	@track recordId = null;
	@track allRequests;
	@track requests;
	@track error;
	wiredRequestsResult;

	@wire(getRequestList)
	wiredRequest(result) {
		this.wiredRequestsResult = result;
		if (result.data) {
			this.allRequests = result.data;
			this.filterRequests();
			this.error = undefined;
		} else if (result.error) {
			this.error = result.error;
			this.requests = undefined;
		}
	}
	filterRequests() {
		var tempRequests = [];
		for (var i = 0; i < this.allRequests.length; i++) {
			if (this.allRequests[i].ExternalRequestStatus__c != "Avlyst" &&
				this.allRequests[i].ExternalRequestStatus__c != "Dekket" &&
				this.allRequests[i].ExternalRequestStatus__c != "Udekket") {
				tempRequests.push(this.allRequests[i]);
			}
		}
		this.requests = tempRequests;
	}

	isDuplicate(fields) {
		var isDuplicate = null;
		for (var i = 0; i < this.requests.length; i++) {
			if ((this.requests[i].StartTime__c <= fields.StartTime__c && fields.StartTime__c <= this.requests[i].EndTime__c
				||
				fields.StartTime__c <= this.requests[i].StartTime__c && this.requests[i].StartTime__c <= fields.EndTime__c)
				&&
				this.requests[i].Id != this.recordId) {
				isDuplicate = i;
				break;
			}
		}
		return isDuplicate;
	}

	@track sameLocation = true;
	value = 'yes';
	get options() {
		return [
			{ label: 'Ja', value: 'yes' },
			{ label: 'Nei', value: 'no' },
		];
	}

	@track error;
	@track fieldValues = { Name: "", Subject__c: "", StartTime__c: "", EndTime__c: "", MeetingStreet__c: "", MeetingPostalCity__c: "", MeetingPostalCode__c: "", Description__C: "" };


	@track startTime;
	@track endTime;
	handleChange(event) {
		var now = new Date();
		var tempTime = event.detail.value;
		tempTime = tempTime.split("");

		console.log(parseFloat(tempTime[14] + tempTime[15]));
		console.log(now.getMinutes());
		console.log(parseFloat(tempTime[14] + tempTime[15]) - now.getMinutes() <= 1);
		if (this.startTime == null) {
			if (Math.abs(parseFloat(tempTime[14] + tempTime[15]) - now.getMinutes()) <= 1) {
				tempTime[14] = '0';
				tempTime[15] = '0';
			}
			this.startTime = tempTime.join("");
			var first = parseFloat(tempTime[11]);
			var second = parseFloat(tempTime[12]);
			second = (second + 1) % 10;
			if (second == 0) {
				first = first + 1;
			}
			tempTime[11] = first.toString();
			tempTime[12] = second.toString();
			this.endTime = tempTime.join("");
		}
		else {
			this.startTime = event.detail.value;
		}
		if (event.detail.value > this.endTime) {
			var first = parseFloat(tempTime[11]);
			var second = parseFloat(tempTime[12]);
			second = (second + 1) % 10;
			if (second == 0) {
				first = first + 1;
			}
			tempTime[11] = first.toString();
			tempTime[12] = second.toString();
			this.endTime = tempTime.join("");
		}
	}
	setEndTime(event) {
		this.endTime = event.detail.value;
	}


	handleSubmit(event) {
		event.preventDefault();

		const fields = event.detail.fields;
		if (this.sameLocation) {
			fields.InterpretationStreet__c = fields.MeetingStreet__c;
			fields.InterpretationPostalCode__c = fields.MeetingPostalCode__c;
			fields.InterpretationPostalCity__c = fields.MeetingPostalCity__c;
		}
		console.log(JSON.stringify(fields));
		if (fields) {
			const isDuplicate = this.isDuplicate(fields);
			if (isDuplicate == null) {
				this.template.querySelector('lightning-record-edit-form').submit(fields);
			}

			else {
				if (confirm("Du har allerede en bestilling på samme tidspunkt\nTema: " + this.requests[isDuplicate].Subject__c +
					"\nFra: " + this.formatDateTime(this.requests[isDuplicate].StartTime__c) +
					"\nTil: " + this.formatDateTime(this.requests[isDuplicate].EndTime__c)
					+ "\n\nFortsett?")) {
					this.template.querySelector('lightning-record-edit-form').submit(fields);
				}
			}
		}
	}

	formatDateTime(dateTime) {
		const year = dateTime.substring(0, 4);
		const month = dateTime.substring(5, 7);
		const day = dateTime.substring(8, 10);

		var time = dateTime.substring(11, 16).split("");
		time[1] = ((parseFloat(time[1]) + 2) % 10).toString();
		time[0] = (parseFloat(time[0]) + ((parseFloat(time[1]) + 2) > 9) ? 1 : 0).toString();
		time = time.join("");
		return day + "." + month + "." + year + " " + time;
	}

	handleError(event) {

	}
	handleSuccess(event) {
		var x = this.template.querySelector(".submitted-true");
		x.classList.remove('hidden');
		this.template.querySelector(".h2-successMessage").focus();
		x = this.template.querySelector(".submitted-false");
		x.classList.add('hidden');
		this.recordId = event.detail.id;
		window.scrollTo(0, 0);

	}
	handleUploadFinished(event) {
		// Get the list of uploaded files
		const uploadedFiles = event.detail.files;
		alert(uploadedFiles.length + " filer ble lastet opp.");
	}

	toggled() {
		this.sameLocation = !this.sameLocation;
	}


	previousPage;
	connectedCallback() {
		let testURL = window.location.href;
		let newURL = new URL(testURL).searchParams;
		if (JSON.parse(newURL.get("fromList")) != null) {
			this.previousPage = 'mine-bestillinger';
		}
		else {
			this.previousPage = 'home';
		}
		if (JSON.parse(newURL.get("fieldValues")) != null) {

			this.fieldValues = JSON.parse(newURL.get("fieldValues"));
			this.sameLocation = this.fieldValues.MeetingStreet__c == this.fieldValues.InterpretationStreet__c;
			if (!this.sameLocation) {
				this.value = 'no';
			}

			this.recordId = this.fieldValues.Id;
			this.edit = JSON.parse(newURL.get("edit")) != null;
		}
	}


	//Navigation functions
	goToNewRequest(event) {
		if (!this.isProd) {
			event.preventDefault();
			this[NavigationMixin.Navigate]({
				type: 'comm__namedPage',
				attributes: {
					pageName: 'ny-bestilling'
				},
			});
		}
	}

	goToMyRequests(event) {
		this[NavigationMixin.Navigate]({
			type: 'comm__namedPage',
			attributes: {
				pageName: 'mine-bestillinger'
			}
		});
	}
	goToHome(event) {
		if (!this.isProd) {
			event.preventDefault();
			this[NavigationMixin.Navigate]({
				type: 'comm__namedPage',
				attributes: {
					pageName: 'home'
				},
			});
		}
	}
	goToPrevousPage() {
		this[NavigationMixin.Navigate]({
			type: 'comm__namedPage',
			attributes: {
				pageName: this.previousPage
			}
		});
	}
}
