import { LightningElement, track, api } from 'lwc';

export default class Table extends LightningElement {
    @api columns;
    @track recordsToShow;

    @api
    showRecords(records) {
        let recordsToShow = [];
        for (let record of records) {
            let fields = [];
            for (let column of this.columns) {
                let field = {
                    name: column.name,
                    value: record[column.name],
                    svg: column.svg
                };
                fields.push(field);
            }
            recordsToShow.push({
                id: record.Id,
                fields: fields
            });
        }
        this.recordsToShow = recordsToShow;
        console.log(JSON.stringify(this.recordsToShow));
        console.log(JSON.stringify(this.columns));
    }

    handleOnRowClick(result) {
        const eventToSend = new CustomEvent('rowclick', { detail: result.detail });
        this.dispatchEvent(eventToSend);
    }
}
