import { LightningElement, wire, track, api } from 'lwc';
import getOpenServiceAppointments from '@salesforce/apex/HOT_OpenServiceAppointmentListController.getOpenServiceAppointments';
import getServiceResource from '@salesforce/apex/HOT_Utility.getServiceResource';
import createInterestedResources from '@salesforce/apex/HOT_OpenServiceAppointmentListController.createInterestedResources';
import { refreshApex } from '@salesforce/apex';

var actions = [
	{ label: 'Detaljer', name: 'details' },
	{ label: 'Chat', name: 'chat' },
];

export default class Hot_allServiceAppointments extends LightningElement {

	@track columns = [
		/*{
			label: 'Oppdragsnummer',
			fieldName: 'AppointmentNumber',
			type: 'text',
			sortable: true,
		},*/
		{
			label: 'Start tid',
			fieldName: 'EarliestStartTime',
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
			fieldName: 'DueDate',
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
			label: 'Arbeidstype',
			fieldName: 'HOT_WorkTypeName__c',
			type: 'text',
			sortable: true,
		},
		{
			label: 'Adresse',
			fieldName: 'HOT_InterpretationStreet__c',
			type: 'text',
			sortable: true,
		},
		{
			label: 'Postnr',
			fieldName: 'HOT_InterpretationPostalCode__c',
			type: 'text',
			sortable: true,
		},
		{
			label: 'Påmeldte',
			fieldName: 'HOT_NumberOfInterestedResources__c',
			type: 'number',
			sortable: true,
			cellAttributes: { alignment: 'left' }
		},/*
		{
			type: 'action',
			typeAttributes: { rowActions: actions },
		},*/
	];
	@track serviceResource;
	@wire(getServiceResource)
	wiredServiceresource(result) {
		if (result.data) {
			this.serviceResource = result.data;
			console.log(JSON.stringify(this.serviceResource));
		}
	}

	@track allServiceAppointments;
	@track allServiceAppointmentsFiltered;
	wiredAllServiceAppointmentsResult;
	@wire(getOpenServiceAppointments)
	wiredAllServiceAppointments(result) {
		this.wiredAllServiceAppointmentsResult = result;
		if (result.data) {
			this.allServiceAppointments = result.data;
			this.error = undefined;
			this.filterServiceAppointments();
			//console.log(JSON.stringify(this.allServiceAppointments));
			for (var i = 0; i < this.allServiceAppointments.length; i++) {
				//console.log(JSON.stringify(this.allServiceAppointments[i].WorkType));
			}
		} else if (result.error) {
			this.error = result.error;
			this.allServiceAppointments = undefined;
		}
	}
	filterServiceAppointments() {
		var tempServiceAppointments = [];
		for (var i = 0; i < this.allServiceAppointments.length; i++) {
			if (this.serviceResource.ServiceTerritories && JSON.stringify(this.serviceResource.ServiceTerritories).includes(this.allServiceAppointments[i].ServiceTerritoryId)) {
				tempServiceAppointments.push(this.allServiceAppointments[i]);
			}
		}
		this.allServiceAppointmentsFiltered = tempServiceAppointments;
	}

	showHideAll() {
		if (this.isChecked) {
			this.allServiceAppointmentsFiltered = this.allServiceAppointments;
		}
		else {
			this.filterServiceAppointments();
		}
	}

	connectedCallback() {
		refreshApex(this.wiredServiceAppointmentsResult);
	}

	//Sorting methods
	@track defaultSortDirection = 'asc';
	@track sortDirection = 'asc';
	@track sortedBy = 'EarliestStartTime';

	mobileSortingDefaultValue = '{"fieldName": "EarliestStartTime", "sortDirection": "asc"} ';
	get sortingOptions() {
		return [
			{ label: 'Start tid stigende', value: '{"fieldName": "EarliestStartTime", "sortDirection": "asc"} ' },
			{ label: 'Start tid synkende', value: '{"fieldName": "EarliestStartTime", "sortDirection": "desc"} ' },
			{ label: 'Tema A - Å', value: '{"fieldName": "Subject", "sortDirection": "asc"} ' },
			{ label: 'Tema Å - A', value: '{"fieldName": "Subject", "sortDirection": "desc"} ' },
			{ label: 'Sted A - Å', value: '{"fieldName": "HOT_InterpretationStreet__c", "sortDirection": "asc"} ' },
			{ label: 'Sted Å - A', value: '{"fieldName": "HOT_InterpretationStreet__c", "sortDirection": "desc"} ' },
		];
	}
	handleMobileSorting(event) {
		this.sortList(JSON.parse(event.detail.value));
	}
	sortBy(field, reverse) {
		const key = function (x) {
			return x[field];
		};
		if (field == 'HOT_NumberOfInterestedResources__c') {
			return function (a, b) {
				a = key(a);
				b = key(b);
				return reverse * ((a > b) - (b > a));
			};
		}
		else {
			return function (a, b) {
				a = key(a).toLowerCase();
				b = key(b).toLowerCase();
				return reverse * ((a > b) - (b > a));
			};
		}
	}
	onHandleSort(event) {
		this.sortList(event.detail);
	}
	sortList(input) {
		const { fieldName: sortedBy, sortDirection } = input;
		let cloneData = [...this.allServiceAppointments];
		cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));

		this.allServiceAppointments = cloneData;
		this.sortDirection = sortDirection;
		this.sortedBy = sortedBy;
		this.showHideAll();
	}

	//Row action methods
	handleRowAction(event) {
		const actionName = event.detail.action.name;
		const row = event.detail.row;

		switch (actionName) {
			case 'details':
				this.showDetails(row);
				break;
			case 'chat':
				this.openChatter(row);
				break;
			default:
		}
	}

	showDetails(row) {

	}
	openChatter(row) {

	}
	selectedRows = [];
	getSelectedName(event) {
		this.selectedRows = event.detail.selectedRows;
		console.log(JSON.stringify(this.selectedRows));
	}

	sendInterest() {
		let appointmentNumbers = [];
		for (var i = 0; i < this.selectedRows.length; i++) {
			appointmentNumbers.push(this.selectedRows[i].AppointmentNumber);
		}
		if (appointmentNumbers.length > 0) {
			createInterestedResources({ appointmentNumbers });
		}
	}


	isChecked = false;
	@track checkBoxLabel = "Vis oppdrag fra alle regioner";
	handleChecked(event) {
		this.isChecked = event.detail.checked;
		if (this.isChecked) {
			//this.checkBoxLabel = "Vis oppdrag fra mine regioner";
			this.allServiceAppointmentsFiltered = this.allServiceAppointments;
		}
		else {
			//this.checkBoxLabel = "Vis oppdrag fra alle regioner";
			this.filterServiceAppointments();
		}
	}


}