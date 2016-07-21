import { Injectable }    from '@angular/core';

import { EquitySymbol } from './../beans/equitySymbol';
import { OptionSymbol } from './../beans/optionSymbol';
import { Order } from './../beans/order';
import { OptionOrder } from './../beans/optionOrder';
import { StockOrder } from './../beans/stockOrder';
import { Condition } from './../beans/condition';
import { StrategyOrderInfo } from './../beans/strategyOrderInfo';

import { LocalStorageService } from './local-storage.service';
import { PriceService } from './price.service';
import { OptionSymbolFilterService } from './opt-symbol-filter.service';

import { Constants } from './../constants/constants';

import 'rxjs/add/operator/toPromise';

const OPTION_TYPE:string = "OPT";

@Injectable()
export class OptionTradingService {

    constructor(private storageService: LocalStorageService, private priceService : PriceService, private filterService : OptionSymbolFilterService) { }

    private static getId(symbol : string, type : string) : string{
        return "optionTradeService : " +  type + "~" + symbol;
    }

    //region option orders

    createOrderObject(symbol : OptionSymbol, type : string, subType : string, side : string, price : number, quantity : number) : OptionOrder {
        let order:OptionOrder = {
            id: Math.floor(Math.random() * (10000 - 500) + 500),
            symbol: symbol,
            type: type,
            subType: subType,
            side: side,
            price: price,
            quantity: quantity
        };
        let orders:OptionOrder[] = this.getOrders(symbol.underlyingSymbol);
        if (typeof orders === 'undefined') {
            orders = [];
        }
        orders.push(order);
        this.saveOrders(symbol.underlyingSymbol, orders);
        return order;
    }

    updateOrder(id : number, underlyingSymbol : string, newOrder : OptionOrder) : boolean{
        let orders:OptionOrder[] = this.getOrders(underlyingSymbol), success:boolean = false, orderIndex:number, updateOrder:OptionOrder;
        orders.forEach(function(order, index){
            if (typeof orderIndex === 'undefined' && order.id === id) {
                orderIndex = index;
                updateOrder = order;
            }
        });
        if (orderIndex && updateOrder) {
            Object.assign(updateOrder, newOrder);
            orders.splice(orderIndex, 1);
            orders.push(updateOrder);
            success = this.saveOrders(underlyingSymbol, orders);
        }
        return success;
    }

    deleteOrder(id : number, underlyingSymbol : string) : boolean{
        let orders:OptionOrder[] = this.getOrders(underlyingSymbol), orderIndex:number, success:boolean = false;
        orders.forEach(function(order, index){
            if (typeof orderIndex === 'undefined' && order.id === id) {
                orderIndex = index;
            }
        });

        if (orderIndex) {
            orders.splice(orderIndex, 1);
            success = this.saveOrders(underlyingSymbol, orders);
        } else {
            console.warn('order obj not in order store : ' + id + " sym : " + underlyingSymbol);
        }
        return success;
    }

    private saveOrders(underlyingSymbol : string, orders:OptionOrder[]){
        return this.storageService.save(OptionTradingService.getId(underlyingSymbol, OPTION_TYPE), orders);
    }

    getOrders(underlyingSymbol : string) : OptionOrder[] {
        let orders:OptionOrder[] = this.storageService.getData(OptionTradingService.getId(underlyingSymbol, OPTION_TYPE));
        if (typeof orders === 'undefined') {
            orders = [];
        }
        return orders;
    }

    //endregion

    //region stock orders

    private createStockOrderObject(symbol : EquitySymbol, side : string, price : number, quantity : number) : StockOrder {
        let order:StockOrder = {
            id: Math.floor(Math.random() * (10000 - 500) + 500),
            symbol: symbol,
            side: side,
            price: price,
            quantity: quantity
        };
        let orders:StockOrder[] = this.getStockOrders(symbol);
        if (typeof orders === 'undefined') {
            orders = [];
        }
        orders.push(order);
        this.saveStockOrders(symbol, orders);

        return order;
    }

    private saveStockOrders(symbol : EquitySymbol, orders:StockOrder[]):boolean{
        return this.storageService.save(OptionTradingService.getId(symbol.name, symbol.type), orders);
    }

    private getStockOrders(symbol : EquitySymbol) : StockOrder[] {
        let orders:StockOrder[] = this.storageService.getData(OptionTradingService.getId(symbol.name, symbol.type));
        if (typeof orders === 'undefined') {
            orders = [];
        }
        return orders;
    }

    //endregion

    private getUnderlyingSymbolPrice(symbol : EquitySymbol) : number{
        return this.priceService.getLastPrice(symbol);
    }

    private getOptionPrice(expiryDate : string, strikePrice : number, type : string, side : string) : number{
        return this.priceService.getOptionPrice(expiryDate, strikePrice, type, side);
    }

    private getOption(options : OptionSymbol[], expiryCondition : Condition, strikePriceCondition : Condition) : OptionSymbol{
        let validOptions:OptionSymbol[] = this.filterService.filter(options, expiryCondition, strikePriceCondition);
        let option : OptionSymbol;
        if (validOptions.length > 0) {
            if (validOptions.length === 1) {
                option = validOptions[0];
            } else {
                validOptions.forEach(function (value) {
                    if (typeof option === 'undefined') {
                        option = value;
                    } else {
                        if (strikePriceCondition.rule === 'lesser') {
                            if (option.strikePrice < value.strikePrice) {
                                option = value;
                            }
                        } else {
                            if (option.strikePrice > value.strikePrice) {
                                option = value;
                            }
                        }

                    }
                });
            }

        }
        return option;
    }

    private static getReturnObject(strategy : string, underlyingSymbol : EquitySymbol, orders : Order[],
                                   netPremiumPaid : number, netPremiumReceived : number, maxProfit : number, maxLoss : number) : StrategyOrderInfo{
        return {
            strategy : strategy,
            underlyingSymbol : underlyingSymbol,
            netPremiumPaid: netPremiumPaid,
            netPremiumReceived: netPremiumReceived,
            maxProfit: maxProfit,
            maxLoss: maxLoss,
            orders: orders
        };
    }

    private static getCondition(value : any, greater : boolean) : Condition {
        return {
            rule: greater ? 'greater' : 'lesser',
            value: value
        }
    }

    //region strategy

    //region ladder

    /**
     * Number of Option Order - 3
     * Order 1 - Buy 1 ITM Call: Buy 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Sell 1 ATM Call: Sell 1 Call Option with closest Strike Price lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 3 - Sell 1 OTM Call: Sell 1 Call Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Paid = Order 1 - (Order 2 + Order 3)
     * Max Profit = Strike Price of Order 2 - Strike Price of Order 1 - Net Premium Paid
     * Max Loss = …
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    longCallLadder(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumPaid:number = 0, maxProfit:number = 0,
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice : number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumPaid += orderPrice;
            maxProfit -= order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.CALL, Constants.ITM, Constants.BUY, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, false));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumPaid -= orderPrice;
            maxProfit += order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.ATM, Constants.SELL, orderPrice, 1));
        }

        let order3Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order3Symbol) {
            orderPrice = this.getOptionPrice(order3Symbol.expiryDate, order3Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumPaid -= orderPrice;
            orders.push(this.createOrderObject(order3Symbol, Constants.CALL, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        maxProfit -= netPremiumPaid;

        return OptionTradingService.getReturnObject('longCallLadder', underlyingSymbol, orders, netPremiumPaid, -1, maxProfit, -1);
    }

    /**
     * Number of Option Order - 3
     * Order 1 - Sell 1 ITM Call: Sell 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Buy 1 ATM Call: Buy 1 Call Option with closest Strike Price lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 3 - Buy 1 OTM Call: Buy 1 Call Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 1 - (Order 2 + Order 3)
     * Max Profit = …
     * Max Loss = Strike Price of Order 2 - Strike Price of Order 1 - Net Premium Received.
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    shortCallLadder(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumReceived:number = 0, maxLoss:number = 0, 
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice : number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumReceived += orderPrice;
            maxLoss -= order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.CALL, Constants.ITM, Constants.SELL, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, false));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumReceived -= orderPrice;
            maxLoss += order2Symbol.strikePrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.ATM, Constants.BUY, orderPrice, 1));
        }

        let order3Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order3Symbol) {
            orderPrice = this.getOptionPrice(order3Symbol.expiryDate, order3Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumReceived -= orderPrice;
            orders.push(this.createOrderObject(order3Symbol, Constants.CALL, Constants.OTM, Constants.BUY, orderPrice, 1));
        }

        maxLoss -= netPremiumReceived;

        return OptionTradingService.getReturnObject('shortCallLadder', underlyingSymbol, orders, -1, netPremiumReceived, -1, maxLoss);
    }

    /**
     * Number of Option Order - 3
     * Order 1 - Buy 1 ITM Put:    Buy 1 Put Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Sell 1 ATM Put: Sell 1 Put Option with closest Strike Price higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 3 - Sell 1 OTM Put: Sell 1 Call Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Paid = Order 1 - (Order 2 + Order 3)
     * Max Profit = Strike Price of Order 1 - Strike Price of Order 3 - Net Premium Paid
     * Max Loss = …
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    longPutLadder(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumPaid:number = 0, maxProfit:number = 0, 
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.PUT, Constants.BUY);
            netPremiumPaid += orderPrice;
            maxProfit += order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.PUT, Constants.ITM, Constants.BUY, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumPaid -= orderPrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ATM, Constants.SELL, orderPrice, 1));
        }

        let order3Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order3Symbol) {
            orderPrice = this.getOptionPrice(order3Symbol.expiryDate, order3Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumPaid -= orderPrice;
            maxProfit -= order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order3Symbol, Constants.PUT, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        maxProfit -= netPremiumPaid;

        return OptionTradingService.getReturnObject('longPutLadder', underlyingSymbol, orders, netPremiumPaid, -1, maxProfit, -1);
    }

    /**
     * Number of Option Order - 3
     * Order 1 - Sell 1 ITM Put: Sell 1 Put Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Buy 1 ATM Put:    Buy 1 Put Option with closest Strike Price higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 3 - Buy 1 OTM Put:    Buy 1 Put Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 1 - (Order 2 + Order 3)
     * Max Profit = …
     * Max Loss = Strike Price of Order 1 - Strike Price of Order 2 - Net Premium Received
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    shortPutLadder(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumReceived:number = 0, maxLoss:number = 0, 
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;
        
        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumReceived += orderPrice;
            maxLoss += order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.PUT, Constants.ITM, Constants.SELL, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.BUY);
            netPremiumReceived -= orderPrice;
            maxLoss -= order2Symbol.strikePrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ATM, Constants.BUY, orderPrice, 1));
        }

        let order3Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order3Symbol) {
            orderPrice = this.getOptionPrice(order3Symbol.expiryDate, order3Symbol.strikePrice, Constants.PUT, Constants.BUY);
            netPremiumReceived -= orderPrice;
            orders.push(this.createOrderObject(order3Symbol, Constants.PUT, Constants.OTM, Constants.BUY, orderPrice, 1));
        }

        maxLoss -= netPremiumReceived;

        return OptionTradingService.getReturnObject('shortPutLadder', underlyingSymbol, orders, -1, netPremiumReceived, -1, maxLoss);
    }

    //endregion

    //region guts

    /**
     * Number of Option Order - 2
     * Order 1 - Buy 1 ITM Call: Buy 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Buy 1 ITM Put:    Buy 1 Put Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Paid = Order 1 Price + Order 2 Price
     * Max Profit = …
     * Max Loss = Net Premium Paid + Strike Price of Order 2 - Strike Price of Order 1
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    longGuts(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumPaid:number = 0, maxLoss:number = 0, 
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumPaid += orderPrice;
            maxLoss -= order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.CALL, Constants.ITM, Constants.BUY, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.BUY);
            netPremiumPaid += orderPrice;
            maxLoss += order2Symbol.strikePrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ITM, Constants.BUY, orderPrice, 1));
        }

        maxLoss += netPremiumPaid;

        return OptionTradingService.getReturnObject('longGuts', underlyingSymbol, orders, netPremiumPaid, -1, -1, maxLoss);
    }

    /**
     * Number of Option Order - 2
     * Order 1 - Sell 1 ITM Call: Sell 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Sell 1 ITM Put: Sell 1 Put Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 1 Price + Order 2 Price
     * Max Profit = Net Premium Received + Strike Price of Order 2 - Strike Price of Order 1
     * Max Loss = …
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    shortGuts(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo {
        let orders:OptionOrder[] = [], netPremiumReceived:number = 0, maxProfit:number = 0, 
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumReceived += orderPrice;
            maxProfit -= order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.CALL, Constants.ITM, Constants.SELL, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumReceived += orderPrice;
            maxProfit += order2Symbol.strikePrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ITM, Constants.SELL, orderPrice, 1));
        }

        maxProfit += netPremiumReceived;

        return OptionTradingService.getReturnObject('shortGuts', underlyingSymbol, orders, -1, netPremiumReceived, maxProfit, -1);
    }

    //endregion

    //region straddle

    /**
     * Number of Options Orders - 2
     * Order 1 - Sell 1 ATM Call: Sell 1 Call Option with closest Strike Price lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Sell 1 ATM Put: Sell 1 Put Option with closest Strike Price higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 1 Price + Order 2 Price
     * Max Profit = Net Premium Received
     * Max Loss = …
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    shortStraddle(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumPaid:number = 0, expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, false));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumPaid += orderPrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.CALL, Constants.ATM, Constants.SELL, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumPaid += orderPrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ATM, Constants.SELL, orderPrice, 1));
        }

        return OptionTradingService.getReturnObject('shortStraddle', underlyingSymbol, orders, netPremiumPaid, -1, netPremiumPaid, -1);
    }

    //endregion

    //region ratio

    /**
     * Number of Option Orders - 3
     * Order 1 - Buy 1 ITM Call: Buy 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 & 3 - Sell 2 OTM Calls:    Sell 2 Call Options where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 2 Price + Order 3 Price - Order 1 Price
     * Max Profit = Strike Price of Order 2 - Strike Price of Order 1 + Net Premium Received
     * Max Loss = …
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    ratioSpread(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumReceived:number = 0, maxProfit:number = 0, 
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumReceived -= orderPrice;
            maxProfit -= order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.CALL, Constants.ITM, Constants.BUY, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumReceived += orderPrice;
            netPremiumReceived += orderPrice;
            maxProfit += order2Symbol.strikePrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.OTM, Constants.SELL, orderPrice, 1));
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        maxProfit += netPremiumReceived;

        return OptionTradingService.getReturnObject('ratioSpread', underlyingSymbol, orders, -1, netPremiumReceived, maxProfit, -1);
    }

    /**
     * Number of Option Orders - 3
     * Order 1 - Buy 1 ITM Put: Buy 1 Put Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 & 3 - Sell 2 OTM Puts: Sell 2 Put Options where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 2 + Order 3 - Order 1
     * Max Profit = Strike Price of Order 1 - Strike Price of Order 2 + Net Premium Received
     * Max Loss = …..
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    putRatioSpread(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumReceived:number = 0, maxProfit:number = 0, 
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.PUT, Constants.BUY);
            netPremiumReceived -= orderPrice;
            maxProfit += order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.PUT, Constants.ITM, Constants.BUY, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumReceived += orderPrice;
            netPremiumReceived += orderPrice;
            maxProfit -= order2Symbol.strikePrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.OTM, Constants.SELL, orderPrice, 1));
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        maxProfit += netPremiumReceived;

        return OptionTradingService.getReturnObject('putRatioSpread', underlyingSymbol, orders, -1, netPremiumReceived, maxProfit, -1);
    }

    /**
     * Number of Stock Orders - 1
     * Number of Option Orders - 2
     * Order 1 - 100 shares of Underlying Stock at current price
     * Order 2 & 3 - Sell 2 ATM Calls:    Sell 2 Call Options with closest Strike Price higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 2 Price + Order 3 Price
     * Max Profit = Net Premium Received
     * Max Loss = ….
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    ratioCallWrite(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:Order[] = [], netPremiumReceived:number = 0, expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        orders.push(this.createStockOrderObject(underlyingSymbol, Constants.BUY, underlyingPrice, 100));

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumReceived += orderPrice;
            netPremiumReceived += orderPrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.ATM, Constants.SELL, orderPrice, 1));
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.ATM, Constants.SELL, orderPrice, 1));
        }

        return OptionTradingService.getReturnObject('ratioCallWrite', underlyingSymbol, orders, -1, netPremiumReceived, netPremiumReceived, -1);
    }

    /**
     * Number of Stock Orders - 1
     * Number of Option Orders - 2
     * Order 1 - Sell (Short) 100 shares of Underlying Stock at current price
     * Order 2 & 3 - Sell 2 ATM Puts:    Sell 2 Put Options with closest Strike Price higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 2 Price + Order 3 Price
     * Max Profit = Net Premium Received
     * Max Loss = …
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    ratioPutWrite(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:Order[] = [], netPremiumReceived:number = 0, expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        orders.push(this.createStockOrderObject(underlyingSymbol, Constants.SELL, underlyingPrice, 100));

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumReceived += orderPrice;
            netPremiumReceived += orderPrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ATM, Constants.SELL, orderPrice, 1));
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ATM, Constants.SELL, orderPrice, 1));
        }

        return OptionTradingService.getReturnObject('ratioPutWrite', underlyingSymbol, orders, -1, netPremiumReceived, netPremiumReceived, -1);
    }

    /**
     * Number of Stock Orders - 1
     * Number of Option Orders - 2
     * Order 1 - Buy 100 shares of Underlying Stock at current price
     * Order 2 - Sell 1 ITM Call: Sell 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 3 - Sell 1 OTM Call: Sell 1 Call Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 2 Price + Order 3 Price
     * Max Profit = Net Premium Received + Strike Price of Order 2 - (Purchase Price of Order 1 x 100 shares)
     * Max Loss = …
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    variableRatioWrite(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:Order[] = [], netPremiumReceived:number = 0, maxProfit:number = 0, 
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        orders.push(this.createStockOrderObject(underlyingSymbol, Constants.BUY, underlyingPrice, 100));

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.CALL, Constants.SELL);
            maxProfit += order2Symbol.strikePrice;
            netPremiumReceived += orderPrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.ITM, Constants.SELL, orderPrice, 1));
        }

        let order3Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order3Symbol) {
            orderPrice = this.getOptionPrice(order3Symbol.expiryDate, order3Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumReceived += orderPrice;
            orders.push(this.createOrderObject(order3Symbol, Constants.CALL, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        maxProfit += netPremiumReceived - (underlyingPrice * 100);

        return OptionTradingService.getReturnObject('variableRatioWrite', underlyingSymbol, orders, -1, netPremiumReceived, maxProfit, -1);
    }

    //endregion

    //region butterfly

    /**
     * Number of Option Orders - 4
     * Order 1 - Buy 1 ITM Call:    Buy 1 Call Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 & 3 - Sell 2 ATM Calls:    Sell 2 Call Options with closest Strike Price higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 4 - Buy 1 OTM Call:    Buy 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Paid = Order 1 Price - (Order 2 + Order 3 Price) + Order 4 Price
     * Max Profit = Strike Price of Order 2 - Strike Price of Order 4 - Net Premium Paid
     * Max Loss = Net Premium Paid
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: number, maxProfit: number, maxLoss: number, orders: Array}}
     * @private
     */
    butterflySpread(options : OptionSymbol[], underlyingSymbol : EquitySymbol) :StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumPaid:number = 0, maxProfit:number = 0, 
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumPaid += orderPrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.CALL, Constants.ITM, Constants.BUY, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.CALL, Constants.SELL);
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.ATM, Constants.SELL, orderPrice, 1));
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.ATM, Constants.SELL, orderPrice, 1));
            netPremiumPaid -= orderPrice;
            netPremiumPaid -= orderPrice;
            maxProfit += orderPrice;
        }

        let order4Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order4Symbol) {
            orderPrice = this.getOptionPrice(order4Symbol.expiryDate, order4Symbol.strikePrice, Constants.CALL, Constants.BUY);
            orders.push(this.createOrderObject(order4Symbol, Constants.CALL, Constants.OTM, Constants.BUY, orderPrice, 1));
            netPremiumPaid += orderPrice;
            maxProfit -= orderPrice;
        }

        maxProfit -= netPremiumPaid;

        return OptionTradingService.getReturnObject('butterflySpread', underlyingSymbol, orders, netPremiumPaid, -1, maxProfit, netPremiumPaid);
    }

    /**
     * Number of Option Orders - 4
     * Order 1 - Buy 1 OTM Put: Buy 1 Put Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Sell 1 ATM Put: Sell 1 Put Option with closest Strike Price lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 3 - Sell 1 ATM Call: Sell 1 Call Option with closest Strike Price higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 4 - Buy 1 OTM Call:    Buy 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 2 - Order 1 + Order 3 - Order 4
     * Max Profit = Net Premium Received
     * Max Loss = Strike Price of Order 4 - Strike Price of Order 3 - Net Premium Received
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    ironButterfly(options : OptionSymbol[], underlyingSymbol : EquitySymbol) :StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumReceived:number = 0, maxLoss:number = 0,
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.PUT, Constants.BUY);
            netPremiumReceived -= orderPrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.PUT, Constants.OTM, Constants.BUY, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, false));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumReceived += orderPrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ATM, Constants.SELL, orderPrice, 1));
        }

        let order3Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, true));
        if (order3Symbol) {
            orderPrice = this.getOptionPrice(order3Symbol.expiryDate, order3Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumReceived += orderPrice;
            maxLoss -= order3Symbol.strikePrice;
            orders.push(this.createOrderObject(order3Symbol, Constants.CALL, Constants.ATM, Constants.SELL, orderPrice, 1));
        }

        let order4Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order4Symbol) {
            orderPrice = this.getOptionPrice(order4Symbol.expiryDate, order4Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumReceived -= orderPrice;
            maxLoss += order4Symbol.strikePrice;
            orders.push(this.createOrderObject(order4Symbol, Constants.CALL, Constants.OTM, Constants.BUY, orderPrice, 1));
        }

        maxLoss -= netPremiumReceived;

        return OptionTradingService.getReturnObject('ironButterfly', underlyingSymbol, orders, -1, netPremiumReceived, netPremiumReceived, maxLoss);
    }

    /**
     * Number of Option Orders - 4
     * Order 1 - Buy 1 OTM Put: Buy 1 Put Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 & 3 - Sell 2 ATM Puts: Sell 2 Put Options with closest Strike Price lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 4 - Buy 1 ITM Put: Buy 1 Put Option where Strike Price is 2% less than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Paid = Order 1 Price + Order 4 Price - Order 2 Price - Order 3 Price
     * Max Profit = Strike Price of Order 4 - Strike Price of Order 2 - Net Premium Paid
     * Max Loss = Net Premium Paid
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    longPutButterfly(options : OptionSymbol[], underlyingSymbol : EquitySymbol) :StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumPaid:number = 0, maxProfit:number = 0,
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.PUT, Constants.BUY);
            netPremiumPaid += orderPrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.PUT, Constants.OTM, Constants.BUY, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, false));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumPaid -= orderPrice;
            netPremiumPaid -= orderPrice;
            maxProfit -= order2Symbol.strikePrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ATM, Constants.SELL, orderPrice, 1));
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ATM, Constants.SELL, orderPrice, 1));
        }

        let order4Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order4Symbol) {
            orderPrice = this.getOptionPrice(order4Symbol.expiryDate, order4Symbol.strikePrice, Constants.PUT, Constants.BUY);
            netPremiumPaid += orderPrice;
            maxProfit += order4Symbol.strikePrice;
            orders.push(this.createOrderObject(order4Symbol, Constants.PUT, Constants.ITM, Constants.BUY, orderPrice, 1));
        }

        maxProfit -= netPremiumPaid;

        return OptionTradingService.getReturnObject('longPutButterfly', underlyingSymbol, orders, netPremiumPaid, -1, maxProfit, netPremiumPaid);
    }

    /**
     * Number of Option Orders - 4
     * Order 1 - Sell 1 ITM Put: Sell 1 Put Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 & 3 - Buy 2 ATM Puts: Buy 2 Put Options with closest Strike Price higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 4 - Sell 1 OTM Put: Sell 1 Put Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 2 Price + Order 3 Price - Order 1 Price - Order 4 Price
     * Max Profit = Net Premium Received
     * Max Loss = Strike Price of Order 1 - Strike Price of Order 2 - Net Premium Received
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    shortPutButterfly(options : OptionSymbol[], underlyingSymbol : EquitySymbol) :StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumReceived:number = 0, maxLoss:number = 0,
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumReceived -= orderPrice;
            maxLoss += order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.PUT, Constants.ITM, Constants.SELL, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.BUY);
            netPremiumReceived += orderPrice;
            netPremiumReceived += orderPrice;
            maxLoss -= order2Symbol.strikePrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ATM, Constants.BUY, orderPrice, 1));
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ATM, Constants.BUY, orderPrice, 1));
        }

        let order4Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order4Symbol) {
            orderPrice = this.getOptionPrice(order4Symbol.expiryDate, order4Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumReceived -= orderPrice;
            orders.push(this.createOrderObject(order4Symbol, Constants.PUT, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        maxLoss -= netPremiumReceived;

        return OptionTradingService.getReturnObject('shortPutButterfly', underlyingSymbol, orders, -1, netPremiumReceived, netPremiumReceived, maxLoss);
    }

    /**
     * Number of Option Orders - 4
     * Order 1 - Sell 1 ITM Call: Sell 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 & 3 - Buy 2 ATM Calls:    Buy 2 Call Options with closest Strike Price lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 4 - Sell 1 OTM Call:    Buy 1 Call Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 1 Price + Order 4 Price - Order 2 Price - Order 3 Price
     * Max Profit = Net Premium Received
     * Max Loss = Strike Price of Order 2 - Strike Price of Order 1 - Net Premium Received
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    shortButterfly(options : OptionSymbol[], underlyingSymbol : EquitySymbol) :StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumReceived:number = 0, maxLoss:number = 0,
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumReceived += orderPrice;
            maxLoss -= orderPrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.CALL, Constants.ITM, Constants.SELL, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, false));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumReceived -= orderPrice;
            netPremiumReceived -= orderPrice;
            maxLoss += orderPrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.ATM, Constants.BUY, orderPrice, 1));
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.ATM, Constants.BUY, orderPrice, 1));
        }

        let order4Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order4Symbol) {
            orderPrice = this.getOptionPrice(order4Symbol.expiryDate, order4Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumReceived += orderPrice;
            orders.push(this.createOrderObject(order4Symbol, Constants.CALL, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        maxLoss -= netPremiumReceived;

        return OptionTradingService.getReturnObject('shortButterfly', underlyingSymbol, orders, -1, netPremiumReceived, netPremiumReceived, maxLoss);
    }

    /**
     * Number of Option Orders - 4
     * Order 1 - Sell 1 OTM Put: Sell 1 Put Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Buy 1 ATM Put:    Buy 1 Put Option with closest Strike Price higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 3 - Buy 1 ATM Call: Buy 1 Call Option with closest Strike Price lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 4 - Sell 1 OTM Call:    Sell 1 Call Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Paid = (Order 2 - Order 1) + (Order 3 - Order 4)
     * Max Profit = Strike Price of Order 4 - Strike Price of Order 3 - Net Premium Paid
     * Max Loss = Net Premium Paid
     * @param options option symbols
     * @param underlyingSymbol
     * @private
     */
    reverseIronButterfly(options : OptionSymbol[], underlyingSymbol : EquitySymbol) :StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumPaid:number = 0, maxProfit:number = 0,
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumPaid -= orderPrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.PUT, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.BUY);
            netPremiumPaid += orderPrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.ATM, Constants.BUY, orderPrice, 1));
        }

        let order3Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice, false));
        if (order3Symbol) {
            orderPrice = this.getOptionPrice(order3Symbol.expiryDate, order3Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumPaid += orderPrice;
            maxProfit -= order3Symbol.strikePrice;
            orders.push(this.createOrderObject(order3Symbol, Constants.CALL, Constants.ATM, Constants.BUY, orderPrice, 1));
        }

        let order4Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order4Symbol) {
            orderPrice = this.getOptionPrice(order4Symbol.expiryDate, order4Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumPaid -= orderPrice;
            maxProfit += order4Symbol.strikePrice;
            orders.push(this.createOrderObject(order4Symbol, Constants.CALL, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        maxProfit -= netPremiumPaid;

        return OptionTradingService.getReturnObject('reverseIronButterfly', underlyingSymbol, orders, netPremiumPaid, -1, maxProfit, netPremiumPaid);
    }

    //endregion

    //region condor

    /**
     * Number of Option Orders - 4
     * Order 1 - Sell 1 ITM Call: Sell 1 Call Option where Strike Price is 3% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Buy 1 ITM Call: Buy 1 Call Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 3 - Sell 1 OTM Call: Sell 1 Call Option where Strike Price is 3% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 4 - Buy 1 OTM Call: Buy 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Paid = Order 2 Price - Order 1 Price + Order 4 Price - Order 3 Price
     * Max Profit = Strike Price of Order 3 - Strike Price of Order 4 - Net Premium Paid
     * Max Loss = Net Premium Paid
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    condor(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumPaid:number = 0, maxProfit:number = 0,
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.03, true));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumPaid -= orderPrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.CALL, Constants.ITM, Constants.SELL, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.CALL, Constants.BUY);
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.ITM, Constants.BUY, orderPrice, 1));
            netPremiumPaid += orderPrice;
        }

        let order3Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.97, false));
        if (order3Symbol) {
            orderPrice = this.getOptionPrice(order3Symbol.expiryDate, order3Symbol.strikePrice, Constants.CALL, Constants.SELL);
            orders.push(this.createOrderObject(order3Symbol, Constants.CALL, Constants.OTM, Constants.SELL, orderPrice, 1));
            netPremiumPaid -= orderPrice;
            maxProfit += orderPrice;
        }

        let order4Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order4Symbol) {
            orderPrice = this.getOptionPrice(order4Symbol.expiryDate, order4Symbol.strikePrice, Constants.CALL, Constants.BUY);
            orders.push(this.createOrderObject(order4Symbol, Constants.CALL, Constants.OTM, Constants.BUY, orderPrice, 1));
            netPremiumPaid += orderPrice;
            maxProfit -= orderPrice;
        }

        maxProfit -= netPremiumPaid;

        return OptionTradingService.getReturnObject('condor', underlyingSymbol, orders, netPremiumPaid, -1,  maxProfit, netPremiumPaid);
    }

    /**
     * Number of Option Orders - 4
     * Order 1 - Sell 1 OTM Put: Sell 1 Put Option where Strike Price is 3% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Buy 1 OTM Put: Buy 1 Put Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 3 - Sell 1 OTM Call: Sell 1 Call Option where Strike Price is 3% less than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 4 - Buy 1 OTM Call: Buy 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 1 - Order 2 + Order 3 - Order 4
     * Max Profit = Net Premium Received
     * Max Loss = Strike Price of Order 4 - Strike Price of Order 3 - Net Premium Received
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    ironCondor(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumPaid:number = 0, maxLoss:number = 0,
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.03, true));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumPaid += orderPrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.PUT, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.BUY);
            netPremiumPaid -= orderPrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.OTM, Constants.BUY, orderPrice, 1));
        }

        let order3Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.97, false));
        if (order3Symbol) {
            orderPrice = this.getOptionPrice(order3Symbol.expiryDate, order3Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumPaid += orderPrice;
            maxLoss -= order3Symbol.strikePrice;
            orders.push(this.createOrderObject(order3Symbol, Constants.CALL, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        let order4Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order4Symbol) {
            orderPrice = this.getOptionPrice(order4Symbol.expiryDate, order4Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumPaid -= orderPrice;
            maxLoss += order4Symbol.strikePrice;
            orders.push(this.createOrderObject(order4Symbol, Constants.CALL, Constants.OTM, Constants.BUY, orderPrice, 1));
        }

        maxLoss -= netPremiumPaid;

        return OptionTradingService.getReturnObject('ironCondor', underlyingSymbol, orders, netPremiumPaid, -1, netPremiumPaid, maxLoss);
    }

    /**
     * Number of Option Orders - 4
     * Order 1 - Buy 1 OTM Put:    Buy 1 Put Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Sell 1 OTM Put: Sell 1 Put Option where Strike Price is 3% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 3 - Buy 1 OTM Call:    Buy 1 Call Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 4 - Sell 1 OTM Call:    Sell 1 Call Option where Strike Price is 3% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Paid = (Order 1 - Order 2) + (Order 3 - Order 4)
     * Max Profit = Strike Price of Order 4 - Strike Price of Order 3 - Net Premium Paid
     * Max Loss = Net Premium Paid
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    reverseIronCondor(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumPaid:number = 0, maxProfit:number = 0,
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.PUT, Constants.BUY);
            netPremiumPaid += orderPrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.PUT, Constants.OTM, Constants.BUY, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.97, false));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumPaid -= orderPrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        let order3Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order3Symbol) {
            orderPrice = this.getOptionPrice(order3Symbol.expiryDate, order3Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumPaid += orderPrice;
            maxProfit -= order3Symbol.strikePrice;
            orders.push(this.createOrderObject(order3Symbol, Constants.CALL, Constants.OTM, Constants.BUY, orderPrice, 1));
        }

        let order4Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.03, true));
        if (order4Symbol) {
            orderPrice = this.getOptionPrice(order4Symbol.expiryDate, order4Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumPaid -= orderPrice;
            maxProfit += order4Symbol.strikePrice;
            orders.push(this.createOrderObject(order4Symbol, Constants.CALL, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        maxProfit -= netPremiumPaid;

        return OptionTradingService.getReturnObject('reverseIronCondor', underlyingSymbol, orders, netPremiumPaid, -1, maxProfit, netPremiumPaid);
    }

    /**
     * Number of Option Orders - 4
     * Order 1 - Buy 1 ITM Call: Buy 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Sell 1 ITM Call: Sell 1 Call Option where Strike Price is 3% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 3 - Buy 1 OTM Call: Buy 1 Call Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 4 - Sell 1 OTM Call: Sell 1 Call Option where Strike Price is 3% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 2 Price + Order 4 Price - Order 1 Price - Order 3 Price
     * Max Profit = Net Premium Received
     * Max Loss = Strike Price of Order Order 1 - Strike Price of Order 2 - Net Premium Received
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    shortCondor(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumReceived:number = 0, maxLoss:number = 0,
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumReceived -= orderPrice;
            maxLoss += order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.CALL, Constants.ITM, Constants.BUY, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.97, false));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumReceived -= orderPrice;
            maxLoss -= order1Symbol.strikePrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.CALL, Constants.ITM, Constants.SELL, orderPrice, 1));
        }

        let order3Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order3Symbol) {
            orderPrice = this.getOptionPrice(order3Symbol.expiryDate, order3Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumReceived -= orderPrice;
            orders.push(this.createOrderObject(order3Symbol, Constants.CALL, Constants.OTM, Constants.BUY, orderPrice, 1));
        }

        let order4Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.03, true));
        if (order4Symbol) {
            orderPrice = this.getOptionPrice(order4Symbol.expiryDate, order4Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumReceived += orderPrice;
            orders.push(this.createOrderObject(order4Symbol, Constants.CALL, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        maxLoss -= netPremiumReceived;

        return OptionTradingService.getReturnObject('shortCondor', underlyingSymbol, orders, -1, netPremiumReceived, netPremiumReceived, maxLoss);
    }

    //endregion

    //region strangle

    /**
     * Number of Option Orders - 2
     * Order 1 - Buy 1 OTM Call: Buy 1 Call Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Buy 1 OTM Put: Buy 1 Put Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Paid = Order 1 Price + Order 2 Price
     * Max Profit = …
     * Max Loss = Net Premium Paid
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    longStrangle(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumPaid = 0,
            expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.CALL, Constants.BUY);
            netPremiumPaid += orderPrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.CALL, Constants.OTM, Constants.BUY, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.BUY);
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.OTM, Constants.BUY, orderPrice, 1));
            netPremiumPaid += orderPrice;
        }

        return OptionTradingService.getReturnObject('longStrangle', underlyingSymbol, orders, netPremiumPaid, -1, -1, netPremiumPaid);
    }

    /**
     * Number of Options Orders - 2
     * Order 1 - Sell 1 OTM Call: Sell 1 Call Option where Strike Price is 2% higher than Current Underlying Price and Expiry date greater than 15 days from today.
     * Order 2 - Sell 1 OTM Put: Sell 1 Put Option where Strike Price is 2% lower than Current Underlying Price and Expiry date greater than 15 days from today.
     * Net Premium Received = Order 1 Price + Order 2 Price
     * Max Profit = Net Premium Received
     * Max Loss = ….
     * @param options option symbols
     * @param underlyingSymbol
     * @returns {{netPremiumPaid: *, maxProfit: *, maxLoss: *, orders: *}}
     * @private
     */
    shortStrangle(options : OptionSymbol[], underlyingSymbol : EquitySymbol) : StrategyOrderInfo{
        let orders:OptionOrder[] = [], netPremiumPaid = 0, expiryCondition:Condition = OptionTradingService.getCondition(15, true), orderPrice:number;

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let order1Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 1.02, true));
        if (order1Symbol) {
            orderPrice = this.getOptionPrice(order1Symbol.expiryDate, order1Symbol.strikePrice, Constants.CALL, Constants.SELL);
            netPremiumPaid += orderPrice;
            orders.push(this.createOrderObject(order1Symbol, Constants.CALL, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        let order2Symbol:OptionSymbol = this.getOption(options, expiryCondition, OptionTradingService.getCondition(underlyingPrice * 0.98, false));
        if (order2Symbol) {
            orderPrice = this.getOptionPrice(order2Symbol.expiryDate, order2Symbol.strikePrice, Constants.PUT, Constants.SELL);
            netPremiumPaid += orderPrice;
            orders.push(this.createOrderObject(order2Symbol, Constants.PUT, Constants.OTM, Constants.SELL, orderPrice, 1));
        }

        return OptionTradingService.getReturnObject('shortStrangle', underlyingSymbol, orders, netPremiumPaid, -1, netPremiumPaid, -1);
    }

    //endregion

    //endregion

    static getOrderSubType(underlyingSymbolPrice : number, strikePrice : number, type : string) : string{
        let subType : string;
        if (type === Constants.CALL) {
            if (underlyingSymbolPrice > strikePrice) {
                subType = Constants.ITM;
            } else if (underlyingSymbolPrice < strikePrice) {
                subType = Constants.OTM;
            } else {
                subType = Constants.ATM;
            }
        } else {
            if (underlyingSymbolPrice < strikePrice) {
                subType = Constants.ITM;
            } else if (underlyingSymbolPrice > strikePrice) {
                subType = Constants.OTM;
            } else {
                subType = Constants.ATM;
            }
        }
        return subType;
    }

    /**
     * intrinsic = Strike Price - Underlying Stock Price
     * extrinsic = Option Price - Intrinsic Value
     * price = * Buy Price - * Sell Price
     * @param orders orders
     * @param underlyingSymbol
     * @private {{intrinsic:*, extrinsic:*, ivRank:*, theta:*, delta:*, price:*}}
     */
    orderInfo(orders, underlyingSymbol : EquitySymbol){
        let orderInfo = {
            intrinsic: 0,
            extrinsic: 0,
            ivRank: "34",
            theta: "35",
            delta: "12",
            price: 0,
            pop: "13.23",
            troc: "5.26",
            absPrice : 0
        };

        let underlyingPrice:number = this.getUnderlyingSymbolPrice(underlyingSymbol);

        let totIntrinsic:number = 0;
        let totExtrinsic:number = 0;
        let totPrice:number = 0;

        orders.forEach(function (value) {
            if (value.length > 0) {
                value.forEach(function (val) {
                    let qty:number = val.quantity;
                    let typ:string = val.side;
                    let strkPrice:number = val.symbol.strikePrice;
                    let intrinsic:number = strkPrice - underlyingPrice;
                    let extrinsic:number = val.price - intrinsic;
                    let price:number = ((typ === 'buy') ? (1) : (-1)) * val.price;

                    totIntrinsic += qty * intrinsic;
                    totExtrinsic += qty * extrinsic;

                    totPrice += price;
                })
            }
        });

        orderInfo.intrinsic = totIntrinsic;
        orderInfo.extrinsic = totExtrinsic;
        orderInfo.price = totPrice;
        orderInfo.absPrice = Math.abs(totPrice);

        return orderInfo;
    }
}

