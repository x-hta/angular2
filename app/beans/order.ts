import { Symbol } from './symbol';

export class Order {
    id: number;
    symbol: Symbol;
    type: string;
    subType:string;
    side: string;
    price: number;
    quantity: number
}
