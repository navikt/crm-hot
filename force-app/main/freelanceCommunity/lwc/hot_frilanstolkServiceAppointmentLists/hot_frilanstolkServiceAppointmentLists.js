import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';

export default class Hot_frilanstolkServiceAppointmentLists extends NavigationMixin(LightningElement) {
    @track filters = [];
    @track records = [];
    @track checkedRows = [];

    breadcrumbs = [
        {
            label: 'Tolketjenesten',
            href: ''
        },
        {
            label: 'Oppdrag',
            href: 'mine-oppdrag'
        }
    ];

    handleFilters(event) {
        this.filters = event.detail;
    }
    handleRecords(event) {
        this.records = event.detail;
    }
    handleRowChecked(event) {
        this.checkedRows = event.detail;
    }

    recordId;
    @track urlStateParameters;
    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference && Object.keys(currentPageReference.state).length > 0) {
            this.urlStateParameters = { ...currentPageReference.state };
            this.updateTab({ target: { dataset: { id: this.urlStateParameters.list } } });
            this.recordId = this.urlStateParameters.id;
        } else {
            this.updateTab({ target: { dataset: { id: 'open' } } });
        }
    }
    setActiveTabMobile(event) {
        this.setActiveTab({ target: { dataset: { id: event.detail.name } } });
    }

    setActiveTab(event) {
        this.updateTab(event);
        this.updateURL();
    }
    updateTab(event) {
        for (let tab of this.tabs) {
            tab.selected = false;
            this.tabMap[tab.name] = false;
            if (tab.name === event.target.dataset.id) {
                tab.selected = true;
                this.urlStateParameterList = tab.name;
                this.activeTab = tab.name;
                this.tabMap[tab.name] = true;
            }
        }
        this.updateTabStyle();
    }
    @track urlStateParameterList = '';
    updateURL() {
        let baseURL = window.location.protocol + '//' + window.location.host + window.location.pathname;
        if (this.urlStateParameterList !== '') {
            baseURL += '?list=' + this.urlStateParameterList;
        }
        window.history.pushState({ path: baseURL }, '', baseURL);
    }

    goBack() {
        let res = this.template.querySelector('[data-name="' + this.activeTab + '"]').goBack();
        if (!res.id) {
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: {
                    pageName: 'home'
                }
            });
        }
        if (res.id && this.activeTab === res.tab) {
            this.updateURL();
        }
    }

    @track tabs = [
        { name: 'open', label: 'Ledige oppdrag', selected: false },
        { name: 'interested', label: 'Påmeldte oppdrag', selected: false },
        { name: 'my', label: 'Mine oppdrag', selected: false },
        { name: 'wageClaim', label: 'Ledig på lønn', selected: false }
    ];

    @track tabMap = {
        open: false,
        interested: false,
        my: false,
        wageClaim: false
    };

    renderedCallback() {
        this.updateTabStyle();
    }
    updateTabStyle() {
        this.template.querySelectorAll('button.tab').forEach((element) => {
            element.classList.remove('tab_active');
            if (element.dataset.id === this.activeTab) {
                element.classList.add('tab_active');
            }
        });
    }

    applyFilter(event) {
        this.filters = event.detail.filterArray;
        let recordListLength = this.template.querySelector('[data-name="' + this.activeTab + '"]').applyFilter(event);
        return recordListLength;
    }

    sendFilteredRecordsLength(event) {
        let recordListLength = this.applyFilter(event);
        this.template.querySelector('c-list-filters-button').setFilteredRecordsLength(recordListLength);
    }

    isDetails = false;
    handleDetails(event) {
        this.isDetails = event.detail;
        if (!this.isDetails) {
            this.recordId = undefined;
        }
    }
}
