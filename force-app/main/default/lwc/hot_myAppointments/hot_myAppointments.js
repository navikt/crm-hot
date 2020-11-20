import { LightningElement, wire, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getWorkOrders from '@salesforce/apex/HOT_WorkOrderListController.getWorkOrders';




var actions = [
	{ label: 'Avlys', name: 'delete' },
	{ label: 'Detaljer', name: 'details' },
];

export default class Hot_myAppointments extends NavigationMixin(LightningElement) {

	@track workOrders = [];

	@track columns = [
		{
			label: 'Start tid',
			fieldName: 'StartDate',
			type: 'date',
			sortable: true,
			typeAttributes: {
				day: 'numeric',
				month: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			}
		},
		{
			label: 'Slutt tid',
			fieldName: 'EndDate',
			type: 'date',
			sortable: true,
			typeAttributes: {
				day: 'numeric',
				month: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			}
		},
		{
			label: 'Tema',
			fieldName: 'Subject',
			type: 'text',
			sortable: true,
		},
		{
			label: 'Adresse',
			fieldName: 'Street',
			type: 'text',
			sortable: true,
		},
		{
			label: 'Postnr',
			fieldName: 'PostalCode',
			type: 'text',
			sortable: true,
		},
		{
			label: 'Poststed',
			fieldName: 'City',
			type: 'text',
			sortable: true,
		},
		{
			type: 'action',
			typeAttributes: { rowActions: actions },
		},
	];

	@track requestNumber;
	@track showAll = true;
	connectedCallback() {
		let testURL = window.location.href;
		let params = testURL.split("?")[1];

		function parse_query_string(query) {
			var vars = query.split("&");
			var query_string = {};
			for (var i = 0; i < vars.length; i++) {
				var pair = vars[i].split("=");
				var key = decodeURIComponent(pair[0]);
				var value = decodeURIComponent(pair[1]);
				// If first entry with this name
				if (typeof query_string[key] === "undefined") {
					query_string[key] = decodeURIComponent(value);
					// If second entry with this name
				} else if (typeof query_string[key] === "string") {
					var arr = [query_string[key], decodeURIComponent(value)];
					query_string[key] = arr;
					// If third or later entry with this name
				} else {
					query_string[key].push(decodeURIComponent(value));
				}
			}
			return query_string;
		}

		if (params != undefined) {
			var parsed_params = parse_query_string(params);
			let requestNumber = parsed_params.id;
			if (parsed_params.id != null) {
				this.requestNumber = parsed_params.id;
			}
			getWorkOrders({ requestNumber: requestNumber }).then(result => {
				this.workOrders = result;
			});
			this.showAll = false;
		}
		else {
			this.showAll = true;
			getWorkOrders({ requestNumber: null }).then(result => {
				this.workOrders = result;
			});
		}

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

	goToMyAppointments(event) {
		if (!this.isProd) {
			event.preventDefault();
			this[NavigationMixin.Navigate]({
				type: 'comm__namedPage',
				attributes: {
					pageName: 'mine-avtaler'
				}
			});
		}
	}
	goToMyRequests(event) {
		if (!this.isProd) {
			event.preventDefault();
			this[NavigationMixin.Navigate]({
				type: 'comm__namedPage',
				attributes: {
					pageName: 'mine-bestillinger'
				}
			});
		}
	}
	@track thisURL = window.location.href;
}