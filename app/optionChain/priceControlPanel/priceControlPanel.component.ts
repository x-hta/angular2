import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { StrategyComponent } from './../strategy/strategy.component';
import { ModeControlComponent } from './../modeControl/modeControl.component';

@Component({
    selector: '[option-chain-price-control-panel]',
    templateUrl: 'app/optionChain/priceControlPanel/priceControlPanel.component.html',
    directives: [StrategyComponent, ModeControlComponent]
})

export class PriceControlPanelComponent {
    @Input() symbol: string;
}