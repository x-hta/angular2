import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {NgClass} from '@angular/common';

import {Constants} from './../../constants/constants';

@Component({
    selector: '[option-chain-mode-control]',
    templateUrl: 'app/optionChain/modeControl/modeControl.component.html',
    directives:[NgClass]
})

export class ModeControlComponent implements OnInit{

    types = [];
    selectedType:string;

    @Output() event:EventEmitter<Object> = new EventEmitter();

    ngOnInit() {
        this.types.push({key : Constants.CALL, label : 'Call'});
        this.types.push({key : Constants.PUT, label : 'Put'});
        this.types.push({key : Constants.ANY, label : 'All Trades'});
        this.change(Constants.CALL);
    }

    change(key:string){
        this.selectedType = key;
        this.event.emit({msg : "ModeClick", data : key});
    }
}
