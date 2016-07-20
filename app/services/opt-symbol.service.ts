import { Injectable }    from '@angular/core';

import { Symbol } from './../beans/symbol';

import { LocalStorageService } from './local-storage.service';

import 'rxjs/add/operator/toPromise';

const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MS_PER_DAY:number = 1000 * 60 * 60 * 24;

@Injectable()
export class OptionSymbolService {

    constructor(private storageService: LocalStorageService) { }

    private static generateOptionSymbols(underlyingSymbol : String) : Symbol[]{
        let symbols = [], today = new Date(), i, j;//price = this.priceService.getLastPrice(underlyingSymbol),
        let dateInWeek = today.getDay();
        if (dateInWeek > 5) {
            today.setDate(today.getDate() + 6);
        } else {
            today.setDate(today.getDate() + 5 - dateInWeek);
        }

        let startDate = today.getTime();
        //var endDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()).getTime();
        let start = 145, end = 265;
        for (i = 0; i < 12; i++) {
            let dd = startDate + ((i) * (7 * 1000 * 60 * 60 * 24));
            let d = new Date(dd), year = d.getFullYear(), month = d.getMonth() + 1, date = d.getDate(),
                e = year + '-' + (month < 10 ? ('0' + month) : month) + '-' + (date < 10 ? ('0' + date) : date),
                n = monthNames[d.getMonth()] + ' ' + (date < 10 ? ('0' + date) : date) + "'" + year.toString().substring(2);
            for (j = start; j < end; j += 5) {
                symbols.push({
                    name: n,
                    underlyingSymbol: underlyingSymbol,
                    expiryDate: e,
                    strikePrice: j,
                    uid: underlyingSymbol + '~' + e + '~' + j
                });
            }
        }
        return symbols;
    }

    private static getId() : string{
        let today = new Date(), month = today.getMonth() + 1;
        let e = today.getFullYear() + '-' + (month < 9 ? ('0' + month) : month) + '-' + (today.getDate() < 10 ? ('0' + today.getDate()) : today.getDate());
        return 'optionSymbolService : options : ' + e;
    }

    /**
     * get difference in days
     * @param symbol
     * @returns {number}
     */
    static getDateDifferenceInDays(symbol : Symbol) : number{
        let a = new Date(), b = new Date(symbol.expiryDate);
        let utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
        let utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

        return Math.floor((utc2 - utc1) / MS_PER_DAY);
    }

    getOptions(underlyingSymbol : string) : Promise<Symbol[]>{
        var self = this;
        return new Promise(function(resolve) {
            let id = OptionSymbolService.getId();
            let symbols = self.storageService.getData(id);
            if (typeof symbols === 'undefined') {
                symbols = OptionSymbolService.generateOptionSymbols(underlyingSymbol);
                self.storageService.save(id, symbols);
                resolve(symbols);
            } else {
                resolve(symbols);
            }
        });
    }

    getSymbol(symbol : string) : Symbol{
        return <Symbol>{
            uid: symbol,
            name: symbol,
            underlyingSymbol: symbol,
            expiryDate: '',
            strikePrice: 0
        }
    }

}