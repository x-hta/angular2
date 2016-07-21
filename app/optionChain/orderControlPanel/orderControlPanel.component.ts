import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { OptionSymbolService } from './../../services/opt-symbol.service';
import { OptionTradingService } from './../../services/opt-trading.service';

import { OptionSymbol } from './../../beans/optionSymbol';
import { OptionOrder } from './../../beans/optionOrder';

import { Constants } from './../../constants/constants';

import { StrategyComponent } from './../strategy/strategy.component';
import { ModeControlComponent } from './../modeControl/modeControl.component';

@Component({
    selector: '[option-chain-order-control-panel]',
    templateUrl: 'app/optionChain/orderControlPanel/orderControlPanel.component.html',
    directives : [StrategyComponent, ModeControlComponent]
})

export class OrderControlPanelComponent {

    @Input() symbol: string;
    @Input() orderType: string;

    @Output() event:EventEmitter<Object> = new EventEmitter();

    @Output() modeEvent:EventEmitter<Object> = new EventEmitter();

    constructor(private symbolService: OptionSymbolService, private tradeService: OptionTradingService) {
    }

    decreaseStrikePrice(){
        console.log("OrderControlPanelComponent : decreaseStrikePrice()");
        let orders:OptionOrder[] = this.tradeService.getOrders(this.symbol), self = this, updated : boolean = false;
        orders.forEach(function(order){
            if(self.orderType === Constants.ANY || self.orderType === order.type){
                let newOptionSymbol:OptionSymbol = self.symbolService.getPreviousOptionSymbolByStrikePrice(order.symbol);
                if(newOptionSymbol){
                    order.symbol = newOptionSymbol;
                    self.tradeService.updateOrder(order.id, self.symbol, order);
                    updated = true;
                }
            }
        });
        this.event.emit({msg : "decreaseStrikePrice", data : updated});
    }

    increaseStrikePrice(){
        console.log("OrderControlPanelComponent : increaseStrikePrice()");
        let orders:OptionOrder[] = this.tradeService.getOrders(this.symbol), self = this, updated : boolean = false;
        orders.forEach(function(order){
            if(self.orderType === Constants.ANY || self.orderType === order.type){
                let newOptionSymbol:OptionSymbol = self.symbolService.getPreviousOptionSymbolByStrikePrice(order.symbol);
                if (newOptionSymbol) {
                    order.symbol = newOptionSymbol;
                    self.tradeService.updateOrder(order.id, self.symbol, order);
                    updated = true;
                }
            }
        });
        this.event.emit({msg : "increaseStrikePrice", data : updated});
    }

    decreaseQuantity(){
        console.log("OrderControlPanelComponent : decreaseQuantity()");
        let orders:OptionOrder[] = this.tradeService.getOrders(this.symbol), self = this, updated : boolean = false;
        orders.forEach(function(order){
            if(self.orderType === Constants.ANY || self.orderType === order.type) {
                if(order.quantity > 1){
                    order.quantity--;
                    self.tradeService.updateOrder(order.id, self.symbol, order);
                    updated = true;
                }
            }
        });
        this.event.emit({msg : "decreaseQuantity", data : updated});
    }

    increaseQuantity(){
        console.log("OrderControlPanelComponent : increaseQuantity()");
        let orders:OptionOrder[] = this.tradeService.getOrders(this.symbol), self = this, updated : boolean = false;
        orders.forEach(function(order){
            if(self.orderType === Constants.ANY || self.orderType === order.type) {
                order.quantity++;
                self.tradeService.updateOrder(order.id, self.symbol, order);
                updated = true;
            }
        });
        this.event.emit({msg : "increaseQuantity", data : updated});
    }

    decreaseExpDate(){
        console.log("OrderControlPanelComponent : decreaseExpDate()");
        let orders:OptionOrder[] = this.tradeService.getOrders(this.symbol), self = this, updated : boolean = false;
        orders.forEach(function(order){
            if(self.orderType === Constants.ANY || self.orderType === order.type){
                let newOptionSymbol:OptionSymbol = self.symbolService.getPreviousOptionSymbolByStrikePrice(order.symbol);
                if (newOptionSymbol) {
                    order.symbol = newOptionSymbol;
                    self.tradeService.updateOrder(order.id, self.symbol, order);
                    updated = true;
                }
            }
        });
        this.event.emit({msg : "decreaseExpDate", data : updated});
    }

    increaseExpDate(){
        console.log("OrderControlPanelComponent : increaseExpDate()");
        let orders:OptionOrder[] = this.tradeService.getOrders(this.symbol), self = this, updated : boolean = false;
        orders.forEach(function(order){
            if(self.orderType === Constants.ANY || self.orderType === order.type){
                let newOptionSymbol:OptionSymbol = self.symbolService.getPreviousOptionSymbolByStrikePrice(order.symbol);
                if (newOptionSymbol) {
                    order.symbol = newOptionSymbol;
                    self.tradeService.updateOrder(order.id, self.symbol, order);
                    updated = true;
                }
            }
        });
        this.event.emit({msg : "increaseExpDate", data : updated});
    }

    swap(){
        console.log("OrderControlPanelComponent : swap()");
        let orders:OptionOrder[] = this.tradeService.getOrders(this.symbol), self = this, updated : boolean = false;
        orders.forEach(function(order){
            if(self.orderType === Constants.ANY || self.orderType === order.type) {
                if (order.side === Constants.BUY) {
                    order.side = Constants.SELL;
                } else {
                    order.side = Constants.BUY;
                }
                self.tradeService.updateOrder(order.id, self.symbol, order);
                updated = true;
            }
        });
        this.event.emit({msg : "swap", data : updated});
    }

    deleteAll(){
        console.log("OrderControlPanelComponent : deleteAll()");
        let orders:OptionOrder[] = this.tradeService.getOrders(this.symbol), self = this, updated : boolean = false;
        orders.forEach(function(order){
            if(self.orderType === Constants.ANY || self.orderType === order.type) {
                self.tradeService.deleteOrder(order.id, self.symbol);
                updated = true;
            }
        });
        this.event.emit({msg : "deleteAll", data : updated});
    }

    updateModeChange(event){
        this.modeEvent.emit(event);
    }
}
