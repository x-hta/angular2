import { Symbol } from './symbol';

export class OptionSymbol extends Symbol{
    underlyingSymbol : string;
    expiryDate: string;
    strikePrice: number;
}
