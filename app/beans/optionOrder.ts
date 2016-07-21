import { Order } from './order';
import { OptionSymbol } from './optionSymbol';

export class OptionOrder extends Order{
    symbol: OptionSymbol;
    type: string;
    subType:string;
}