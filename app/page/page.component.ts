import {Component, OnInit, OnDestroy, ViewChild, ViewContainerRef, ComponentResolver, ComponentFactory, Input} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {PageInterface} from './page.component.interface';
import {PageComponentBuilder} from './page.component.builder';
import {WidgetComponent} from './../widget/widget.component';

@Component({
    selector : 'widget',
    template : `
        <div class="">
            <div class="AREA-NORTH">
                <div>header</div>
                <div>menu</div>
            </div>
        <div class="WRAPPER row">
            <div class="col-sm-12">
                <div #dynamicPagePlaceHolder></div>
            </div>
        </div>
        <div class="AREA-SOUTH">
            <div>footer</div>
        </div>
    </div>
    `,
    providers : [PageComponentBuilder]
})
export class DynamicPageComponent implements OnInit, OnDestroy{

    sub: any;

    @ViewChild('dynamicPagePlaceHolder', {read: ViewContainerRef})
    protected dynamicComponentTarget: ViewContainerRef;

    constructor(protected componentResolver: ComponentResolver, protected pageBuilder: PageComponentBuilder, private route: ActivatedRoute){

    }

    ngOnInit(): void{
        console.log('DynamicPageComponent : ngOnInit()');

        this.sub = this.route.params.subscribe(params => {
            let id = params['id'];

            let template:string = this.pageBuilder.CreateTemplate(id);

            // now we get built component, just to load it
            var dynamicComponent = this.pageBuilder.CreateComponent(template, [WidgetComponent]);

            // we have a component and its target
            this.componentResolver
                .resolveComponent(dynamicComponent)
                .then((factory:ComponentFactory<PageInterface>) => {
                    // Instantiates a single {@link Component} and inserts its Host View
                    //   into this container at the specified `index`
                    let dynamicComponent = this.dynamicComponentTarget.createComponent(factory, 0);
                    // and here we have access to our dynamic component
                    let component:PageInterface = dynamicComponent.instance;

                    component.id = "1234";
                });
        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

}