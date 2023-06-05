import { LightningElement, wire, track, api } from 'lwc';
import getInterestedResources from '@salesforce/apex/HOT_InterestedResourcesListController.getInterestedResources';
import retractInterest from '@salesforce/apex/HOT_InterestedResourcesListController.retractInterest';
import getThreadDispatcherId from '@salesforce/apex/HOT_InterestedResourcesListController.getThreadDispatcherId';
import getThreadDispatcherIdSA from '@salesforce/apex/HOT_InterestedResourcesListController.getThreadDispatcherIdSA';
import getMyThreads from '@salesforce/apex/HOT_ThreadListController.getMyThreadsIR';
import getContactId from '@salesforce/apex/HOT_MessageHelper.getUserContactId';
import getServiceResource from '@salesforce/apex/HOT_Utility.getServiceResource';
import { refreshApex } from '@salesforce/apex';
import { getParametersFromURL } from 'c/hot_URIDecoder';
import { columns, mobileColumns, iconByValue } from './columns';
import { defaultFilters, compare } from './filters';
import { formatRecord } from 'c/datetimeFormatter';
import { NavigationMixin } from 'lightning/navigation';
import createThreadInterpreter from '@salesforce/apex/HOT_MessageHelper.createThreadInterpreter';

export default class Hot_interestedResourcesList extends NavigationMixin(LightningElement) {
    @track columns = [];
    @track filters = [];
    @track iconByValue = iconByValue;
    @track isGoToThreadButtonDisabled = false;
    setColumns() {
        if (window.screen.width > 576) {
            this.columns = columns;
        } else {
            this.columns = mobileColumns;
        }
    }
    sendFilters() {
        const eventToSend = new CustomEvent('sendfilters', { detail: this.filters });
        this.dispatchEvent(eventToSend);
    }
    sendRecords() {
        const eventToSend = new CustomEvent('sendrecords', { detail: this.initialInterestedResources });
        this.dispatchEvent(eventToSend);
    }
    sendDetail() {
        const eventToSend = new CustomEvent('senddetail', { detail: this.isDetails });
        this.dispatchEvent(eventToSend);
    }

    setPreviousFiltersOnRefresh() {
        if (sessionStorage.getItem('interestedfilters')) {
            this.applyFilter({
                detail: { filterArray: JSON.parse(sessionStorage.getItem('interestedfilters')), setRecords: true }
            });
            sessionStorage.removeItem('interestedfilters');
        }
        this.sendFilters();
    }

    disconnectedCallback() {
        // Going back with browser back or back button on mouse forces page refresh and a disconnect
        // Save filters on disconnect to exist only within the current browser tab
        sessionStorage.setItem('interestedfilters', JSON.stringify(this.filters));
    }

    renderedCallback() {
        this.setPreviousFiltersOnRefresh();
    }

    connectedCallback() {
        this.setColumns();
        refreshApex(this.wiredInterestedResourcesResult);
        this.updateURL();
    }
    getDayOfWeek(date) {
        var jsDate = new Date(date);
        var dayOfWeek = jsDate.getDay();
        var dayOfWeekString;
        switch (dayOfWeek) {
            case 0:
                dayOfWeekString = 'Søndag';
                break;
            case 1:
                dayOfWeekString = 'Mandag';
                break;
            case 2:
                dayOfWeekString = 'Tirsdag';
                break;
            case 3:
                dayOfWeekString = 'Onsdag';
                break;
            case 4:
                dayOfWeekString = 'Torsdag';
                break;
            case 5:
                dayOfWeekString = 'Fredag';
                break;
            case 6:
                dayOfWeekString = 'Lørdag';
                break;
            default:
                dayOfWeekString = '';
        }
        return dayOfWeekString;
    }
    @track serviceResource;
    @wire(getServiceResource)
    wiredServiceresource(result) {
        if (result.data) {
            this.serviceResource = result.data;
        }
    }

    noInterestedResources = false;
    initialInterestedResources = [];
    @track records = [];
    @track allInterestedResourcesWired = [];
    wiredInterestedResourcesResult;
    @wire(getInterestedResources)
    wiredInterestedResources(result) {
        this.wiredInterestedResourcesResult = result;
        if (result.data) {
            this.noInterestedResources = this.allInterestedResourcesWired.length === 0;
            this.error = undefined;
            this.allInterestedResourcesWired = [...result.data];
            this.noInterestedResources = this.allInterestedResourcesWired.length === 0;
            getContactId({}).then((contactId) => {
                this.userContactId = contactId;

                getMyThreads().then((result) => {
                    var thread = [];
                    thread = result;
                    var map = new Map();
                    thread.forEach((t) => {
                        map.set(t.CRM_Related_Object__c, t.HOT_Thread_read_by__c);
                    });
                    this.allInterestedResourcesWired = this.allInterestedResourcesWired.map((appointment) => {
                        let threadId;
                        if (
                            appointment.Status__c == 'Assigned' ||
                            appointment.Status__c == 'Tildelt' ||
                            appointment.Status__c == 'Canceled' ||
                            appointment.Status__c == 'Avlyst' ||
                            appointment.Status__c == 'Canceled by Interpreter' ||
                            appointment.Status__c == 'Avlyst av tolk'
                        ) {
                            threadId = appointment.ServiceAppointment__c;
                        } else {
                            threadId = appointment.Id;
                        }
                        let status = 'noThread';
                        if (map.has(threadId)) {
                            var readBy = map.get(threadId);
                            if (readBy.includes(this.userContactId)) {
                                status = 'false';
                            } else {
                                status = 'true';
                            }
                        } else {
                        }
                        return {
                            ...appointment,
                            IsUnreadMessage: status
                        };
                    });
                    let tempRecords = [];
                    for (let record of this.allInterestedResourcesWired) {
                        tempRecords.push(formatRecord(Object.assign({}, record), this.datetimeFields));
                    }
                    this.records = tempRecords;
                    this.initialInterestedResources = [...this.records];
                    this.refresh();
                });
            });
        } else if (result.error) {
            this.error = result.error;
            this.allInterestedResourcesWired = undefined;
        }
    }

    refresh() {
        let filterFromSessionStorage = JSON.parse(sessionStorage.getItem('interestedSessionFilter'));
        this.filters = filterFromSessionStorage === null ? defaultFilters() : filterFromSessionStorage;
        //this.goToRecordDetails({ detail: { Id: this.recordId } });
        //this.sendRecords();
        this.sendFilters();
        this.applyFilter({ detail: { filterArray: this.filters, setRecords: true } });
    }

    datetimeFields = [
        {
            name: 'StartAndEndDate',
            type: 'datetimeinterval',
            start: 'ServiceAppointmentStartTime__c',
            end: 'ServiceAppointmentEndTime__c'
        },
        { name: 'WorkOrderCanceledDate__c', type: 'date' },
        { name: 'HOT_ReleaseDate__c', type: 'date' },
        { name: 'AppointmentDeadlineDate__c', type: 'date' }
    ];

    @track interestedResource;
    isDetails = false;
    isSeries = false;
    showTable = true;
    goToRecordDetails(result) {
        this.template.querySelector('.serviceAppointmentDetails').classList.remove('hidden');
        this.template.querySelector('.serviceAppointmentDetails').focus();
        this.interestedResource = undefined;
        let recordId = result.detail.Id;
        this.recordId = recordId;
        this.isDetails = !!this.recordId;
        for (let interestedResource of this.records) {
            if (recordId === interestedResource.Id) {
                this.interestedResource = interestedResource;
                let DeadlineDateTimeFormatted = new Date(this.interestedResource.AppointmentDeadlineDate__c);
                this.interestedResource.AppointmentDeadlineDate__c =
                    DeadlineDateTimeFormatted.getDate() +
                    '.' +
                    (DeadlineDateTimeFormatted.getMonth() + 1) +
                    '.' +
                    DeadlineDateTimeFormatted.getFullYear();
                // if (
                //     this.interestedResource.Status__c == 'Påmeldt' ||
                //     this.interestedResource.Status__c == 'Tildelt' ||
                //     this.interestedResource.Status__c == 'Assigned' ||
                //     this.interestedResource.Status__c == 'Interested'
                // ) {
                //     this.isGoToThreadButtonDisabled = false;
                // } else {
                //     this.isGoToThreadButtonDisabled = true;
                // }

                this.interestedResource.weekday = this.getDayOfWeek(
                    this.interestedResource.ServiceAppointmentStartTime__c
                );
            }
        }

        this.isNotRetractable = this.interestedResource?.Status__c !== 'Påmeldt';
        this.updateURL();
    }

    @api recordId;
    updateURL() {
        let baseURL =
            window.location.protocol + '//' + window.location.host + window.location.pathname + '?list=interested';
        if (this.recordId) {
            baseURL += '&id=' + this.recordId;
        }
        window.history.pushState({ path: baseURL }, '', baseURL);
    }

    @api goBack() {
        let recordIdToReturn = this.recordId;
        this.recordId = undefined;
        this.isDetails = false;
        this.showTable = true;
        this.sendDetail();
        return { id: recordIdToReturn, tab: 'interested' };
    }
    filteredRecordsLength = 0;
    @api
    applyFilter(event) {
        let setRecords = event.detail.setRecords;
        this.filters = event.detail.filterArray;
        sessionStorage.setItem('interestedSessionFilter', JSON.stringify(this.filters));
        let filteredRecords = [];
        let records = this.initialInterestedResources;
        for (let record of records) {
            let includeRecord = true;
            for (let filter of this.filters) {
                includeRecord *= compare(filter, record);
            }
            if (includeRecord) {
                filteredRecords.push(record);
            }
        }
        this.filteredRecordsLength = filteredRecords.length;

        if (setRecords) {
            this.records = filteredRecords;
        }
        return this.filteredRecordsLength;
    }
    isNotRetractable = false;
    retractInterest() {
        retractInterest({ interestedResourceId: this.interestedResource.Id }).then(() => {
            refreshApex(this.wiredInterestedResourcesResult);
            this.interestedResource.Status__c = 'Tilbaketrukket påmelding';
            let newNumberOfInterestedResources = Number(this.interestedResource.NumberOfInterestedResources__c) - 1;
            this.interestedResource.NumberOfInterestedResources__c = newNumberOfInterestedResources;
            this.isNotRetractable = true;
        });
    }
    closeModal() {
        this.template.querySelector('.serviceAppointmentDetails').classList.add('hidden');
        this.isGoToThreadButtonDisabled = false;
        this.recordId = undefined;
        this.updateURL();
    }
    navigateToThread(recordId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Thread__c',
                actionName: 'view'
            },
            state: {
                from: 'mine-oppdrag',
                list: 'interested',
                recordId: this.interestedResource.Id
            }
        });
    }
    goToInterestedResourceThread() {
        this.isGoToThreadButtonDisabled = true;
        if (
            this.interestedResource.Status__c != 'Assigned' &&
            this.interestedResource.Status__c != 'Canceled' &&
            this.interestedResource.Status__c != 'Tildelt' &&
            this.interestedResource.Status__c != 'Avlyst' &&
            this.interestedResource.Status__c != 'Canceled by Interpreter' &&
            this.interestedResource.Status__c != 'Avlyst av tolk'
        ) {
            getThreadDispatcherId({ interestedResourceId: this.interestedResource.Id }).then((result) => {
                if (result != '') {
                    this.threadId = result;
                    this.navigateToThread(this.threadId);
                } else {
                    createThreadInterpreter({ recordId: this.interestedResource.Id })
                        .then((result) => {
                            this.navigateToThread(result.Id);
                        })
                        .catch((error) => {
                            this.modalHeader = 'Noe gikk galt';
                            this.modalContent = 'Kunne ikke åpne samtale. Feilmelding: ' + error;
                            this.noCancelButton = true;
                            this.showModal();
                        });
                }
            });
        } else {
            getThreadDispatcherIdSA({ saId: this.interestedResource.ServiceAppointment__c }).then((result) => {
                if (result != '') {
                    this.threadId = result;
                    this.navigateToThread(this.threadId);
                } else {
                    createThreadInterpreter({ recordId: this.interestedResource.ServiceAppointment__c })
                        .then((result) => {
                            this.navigateToThread(result.Id);
                        })
                        .catch((error) => {
                            this.modalHeader = 'Noe gikk galt';
                            this.modalContent = 'Kunne ikke åpne samtale. Feilmelding: ' + error;
                            this.noCancelButton = true;
                            this.showModal();
                        });
                }
            });
        }
    }
}
