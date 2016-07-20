import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

import { Symbol }        from './../../beans/symbol';
import { Order }        from './../../beans/order';

import { Constants }        from './../../constants/constants';

import { OptionSymbolService } from './../../services/opt-symbol.service';
import { OptionTradingService } from './../../services/opt-trading.service';
import { PriceService } from './../../services/price.service';

@Component({
    selector: '[option-chain-table]',
    templateUrl: 'app/optionChain/table/table.component.html'
})

export class TableComponent implements OnInit, AfterViewInit {

    @Input() symbol: string;
    @Input() mode: string;
    @Input() orderType: string;

    symbols:Symbol[] = [];
    orders:Order[] = [];

    expiryDates:string[] = [];
    strikePrices:number[] = [];
    orderMap = {};

    @ViewChild('buyDate') buyDateTable: ElementRef;
    @ViewChild('buyData') buyDataTable: ElementRef;
    @ViewChild('buyDatePercentage') buyDatePercentageTable: ElementRef;
    @ViewChild('midPrice') midPriceTable: ElementRef;
    @ViewChild('sellDate') sellDateTable: ElementRef;
    @ViewChild('sellData') sellDataTable: ElementRef;
    @ViewChild('sellDatePercentage') sellDatePercentageTable: ElementRef;

    constructor(private symbolService: OptionSymbolService, private tradeService: OptionTradingService, private priceService: PriceService) {
    }

    ngOnInit() {
        this.orders = this.tradeService.getOrders(this.symbol);
        this.symbolService.getOptions(this.symbol).then(symbols => this.symbols = symbols).then(() => this.populateData());
    }

    ngAfterViewInit() {
        let tableHeight = 263.5;
        //var tableHeight = (parentContainer.height() - parentContainer.find('div.OC-HEADER').height() - midPriceTable.height()) / 2;

        this.buyDateTable.nativeElement.style.height = tableHeight;
        this.buyDataTable.nativeElement.style.height = tableHeight;
        this.buyDatePercentageTable.nativeElement.style.height = tableHeight;
        this.sellDateTable.nativeElement.style.height = tableHeight;
        this.sellDataTable.nativeElement.style.height = tableHeight;
        this.sellDatePercentageTable.nativeElement.style.height = tableHeight;
    }

    private populateData(): void{
        console.log('TableComponent => populateData()');
        let self = this, expiryDateArray:string[] = [];
        if(this.mode === Constants.WatchListMode){
            this.symbols.forEach(function(symbol){
                if(self.strikePrices.indexOf(symbol.strikePrice) === -1){
                    console.log('TableComponent => populateData() : add strike price');
                    self.strikePrices.push(TableComponent.getStrikePrice(symbol));
                }
                if(expiryDateArray.indexOf(symbol.expiryDate) === -1){
                    expiryDateArray.push(symbol.expiryDate);
                    console.log('TableComponent => populateData() : add expiry date');
                    self.expiryDates.push(TableComponent.getExpiryDate(symbol));
                }
            });
            this.orders.forEach(function(order){
                if(order.type === this.orderType){
                    if(!self.orderMap.hasOwnProperty(order.symbol.expiryDate)){
                        self.orderMap[order.symbol.expiryDate] = {};
                    }
                    if(!self.orderMap[order.symbol.expiryDate].hasOwnProperty(order.symbol.strikePrice)){
                        self.orderMap[order.symbol.expiryDate][order.symbol.strikePrice] = {};
                        self.orderMap[order.symbol.expiryDate][order.symbol.strikePrice][Constants.BUY] = [];
                        self.orderMap[order.symbol.expiryDate][order.symbol.strikePrice][Constants.SELL] = [];
                    }
                    console.log('TableComponent => populateData() : add order');
                    self.orderMap[order.symbol.expiryDate][order.symbol.strikePrice][order.side].push(order);
                }
            });
        }else{
            this.symbols.forEach(function(symbol){
                if(self.strikePrices.indexOf(symbol.strikePrice) === -1){
                    console.log('TableComponent => populateData() : add strike price');
                    self.strikePrices.push(TableComponent.getStrikePrice(symbol));
                }
            });
            if(this.mode === Constants.TradeMode){
                this.orders.forEach(function(order){
                    if(order.type === this.orderType){
                        if(expiryDateArray.indexOf(order.symbol.expiryDate) === -1){
                            expiryDateArray.push(order.symbol.expiryDate);
                            console.log('TableComponent => populateData() : add expiry date');
                            self.expiryDates.push(TableComponent.getExpiryDate(order.symbol));
                        }
                        if(!self.orderMap.hasOwnProperty(order.symbol.expiryDate)){
                            self.orderMap[order.symbol.expiryDate] = {};
                        }
                        if(!self.orderMap[order.symbol.expiryDate].hasOwnProperty(order.symbol.strikePrice)){
                            self.orderMap[order.symbol.expiryDate][order.symbol.strikePrice] = {};
                            self.orderMap[order.symbol.expiryDate][order.symbol.strikePrice][Constants.BUY] = [];
                            self.orderMap[order.symbol.expiryDate][order.symbol.strikePrice][Constants.SELL] = [];
                        }
                        console.log('TableComponent => populateData() : add order');
                        self.orderMap[order.symbol.expiryDate][order.symbol.strikePrice][order.side].push(order);
                    }
                });
            }else{
                this.orders.forEach(function(order){
                    if(expiryDateArray.indexOf(order.symbol.expiryDate) === -1){
                        expiryDateArray.push(order.symbol.expiryDate);
                        console.log('TableComponent => populateData() : add expiry date');
                        self.expiryDates.push(TableComponent.getExpiryDate(order.symbol));
                    }
                    if(!self.orderMap.hasOwnProperty(order.symbol.expiryDate)){
                        self.orderMap[order.symbol.expiryDate] = {};
                    }
                    if(!self.orderMap[order.symbol.expiryDate].hasOwnProperty(order.symbol.strikePrice)){
                        self.orderMap[order.symbol.expiryDate][order.symbol.strikePrice] = {};
                        self.orderMap[order.symbol.expiryDate][order.symbol.strikePrice][Constants.BUY] = [];
                        self.orderMap[order.symbol.expiryDate][order.symbol.strikePrice][Constants.SELL] = [];
                    }
                    console.log('TableComponent => populateData() : add order');
                    self.orderMap[order.symbol.expiryDate][order.symbol.strikePrice][order.side].push(order);
                });
            }
        }
    }

    private static getStrikePrice(symbol : Symbol):any{
        return symbol.strikePrice;
    }

    private static getExpiryDate(symbol : Symbol):any{
        return {
            expiryDate : symbol.expiryDate,
            name: symbol.name,
            daysToExpire: OptionSymbolService.getDateDifferenceInDays(symbol)
        };
    }

    private getPrice(expiryDate : string, strikePrice : number, side:string) : number{
        return this.priceService.getOptionPrice(expiryDate, strikePrice, this.orderType, side);
    }

    private scrollLeft() : void{
        console.debug('TableComponent => scrollLeft()');
    }

    private scrollRight() : void{
        console.debug('TableComponent => scrollRight()');
    }

}
