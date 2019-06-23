// Filename: public/fields.js
//
// Code written in public files is shared by your site's
// Backend, page code, and site code environments.
//
// Use public files to hold utility functions that can
// be called from multiple locations in your site's code.

/*
    This Module allows for currency and percent format to be used in Wix Input fields.
 */


let INTLCurrencyFormatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

let INTLPercentFormatter = new Intl.NumberFormat('en-AU', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

function readNumber(value) {
    let num = Number(value.replace(/[^0-9.-]+/g,""));
    return isNaN(num) ? null : num;
}

function formatCurrency(value) {
    if (typeof value === 'undefined' || value === null) {
        return null;
    }
    return INTLCurrencyFormatter.format(value);
}

function formatPercent(value) {
    if (typeof value === 'undefined' || value === null) {
        return null;
    }
    return INTLPercentFormatter.format(value / 100);
}

let DATA_FORMAT_HANDLERS = {
    currency: {
        ui_reader: readNumber,
        ui_formatter: formatCurrency,
    },
    percent: {
        ui_reader: readNumber,
        ui_formatter: formatPercent,
    }
};


export class FieldsHandler {

    static _handleFieldEdit(dataset_id, field_id, element) {
        let dataset = $w('#' + dataset_id);
        let type = this.PAGE_FIELDS[dataset_id][field_id].type;
        let {ui_reader, ui_formatter} = DATA_FORMAT_HANDLERS[type];
        let value = ui_reader(element.value);
        dataset.setFieldValue(field_id, value);
        element.value = ui_formatter(value);
    }

    static loadDataset(dataset_id) {
        let dataset_fields = this.PAGE_FIELDS[dataset_id];
        if (!dataset_fields) {
            return; // dataset not registered
        }
        let data = $w('#' + dataset_id).getCurrentItem();

        Object.entries(dataset_fields).forEach(
            (field_entry, idx) => {
                let [field_id, field] = field_entry;
                let type = this.PAGE_FIELDS[dataset_id][field_id].type;
                let formatter = DATA_FORMAT_HANDLERS[type].ui_formatter;

                let value = data[field_id];
                $w('#' + field.ui_id).value = formatter(value);
            }
        )
    }

    static _registerElementHandlers() {
        Object.entries(this.PAGE_FIELDS).forEach(
            (dataset_entry, idx) => {
                let [dataset_id, dataset_fields] = dataset_entry;
                Object.entries(dataset_fields).forEach(
                    (field_entry, idx) => {
                        let [field_id, field] = field_entry;
                        $w('#' + field.ui_id).onChange(
                            (event) => this._handleFieldEdit(dataset_id, field_id, event.target)
                        )
                    }
                )
            }
        )
    }

    static _registerLoadHandlers() {
        Object.keys(this.PAGE_FIELDS).forEach(
            (dataset_id, idx) => {
                $w('#' + dataset_id).onReady(
                    () => FieldsHandler.loadDataset(dataset_id)
                )
            }
        )
    }

    static initPage(page_fields) {
        FieldsHandler.PAGE_FIELDS = page_fields;
        this._registerElementHandlers();
        this._registerLoadHandlers();
    }
}
FieldsHandler.PAGE_FIELDS = null;
