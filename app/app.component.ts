import { Component } from '@angular/core';
import { ROUTER_DIRECTIVES } from '@angular/router';

import { LocalStorageService }         from './services/local-storage.service';
import { OptionSymbolService }         from './services/opt-symbol.service';
import { OptionSymbolFilterService } from './services/opt-symbol-filter.service';
import { PriceService } from './services/price.service';
import { OptionTradingService } from './services/opt-trading.service';

import { DynamicPageComponent } from './page/page.component';

@Component({
    selector: 'my-app',
    template: `
        <router-outlet></router-outlet>
        `,
    styleUrls: ['app/app.component.css', 'app/app.component.theme.css'],
    directives: [ROUTER_DIRECTIVES],
    providers: [
        LocalStorageService, OptionSymbolService, OptionSymbolFilterService, PriceService, OptionTradingService
    ],
    precompile: [DynamicPageComponent]
})

export class AppComponent {
}