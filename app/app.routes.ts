import { provideRouter, RouterConfig }  from '@angular/router';

import { DynamicPageComponent } from './page/page.component';

const routes: RouterConfig = [
    {
        path: '',
        redirectTo: 'page/123456789',
        pathMatch: 'full'
    },
    {
        path: 'page/:id',
        component: DynamicPageComponent
    }
];

export const appRouterProviders = [
    provideRouter(routes)
];