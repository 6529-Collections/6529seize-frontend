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

import { DropContextProfileContext } from '../models/DropContextProfileContext';
import { DropMedia } from '../models/DropMedia';
import { DropMentionedUser } from '../models/DropMentionedUser';
import { DropMetadata } from '../models/DropMetadata';
import { DropRater } from '../models/DropRater';
import { DropRatingCategory } from '../models/DropRatingCategory';
import { DropReferencedNFT } from '../models/DropReferencedNFT';
import { ProfileMin } from '../models/ProfileMin';
import { HttpFile } from '../http/http';

export class Drop {
    'id': string;
    /**
    * Sequence number of the drop in Seize
    */
    'serial_no': number;
    'author': ProfileMin;
    /**
    * Time when the drop was created in milliseconds since 1-1-1970 00:00:00.0 UTC
    */
    'created_at': number;
    'title'?: string | null;
    'content'?: string | null;
    'quoted_drop_id'?: string | null;
    /**
    * Exists if the drop is part of a storm and is not the first drop in the storm
    */
    'root_drop_id'?: string | null;
    'referenced_nfts': Array<DropReferencedNFT>;
    'mentioned_users': Array<DropMentionedUser>;
    'metadata': Array<DropMetadata>;
    'media': Array<DropMedia>;
    /**
    * Which drop in the storm is this drop
    */
    'storm_sequence': number;
    /**
    * Number of drops in the storm
    */
    'max_storm_sequence': number;
    'rating': number;
    'top_raters': Array<DropRater>;
    'raters_count': number;
    'top_rating_categories': Array<DropRatingCategory>;
    'rating_categories_count': number;
    'discussion_comments_count': number;
    'rating_logs_count': number;
    'quotes_count': number;
    'context_profile_context'?: DropContextProfileContext | null;

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
            "name": "quoted_drop_id",
            "baseName": "quoted_drop_id",
            "type": "string",
            "format": ""
        },
        {
            "name": "root_drop_id",
            "baseName": "root_drop_id",
            "type": "string",
            "format": ""
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
        },
        {
            "name": "storm_sequence",
            "baseName": "storm_sequence",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "max_storm_sequence",
            "baseName": "max_storm_sequence",
            "type": "number",
            "format": "int64"
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
            "name": "top_rating_categories",
            "baseName": "top_rating_categories",
            "type": "Array<DropRatingCategory>",
            "format": ""
        },
        {
            "name": "rating_categories_count",
            "baseName": "rating_categories_count",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "discussion_comments_count",
            "baseName": "discussion_comments_count",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "rating_logs_count",
            "baseName": "rating_logs_count",
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
            "type": "DropContextProfileContext",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return Drop.attributeTypeMap;
    }

    public constructor() {
    }
}

