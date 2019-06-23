// Filename: public/updates.js
//
// Code written in public files is shared by your site's
// Backend, page code, and site code environments.
//
// Use public files to hold utility functions that can
// be called from multiple locations in your site's code.

import {FieldsHandler} from 'public/fields';


export async function refreshDataset(dataset_id) {
    await $w('#' + dataset_id).refresh();
    FieldsHandler.loadDataset(dataset_id);
}