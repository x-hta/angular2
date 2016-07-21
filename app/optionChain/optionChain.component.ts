import { Component, OnInit, ViewChild } from '@angular/core';

import { OptionSymbolService } from './../services/opt-symbol.service';
import { OptionTradingService } from './../services/opt-trading.service';

import { OptionOrder } from './../beans/optionOrder';
import { OptionSymbol } from './../beans/optionSymbol';

import { TableComponent } from './table/table.component';
import { PriceControlPanelComponent } from './priceControlPanel/priceControlPanel.component';
import { OrderWindowComponent } from './orderWindow/orderWindow.component';
import { OrderInformationComponent } from './orderInformation/orderInformation.component';
import { OrderControlPanelComponent } from './orderControlPanel/orderControlPanel.component';
import { OrderConfirmationComponent } from './orderConfirmation/orderConfirmation.component';
import { OrderComponent } from './order/order.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';

@Component({
    selector: 'option-chain',
    templateUrl: 'app/optionChain/optionChain.component.html',
    styleUrls : ['app/optionChain/optionChain.component.css'],
    directives: [TableComponent, PriceControlPanelComponent, OrderWindowComponent, OrderInformationComponent,
        OrderControlPanelComponent, OrderConfirmationComponent, OrderComponent, HeaderComponent, FooterComponent]
})

export class OptionChainComponent implements OnInit {

    symbol:string = 'SPDR S&P 500';
    mode:string = 'w';
    type:string = 'c';

    selectedOptionSymbol:OptionSymbol;
    selectedSide:string;

    @ViewChild(TableComponent)
    private tableComponent: TableComponent;

    constructor(private symbolService: OptionSymbolService, private tradeService: OptionTradingService) {
    }

    ngOnInit() {

    }

    handleOrderControlPanelEvent(event){
        console.log('OptionChainComponent : handleOrderControlPanelEvent() --> ' + event.msg + " : " + event.data);
        this.tableComponent.updateOrders();
    }

    handlePriceControlPanelEvent(event){
        console.log('OptionChainComponent : handlePriceControlPanelEvent() --> ' + event.msg + " : " + event.data);
        if(event.data === true){
            this.tableComponent.scrollUp();
        }else{
            this.tableComponent.scrollDown();
        }
    }

    handleModeChange(event){
        console.log('OptionChainComponent : handleModeChange() --> ' + event.msg + " : " + event.data);
        this.type = event.data;
    }

    handleTableMouseOverEvent(event){
        this.selectedOptionSymbol = event.symbol;
        this.selectedSide = event.side;
    }

    handleStrategyClick(event){
        console.log('OptionChainComponent : handleModeChange() --> ' + event.msg + " : " + JSON.stringify(event.data));
        this.tableComponent.updateOrders();
    }
}
