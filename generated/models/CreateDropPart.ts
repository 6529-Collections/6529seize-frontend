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

import { DropMedia } from '../models/DropMedia';
import { QuotedDrop } from '../models/QuotedDrop';
import { HttpFile } from '../http/http';

export class CreateDropPart {
    'content'?: string | null;
    'quoted_drop'?: QuotedDrop | null;
    'media': Array<DropMedia>;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "content",
            "baseName": "content",
            "type": "string",
            "format": ""
        },
        {
            "name": "quoted_drop",
            "baseName": "quoted_drop",
            "type": "QuotedDrop",
            "format": ""
        },
        {
            "name": "media",
            "baseName": "media",
            "type": "Array<DropMedia>",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return CreateDropPart.attributeTypeMap;
    }

    public constructor() {
    }
}

