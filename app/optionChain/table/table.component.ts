import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit, ElementRef, ViewChild, OnChanges } from '@angular/core';

import { OptionSymbol }        from './../../beans/optionSymbol';
import { OptionOrder }        from './../../beans/optionOrder';

import { Constants }        from './../../constants/constants';

import { OptionSymbolService } from './../../services/opt-symbol.service';
import { OptionTradingService } from './../../services/opt-trading.service';
import { PriceService } from './../../services/price.service';

@Component({
    selector: '[option-chain-table]',
    templateUrl: 'app/optionChain/table/table.component.html'
})

export class TableComponent implements AfterViewInit, OnChanges {

    @Input() symbol: string;
    @Input() mode: string;
    @Input() orderType: string;

    @Output() mouseOverEvent: EventEmitter<Object> = new EventEmitter();

    symbols:OptionSymbol[] = [];
    orders:OptionOrder[] = [];

    expiryDates:string[];
    strikePrices:number[];
    symbolMap;
    orderMap;

    @ViewChild('buyDate') buyDateTable: ElementRef;
    @ViewChild('buyData') buyDataTable: ElementRef;
    @ViewChild('buyDatePercentage') buyDatePercentageTable: ElementRef;
    @ViewChild('midPrice') midPriceTable: ElementRef;
    @ViewChild('sellDate') sellDateTable: ElementRef;
    @ViewChild('sellData') sellDataTable: ElementRef;
    @ViewChild('sellDatePercentage') sellDatePercentageTable: ElementRef;

    constructor(private symbolService: OptionSymbolService, private tradeService: OptionTradingService, private priceService: PriceService) {
    }

    ngOnChanges(changes) {
        console.debug(changes);
        this.expiryDates = [];
        this.strikePrices = [];
        this.symbolMap = {};
        this.orderMap = {};
        this.orders = this.tradeService.getOrders(this.symbol);
        this.symbolService.getOptions(this.symbol).then(symbols => this.symbols = symbols).then(() => this.populateData());
    }

    ngAfterViewInit() {
        let tableHeight = 263.5;//todo : get height
        //var tableHeight = (parentContainer.height() - parentContainer.find('div.OC-HEADER').height() - midPriceTable.height()) / 2;

        this.buyDateTable.nativeElement.style.height = tableHeight;
        this.buyDataTable.nativeElement.style.height = tableHeight;
        this.buyDatePercentageTable.nativeElement.style.height = tableHeight;
        this.sellDateTable.nativeElement.style.height = tableHeight;
        this.sellDataTable.nativeElement.style.height = tableHeight;
        this.sellDatePercentageTable.nativeElement.style.height = tableHeight;
    }

    //todo : refactor
    populateData(): void{
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
                if(!self.symbolMap.hasOwnProperty(symbol.expiryDate)) {
                    self.symbolMap[symbol.expiryDate] = {};
                }
                if(!self.symbolMap[symbol.expiryDate].hasOwnProperty(symbol.strikePrice)) {
                    self.symbolMap[symbol.expiryDate][symbol.strikePrice] = symbol;
                }
            });
            this.orders.forEach(function(order){
                if(order.type === self.orderType){
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
                if(!self.symbolMap.hasOwnProperty(symbol.expiryDate)) {
                    self.symbolMap[symbol.expiryDate] = {};
                }
                if(!self.symbolMap[symbol.expiryDate].hasOwnProperty(symbol.strikePrice)) {
                    self.symbolMap[symbol.expiryDate][symbol.strikePrice] = symbol;
                }
            });
            if(this.mode === Constants.TradeMode){
                this.orders.forEach(function(order){
                    if(Constants.ANY === self.orderType ||  order.type === self.orderType){
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

    updateOrders():void{
        this.orders = this.tradeService.getOrders(this.symbol);
        this.populateData();
    }

    private static getStrikePrice(symbol : OptionSymbol):any{
        return symbol.strikePrice;
    }

    private static getExpiryDate(symbol : OptionSymbol):any{
        return {
            expiryDate : symbol.expiryDate,
            name: symbol.name,
            daysToExpire: OptionSymbolService.getDateDifferenceInDays(symbol)
        };
    }

    private getPrice(expiryDate : string, strikePrice : number, side:string) : number{
        let type:string = this.orderType;
        if(type === Constants.ANY){
            type = Constants.CALL;
        }
        return this.priceService.getOptionPrice(expiryDate, strikePrice, type, side);
    }

    private setSelectedOptionSymbol(expiryDate : string, strikePrice : number, side:string){
        let symbol : OptionSymbol = this.symbolMap[expiryDate][strikePrice];
        this.mouseOverEvent.emit({symbol : symbol, side : side});
    }

    scrollUp() : void{
        console.debug('TableComponent => scrollUp()');
        var height = 25;//todo : get height of cell
        this.buyDateTable.nativeElement.scrollTop -= height;
        this.buyDataTable.nativeElement.scrollTop -= height;
        this.buyDatePercentageTable.nativeElement.scrollTop -= height;
        this.sellDateTable.nativeElement.scrollTop -= height;
        this.sellDataTable.nativeElement.scrollTop -= height;
        this.sellDatePercentageTable.nativeElement.scrollTop -= height;
    }

    scrollDown() : void{
        console.debug('TableComponent => scrollDown()');
        var height = 25;//todo : get height of cell
        this.buyDateTable.nativeElement.scrollTop += height;
        this.buyDataTable.nativeElement.scrollTop += height;
        this.buyDatePercentageTable.nativeElement.scrollTop += height;
        this.sellDateTable.nativeElement.scrollTop += height;
        this.sellDataTable.nativeElement.scrollTop += height;
        this.sellDatePercentageTable.nativeElement.scrollTop += height;
    }

    private scrollLeft() : void{
        console.debug('TableComponent => scrollLeft()');
        var width = 72;//todo : get width of cell
        this.buyDataTable.nativeElement.scrollLeft -= width;
        this.midPriceTable.nativeElement.scrollLeft -= width;
        this.sellDataTable.nativeElement.scrollLeft -= width;
    }

    private scrollRight() : void{
        console.debug('TableComponent => scrollRight()');
        var width = 72;//todo : get width of cell
        this.buyDataTable.nativeElement.scrollLeft += width;
        this.midPriceTable.nativeElement.scrollLeft += width;
        this.sellDataTable.nativeElement.scrollLeft += width;

    }

    private onClick():void{
        //todo : create order in watch list
        console.debug('TableComponent => onClick()');
    }

}
