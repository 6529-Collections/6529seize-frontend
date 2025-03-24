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

import { ApiCreateDropPart } from '../models/ApiCreateDropPart';
import { ApiDropMentionedUser } from '../models/ApiDropMentionedUser';
import { ApiDropMetadata } from '../models/ApiDropMetadata';
import { ApiDropReferencedNFT } from '../models/ApiDropReferencedNFT';
import { HttpFile } from '../http/http';

export class ApiCreateWaveDropRequest {
    'title'?: string | null;
    'parts': Array<ApiCreateDropPart>;
    'referenced_nfts': Array<ApiDropReferencedNFT>;
    'mentioned_users': Array<ApiDropMentionedUser>;
    'metadata': Array<ApiDropMetadata>;
    /**
    * If wave requires drop signatures then this needs to be set. Signature of a drop is ethSign(creatorWallet, sha256(oneLineJsonWithAlphabeticallySortedFieldsRecursive(ApiCreateDropRequest - signature (+ wave.participation.terms if it exists))))
    */
    'signature': string | null;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "title",
            "baseName": "title",
            "type": "string",
            "format": ""
        },
        {
            "name": "parts",
            "baseName": "parts",
            "type": "Array<ApiCreateDropPart>",
            "format": ""
        },
        {
            "name": "referenced_nfts",
            "baseName": "referenced_nfts",
            "type": "Array<ApiDropReferencedNFT>",
            "format": ""
        },
        {
            "name": "mentioned_users",
            "baseName": "mentioned_users",
            "type": "Array<ApiDropMentionedUser>",
            "format": ""
        },
        {
            "name": "metadata",
            "baseName": "metadata",
            "type": "Array<ApiDropMetadata>",
            "format": ""
        },
        {
            "name": "signature",
            "baseName": "signature",
            "type": "string",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return ApiCreateWaveDropRequest.attributeTypeMap;
    }

    public constructor() {
    }
}

