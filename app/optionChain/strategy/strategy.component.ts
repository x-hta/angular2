import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

import { OptionSymbolService } from './../../services/opt-symbol.service';
import { OptionTradingService } from './../../services/opt-trading.service';

import { StrategyOrderInfo } from './../../beans/strategyOrderInfo';
import { EquitySymbol } from './../../beans/equitySymbol';

const STRATEGY_MAP = {
    longStrangle: 'longStrangle',
    shortStrangle: 'shortStrangle',
    condor: 'condor',
    ironCondor: 'ironCondor',
    reverseIronCondor: 'reverseIronCondor',
    shortCondor: 'shortCondor',
    butterflySpread: 'butterflySpread',
    ironButterfly: 'ironButterfly',
    longPutButterfly: 'longPutButterfly',
    shortPutButterfly: 'shortPutButterfly',
    shortButterfly: 'shortButterfly',
    reverseIronButterfly: 'reverseIronButterfly',
    ratioSpread: 'ratioSpread',
    putRatioSpread: 'putRatioSpread',
    ratioPutWrite: 'ratioPutWrite',
    ratioCallWrite: 'ratioCallWrite',
    variableRatioWrite: 'variableRatioWrite',
    shortStraddle: 'shortStraddle',
    longGuts: 'longGuts',
    shortGuts: 'shortGuts',
    longCallLadder: 'longCallLadder',
    shortCallLadder: 'shortCallLadder',
    longPutLadder: 'longPutLadder',
    shortPutLadder: 'shortPutLadder'
};

@Component({
    selector: '[option-chain-strategy]',
    templateUrl: 'app/optionChain/strategy/strategy.component.html'
})

export class StrategyComponent {

    @Input() symbol: string;
    @Output() event: EventEmitter<Object> = new EventEmitter();

    strategies = [
        {
            name: 'Strangle',
            def: 0,
            sub: [
                {
                    name: 'Long',
                    key: STRATEGY_MAP.longStrangle
                },
                {
                    name: 'Short',
                    key: STRATEGY_MAP.shortStrangle
                }
            ]
        },
        {
            name: 'Condor',
            def: 0,
            sub: [
                {
                    name: 'Condor',
                    key: STRATEGY_MAP.condor
                },
                {
                    name: 'Iron',
                    key: STRATEGY_MAP.ironCondor
                },
                {
                    name: 'Reverse Iron',
                    key: STRATEGY_MAP.reverseIronCondor
                },
                {
                    name: 'Short',
                    key: STRATEGY_MAP.shortCondor
                }
            ]
        },
        {
            name: 'Butterfly',
            def: 0,
            sub: [
                {
                    name: 'Spread',
                    key: STRATEGY_MAP.butterflySpread
                },
                {
                    name: 'Iron',
                    key: STRATEGY_MAP.ironButterfly
                },
                {
                    name: 'Long Put',
                    key: STRATEGY_MAP.longPutButterfly
                },
                {
                    name: 'Short Put',
                    key: STRATEGY_MAP.shortPutButterfly
                },
                {
                    name: 'Short',
                    key: STRATEGY_MAP.shortButterfly
                },
                {
                    name: 'Reverse Iron',
                    key: STRATEGY_MAP.reverseIronButterfly
                }
            ]
        },
        {
            name: 'Ratio',
            def: 0,
            sub: [
                {
                    name: 'Spread',
                    key: STRATEGY_MAP.ratioSpread
                },
                {
                    name: 'Put Spread',
                    key: STRATEGY_MAP.putRatioSpread
                },
                {
                    name: 'Put Write',
                    key: STRATEGY_MAP.ratioPutWrite
                },
                {
                    name: 'Call Write',
                    key: STRATEGY_MAP.ratioCallWrite
                },
                {
                    name: 'Variable Write',
                    key: STRATEGY_MAP.variableRatioWrite
                }
            ]
        },
        {
            name: 'Straddle',
            def: 0,
            sub: [
                {
                    name: 'Short',
                    key: STRATEGY_MAP.shortStraddle
                }
            ]
        },
        {
            name: 'Guts',
            def: 0,
            sub: [
                {
                    name: 'Long',
                    key: STRATEGY_MAP.longGuts
                },
                {
                    name: 'Short',
                    key: STRATEGY_MAP.shortGuts
                }
            ]
        },
        {
            name: 'Ladder',
            def: 0,
            sub: [
                {
                    name: 'Long Call',
                    key: STRATEGY_MAP.longCallLadder
                },
                {
                    name: 'Short Call',
                    key: STRATEGY_MAP.shortCallLadder
                },
                {
                    name: 'Long Put',
                    key: STRATEGY_MAP.longPutLadder
                },
                {
                    name: 'Short Put',
                    key: STRATEGY_MAP.shortPutLadder
                }
            ]
        }
    ];

    subData = [
        {
            name: 'Long',
            key: STRATEGY_MAP.longStrangle
        },
        {
            name: 'Short',
            key: STRATEGY_MAP.shortStrangle
        }
    ];

    show:boolean = false;

    @ViewChild('strategyBox') window: ElementRef;

    constructor(private symbolService: OptionSymbolService, private tradeService: OptionTradingService) {
    }

    /**
     * on click event for strategy
     * @param key
     */
    private setStrategy(key:string) : void{
        this.show = false;
        let self = this;
        this.getData(key, this.symbol).then(function (data) {
            self.event.emit({msg : key, data : data})
        });
    }

    /**
     * show strategy box
     */
    private showStrategies() : void{
        this.show = typeof this.window === 'undefined';
    }

    private onMouseEnter(index : number) : void{
        //console.debug(sub);
        this.subData = this.strategies[index].sub;
    }

    /**
     * get data using trade service
     * @param key
     * @param underlyingSymbol
     * @returns {*}
     * @private
     */
    private getData(key : string, underlyingSymbol : string) : Promise<StrategyOrderInfo>{
        let self = this;
        return this.symbolService.getOptions(underlyingSymbol).then(function (options) {
            let sym:EquitySymbol = self.symbolService.getBaseSymbol(underlyingSymbol);
            switch (key) {
                case STRATEGY_MAP.longStrangle:
                    return self.tradeService.longStrangle(options, sym);
                case STRATEGY_MAP.shortStrangle:
                    return self.tradeService.shortStrangle(options, sym);
                case STRATEGY_MAP.condor:
                    return self.tradeService.condor(options, sym);
                case STRATEGY_MAP.ironCondor:
                    return self.tradeService.ironCondor(options, sym);
                case STRATEGY_MAP.reverseIronCondor:
                    return self.tradeService.reverseIronCondor(options, sym);
                case STRATEGY_MAP.shortCondor:
                    return self.tradeService.shortCondor(options, sym);
                case STRATEGY_MAP.butterflySpread:
                    return self.tradeService.butterflySpread(options, sym);
                case STRATEGY_MAP.ironButterfly:
                    return self.tradeService.ironButterfly(options, sym);
                case STRATEGY_MAP.longPutButterfly:
                    return self.tradeService.longPutButterfly(options, sym);
                case STRATEGY_MAP.shortPutButterfly:
                    return self.tradeService.shortPutButterfly(options, sym);
                case STRATEGY_MAP.shortButterfly:
                    return self.tradeService.shortButterfly(options, sym);
                case STRATEGY_MAP.reverseIronButterfly:
                    return self.tradeService.reverseIronButterfly(options, sym);
                case STRATEGY_MAP.ratioSpread:
                    return self.tradeService.ratioSpread(options, sym);
                case STRATEGY_MAP.putRatioSpread:
                    return self.tradeService.putRatioSpread(options, sym);
                case STRATEGY_MAP.ratioPutWrite:
                    return self.tradeService.ratioPutWrite(options, sym);
                case STRATEGY_MAP.ratioCallWrite:
                    return self.tradeService.ratioCallWrite(options, sym);
                case STRATEGY_MAP.variableRatioWrite:
                    return self.tradeService.variableRatioWrite(options, sym);
                case STRATEGY_MAP.shortStraddle:
                    return self.tradeService.shortStraddle(options, sym);
                case STRATEGY_MAP.longGuts:
                    return self.tradeService.longGuts(options, sym);
                case STRATEGY_MAP.shortGuts:
                    return self.tradeService.shortGuts(options, sym);
                case STRATEGY_MAP.longCallLadder:
                    return self.tradeService.longCallLadder(options, sym);
                case STRATEGY_MAP.shortCallLadder:
                    return self.tradeService.shortCallLadder(options, sym);
                case STRATEGY_MAP.longPutLadder:
                    return self.tradeService.longPutLadder(options, sym);
                default:
                    return self.tradeService.shortPutLadder(options, sym);
            }
        });
    }
}
