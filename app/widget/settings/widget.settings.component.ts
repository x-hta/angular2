import {Component, OnInit, ViewChild, ViewContainerRef, ComponentResolver, ComponentFactory, Input} from '@angular/core';

import {WidgetSettingsInterface} from './widget.settings.interface';
import {WidgetBuilder} from './../widget.builder';

@Component({
    selector : '[widget-settings]',
    templateUrl : 'app/widget/settings/widget.settings.component.html',
    styleUrls : ['app/widget/settings/widget.settings.component.css'],
    providers : [WidgetBuilder]
})
export class WidgetSettingsComponent implements OnInit{

    widgetId : string = '123';

    //@Input()
    widgetType : string = 'optionChain';

    @ViewChild('dynamicSettingsContentPlaceHolder', {read: ViewContainerRef})
    protected dynamicComponentTarget: ViewContainerRef;

    constructor(protected componentResolver: ComponentResolver, protected widgetBuilder: WidgetBuilder){

    }

    ngOnInit() {
        console.log('WidgetSettingsComponent : ngOnInit()');

        // now we get built component, just to load it
        var dynamicComponent = this.widgetBuilder.CreateWidgetSettings(this.widgetType);

        // we have a component and its target
        this.componentResolver
            .resolveComponent(dynamicComponent)
            .then((factory: ComponentFactory<WidgetSettingsInterface>) =>
            {
                // Instantiates a single {@link Component} and inserts its Host View
                //   into this container at the specified `index`
                let dynamicComponent = this.dynamicComponentTarget.createComponent(factory, 0);
            });
    }

    public open() : void {
        console.log('WidgetSettingsComponent : open()');
    }

    private close() : void {
        console.log('WidgetSettingsComponent : close()');
    }

}