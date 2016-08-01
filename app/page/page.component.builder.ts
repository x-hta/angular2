import { Component } from '@angular/core';

import {PageInterface} from './page.component.interface';

export class PageComponentBuilder{

    public CreateTemplate(id : string) {

        let template = `
           <div class="MID-CONTENT row">
                <div class="XPAGE col-sm-12">
                    <div class="clearfix"></div>
                    <div class="col-sm-6">
                        <div widget widgetHeader="Option Trader 1" enableClose="true" enableSettings="true" widgetChannel="g"
                            widgetId="123" widgetType="optionChain">
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div widget widgetHeader="Option Trader 2" enableClose="true" enableSettings="true" widgetChannel="g"
                            widgetId="1234" widgetType="optionChain">
                        </div>
                    </div>
                </div>
            </div>
            `;
        return template;
    }

    public CreateComponent(tmpl: string, injectDirectives: any[]): any {

        @Component({
            selector: '[page]',
            template: tmpl,
            directives: injectDirectives,
        })
        class PageComponent implements PageInterface {
            public id: string;
        };

        return PageComponent;
    }
}