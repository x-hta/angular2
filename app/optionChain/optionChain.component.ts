import { Component, OnInit } from '@angular/core';

import { OptionSymbolService } from './../services/opt-symbol.service';
import { OptionTradingService } from './../services/opt-trading.service';

import { Symbol } from './../beans/symbol';
import { Order } from './../beans/order';

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
    symbols: Symbol[] = [];
    mode:string = 'w';
    constructor(private symbolService: OptionSymbolService, private tradeService: OptionTradingService) {
    }
    ngOnInit() {

    }
    decreaseStrikePrice(){
        let orders:Order[] = this.tradeService.getOrders(this.symbol), self = this;
        orders.forEach(function(order){
            //todo : decrease strike price
            self.tradeService.updateOrder(order.id, self.symbol, order);
        });
    }
    increaseStrikePrice(){
        let orders:Order[] = this.tradeService.getOrders(this.symbol), self = this;
        orders.forEach(function(order){
            //todo : increase strike price
            self.tradeService.updateOrder(order.id, self.symbol, order);
        });
    }
}
