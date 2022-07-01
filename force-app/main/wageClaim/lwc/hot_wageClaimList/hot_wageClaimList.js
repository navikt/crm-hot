import { LightningElement, wire, track, api } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getMyWageClaims from '@salesforce/apex/HOT_WageClaimListController.getMyWageClaims';
//import retractAvailability from '@salesforce/apex/HOT_WageClaimListController.retractAvailability';
import { columns, mobileColumns } from './columns';
import { formatRecord } from 'c/datetimeFormatter';

export default class Hot_wageClaimList extends LightningElement {
    @track columns = [];
    setColumns() {
        if (window.screen.width > 576) {
            this.columns = columns;
        } else {
            this.columns = mobileColumns;
        }
    }

    noWageClaims = false;
    @track wageClaims = [];
    @track allWageClaimsWired = [];
    wiredWageClaimsResult;
    @wire(getMyWageClaims)
    wiredWageClaims(result) {
        this.wiredWageClaimsResult = result;
        if (result.data) {
            this.allWageClaimsWired = result.data;
            this.noWageClaims = this.allWageClaimsWired.length === 0;
            this.error = undefined;
            let tempRecords = [];
            for (let record of result.data) {
                tempRecords.push(formatRecord(Object.assign({}, record), this.datetimeFields));
            }
            this.wageClaims = tempRecords;
        } else if (result.error) {
            this.error = result.error;
            this.allWageClaimsWired = undefined;
        }
    }

    datetimeFields = [{ name: 'StartAndEndDate', type: 'datetimeinterval', start: 'StartTime__c', end: 'EndTime__c' }];
    connectedCallback() {
        this.setColumns();
        refreshApex(this.wiredWageClaimsResult);
    }

    @track wageClaim;
    isWageClaimDetails = false;
    goToRecordDetails(result) {
        window.scrollTo(0, 0);
        let recordId = result.detail.Id;
        this.urlStateParameterId = recordId;
        this.isWageClaimDetails = this.urlStateParameterId !== '';
        for (let wageClaim of this.wageClaims) {
            if (recordId === wageClaim.Id) {
                this.wageClaim = wageClaim;
            }
        }
        this.updateURL();
    }

    @track urlStateParameterId = '';
    updateURL() {
        let baseURL = window.location.protocol + '//' + window.location.host + window.location.pathname;
        if (this.urlStateParameterId !== '') {
            baseURL += '?list=wageClaim' + '&id=' + this.urlStateParameterId;
        }
        window.history.pushState({ path: baseURL }, '', baseURL);
    }

    @api goBack() {
        let recordIdToReturn = this.urlStateParameterId;
        this.urlStateParameterId = '';
        this.isWageClaimDetails = false;
        return { id: recordIdToReturn, tab: 'wageClaim' };
    }

    /*retractAvailability(row) {
        if (
            confirm(
                'Er du sikker på at du vil fjerne tilgjengeligheten din for dette tidspunktet? Du vil da ikke ha krav på lønn.'
            )
        ) {
            try {
                retractAvailability({ recordId: row.Id }).then(() => {
                    refreshApex(this.wiredWageClaimsResult);
                });
            } catch (error) {
                alert(JSON.stringify(error));
            }
        }
    }*/
    @api
    getFilters() {}
}
