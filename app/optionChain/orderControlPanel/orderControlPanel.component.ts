import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { OptionTradingService } from './../../services/opt-trading.service';

import { OptionOrder } from './../../beans/optionOrder';

import { StrategyComponent } from './../strategy/strategy.component';
import { ModeControlComponent } from './../modeControl/modeControl.component';

@Component({
    selector: '[option-chain-order-control-panel]',
    templateUrl: 'app/optionChain/orderControlPanel/orderControlPanel.component.html',
    directives : [StrategyComponent, ModeControlComponent]
})

export class OrderControlPanelComponent {

    @Input() symbol: string;

    constructor(private tradeService: OptionTradingService) {
    }
    decreaseStrikePrice(){
        let orders:OptionOrder[] = this.tradeService.getOrders(this.symbol), self = this;
        orders.forEach(function(order){
            //todo : decrease strike price
            self.tradeService.updateOrder(order.id, self.symbol, order);
        });
    }
    increaseStrikePrice(){
        let orders:OptionOrder[] = this.tradeService.getOrders(this.symbol), self = this;
        orders.forEach(function(order){
            //todo : increase strike price
            self.tradeService.updateOrder(order.id, self.symbol, order);
        });
    }
    decreaseQuantity(){}
    increaseQuantity(){}
    decreaseExpDate(){}
    increaseExpDate(){}
    swap(){}
    deleteAll(){}
}
