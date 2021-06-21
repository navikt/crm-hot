import { LightningElement, wire, track } from 'lwc';
import getOpenServiceAppointments from '@salesforce/apex/HOT_OpenServiceAppointmentListController.getOpenServiceAppointments';
import getServiceResource from '@salesforce/apex/HOT_Utility.getServiceResource';
import { refreshApex } from '@salesforce/apex';
import createInterestedResources from '@salesforce/apex/HOT_OpenServiceAppointmentListController.createInterestedResources';
import { sortList, getMobileSortingOptions } from 'c/sortController';
import { openServiceAppointmentFieldLabels } from 'c/hot_fieldLabels';
import { formatRecord } from 'c/hot_recordDetails';

export default class Hot_openServiceAppointments extends LightningElement {
    @track choices = [
        { name: 'Alle', label: 'Alle' },
        { name: 'Vanlige oppdrag', label: 'Vanlige oppdrag' },
        { name: 'Fellesoppdrag', label: 'Fellesoppdrag' },
        { name: 'Skjermtolk-oppdrag', label: 'Skjermtolk-oppdrag' }
    ];
    @track selectDisable = false;
    @track selectMultiple = false;
    @track selectRequired = false;
    @track selectSize = 1;

    @track columns = [
        {
            label: 'Frigitt dato',
            fieldName: 'HOT_ReleaseDate__c',
            type: 'date',
            sortable: true,
            typeAttributes: {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            },
            initialWidth: 135
        },
        {
            label: 'Start Tid',
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
            },
            initialWidth: 135
        },
        {
            label: 'Slutt Tid',
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
            },
            initialWidth: 135
        },
        {
            label: 'Forespørsel',
            fieldName: 'HOT_RequestNumber__c',
            type: 'text',
            sortable: true,
            initialWidth: 125
        },
        {
            label: 'Informasjon',
            fieldName: 'HOT_Information__c',
            type: 'text',
            sortable: true,
            initialWidth: 240
        },
        {
            label: 'Tema',
            fieldName: 'HOT_FreelanceSubject__c',
            type: 'text',
            sortable: true
        },
        {
            label: 'Frist',
            fieldName: 'HOT_DeadlineDate__c',
            type: 'date',
            sortable: true,
            typeAttributes: {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            },
            initialWidth: 90
        },
        {
            type: 'action',
            typeAttributes: { rowActions: this.getRowActions }
        }
    ];

    columnLabels = [
        "'Frigitt Dato'",
        "''",
        "'Start Tid'",
        "'Slutt Tid'",
        "'Forespørsel'",
        "'Informasjon'",
        "'Tema'",
        "'Frist"
    ];

    getRowActions(row, doneCallback) {
        let actions = [];
        if (row['HOT_IsSerieoppdrag__c'] === true) {
            actions.push({ label: 'Se hele serien', name: 'series' });
        }
        actions.push({ label: 'Detaljer', name: 'details' });

        doneCallback(actions);
    }

    @track serviceResource;
    @track serviceResourceId;
    @wire(getServiceResource)
    wiredServiceresource(result) {
        if (result.data) {
            this.serviceResource = result.data;
            this.serviceResourceId = this.serviceResource.Id;
            let tempRegions =
                result.data.HOT_PreferredRegions__c != null ? result.data.HOT_PreferredRegions__c.split(';') : [];
            for (let tempRegion of tempRegions) {
                this.regions.push(tempRegion);
            }
        }
    }

    @track isScreenInterpretation = false;
    @track picklistValue = 'Alle';
    handlePicklist(event) {
        this.picklistValue = event.detail;
        this.isScreenInterpretation = this.picklistValue === 'Skjermtolk-oppdrag';
        this.filterServiceAppointments();
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
        } else if (result.error) {
            this.error = result.error;
            this.allServiceAppointments = undefined;
        }
    }

    // TODO: Find out what requestNumberNull does
    filterServiceAppointments() {
        console.log(this.picklistValue);

        let tempServiceAppointments = [];
        let region = false;
        for (let i = 0; i < this.allServiceAppointments.length; i++) {
            region = this.regions.includes(this.allServiceAppointments[i].ServiceTerritory.HOT_DeveloperName__c);
            if (this.picklistValue === 'Alle' && region) {
                tempServiceAppointments.push(this.allServiceAppointments[i]);
            } else if (
                // TODO: Check if !isFellesOppdrag
                this.picklistValue === 'Vanlige oppdrag' &&
                !this.allServiceAppointments[i].HOT_IsScreenInterpreterNew__c &&
                region
            ) {
                tempServiceAppointments.push(this.allServiceAppointments[i]);
            } else if (
                // TODO: Best way to get the value of isFellesOppdrag checkbox field?
                this.picklistValue === 'Fellesoppdrag' &&
                this.allServiceAppointments[i].HOT_Request__r.IsFellesOppdrag__c &&
                region
            ) {
                tempServiceAppointments.push(this.allServiceAppointments[i]);
            } else if (
                this.picklistValue === 'Skjermtolk-oppdrag' &&
                this.allServiceAppointments[i].HOT_IsScreenInterpreterNew__c
            ) {
                tempServiceAppointments.push(this.allServiceAppointments[i]);
            }

            /*if (this.isRequestNumberNull === false) {
                if (this.allServiceAppointments[i].HOT_RequestNumber__c === this.requestNumber) {
                    tempServiceAppointments.push(this.allServiceAppointments[i]);
                }
            } else if (this.isScreenInterpretation) {
                if (this.allServiceAppointments[i].HOT_IsScreenInterpreterNew__c) {
                    tempServiceAppointments.push(this.allServiceAppointments[i]);
                }
            } else {
                if (this.regions.includes(this.allServiceAppointments[i].ServiceTerritory.HOT_DeveloperName__c)) {
                    tempServiceAppointments.push(this.allServiceAppointments[i]);
                }
            }*/
        }
        this.allServiceAppointmentsFiltered = tempServiceAppointments;
    }

    connectedCallback() {
        for (let i = 0; i < 10; i++) {
            if (i < this.columnLabels.length) {
                document.documentElement.style.setProperty('--columnlabel_' + i.toString(), this.columnLabels[i]);
            } else {
                document.documentElement.style.setProperty('--columnlabel_' + i.toString(), '');
            }
        }

        refreshApex(this.wiredAllServiceAppointmentsResult);
    }
    //Sorting methods
    @track defaultSortDirection = 'asc';
    @track sortDirection = 'desc';
    @track sortedBy = 'HOT_ReleaseDate__c';

    mobileSortingDefaultValue = '{"fieldName": "HOT_ReleaseDate__c", "sortDirection": "desc"} ';
    get sortingOptions() {
        return getMobileSortingOptions(this.columns);
    }

    handleMobileSorting(event) {
        let value = JSON.parse(event.detail.value);
        this.sortDirection = value.sortDirection;
        this.sortedBy = value.fieldName;
        this.allServiceAppointments = sortList(this.allServiceAppointments, this.sortedBy, this.sortDirection);
        this.filterServiceAppointments();
    }
    onHandleSort(event) {
        this.sortDirection = event.detail.sortDirection;
        this.sortedBy = event.detail.fieldName;
        this.allServiceAppointments = sortList(this.allServiceAppointments, this.sortedBy, this.sortDirection);
        this.filterServiceAppointments();
    }

    //Row action methods
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'details':
                this.showDetails(row);
                break;
            case 'series':
                this.showSeries(row);
                break;
            case 'handleBackToFullList_action':
                this.handleBackToFullList();
                break;
            default:
        }
    }

    @track serviceAppointmentDetails = null;
    showDetails(row) {
        this.serviceAppointmentDetails = formatRecord(row, openServiceAppointmentFieldLabels.getSubFields('details'));

        let detailPage = this.template.querySelector('.detailPage');
        detailPage.classList.remove('hidden');
        detailPage.focus();
    }
    abortShowDetails() {
        this.template.querySelector('.detailPage').classList.add('hidden');
    }

    @track requestNumber = null;
    @track isRequestNumberNull = true;
    showSeries(row) {
        this.requestNumber = row.HOT_RequestNumber__c;
        this.isRequestNumberNull = false;
        this.filterServiceAppointments();
    }
    handleBackToFullList() {
        this.requestNumber = null;
        this.isRequestNumberNull = true;
        this.isScreenInterpretation = false;
        this.filterServiceAppointments();
    }

    @track selectedRows = [];
    getSelectedName(event) {
        this.selectedRows = event.detail.selectedRows;
    }

    @track serviceAppointmentCommentDetails = [];
    abortSendingInterest() {
        this.template.querySelector('.commentPage').classList.add('hidden');
    }
    sendInterest() {
        if (this.selectedRows.length > 0) {
            this.serviceAppointmentCommentDetails = [];
            for (let row of this.selectedRows) {
                this.serviceAppointmentCommentDetails.push(
                    formatRecord(row, openServiceAppointmentFieldLabels.getSubFields('comment'))
                );
            }
            let commentPage = this.template.querySelector('.commentPage');
            commentPage.classList.remove('hidden');
            commentPage.focus();
        } else {
            alert('Velg oppdrag du ønsker å melde interesse om, så trykk på knappen.');
        }
    }
    confirmSendingInterest() {
        let serviceAppointmentIds = [];
        let comments = [];
        for (let i = 0; i < this.selectedRows.length; i++) {
            serviceAppointmentIds.push(this.selectedRows[i].Id);
        }
        this.template.querySelectorAll('.comment-field').forEach((element) => {
            comments.push(element.value);
        });
        createInterestedResources({ serviceAppointmentIds, comments }).then(() => {
            refreshApex(this.wiredAllServiceAppointmentsResult);
        });
        this.template.querySelector('.commentPage').classList.add('hidden');
    }

    @track regions = [];
    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        this.regions = fields.HOT_PreferredRegions__c;
        this.filterServiceAppointments();
        this.template.querySelector('lightning-record-edit-form').submit(this.fieldValues);
        this.handleHideRegionFilter();
    }
    handleShowRegionFilter() {
        let regionPage = this.template.querySelector('.regionPage');
        regionPage.classList.remove('hidden');
        regionPage.focus();
    }
    handleHideRegionFilter() {
        this.template.querySelector('.regionPage').classList.add('hidden');
    }
}
