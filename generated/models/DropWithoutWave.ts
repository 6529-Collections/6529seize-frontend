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

import { DropContextProfileContext } from '../models/DropContextProfileContext';
import { DropMentionedUser } from '../models/DropMentionedUser';
import { DropMetadata } from '../models/DropMetadata';
import { DropPart } from '../models/DropPart';
import { DropRater } from '../models/DropRater';
import { DropReferencedNFT } from '../models/DropReferencedNFT';
import { DropSubscriptionTargetAction } from '../models/DropSubscriptionTargetAction';
import { DropType } from '../models/DropType';
import { ProfileMin } from '../models/ProfileMin';
import { ReplyToDropResponse } from '../models/ReplyToDropResponse';
import { HttpFile } from '../http/http';

export class DropWithoutWave {
    'id': string;
    /**
    * Sequence number of the drop in Seize
    */
    'serial_no': number;
    'drop_type': DropType;
    'reply_to'?: ReplyToDropResponse;
    'author': ProfileMin;
    /**
    * Time when the drop was created in milliseconds since 1-1-1970 00:00:00.0 UTC
    */
    'created_at': number;
    /**
    * Time when the drop was updated in milliseconds since 1-1-1970 00:00:00.0 UTC
    */
    'updated_at': number | null;
    'title': string | null;
    'parts': Array<DropPart>;
    /**
    * Number of drops in the storm
    */
    'parts_count': number;
    'referenced_nfts': Array<DropReferencedNFT>;
    'mentioned_users': Array<DropMentionedUser>;
    'metadata': Array<DropMetadata>;
    'rating': number;
    'top_raters': Array<DropRater>;
    'raters_count': number;
    'context_profile_context': DropContextProfileContext | null;
    'subscribed_actions': Array<DropSubscriptionTargetAction>;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "id",
            "baseName": "id",
            "type": "string",
            "format": ""
        },
        {
            "name": "serial_no",
            "baseName": "serial_no",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "drop_type",
            "baseName": "drop_type",
            "type": "DropType",
            "format": ""
        },
        {
            "name": "reply_to",
            "baseName": "reply_to",
            "type": "ReplyToDropResponse",
            "format": ""
        },
        {
            "name": "author",
            "baseName": "author",
            "type": "ProfileMin",
            "format": ""
        },
        {
            "name": "created_at",
            "baseName": "created_at",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "updated_at",
            "baseName": "updated_at",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "title",
            "baseName": "title",
            "type": "string",
            "format": ""
        },
        {
            "name": "parts",
            "baseName": "parts",
            "type": "Array<DropPart>",
            "format": ""
        },
        {
            "name": "parts_count",
            "baseName": "parts_count",
            "type": "number",
            "format": "int64"
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
            "name": "rating",
            "baseName": "rating",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "top_raters",
            "baseName": "top_raters",
            "type": "Array<DropRater>",
            "format": ""
        },
        {
            "name": "raters_count",
            "baseName": "raters_count",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "context_profile_context",
            "baseName": "context_profile_context",
            "type": "DropContextProfileContext",
            "format": ""
        },
        {
            "name": "subscribed_actions",
            "baseName": "subscribed_actions",
            "type": "Array<DropSubscriptionTargetAction>",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return DropWithoutWave.attributeTypeMap;
    }

    public constructor() {
    }
}



