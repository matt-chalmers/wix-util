// Filename: public/fields.js
//
// Code written in public files is shared by your site's
// Backend, page code, and site code environments.
//
// Use public files to hold utility functions that can
// be called from multiple locations in your site's code.

/* This Module allows for currency and percent format to be used in Wix Text Input
*  fields.
*
* To get started you must know the IDs of your Wix dataset and their fields, as well
* the HTML id of the fields in the UI. You can gather that information from your
* Corvid editor.
*
* Simple usage example for four fields across two datasets:
*
*   import {FieldsHandler, Dataset, CurrencyField, PercentField} from "public/fields";
*
*   const CUSTOM_PAGE_FIELDS = [
*       new Dataset("wixDatasetID_1", [
*           new CurrencyField("wixFieldID_1", "HTMLFieldID_1"),
*           new PercentField("wixFieldID_2", "HTMLFieldID_2"),
*       ]),
*       new Dataset("wixDatasetID_2", [
*           new CurrencyField("wixFieldID_3", "HTMLFieldID_3", 0, 0),
*           new PercentField("wixFieldID_4", "HTMLFieldID_4", 0, 0),
*       ]),
*   ];
*
*   $w.onReady(function () {
*       FieldsHandler.initPage(CUSTOM_PAGE_FIELDS);
*   });
*
*
* Once the page has loaded and the FieldsHandler has displayed your data, it will
* monitor the UI element for changes and update the Wix dataset appropriately.
*
* BUT - if you manually call refresh() on your Wix dataset the FieldsHandler won't know
* about it and the UI data may move out of sync with the Wix dataset. Fix this by also
* calling FieldsHandler.loadDataset(datasetId) immediately after the refresh. Eg:
*
*   await $w('#' + datasetId).refresh();
*   FieldsHandler.loadDataset(datasetId);
*
* */

import * as _ from "lodash";


/* Data readers and writers utils */


function readNumber(value) {
    const num = Number(value.replace(/[^0-9.-]+/g,""));
    return isNaN(num) ? null : num;
}


/* Classes for describing fields/datasets and initiating our bindings */

export class Field {
    /**
     * Create a Field
     *
     * @param {string} id - the id of the field in the Wix dataset
     * @param {string} interfaceId - the html id of the field in the Wix UI
     * @param {string} type - the formatting type of field as either "currency" or "percent"
     */
    constructor(id, interfaceId, type) {
        this.id = id;
        this.interfaceId = interfaceId;
        this.type = type;
    }

    read(value) {
        return value;
    }

    format(value) {
        return value;
    }
}

export class CurrencyField  extends Field {
    /**
     * Create a CurrencyField
     *
     * @param {Number} minDP - the minimum number of decimal places to show
     * @param {Number} maxDP - the maximum number of decimal places to show
     */
    constructor(id, interfaceId, minDP=2, maxDP=2) {
        super(id, interfaceId, 'currency');
        this.formatter = new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            minimumFractionDigits: minDP,
            maximumFractionDigits: maxDP,
        });
    }

    read(value) {
        return readNumber(value);
    }

    format(value) {
        if (typeof value === 'undefined' || value === null) {
            return null;
        }
        return this.formatter.format(value);
    }
}


export class PercentField  extends Field {
    /**
     * Create a PercentField
     *
     * @param {Number} minDP - the minimum number of decimal places to show
     * @param {Number} maxDP - the maximum number of decimal places to show
     */
    constructor(id, interfaceId, minDP=2, maxDP=2) {
        super(id, interfaceId, 'percent');
        this.formatter = new Intl.NumberFormat('en-AU', {
            style: 'percent',
            minimumFractionDigits: minDP,
            maximumFractionDigits: maxDP,
        });
    }

    read(value) {
        return readNumber(value);
    }

    format(value) {
        if (typeof value === 'undefined' || value === null) {
            return null;
        }
        return this.formatter.format(value / 100);
    }
}


export class Dataset {
    /**
     * Create a Dataset
     *
     * @param {string} id - the id of the Wix dataset
     * @param {Field[]} fields - Array of field requiring custom formatting
     */
    constructor(id, fields) {
        this.id = id;
        this.fields = fields;
    }
}


export class FieldsHandler {

    /**
     * When a field value is changed in the UI, ensure that both the UI
     * format and dataset format are correctly applied to the new value.
     *
     * @param {Dataset} dataset
     * @param {Field} field
     * @param {WixElement} element - the UI element holding the value
     */
    static _handleFieldEdit(dataset, field, element) {
        const wixDataset = $w('#' + dataset.id);
        const value = field.read(element.value);
        wixDataset.setFieldValue(field.id, value);
        element.value = field.format(value);
    }

    /**
     * Load any registered fields for a dataset into the UI view.
     *
     * @param {Number} datasetId
     */
    static loadDataset(datasetId) {
        const dataset = this.PAGE_FIELDS[datasetId];
        if (!dataset.fields) { return; }

        let wixData = $w('#' + dataset.id).getCurrentItem();
        for ( const field of dataset.fields ) {
            const value = wixData[field.id];
            $w('#' + field.interfaceId).value = field.format(value);
        }
    }

    /**
     * Register event handlers for when values are change in the UI
     */
    static _registerElementHandlers() {
        Object.values(this.PAGE_FIELDS).forEach((dataset, idx) => {
            dataset.fields.forEach((field, idx) => {
                $w('#' + field.interfaceId).onChange(
                    (event) => this._handleFieldEdit(dataset, field, event.target)
                )
            });
        });
    }

    /**
     * Register event handlers for when datasets become ready to load into the UI
     */
    static _registerLoadHandlers() {
        Object.values(this.PAGE_FIELDS).forEach((dataset, idx) => {
            $w('#' + dataset.id).onReady(
                () => this.loadDataset(dataset.id)
            )
        });
    }

    /**
     * This is the main entry point for a page to initiate field handling.
     *
     * Initialise the page FieldHandler with the datasets it needs to handle
     * and register all event handlers for the datasets and their fields.
     *
     * @param {Dataset[]} datasets
     */
    static initPage(datasets) {
        this.PAGE_FIELDS = _.keyBy(datasets, 'id');
        this._registerElementHandlers();
        this._registerLoadHandlers();
    }
}
FieldsHandler.PAGE_FIELDS = null;
