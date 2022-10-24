import { LightningElement, wire, api, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import securityMeasures from '@salesforce/schema/HOT_Request__c.Account__r.CRM_Person__r.INT_SecurityMeasures__c';
import reservations from '@salesforce/schema/HOT_Request__c.Account__r.CRM_Person__r.HOT_Reservations__c';
import isDeceased from '@salesforce/schema/HOT_Request__c.Person__r.INT_IsDeceased__c';
import ACCOUNT_ID from '@salesforce/schema/HOT_Request__c.Account__c';
import getOverlappingRecordsFromRequestId from '@salesforce/apex/HOT_DuplicateHandler.getOverlappingRecordsFromRequestId';
import { formatDate } from 'c/datetimeFormatter';

export default class Hot_warningBannerRequest extends LightningElement {
    @api recordId;
    @api accountId;
    @track record;
    @track isDeceased = true;

    @wire(getRecord, {
        recordId: '$recordId',
        fields: [securityMeasures, reservations, ACCOUNT_ID, isDeceased]
    })
    wiredGetRecord(result) {
        this.record = result;
        if (result.data) {
            this.getDuplicates();
        }
    }
    get hasisDeceased() {
        return getFieldValue(this.record.data, isDeceased);
    }

    get securityMeasures() {
        let secMeasures = JSON.parse(getFieldValue(this.record.data, securityMeasures));
        let securityMeasuresFormatted = [];
        secMeasures.forEach((sm) => {
            console.log(sm.tiltaksType);
            securityMeasuresFormatted.push(
                sm.beskrivelse +
                    ' (' +
                    sm.tiltaksType +
                    '), gyldig: ' +
                    formatDate(sm.gyldigFraOgMed) +
                    ' - ' +
                    formatDate(sm.gyldigTilOgMed)
            );
        });
        return securityMeasuresFormatted;
    }

    get hasSecurityMeasures() {
        return (
            getFieldValue(this.record.data, securityMeasures) != null &&
            getFieldValue(this.record.data, securityMeasures) != '[]'
        );
    }

    get reservations() {
        return getFieldValue(this.record.data, reservations);
    }

    get hasReservations() {
        return getFieldValue(this.record.data, reservations) != null;
    }

    @track duplicateRecords = [];
    @track hasDuplicates = false;
    @track hasSelfDuplicates = false;
    async getDuplicates() {
        let requestId = this.recordId;
        let accountId = getFieldValue(this.record.data, ACCOUNT_ID);
        let result = await getOverlappingRecordsFromRequestId({ accountId, requestId });
        this.duplicateRecords = [];
        this.hasSelfDuplicates = false;
        for (let record of result) {
            if (record.Id === this.recordId) {
                this.hasSelfDuplicates = true;
            } else {
                record.Link = '/lightning/r/' + record.Id + '/view';
                this.duplicateRecords.push(record);
            }
        }
        this.hasDuplicates = this.duplicateRecords.length > 0;
    }
}
