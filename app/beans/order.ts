import { Symbol } from './symbol';

export class Order {
    id: number;
    symbol : Symbol;
    side: string;
    price: number;
    quantity: number
}
