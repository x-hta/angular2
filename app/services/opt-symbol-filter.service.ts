import { Injectable } from '@angular/core';

import { Symbol } from './../beans/symbol';
import { Condition } from './../beans/condition';

import { OptionSymbolService } from './opt-symbol.service';

@Injectable()
export class OptionSymbolFilterService {

    filter(symbols : Symbol[], expiryCondition : Condition, strikePriceCondition : Condition) : Symbol[]{
        let filtered = [];
        symbols.forEach(function(value){
            if(OptionSymbolFilterService.validateExpiryDate(value, expiryCondition) && OptionSymbolFilterService.validateStrikePrice(value, strikePriceCondition)){
                filtered.push(value);
            }
        });
        return filtered;
    }

    /**
     * check expiry date meets the condition
     * @param option symbol
     * @param condition
     * @returns {boolean}
     */
    private static validateExpiryDate (option : Symbol, condition : Condition) : boolean{
        let valid = false;
        switch (condition.rule){
            case 'greater':
                valid = OptionSymbolService.getDateDifferenceInDays(option) > condition.value;
                break;
        }
        return valid;
    }

    /**
     * check strike price meets the price condition
     * @param option
     * @param condition
     * @returns {boolean}
     */
    private static validateStrikePrice(option : Symbol, condition : Condition) : boolean{
        let valid = false;
        switch (condition.rule){
            case 'greater':
                valid = option.strikePrice > condition.value;
                break;
            case 'lesser':
                valid = option.strikePrice < condition.value;
                break;
        }
        return valid;
    }

}
