import { Symbol } from './symbol';
import { Order } from './order';

export class StrategyOrderInfo {
    strategy : string;
    underlyingSymbol : Symbol;
    orders : Order[];
    netPremiumPaid: number;
    netPremiumReceived: number;
    maxProfit: number;
    maxLoss: number;
}
