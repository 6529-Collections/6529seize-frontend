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
import { DropMentionedUser } from '../models/DropMentionedUser';
import { DropMetadata } from '../models/DropMetadata';
import { DropReferencedNFT } from '../models/DropReferencedNFT';
import { HttpFile } from '../http/http';

export class CreateDropRequest {
    'title'?: string | null;
    'content'?: string | null;
    /**
    * If the drop is part of a storm and is not the first drop in the storm
    */
    'root_drop_id'?: string | null;
    'quoted_drop_id'?: string | null;
    'referenced_nfts': Array<DropReferencedNFT>;
    'mentioned_users': Array<DropMentionedUser>;
    'metadata': Array<DropMetadata>;
    'media': Array<DropMedia>;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "title",
            "baseName": "title",
            "type": "string",
            "format": ""
        },
        {
            "name": "content",
            "baseName": "content",
            "type": "string",
            "format": ""
        },
        {
            "name": "root_drop_id",
            "baseName": "root_drop_id",
            "type": "string",
            "format": "uuid"
        },
        {
            "name": "quoted_drop_id",
            "baseName": "quoted_drop_id",
            "type": "string",
            "format": "uuid"
        },
        {
            "name": "referenced_nfts",
            "baseName": "referenced_nfts",
            "type": "Array<DropReferencedNFT>",
            "format": ""
        },
        {
            "name": "mentioned_users",
            "baseName": "mentioned_users",
            "type": "Array<DropMentionedUser>",
            "format": ""
        },
        {
            "name": "metadata",
            "baseName": "metadata",
            "type": "Array<DropMetadata>",
            "format": ""
        },
        {
            "name": "media",
            "baseName": "media",
            "type": "Array<DropMedia>",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return CreateDropRequest.attributeTypeMap;
    }

    public constructor() {
    }
}
