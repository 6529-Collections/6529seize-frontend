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

import { ApiCreateGroupDescription } from '../models/ApiCreateGroupDescription';
import { HttpFile } from '../http/http';

export class ApiCreateGroup {
    'name': string;
    'group': ApiCreateGroupDescription;
    'is_private'?: boolean;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "name",
            "baseName": "name",
            "type": "string",
            "format": ""
        },
        {
            "name": "group",
            "baseName": "group",
            "type": "ApiCreateGroupDescription",
            "format": ""
        },
        {
            "name": "is_private",
            "baseName": "is_private",
            "type": "boolean",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return ApiCreateGroup.attributeTypeMap;
    }

    public constructor() {
    }
}

