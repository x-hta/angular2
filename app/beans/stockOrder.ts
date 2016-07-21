import { Order } from './order';
import { EquitySymbol } from './equitySymbol';

export class StockOrder extends Order{
    symbol: EquitySymbol;
}