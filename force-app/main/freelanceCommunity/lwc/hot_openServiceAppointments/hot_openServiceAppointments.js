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

    @track columns = [
        {
            label: 'Frigitt dato',
            fieldName: 'HOT_ReleaseDate__c',
            type: 'date',
        },
        {
            label: 'Start tid',
            fieldName: 'EarliestStartTime',
            type: 'date',
        },
        {
            label: 'Slutt tid',
            fieldName: 'DueDate',
            type: 'date',
        },
        {
            label: 'Informasjon',
            fieldName: 'HOT_Information__c',
            type: 'text',
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
        },
    ];

    columnLabels = ["'Frigitt dato'", "''", "'Start tid'", "'Slutt tid'", "'Informasjon'", "'Tema'", "'Frist"];

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

    @track picklistValue = 'Alle';
    handlePicklist(event) {
        this.picklistValue = event.detail.name;
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

    filterServiceAppointments() {
        let tempServiceAppointments = [];
        let isRegion = false;
        for (let i = 0; i < this.allServiceAppointments.length; i++) {
            isRegion = this.regions.includes(this.allServiceAppointments[i].ServiceTerritory.HOT_DeveloperName__c);
            // Series
            if (this.isSeriesSelected === true) {
                if (this.allServiceAppointments[i].HOT_RequestNumber__c === this.requestNumber) {
                    tempServiceAppointments.push(this.allServiceAppointments[i]);
                }
            } else if (this.picklistValue === 'Alle' && isRegion) {
                tempServiceAppointments.push(this.allServiceAppointments[i]);
            } else if (
                this.picklistValue === 'Vanlige oppdrag' &&
                !this.allServiceAppointments[i].HOT_IsScreenInterpreterNew__c &&
                !this.allServiceAppointments[i].HOT_Request__r.IsFellesOppdrag__c &&
                isRegion
            ) {
                tempServiceAppointments.push(this.allServiceAppointments[i]);
            } else if (
                this.picklistValue === 'Fellesoppdrag' &&
                this.allServiceAppointments[i].HOT_Request__r.IsFellesOppdrag__c
            ) {
                tempServiceAppointments.push(this.allServiceAppointments[i]);
            } else if (
                this.picklistValue === 'Skjermtolk-oppdrag' &&
                this.allServiceAppointments[i].HOT_IsScreenInterpreterNew__c
            ) {
                tempServiceAppointments.push(this.allServiceAppointments[i]);
            }
        }
        this.allServiceAppointmentsFiltered = tempServiceAppointments;
        console.log(JSON.stringify(this.allServiceAppointmentsFiltered));
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
    @track isSeriesSelected = false;
    showSeries(row) {
        this.requestNumber = row.HOT_RequestNumber__c;
        this.isSeriesSelected = true;
        this.filterServiceAppointments();
    }
    handleBackToFullList() {
        this.requestNumber = null;
        this.isSeriesSelected = false;
        this.picklistValue = 'Alle';
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
