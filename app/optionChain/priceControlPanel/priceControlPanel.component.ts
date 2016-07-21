import { Component, EventEmitter, Input, OnInit, OnChanges } from '@angular/core';
import {NgClass} from '@angular/common';

import {OptionSymbol} from './../../beans/optionSymbol';
import {EquitySymbol} from './../../beans/equitySymbol';

import {Snapshot} from './../../beans/snapshot';

import {PriceService} from './../../services/price.service';

import { StrategyComponent } from './../strategy/strategy.component';
import { ModeControlComponent } from './../modeControl/modeControl.component';

@Component({
    selector: '[option-chain-price-control-panel]',
    templateUrl: 'app/optionChain/priceControlPanel/priceControlPanel.component.html',
    directives: [NgClass, StrategyComponent, ModeControlComponent]
})

export class PriceControlPanelComponent implements OnChanges{

    @Input() underlyingSymbol: EquitySymbol;
    @Input() symbol: OptionSymbol;
    @Input() orderType: string;
    @Input() side: string;

    snapshot : Snapshot;

    constructor(private priceService: PriceService) {
    }

    ngOnChanges(changes) {
        this.getSnapshot();
    }

    scrollUp(){}

    scrollDown(){}

    getSnapshot(){
        if(this.symbol){
            console.debug('PriceControlPanelComponent : getSnapshot() --> ' + this.symbol.uid);
            this.snapshot = this.priceService.getSnapshot(this.symbol);
        }
    }
}