import {Component, OnInit, ViewChild, ViewContainerRef, ComponentResolver, ComponentFactory, Input} from '@angular/core';

import {WidgetInterface} from './widget.interface';
import {WidgetBuilder} from './widget.builder';
import {WidgetSettingsComponent} from './settings/widget.settings.component';

@Component({
    selector : 'widget',
    templateUrl : 'app/widget/widget.component.html',
    styleUrls : ['app/widget/widget.component.css'],
    providers : [WidgetBuilder],
    directives : [WidgetSettingsComponent]
})
export class WidgetComponent implements OnInit{
    widgetHeader : string = 'Option Trader';
    enableClose : boolean = true;
    enableSettings : boolean = true;
    widgetChannel : string = 'g';
    widgetId : string = '123';

    //@Input()
    widgetType : string = 'optionChain';

    @ViewChild('dynamicContentPlaceHolder', {read: ViewContainerRef})
    protected dynamicComponentTarget: ViewContainerRef;

    @ViewChild(WidgetSettingsComponent)
    private settingsComponent: WidgetSettingsComponent;

    constructor(protected componentResolver: ComponentResolver, protected widgetBuilder: WidgetBuilder){

    }

    ngOnInit() : void{
        console.log('WidgetComponent : ngOnInit()');

        // now we get built component, just to load it
        var dynamicComponent = this.widgetBuilder.CreateWidget(this.widgetType);

        // we have a component and its target
        this.componentResolver
            .resolveComponent(dynamicComponent)
            .then((factory: ComponentFactory<WidgetInterface>) =>
            {
                // Instantiates a single {@link Component} and inserts its Host View
                //   into this container at the specified `index`
                let dynamicComponent = this.dynamicComponentTarget.createComponent(factory, 0);
            });
    }

    private close() : void {
        console.log('WidgetComponent : close()');
    }

    private openSettings() : void{
        console.log('WidgetComponent : openSettings()');
        this.settingsComponent.open();
    }

}