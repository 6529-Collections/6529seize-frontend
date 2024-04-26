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

export class DropMentionedUser {
    'mentioned_profile_id': string;
    'handle_in_content': string;
    'current_handle'?: string | null;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "mentioned_profile_id",
            "baseName": "mentioned_profile_id",
            "type": "string",
            "format": "uuid"
        },
        {
            "name": "handle_in_content",
            "baseName": "handle_in_content",
            "type": "string",
            "format": ""
        },
        {
            "name": "current_handle",
            "baseName": "current_handle",
            "type": "string",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return DropMentionedUser.attributeTypeMap;
    }

    public constructor() {
    }
}
