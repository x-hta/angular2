import { Injectable } from '@angular/core';

import { OptionSymbol } from './../beans/optionSymbol';
import { Condition } from './../beans/condition';

import { OptionSymbolService } from './opt-symbol.service';

@Injectable()
export class OptionSymbolFilterService {

    filter(symbols : OptionSymbol[], expiryCondition : Condition, strikePriceCondition : Condition) : OptionSymbol[]{
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
    private static validateExpiryDate (option : OptionSymbol, condition : Condition) : boolean{
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
    private static validateStrikePrice(option : OptionSymbol, condition : Condition) : boolean{
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
