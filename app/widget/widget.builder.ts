import {OptionChainComponent} from './../optionChain/optionChain.component'

export class WidgetBuilder{

    public CreateWidget(type : string): any {
        if(type === 'optionChain'){
            return OptionChainComponent;
        }
        return null;
    }

    public CreateWidgetSettings(type : string): any {
        if(type === 'optionChain'){
            return OptionChainComponent;
        }
        return null;
    }
}