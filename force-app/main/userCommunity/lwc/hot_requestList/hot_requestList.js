import { LightningElement, wire, track, api } from 'lwc';
import getRequestList from '@salesforce/apex/HOT_RequestListContoller.getRequestList';
import { updateRecord } from 'lightning/uiRecordApi';
import STATUS from '@salesforce/schema/HOT_Request__c.Status__c';
import REQUEST_ID from '@salesforce/schema/HOT_Request__c.Id';
import FILE_CONSENT from '@salesforce/schema/HOT_Request__c.IsFileConsent__c';
import NOTIFY_DISPATCHER from '@salesforce/schema/HOT_Request__c.IsNotifyDispatcher__c';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import getAssignedResources from '@salesforce/apex/HOT_Utility.getAssignedResources';
import getPersonAccount from '@salesforce/apex/HOT_Utility.getPersonAccount';
import { sortList, getMobileSortingOptions } from 'c/sortController';
import { requestFieldLabels } from 'c/hot_fieldLabels';
import { formatRecord } from 'c/hot_recordDetails';

export default class RequestList extends NavigationMixin(LightningElement) {
    rerenderCallback() {
        refreshApex(this.wiredRequestsResult);
    }
    @track choices = [
        { name: 'Fremtidige', label: 'Fremtidige' },
        { name: 'Alle', label: 'Alle' },
        { name: 'Åpen', label: 'Åpen' },
        { name: 'Under behandling', label: 'Under behandling' },
        { name: 'Du har fått tolk', label: 'Du har fått tolk' },
        { name: 'Ikke ledig tolk', label: 'Ikke ledig tolk' },
        { name: 'Se tidsplan', label: 'Serieoppdrag' }, // "Se tidsplan"
        { name: 'Avlyst', label: 'Avlyst' },
        { name: 'Gjennomført', label: 'Gjennomført' }
    ];

    @track error;
    @track userRecord = { AccountId: null };
    @wire(getPersonAccount)
    wiredGetRecord({ data }) {
        if (data) {
            this.userRecord.AccountId = data.AccountId;
        }
    }

    @track columns = [
        {
            label: 'Start tid',
            fieldName: 'StartTime__c',
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
            fieldName: 'EndTime__c',
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
            label: 'Bestilling',
            fieldName: 'Name',
            type: 'text',
            sortable: true
        },
        {
            label: 'Oppmøtested',
            fieldName: 'MeetingStreet__c',
            type: 'text',
            sortable: true
        },
        {
            label: 'Tema',
            fieldName: 'Subject__c',
            type: 'text',
            sortable: true
        },
        {
            label: 'Serieoppdrag',
            fieldName: 'IsSerieoppdrag__c',
            type: 'boolean',
            sortable: true
        },
        {
            label: 'Status',
            fieldName: 'ExternalRequestStatus__c',
            type: 'text',
            sortable: true
        },
        {
            type: 'action',
            typeAttributes: { rowActions: this.getRowActions }
        }
    ];
    mobileColumns = [
        "'Start tid'",
        "'Slutt tid'",
        "'Bestilling'",
        "'Oppmøtested'",
        "'Tema'",
        "'Serieoppdrag'",
        "'Status'"
    ];

    getRowActions(row, doneCallback) {
        let actions = [];
        let tempEndDate = new Date(row['EndTime__c']);
        if (row['Orderer__c'] === row['TempAccountId__c']) {
            if (
                row['Status__c'] !== 'Avlyst' &&
                row['Status__c'] !== 'Dekket' &&
                row['Status__c'] !== 'Delvis dekket' &&
                tempEndDate.getTime() > Date.now()
            ) {
                actions.push({ label: 'Avlys', name: 'delete' });
            }
            if (row['Status__c'] === 'Åpen') {
                actions.push({ label: 'Rediger', name: 'edit_order' });
            }
            if (row['Status__c'] === 'Åpen' || row['Status__c'] === 'Godkjent' || row['Status__c'] === 'Tildelt') {
                actions.push({ label: 'Legg til filer', name: 'add_files' });
            }
            actions.push({ label: 'Kopier', name: 'clone_order' });
        }
        actions.push({ label: 'Detaljer', name: 'details' });
        actions.push({ label: 'Se tidsplan', name: 'see_times' });
        doneCallback(actions);
    }

    get requestTypes() {
        return [
            { label: 'Mine bestillinger', value: 'my' },
            { label: 'Bestillinger på vegne av andre', value: 'user' }
        ];
    }

    @track rerender;
    @track requests;
    @track allRequests;
    @track allOrderedRequests;
    @track allMyRequests;
    wiredRequestsResult;

    @wire(getRequestList)
    async wiredRequest(result) {
        this.wiredRequestsResult = result;
        if (result.data) {
            this.allRequests = this.distributeRequests(result.data);
            this.filterRequests();
            this.error = undefined;
            let requestIds = [];
            for (let request of result.data) {
                requestIds.push(request.Id);
            }
            this.requestAssignedResources = await getAssignedResources({
                requestIds
            });
        } else if (result.error) {
            this.error = result.error;
            this.allRequests = undefined;
        }
    }

    distributeRequests(data) {
        this.allMyRequests = [];
        this.allOrderedRequests = [];
        for (let request of data) {
            if (request.Account__c === this.userRecord.AccountId) {
                this.allMyRequests.push(request);
            } else if (
                request.Orderer__c === this.userRecord.AccountId &&
                request.Account__c !== this.userRecord.AccountId
            ) {
                this.allOrderedRequests.push(request);
            }
        }
        return this.isMyRequests ? this.allMyRequests : this.allOrderedRequests;
    }

    @track picklistValue = 'Fremtidige';
    handlePicklist(event) {
        this.picklistValue = event.detail.name;
        this.filterRequests();
    }

    filterRequests() {
        let tempRequests = [];
        let pickListValue = this.picklistValue;
        for (let i = 0; i < this.allRequests.length; i++) {
            let status = this.allRequests[i].ExternalRequestStatus__c;
            if (status === pickListValue) {
                tempRequests.push(this.allRequests[i]);
            } else if (pickListValue === 'Alle') {
                tempRequests = this.allRequests; // Already set correctly in handleRequestType
            } else if (pickListValue === 'Fremtidige') {
                if (
                    status !== 'Avlyst' &&
                    (this.allRequests[i].SeriesEndDate__c > new Date().toISOString().substring(0, 10) ||
                        this.allRequests[i].EndTime__c > new Date().toISOString().substring(0, 10))
                ) {
                    tempRequests.push(this.allRequests[i]);
                }
            }
        }
        this.requests = tempRequests;
    }

    @track isMyRequests = true;
    handleRequestType(event) {
        this.isMyRequests = event.detail.value === 'my';
        this.allRequests = this.isMyRequests ? this.allMyRequests : this.allOrderedRequests;
        this.allRequests = sortList(this.allRequests, this.sortedBy, this.sortDirection);
        this.filterRequests();
        let tempColumns = [...this.columns];
        let tempMobileColumns = [...this.mobileColumns];

        if (this.isMyRequests) {
            tempColumns.shift();
            tempMobileColumns.shift();
            tempMobileColumns.push("''");
        } else {
            tempColumns.unshift({
                label: 'Bruker',
                fieldName: 'UserName__c',
                type: 'text',
                sortable: true
            });
            tempMobileColumns.unshift("'Bruker'");
        }
        for (let i = 0; i < 10; i++) {
            if (i < tempMobileColumns.length) {
                document.documentElement.style.setProperty('--columnlabel_' + i.toString(), tempMobileColumns[i]);
            } else {
                document.documentElement.style.setProperty('--columnlabel_' + i.toString(), '');
            }
        }
        this.columns = [...tempColumns];
        this.mobileColumns = [...tempMobileColumns];
    }

    @track defaultSortDirection = 'asc';
    @track sortDirection = 'asc';
    @track sortedBy = 'StartTime__c';

    get sortingOptions() {
        return getMobileSortingOptions(this.columns);
    }

    onHandleSort(event) {
        this.sortDirection = event.detail.sortDirection;
        this.sortedBy = event.detail.fieldName;
        this.allRequests = sortList(this.allRequests, this.sortedBy, this.sortDirection);
        this.filterRequests();
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        switch (actionName) {
            case 'delete':
                this.cancelOrder(row);
                break;
            case 'clone_order':
                this.cloneOrder(row);
                break;
            case 'edit_order':
                this.editOrder(row);
                break;
            case 'details':
                this.showDetails(row);
                break;
            case 'see_times':
                this.showTimes(row);
                break;
            case 'add_files':
                this.addFiles(row);
                break;
            default:
        }
    }
    connectedCallback() {
        for (let i = 0; i < 10; i++) {
            if (i < this.mobileColumns.length) {
                document.documentElement.style.setProperty('--columnlabel_' + i.toString(), this.mobileColumns[i]);
            } else {
                document.documentElement.style.setProperty('--columnlabel_' + i.toString(), '');
            }
        }
        window.scrollTo(0, 0);
        refreshApex(this.wiredRequestsResult);
    }

    renderedCallback() {
        if (this.showUploadFilesComponent) {
            document.documentElement.style.setProperty('--dialogMaxWidth', '50%');
        } else {
            document.documentElement.style.setProperty('--dialogMaxWidth', '432px');
        }
    }

    findRowIndexById(Id) {
        let ret = -1;
        this.requests.some((row, index) => {
            if (row.Id === Id) {
                ret = index;
                return true;
            }
            return false;
        });
        return ret;
    }
    cancelOrder(row) {
        const { Id } = row;
        const index = this.findRowIndexById(Id);
        if (index !== -1) {
            let tempEndDate = new Date(this.requests[index].EndTime__c);
            if (
                this.requests[index].ExternalRequestStatus__c != 'Avlyst' &&
                this.requests[index].ExternalRequestStatus__c != 'Dekket' &&
                tempEndDate.getTime() > Date.now()
            ) {
                if (confirm('Er du sikker på at du vil avlyse bestillingen?')) {
                    const fields = {};
                    fields[REQUEST_ID.fieldApiName] = Id;
                    fields[STATUS.fieldApiName] = 'Avlyst';
                    fields[NOTIFY_DISPATCHER.fieldApiName] = true;
                    const recordInput = { fields };
                    updateRecord(recordInput)
                        .then(() => {
                            refreshApex(this.wiredRequestsResult);
                        })
                        .catch(() => {
                            alert('Kunne ikke avlyse bestilling.');
                        });
                }
            } else {
                alert('Du kan ikke avlyse denne bestillingen.');
            }
        }
    }

    cloneOrder(row) {
        const { Id } = row;
        const index = this.findRowIndexById(Id);
        if (index !== -1) {
            //Here we should get the entire record from salesforce, to get entire interpretation address.
            let clone = this.requests[index];
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: {
                    pageName: 'ny-bestilling'
                },
                state: {
                    fieldValues: JSON.stringify(clone),
                    fromList: true,
                    copy: true
                }
            });
        }
    }

    editOrder(row) {
        const { Id } = row;
        const index = this.findRowIndexById(Id);
        if (index !== -1) {
            if (row.Orderer__c === this.userRecord.AccountId) {
                this.isGetAllFiles = true;
                if (this.requests[index].ExternalRequestStatus__c.includes('Åpen')) {
                    //Here we should get the entire record from salesforce, to get entire interpretation address.
                    let clone = this.requests[index];
                    this[NavigationMixin.Navigate]({
                        type: 'comm__namedPage',
                        attributes: {
                            pageName: 'ny-bestilling'
                        },
                        state: {
                            fieldValues: JSON.stringify(clone),
                            fromList: true,
                            edit: true
                        }
                    });
                }
            } else {
                alert('Denne bestillingen er bestilt av noen andre, og du har ikke rettigheter til å endre den.');
            }
        }
    }

    @track record = null;
    @track recordId;
    @track userForm = false;
    @track companyForm = false;
    @track publicEvent = false;
    @track isGetAllFiles = false;

    showDetails(row) {
        this.record = row;
        this.recordId = row.Id;
        this.isGetAllFiles = row.Account__c === this.userRecord.AccountId ? true : false;
        this.userForm =
            (this.record.Type__c === 'User' || this.record.Type__c === 'Company') && this.record.UserName__c !== '';
        this.companyForm = this.record.Type__c === 'Company' || this.record.Type__c === 'PublicEvent';
        this.publicEvent = this.record.Type__c === 'PublicEvent';

        this.userFields = formatRecord(this.record, requestFieldLabels.getSubFields('user'));
        this.ordererFields = formatRecord(this.record, requestFieldLabels.getSubFields('orderer'));
        this.companyFields = formatRecord(this.record, requestFieldLabels.getSubFields('company'));
        this.requestFields = formatRecord(this.record, requestFieldLabels.getSubFields('request'));
        let detailPage = this.template.querySelector('.ReactModal__Overlay');
        detailPage.classList.remove('hidden');
        detailPage.focus();
    }

    @track userFields = null;
    @track ordererFields = null;
    @track companyFields = null;
    @track requestFields = null;

    @track formatedRecord = [];

    abortShowDetails() {
        this.template.querySelector('.ReactModal__Overlay').classList.add('hidden');
        this.clearFileData();
        this.template.querySelector('.skjema').classList.remove('hidden');
        this.showUploadFilesComponent = false;
    }

    showTimes(row) {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                pageName: 'min-tidsplan'
            },
            state: {
                id: row.Name
            }
        });
    }

    handleFileUpload() {
        this.template.querySelector('c-upload-files').handleFileUpload(this.recordId);
    }

    clearFileData() {
        this.template.querySelector('c-upload-files').clearFileData();
    }

    hasFiles = false;
    fileLength;
    checkFileDataLength(event) {
        this.fileLength = event.detail;
        this.hasFiles = event.detail > 0;
    }

    showModal() {
        this.template.querySelector('c-alertdialog').showModal();
    }

    header;
    content;
    onUploadComplete() {
        this.template.querySelector('.loader').classList.add('hidden');
        this.header = 'Suksess!';
        // Only show pop-up modal if in add files window
        if (this.isAddFiles) {
            this.showModal();
        }
        this.template.querySelector('.ReactModal__Overlay').classList.add('hidden');
        this.template.querySelector('.skjema').classList.remove('hidden');
    }

    onUploadError(err) {
        this.template.querySelector('.loader').classList.add('hidden');
        this.header = 'Noe gikk galt';
        this.content = 'Kunne ikke laste opp fil(er). Feilmelding: ' + err;
        this.showModal();
        this.template.querySelector('.ReactModal__Overlay').classList.add('hidden');
        this.template.querySelector('.skjema').classList.remove('hidden');
    }

    validateCheckbox() {
        this.template.querySelector('c-upload-files').validateCheckbox();
    }

    checkboxValue = false;
    getCheckboxValue(event) {
        this.checkboxValue = event.detail;
    }

    uploadFilesOnSave() {
        let file = this.fileLength > 1 ? 'Filene' : 'Filen';
        this.content = file + ' ble lagt til i bestillingen.';
        this.validateCheckbox();

        // Show spinner
        if (this.checkboxValue) {
            this.template.querySelector('.loader').classList.remove('hidden');
            this.showUploadFilesComponent = false;
        }
        this.handleFileUpload();
        this.setFileConsent();
    }

    setFileConsent() {
        let fields = {};
        fields[REQUEST_ID.fieldApiName] = this.recordId;
        fields[FILE_CONSENT.fieldApiName] = this.checkboxValue;
        const recordInput = { fields };
        updateRecord(recordInput);
    }

    showUploadFilesComponent = false;
    isAddFiles = false;
    addFiles(row) {
        this.isAddFiles = true;
        this.showUploadFilesComponent = true;
        this.recordId = row.Id;
        this.template.querySelector('.skjema').classList.add('hidden');
        let detailPage = this.template.querySelector('.ReactModal__Overlay');
        detailPage.classList.remove('hidden');
        detailPage.focus();
    }

    goToNewRequest() {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                pageName: 'ny-bestilling'
            },
            state: {
                fromList: true
            }
        });
    }
}
