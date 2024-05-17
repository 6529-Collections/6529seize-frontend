/**
 * Seize API
 * Following is the API interface description for most common operations in Seize API. Some modifying endpoints may need authentication token.
 *
 * OpenAPI spec version: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { HttpFile } from '../http/http';

export class UpdateProxyActionRequest {
    'credit_amount'?: number;
    'end_time'?: number | null;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "credit_amount",
            "baseName": "credit_amount",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "end_time",
            "baseName": "end_time",
            "type": "number",
            "format": "int64"
        }    ];

    static getAttributeTypeMap() {
        return UpdateProxyActionRequest.attributeTypeMap;
    }

    public constructor() {
    }
}

