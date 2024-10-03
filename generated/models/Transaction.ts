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

export class Transaction {
    'transaction': string;
    'block': number;
    'created_at': Date;
    'transaction_date': Date;
    'from_address': string;
    'to_address': string;
    'contract': string;
    'token_id': number;
    'token_count': number;
    'value': number;
    'royalties': number;
    'gas_gwei': number;
    'gas_price': number;
    'gas_price_gwei': number;
    'gas': number;
    'primary_proceeds': number;
    'eth_price_usd': number;
    'value_usd': number;
    'gas_usd': number;
    'from_display': string | null;
    'to_display': string;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "transaction",
            "baseName": "transaction",
            "type": "string",
            "format": ""
        },
        {
            "name": "block",
            "baseName": "block",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "created_at",
            "baseName": "created_at",
            "type": "Date",
            "format": "date-time"
        },
        {
            "name": "transaction_date",
            "baseName": "transaction_date",
            "type": "Date",
            "format": "date-time"
        },
        {
            "name": "from_address",
            "baseName": "from_address",
            "type": "string",
            "format": ""
        },
        {
            "name": "to_address",
            "baseName": "to_address",
            "type": "string",
            "format": ""
        },
        {
            "name": "contract",
            "baseName": "contract",
            "type": "string",
            "format": ""
        },
        {
            "name": "token_id",
            "baseName": "token_id",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "token_count",
            "baseName": "token_count",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "number",
            "format": "double"
        },
        {
            "name": "royalties",
            "baseName": "royalties",
            "type": "number",
            "format": "double"
        },
        {
            "name": "gas_gwei",
            "baseName": "gas_gwei",
            "type": "number",
            "format": "double"
        },
        {
            "name": "gas_price",
            "baseName": "gas_price",
            "type": "number",
            "format": "double"
        },
        {
            "name": "gas_price_gwei",
            "baseName": "gas_price_gwei",
            "type": "number",
            "format": "double"
        },
        {
            "name": "gas",
            "baseName": "gas",
            "type": "number",
            "format": "double"
        },
        {
            "name": "primary_proceeds",
            "baseName": "primary_proceeds",
            "type": "number",
            "format": "double"
        },
        {
            "name": "eth_price_usd",
            "baseName": "eth_price_usd",
            "type": "number",
            "format": "double"
        },
        {
            "name": "value_usd",
            "baseName": "value_usd",
            "type": "number",
            "format": "double"
        },
        {
            "name": "gas_usd",
            "baseName": "gas_usd",
            "type": "number",
            "format": "double"
        },
        {
            "name": "from_display",
            "baseName": "from_display",
            "type": "string",
            "format": ""
        },
        {
            "name": "to_display",
            "baseName": "to_display",
            "type": "string",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return Transaction.attributeTypeMap;
    }

    public constructor() {
    }
}
