import { Select, MenuItem } from "./inspired-components";

import { i18n } from "./shared-vars";
import { Field } from "./data";
import { BaseComponent } from "./base-component";
 
interface ComboBoxProps {
    value?: any;
    onChange?: any;
    items: { Id, Name }[];
    placeholder?: string;
}
export class ComboBox extends BaseComponent<ComboBoxProps, any> {
    refs:{
        comboBox:any;
    }
    render() {
        const p = this.props;
        return (<Select placeholder={p.placeholder}  MenuProps={{ className: "zIndexOneMillon" }} value={p.value}  ref="comboBox"  onChange={p.onChange}>
            {p.items.map(item => <MenuItem key={item.Id} value={item.Id}>{i18n(item.Name)}</MenuItem>)}
        </Select>);
    }
    focus(){
        const {comboBox}=this.refs;
         comboBox && comboBox.focus();
    }
    static textReader(field: Field, props: ComboBoxProps, id) {
        const selectedItems = props.items.filter(ite => ite.Id == id);
        return selectedItems[0] && selectedItems[0].Name;
    }
}

 