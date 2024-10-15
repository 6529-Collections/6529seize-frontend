/**
 * Seize API
 * This is the API interface description for the most commonly used operations in Seize API.  Some modifying endpoints require an authentication token.   We are in the process of documenting all Seize APIs.   If there is an API that you need, please ping us in Discord and we will aim to prioritize its documentation.
 *
 * OpenAPI spec version: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { HttpFile } from '../http/http';

export class ApiAggregatedActivity {
    'consolidation_key': string;
    'created_at': Date;
    'updated_at': Date;
    'primary_purchases_value': number;
    'primary_purchases_count': number;
    'secondary_purchases_value': number;
    'secondary_purchases_count': number;
    'burns': number;
    'sales_value': number;
    'sales_count': number;
    'airdrops': number;
    'transfers_in': number;
    'transfers_out': number;
    'primary_purchases_value_memes': number;
    'primary_purchases_count_memes': number;
    'secondary_purchases_value_memes': number;
    'secondary_purchases_count_memes': number;
    'burns_memes': number;
    'sales_value_memes': number;
    'sales_count_memes': number;
    'airdrops_memes': number;
    'transfers_in_memes': number;
    'transfers_out_memes': number;
    'primary_purchases_value_memelab': number;
    'primary_purchases_count_memelab': number;
    'secondary_purchases_value_memelab': number;
    'secondary_purchases_count_memelab': number;
    'burns_memelab': number;
    'sales_value_memelab': number;
    'sales_count_memelab': number;
    'airdrops_memelab': number;
    'transfers_in_memelab': number;
    'transfers_out_memelab': number;
    'primary_purchases_value_gradients': number;
    'primary_purchases_count_gradients': number;
    'secondary_purchases_value_gradients': number;
    'secondary_purchases_count_gradients': number;
    'burns_gradients': number;
    'sales_value_gradients': number;
    'sales_count_gradients': number;
    'airdrops_gradients': number;
    'transfers_in_gradients': number;
    'transfers_out_gradients': number;
    'primary_purchases_value_nextgen': number;
    'primary_purchases_count_nextgen': number;
    'secondary_purchases_value_nextgen': number;
    'secondary_purchases_count_nextgen': number;
    'burns_nextgen': number;
    'sales_value_nextgen': number;
    'sales_count_nextgen': number;
    'airdrops_nextgen': number;
    'transfers_in_nextgen': number;
    'transfers_out_nextgen': number;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "consolidation_key",
            "baseName": "consolidation_key",
            "type": "string",
            "format": ""
        },
        {
            "name": "created_at",
            "baseName": "created_at",
            "type": "Date",
            "format": "date-time"
        },
        {
            "name": "updated_at",
            "baseName": "updated_at",
            "type": "Date",
            "format": "date-time"
        },
        {
            "name": "primary_purchases_value",
            "baseName": "primary_purchases_value",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "primary_purchases_count",
            "baseName": "primary_purchases_count",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "secondary_purchases_value",
            "baseName": "secondary_purchases_value",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "secondary_purchases_count",
            "baseName": "secondary_purchases_count",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "burns",
            "baseName": "burns",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "sales_value",
            "baseName": "sales_value",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "sales_count",
            "baseName": "sales_count",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "airdrops",
            "baseName": "airdrops",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "transfers_in",
            "baseName": "transfers_in",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "transfers_out",
            "baseName": "transfers_out",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "primary_purchases_value_memes",
            "baseName": "primary_purchases_value_memes",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "primary_purchases_count_memes",
            "baseName": "primary_purchases_count_memes",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "secondary_purchases_value_memes",
            "baseName": "secondary_purchases_value_memes",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "secondary_purchases_count_memes",
            "baseName": "secondary_purchases_count_memes",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "burns_memes",
            "baseName": "burns_memes",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "sales_value_memes",
            "baseName": "sales_value_memes",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "sales_count_memes",
            "baseName": "sales_count_memes",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "airdrops_memes",
            "baseName": "airdrops_memes",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "transfers_in_memes",
            "baseName": "transfers_in_memes",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "transfers_out_memes",
            "baseName": "transfers_out_memes",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "primary_purchases_value_memelab",
            "baseName": "primary_purchases_value_memelab",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "primary_purchases_count_memelab",
            "baseName": "primary_purchases_count_memelab",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "secondary_purchases_value_memelab",
            "baseName": "secondary_purchases_value_memelab",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "secondary_purchases_count_memelab",
            "baseName": "secondary_purchases_count_memelab",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "burns_memelab",
            "baseName": "burns_memelab",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "sales_value_memelab",
            "baseName": "sales_value_memelab",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "sales_count_memelab",
            "baseName": "sales_count_memelab",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "airdrops_memelab",
            "baseName": "airdrops_memelab",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "transfers_in_memelab",
            "baseName": "transfers_in_memelab",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "transfers_out_memelab",
            "baseName": "transfers_out_memelab",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "primary_purchases_value_gradients",
            "baseName": "primary_purchases_value_gradients",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "primary_purchases_count_gradients",
            "baseName": "primary_purchases_count_gradients",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "secondary_purchases_value_gradients",
            "baseName": "secondary_purchases_value_gradients",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "secondary_purchases_count_gradients",
            "baseName": "secondary_purchases_count_gradients",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "burns_gradients",
            "baseName": "burns_gradients",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "sales_value_gradients",
            "baseName": "sales_value_gradients",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "sales_count_gradients",
            "baseName": "sales_count_gradients",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "airdrops_gradients",
            "baseName": "airdrops_gradients",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "transfers_in_gradients",
            "baseName": "transfers_in_gradients",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "transfers_out_gradients",
            "baseName": "transfers_out_gradients",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "primary_purchases_value_nextgen",
            "baseName": "primary_purchases_value_nextgen",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "primary_purchases_count_nextgen",
            "baseName": "primary_purchases_count_nextgen",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "secondary_purchases_value_nextgen",
            "baseName": "secondary_purchases_value_nextgen",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "secondary_purchases_count_nextgen",
            "baseName": "secondary_purchases_count_nextgen",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "burns_nextgen",
            "baseName": "burns_nextgen",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "sales_value_nextgen",
            "baseName": "sales_value_nextgen",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "sales_count_nextgen",
            "baseName": "sales_count_nextgen",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "airdrops_nextgen",
            "baseName": "airdrops_nextgen",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "transfers_in_nextgen",
            "baseName": "transfers_in_nextgen",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "transfers_out_nextgen",
            "baseName": "transfers_out_nextgen",
            "type": "number",
            "format": "int64"
        }    ];

    static getAttributeTypeMap() {
        return ApiAggregatedActivity.attributeTypeMap;
    }

    public constructor() {
    }
}
