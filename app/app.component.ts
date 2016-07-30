import { Component } from '@angular/core';
import { RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';

import { LocalStorageService }         from './services/local-storage.service';
import { OptionSymbolService }         from './services/opt-symbol.service';
import { OptionSymbolFilterService } from './services/opt-symbol-filter.service';
import { PriceService } from './services/price.service';
import { OptionTradingService } from './services/opt-trading.service';

import { WidgetComponent } from './widget/widget.component';

@Component({
    selector: 'my-app',
    template: `
        <h1>{{title}}</h1>
        <router-outlet></router-outlet>
        `,
    styleUrls: ['app/app.component.css', 'app/app.component.theme.css'],
    directives: [ROUTER_DIRECTIVES],
    providers: [
        ROUTER_PROVIDERS, LocalStorageService, OptionSymbolService, OptionSymbolFilterService, PriceService, OptionTradingService
    ]
})

@RouteConfig([
    {
        path: '/optionChain',
        name: 'OptionChain',
        component: WidgetComponent,
        useAsDefault: true
    }
])

export class AppComponent {
    title = 'Option Trader';
}