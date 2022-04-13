import { LightningElement, track } from 'lwc';

export default class hot_freelanceProfileWrapper extends LightningElement {
    @track breadcrumbs = [ 
        {
            label: 'Tolketjenesten',
            href: ''
        },
        {
            label: 'Frilanstolk min side',
            href: 'frilanstolk-min-side'
        }
    ];
}
