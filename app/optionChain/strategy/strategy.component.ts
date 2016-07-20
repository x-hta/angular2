import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

import { OptionSymbolService } from './../../services/opt-symbol.service';
import { OptionTradingService } from './../../services/opt-trading.service';

import { StrategyOrderInfo } from './../../beans/strategyOrderInfo';

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

    strategies = [
        {
            name: 'Strangle',
            def: 'long',
            sub: {
                long: {
                    name: 'Long',
                    key: STRATEGY_MAP.longStrangle
                },
                short: {
                    name: 'Short',
                    key: STRATEGY_MAP.shortStrangle
                }
            }
        },
        {
            name: 'Condor',
            def: 'condor',
            sub: {
                condor: {
                    name: 'Condor',
                    key: STRATEGY_MAP.condor
                },
                ironCondor: {
                    name: 'Iron',
                    key: STRATEGY_MAP.ironCondor
                },
                reverseIronCondor: {
                    name: 'Reverse Iron',
                    key: STRATEGY_MAP.reverseIronCondor
                },
                shortCondor: {
                    name: 'Short',
                    key: STRATEGY_MAP.shortCondor
                }
            }
        },
        {
            name: 'Butterfly',
            def: 'spread',
            sub: {
                spread: {
                    name: 'Spread',
                    key: STRATEGY_MAP.butterflySpread
                },
                iron: {
                    name: 'Iron',
                    key: STRATEGY_MAP.ironButterfly
                },
                longPut: {
                    name: 'Long Put',
                    key: STRATEGY_MAP.longPutButterfly
                },
                shortPut: {
                    name: 'Short Put',
                    key: STRATEGY_MAP.shortPutButterfly
                },
                short: {
                    name: 'Short',
                    key: STRATEGY_MAP.shortButterfly
                },
                reverseIron: {
                    name: 'Reverse Iron',
                    key: STRATEGY_MAP.reverseIronButterfly
                }
            }
        },
        {
            name: 'Ratio',
            def: 'spread',
            sub: {
                spread: {
                    name: 'Spread',
                    key: STRATEGY_MAP.ratioSpread
                },
                putSpread: {
                    name: 'Put Spread',
                    key: STRATEGY_MAP.putRatioSpread
                },
                putWrite: {
                    name: 'Put Write',
                    key: STRATEGY_MAP.ratioPutWrite
                },
                callWrite: {
                    name: 'Call Write',
                    key: STRATEGY_MAP.ratioCallWrite
                },
                variableWrite: {
                    name: 'Variable Write',
                    key: STRATEGY_MAP.variableRatioWrite
                }
            }
        },
        {
            name: 'Straddle',
            def: 'short',
            sub: {
                short: {
                    name: 'Short',
                    key: STRATEGY_MAP.shortStraddle
                }
            }
        },
        {
            name: 'Guts',
            def: 'long',
            sub: {
                long: {
                    name: 'Long',
                    key: STRATEGY_MAP.longGuts
                },
                short: {
                    name: 'Short',
                    key: STRATEGY_MAP.shortGuts
                }
            }
        },
        {
            name: 'Ladder',
            def: 'longCall',
            sub: {
                longCall: {
                    name: 'Long Call',
                    key: STRATEGY_MAP.longCallLadder
                },
                shortCall: {
                    name: 'Short Call',
                    key: STRATEGY_MAP.shortCallLadder
                },
                longPut: {
                    name: 'Long Put',
                    key: STRATEGY_MAP.longPutLadder
                },
                shortPut: {
                    name: 'Short Put',
                    key: STRATEGY_MAP.shortPutLadder
                }
            }
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
    setStrategy(key:string) : void{
        console.log(key);
        this.show = false;
        this.getData(key, this.symbol).then(function (data) {
            console.log(JSON.stringify(data));
        });
    }

    /**
     * show strategy box
     */
    showStrategies() : void{
        this.show = typeof this.window === 'undefined';
    }

    onMouseOver(sub) : void{
        this.subData = sub;
    }

    /**
     * get data using trade service
     * @param key
     * @param underlyingSymbol
     * @returns {*}
     * @private
     */
    private getData(key : string, underlyingSymbol : string) : Promise<StrategyOrderInfo>{
        var self = this;
        return this.symbolService.getOptions(underlyingSymbol).then(function (options) {
            switch (key) {
                case STRATEGY_MAP.longStrangle:
                    return self.tradeService.longStrangle(options, underlyingSymbol);
                case STRATEGY_MAP.shortStrangle:
                    return self.tradeService.shortStrangle(options, underlyingSymbol);
                case STRATEGY_MAP.condor:
                    return self.tradeService.condor(options, underlyingSymbol);
                case STRATEGY_MAP.ironCondor:
                    return self.tradeService.ironCondor(options, underlyingSymbol);
                case STRATEGY_MAP.reverseIronCondor:
                    return self.tradeService.reverseIronCondor(options, underlyingSymbol);
                case STRATEGY_MAP.shortCondor:
                    return self.tradeService.shortCondor(options, underlyingSymbol);
                case STRATEGY_MAP.butterflySpread:
                    return self.tradeService.butterflySpread(options, underlyingSymbol);
                case STRATEGY_MAP.ironButterfly:
                    return self.tradeService.ironButterfly(options, underlyingSymbol);
                case STRATEGY_MAP.longPutButterfly:
                    return self.tradeService.longPutButterfly(options, underlyingSymbol);
                case STRATEGY_MAP.shortPutButterfly:
                    return self.tradeService.shortPutButterfly(options, underlyingSymbol);
                case STRATEGY_MAP.shortButterfly:
                    return self.tradeService.shortButterfly(options, underlyingSymbol);
                case STRATEGY_MAP.reverseIronButterfly:
                    return self.tradeService.reverseIronButterfly(options, underlyingSymbol);
                case STRATEGY_MAP.ratioSpread:
                    return self.tradeService.ratioSpread(options, underlyingSymbol);
                case STRATEGY_MAP.putRatioSpread:
                    return self.tradeService.putRatioSpread(options, underlyingSymbol);
                case STRATEGY_MAP.ratioPutWrite:
                    return self.tradeService.ratioPutWrite(options, underlyingSymbol);
                case STRATEGY_MAP.ratioCallWrite:
                    return self.tradeService.ratioCallWrite(options, underlyingSymbol);
                case STRATEGY_MAP.variableRatioWrite:
                    return self.tradeService.variableRatioWrite(options, underlyingSymbol);
                case STRATEGY_MAP.shortStraddle:
                    return self.tradeService.shortStraddle(options, underlyingSymbol);
                case STRATEGY_MAP.longGuts:
                    return self.tradeService.longGuts(options, underlyingSymbol);
                case STRATEGY_MAP.shortGuts:
                    return self.tradeService.shortGuts(options, underlyingSymbol);
                case STRATEGY_MAP.longCallLadder:
                    return self.tradeService.longCallLadder(options, underlyingSymbol);
                case STRATEGY_MAP.shortCallLadder:
                    return v.tradeService.shortCallLadder(options, underlyingSymbol);
                case STRATEGY_MAP.longPutLadder:
                    return self.tradeService.longPutLadder(options, underlyingSymbol);
                default:
                    return self.tradeService.shortPutLadder(options, underlyingSymbol);
            }
        });
    }
}
