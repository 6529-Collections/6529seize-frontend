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

import { ApiDropMedia } from '../models/ApiDropMedia';
import { ApiDropPartContextProfileContext } from '../models/ApiDropPartContextProfileContext';
import { ApiQuotedDropResponse } from '../models/ApiQuotedDropResponse';
import { HttpFile } from '../http/http';

export class ApiDropPart {
    /**
    * Which drop in the storm is this drop
    */
    'part_id': number;
    'content': string | null;
    'media': Array<ApiDropMedia>;
    'quoted_drop': ApiQuotedDropResponse | null;
    'replies_count': number;
    'quotes_count': number;
    'context_profile_context'?: ApiDropPartContextProfileContext | null;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "part_id",
            "baseName": "part_id",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "content",
            "baseName": "content",
            "type": "string",
            "format": ""
        },
        {
            "name": "media",
            "baseName": "media",
            "type": "Array<ApiDropMedia>",
            "format": ""
        },
        {
            "name": "quoted_drop",
            "baseName": "quoted_drop",
            "type": "ApiQuotedDropResponse",
            "format": ""
        },
        {
            "name": "replies_count",
            "baseName": "replies_count",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "quotes_count",
            "baseName": "quotes_count",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "context_profile_context",
            "baseName": "context_profile_context",
            "type": "ApiDropPartContextProfileContext",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return ApiDropPart.attributeTypeMap;
    }

    public constructor() {
    }
}

