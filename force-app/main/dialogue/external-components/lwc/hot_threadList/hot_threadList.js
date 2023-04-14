import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getMyThreads from '@salesforce/apex/HOT_ThreadListController.getMyThreads';
import getContactId from '@salesforce/apex/HOT_MessageHelper.getUserContactId';
import { refreshApex } from '@salesforce/apex';
import HOT_DispatcherConsoleOverride from '@salesforce/resourceUrl/HOT_DispatcherConsoleOverride';

export default class Hot_threadList extends NavigationMixin(LightningElement) {
    userContactId;
    breadcrumbs = [
        {
            label: 'Tolketjenesten',
            href: ''
        },
        {
            label: 'Mine samtaler',
            href: 'mine-samtaler'
        }
    ];

    iconByValue = {
        false: {
            icon: 'Information',
            fill: '',
            ariaLabel: 'Du har nye meldinger'
        },
        true: {
            icon: 'SuccessFilled',
            fill: 'Green',
            ariaLabel: 'Ingen nye meldinger'
        }
    };

    @track columns = [
        {
            label: 'Tema',
            name: 'HOT_Subject__c',
            type: 'text'
        },
        {
            label: 'Status',
            name: 'read',
            type: 'boolean',
            svg: true
        }
    ];
    @track tabs = [
        { name: 'mythreads', label: 'Med formidler', selected: true, hasUnread: false },
        { name: 'interpreterthreads', label: 'Tolk-Bruker', selected: false, hasUnread: false }
    ];

    @track tabMap = {
        mythreads: true,
        interpreterthreads: false
    };

    setActiveTabMobile(event) {
        this.setActiveTab({ target: { dataset: { id: event.detail.name } } });
    }

    setActiveTab(event) {
        this.updateTab(event);
    }
    updateTab(event) {
        for (let tab of this.tabs) {
            tab.selected = false;
            this.tabMap[tab.name] = false;
            if (tab.name === event.target.dataset.id) {
                tab.selected = true;
                this.activeTab = tab.name;
                this.tabMap[tab.name] = true;
                if (this.activeTab == 'mythreads') {
                    this.showMythreads = true;
                    this.showInterpreterthreads = false;
                    this.showOrderthreads = false;
                    this.showWageClaimthreads = false;
                }
                if (this.activeTab == 'interpreterthreads') {
                    this.showMythreads = false;
                    this.showInterpreterthreads = true;
                    this.showOrderthreads = false;
                    this.showWageClaimthreads = false;
                }
                if (this.activeTab == 'orderThreads') {
                    this.showMythreads = false;
                    this.showInterpreterthreads = false;
                    this.showOrderthreads = true;
                    this.showWageClaimthreads = false;
                }
                if (this.activeTab == 'wageClaimThreads') {
                    this.showMythreads = false;
                    this.showInterpreterthreads = false;
                    this.showOrderthreads = false;
                    this.showWageClaimthreads = true;
                }
            }
        }
        sessionStorage.setItem('activeMessageList', this.activeTab);
        this.updateTabStyle();
    }
    openThread(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.detail.Id,
                objectApiName: 'Thread__c',
                actionName: 'view'
            }
        });
    }
    @track threads;
    @track interpreterThreads;
    @track orderThreads;
    @track wageClaimThreads;
    @track unmappedThreads;
    @track unmappedInterpreterThreads;
    @track unmapperOrderThreads;
    @track unmappedWageClaimThreads;

    showMythreads = true;
    showInterpreterthreads = false;
    showOrderthreads = false;
    showWageClaimthreads = false;
    noThreads = false;
    noInterpreterThreads = false;
    noOrderThreads = false;
    noWageClaimThreads = false;
    ordererThreadsExisting = 0;
    wageClaimThreadsExisting = 0;

    wiredThreadsResult;
    @wire(getMyThreads)
    wiredThreads(result) {
        this.wiredThreadsResult = result;
        if (result.data) {
            getContactId({})
                .then((contactId) => {
                    this.userContactId = contactId;
                    this.unmappedThreads = [];
                    this.threads = [];
                    this.unmappedInterpreterThreads = [];
                    this.unmapperOrderThreads = [];
                    this.unmappedWageClaimThreads = [];

                    result.data.forEach((element) => {
                        if (element.CRM_Type__c == 'HOT_BRUKER-TOLK') {
                            this.unmappedInterpreterThreads.push(element);
                        }
                        if (
                            element.CRM_Type__c == 'HOT_BRUKER-FORMIDLER' ||
                            element.CRM_Type__c == 'HOT_TOLK-FORMIDLER'
                        ) {
                            this.unmappedThreads.push(element);
                        }
                        if (element.CRM_Type__c == 'HOT_BESTILLER-FORMIDLER') {
                            this.unmapperOrderThreads.push(element);
                            this.ordererThreadsExisting++;
                        }
                        if (element.CRM_Type__c == 'HOT_TOLK-RESSURSKONTOR') {
                            this.unmappedWageClaimThreads.push(element);
                            this.wageClaimThreadsExisting++;
                        }
                    });
                    if (this.ordererThreadsExisting > 0) {
                        if (this.tabs.some((tab) => tab.name === 'orderThreads')) {
                        } else {
                            this.tabs.push({
                                name: 'orderThreads',
                                label: 'Annen bestiller',
                                selected: false,
                                hasUnread: false
                            });
                        }
                    }
                    if (this.wageClaimThreadsExisting > 0) {
                        if (this.tabs.some((tab) => tab.name === 'wageClaimThreads')) {
                        } else {
                            this.tabs.push({
                                name: 'wageClaimThreads',
                                label: 'Med ressurskontor',
                                selected: false,
                                hasUnread: false
                            });
                        }
                    }
                    this.threads = this.unmappedThreads.map((x) => ({
                        ...x,
                        read: !String(x.HOT_Thread_read_by__c).includes(contactId) ? false : true
                    }));
                    this.interpreterThreads = this.unmappedInterpreterThreads.map((x) => ({
                        ...x,
                        read: !String(x.HOT_Thread_read_by__c).includes(contactId) ? false : true
                    }));
                    this.orderThreads = this.unmapperOrderThreads.map((x) => ({
                        ...x,
                        read: !String(x.HOT_Thread_read_by__c).includes(contactId) ? false : true
                    }));
                    this.wageClaimThreads = this.unmappedWageClaimThreads.map((x) => ({
                        ...x,
                        read: !String(x.HOT_Thread_read_by__c).includes(contactId) ? false : true
                    }));

                    this.noThreads = this.threads.length === 0;
                    this.noInterpreterThreads = this.interpreterThreads.length === 0;
                    this.noOrderThreads = this.orderThreads.length === 0;
                    this.noWageClaimThreads = this.wageClaimThreads.length === 0;

                    //sorting, unread first
                    this.threads.sort((a, b) => {
                        if (a.read === b.read) {
                            return 0;
                        }
                        if (a.read === false) {
                            return -1;
                        }
                        return 1;
                    });
                    this.interpreterThreads.sort((a, b) => {
                        if (a.read === b.read) {
                            return 0;
                        }
                        if (a.read === false) {
                            return -1;
                        }
                        return 1;
                    });
                    this.orderThreads.sort((a, b) => {
                        if (a.read === b.read) {
                            return 0;
                        }
                        if (a.read === false) {
                            return -1;
                        }
                        return 1;
                    });
                    this.wageClaimThreads.sort((a, b) => {
                        if (a.read === b.read) {
                            return 0;
                        }
                        if (a.read === false) {
                            return -1;
                        }
                        return 1;
                    });

                    //List 1 unread messages
                    let foundUnreadDispatcherThreads = false;

                    for (let i = 0; i < this.threads.length; i++) {
                        const thread = this.threads[i];
                        if (thread.read == false) {
                            foundUnreadDispatcherThreads = true;
                            break;
                        }
                    }
                    if (foundUnreadDispatcherThreads) {
                        this.tabs = this.tabs.map((tab) => {
                            if (tab.name === 'mythreads') {
                                return { ...tab, hasUnread: true };
                            }
                            return tab;
                        });
                    } else {
                        this.tabs = this.tabs.map((tab) => {
                            if (tab.name === 'mythreads') {
                                return { ...tab, hasUnread: false };
                            }
                            return tab;
                        });
                    }
                    //List 2 unread messages
                    let foundUnreadInterpreterThreads = false;

                    for (let i = 0; i < this.interpreterThreads.length; i++) {
                        const thread2 = this.interpreterThreads[i];
                        if (thread2.read == false) {
                            foundUnreadInterpreterThreads = true;
                            break;
                        }
                    }
                    if (foundUnreadInterpreterThreads) {
                        this.tabs = this.tabs.map((tab) => {
                            if (tab.name === 'interpreterthreads') {
                                return { ...tab, hasUnread: true };
                            }
                            return tab;
                        });
                    } else {
                        this.tabs = this.tabs.map((tab) => {
                            if (tab.name === 'interpreterthreads') {
                                return { ...tab, hasUnread: false };
                            }
                            return tab;
                        });
                    }
                    //List 3 unread messages

                    let foundUnreadOrdererThreads = false;

                    for (let i = 0; i < this.orderThreads.length; i++) {
                        const thread3 = this.orderThreads[i];
                        if (thread3.read == false) {
                            foundUnreadOrdererThreads = true;
                            break;
                        }
                    }
                    if (foundUnreadOrdererThreads) {
                        this.tabs = this.tabs.map((tab) => {
                            if (tab.name === 'orderThreads') {
                                return { ...tab, hasUnread: true };
                            }
                            return tab;
                        });
                    } else {
                        this.tabs = this.tabs.map((tab) => {
                            if (tab.name === 'orderThreads') {
                                return { ...tab, hasUnread: false };
                            }
                            return tab;
                        });
                    }
                    //List 4 unread messages

                    let foundUnreadwageClaimThreads = false;

                    for (let i = 0; i < this.wageClaimThreads.length; i++) {
                        const thread4 = this.wageClaimThreads[i];
                        if (thread4.read == false) {
                            foundUnreadwageClaimThreads = true;
                            break;
                        }
                    }
                    if (foundUnreadwageClaimThreads) {
                        this.tabs = this.tabs.map((tab) => {
                            if (tab.name === 'wageClaimThreads') {
                                return { ...tab, hasUnread: true };
                            }
                            return tab;
                        });
                    } else {
                        this.tabs = this.tabs.map((tab) => {
                            if (tab.name === 'wageClaimThreads') {
                                return { ...tab, hasUnread: false };
                            }
                            return tab;
                        });
                    }
                })

                .catch((error) => {
                    //Apex error
                });
            this.activeTab = 'mythreads';
        }
    }

    get isMobile() {
        return window.screen.width < 576;
    }

    connectedCallback() {
        refreshApex(this.wiredThreadsResult);
    }
    renderedCallback() {
        if (sessionStorage.getItem('activeMessageList') != null) {
            this.updateTab({ target: { dataset: { id: sessionStorage.getItem('activeMessageList') } } });
        } else {
            this.updateTab({ target: { dataset: { id: 'mythreads' } } });
        }
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

    goBack() {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                pageName: 'home'
            }
        });
    }
}
