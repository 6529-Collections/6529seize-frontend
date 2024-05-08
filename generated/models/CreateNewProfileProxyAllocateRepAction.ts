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

import { ProfileProxyActionType } from '../models/ProfileProxyActionType';
import { HttpFile } from '../http/http';

export class CreateNewProfileProxyAllocateRepAction {
    'action_type': ProfileProxyActionType;
    'end_time': number | null;
    'credit_amount': number;
    'group_id'?: string | null;
    'credit_category': string | null;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "action_type",
            "baseName": "action_type",
            "type": "ProfileProxyActionType",
            "format": ""
        },
        {
            "name": "end_time",
            "baseName": "end_time",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "credit_amount",
            "baseName": "credit_amount",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "group_id",
            "baseName": "group_id",
            "type": "string",
            "format": ""
        },
        {
            "name": "credit_category",
            "baseName": "credit_category",
            "type": "string",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return CreateNewProfileProxyAllocateRepAction.attributeTypeMap;
    }

    public constructor() {
    }
}



