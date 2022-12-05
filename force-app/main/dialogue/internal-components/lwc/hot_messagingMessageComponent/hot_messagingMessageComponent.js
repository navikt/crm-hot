import { LightningElement, api, wire } from 'lwc';
import getThreads from '@salesforce/apex/HOT_MessageHelper.getThreadsCollection';
import createThread from '@salesforce/apex/HOT_MessageHelper.createThread';
import markAsReadByNav from '@salesforce/apex/HOT_MessageHelper.markAsReadByNav';
import getAccountOnRequest from '@salesforce/apex/HOT_MessageHelper.getAccountOnRequest';
import getAccountOnWorkOrder from '@salesforce/apex/HOT_MessageHelper.getAccountOnWorkOrder';
import { refreshApex } from '@salesforce/apex';

export default class CrmMessagingMessageComponent extends LightningElement {
    showmodal = false;
    showtaskmodal = false;
    activeSectionMessage = '';
    threads;
    singlethread;
    _threadsforRefresh;
    @api recordId;
    @api singleThread;
    @api showClose;
    setCardTitle;
    hasError = false;
    @api englishTextTemplate;

    @api textTemplate; //Support for conditional text template

    @wire(getThreads, { recordId: '$recordId', singleThread: '$singleThread' }) //Calls apex and extracts messages related to this record
    wiredThreads(result) {
        this._threadsforRefresh = result;

        if (result.error) {
            this.error = result.error;
            this.hasError = true;
            console.log(JSON.stringify(result.error, null, 2));
        } else if (result.data) {
            this.threads = result.data;
        }
    }

    accountId;
    accountResult;
    @wire(getAccountOnRequest, { recordId: '$recordId' })
    wiredAccount(result) {
        this.accountResult = result;
        if (result.data) {
            this.accountId = result.data;
        }
    }

    handlenewpressed() {
        if (this.accountId == undefined) {
            getAccountOnWorkOrder({ recordId: this.recordId })
                .then((result) => {
                    this.accountId = result;
                    createThread({ recordId: this.recordId, accountId: this.accountId })
                        .then(() => {
                            return refreshApex(this._threadsforRefresh);
                        })
                        .catch((error) => {});
                })
                .catch((error) => {});
        } else {
            createThread({ recordId: this.recordId, accountId: this.accountId })
                .then(() => {
                    return refreshApex(this._threadsforRefresh);
                })
                .catch((error) => {});
        }
    }

    get showSpinner() {
        return !this.threads && !this.hasError;
    }

    get shownewbutton() {
        return this.threads && this.threads.length == 0 && this.recordId;
    }

    get cardTitle() {
        return this.setCardTitle ?? (this.singleThread === true ? 'Samtale' : 'Samtaler');
    }

    @api
    set cardTitle(cardTitle) {
        this.setCardTitle = cardTitle;
    }

    handleEnglishEvent(event) {
        const englishEvent = new CustomEvent('englisheventtwo', {
            detail: event.detail
        });
        this.dispatchEvent(englishEvent);
    }
    connectedCallback() {
        if (this.threads?.length > 0) {
            markAsReadByNav({ threadId: this.threads[0]?.Id });
        }
    }
}
