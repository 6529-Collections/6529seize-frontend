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

export class Nft {
    'id': number;
    'contract': string;
    'mint_price': number;
    'supply': number;
    'name': string;
    'collection': string;
    'token_type': NftTokenTypeEnum;
    'hodl_rate': number;
    'description': string;
    'artist': string;
    'uri': string | null;
    'thumbnail': string;
    'image': string | null;
    'animation': string | null;
    'metadata': any;
    'tdh': number;
    'tdh__raw': number;
    'tdh_rank': number;
    'market_cap': number;
    'floor_price': number;
    'scaled': string;
    'compressed_animation': string | null;
    'icon': string;
    'total_volume_last_24_hours': number;
    'total_volume_last_7_days': number;
    'total_volume_last_1_month': number;
    'total_volume': number;
    'created_at': Date;
    'mint_date': Date;
    'boosted_tdh': number;
    'artist_seize_handle': string | null;
    'has_distribution': boolean;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "id",
            "baseName": "id",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "contract",
            "baseName": "contract",
            "type": "string",
            "format": ""
        },
        {
            "name": "mint_price",
            "baseName": "mint_price",
            "type": "number",
            "format": "float"
        },
        {
            "name": "supply",
            "baseName": "supply",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string",
            "format": ""
        },
        {
            "name": "collection",
            "baseName": "collection",
            "type": "string",
            "format": ""
        },
        {
            "name": "token_type",
            "baseName": "token_type",
            "type": "NftTokenTypeEnum",
            "format": ""
        },
        {
            "name": "hodl_rate",
            "baseName": "hodl_rate",
            "type": "number",
            "format": "float"
        },
        {
            "name": "description",
            "baseName": "description",
            "type": "string",
            "format": ""
        },
        {
            "name": "artist",
            "baseName": "artist",
            "type": "string",
            "format": ""
        },
        {
            "name": "uri",
            "baseName": "uri",
            "type": "string",
            "format": ""
        },
        {
            "name": "thumbnail",
            "baseName": "thumbnail",
            "type": "string",
            "format": ""
        },
        {
            "name": "image",
            "baseName": "image",
            "type": "string",
            "format": ""
        },
        {
            "name": "animation",
            "baseName": "animation",
            "type": "string",
            "format": ""
        },
        {
            "name": "metadata",
            "baseName": "metadata",
            "type": "any",
            "format": ""
        },
        {
            "name": "tdh",
            "baseName": "tdh",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "tdh__raw",
            "baseName": "tdh__raw",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "tdh_rank",
            "baseName": "tdh_rank",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "market_cap",
            "baseName": "market_cap",
            "type": "number",
            "format": "float"
        },
        {
            "name": "floor_price",
            "baseName": "floor_price",
            "type": "number",
            "format": "float"
        },
        {
            "name": "scaled",
            "baseName": "scaled",
            "type": "string",
            "format": ""
        },
        {
            "name": "compressed_animation",
            "baseName": "compressed_animation",
            "type": "string",
            "format": ""
        },
        {
            "name": "icon",
            "baseName": "icon",
            "type": "string",
            "format": ""
        },
        {
            "name": "total_volume_last_24_hours",
            "baseName": "total_volume_last_24_hours",
            "type": "number",
            "format": "float"
        },
        {
            "name": "total_volume_last_7_days",
            "baseName": "total_volume_last_7_days",
            "type": "number",
            "format": "float"
        },
        {
            "name": "total_volume_last_1_month",
            "baseName": "total_volume_last_1_month",
            "type": "number",
            "format": "float"
        },
        {
            "name": "total_volume",
            "baseName": "total_volume",
            "type": "number",
            "format": "float"
        },
        {
            "name": "created_at",
            "baseName": "created_at",
            "type": "Date",
            "format": "date-time"
        },
        {
            "name": "mint_date",
            "baseName": "mint_date",
            "type": "Date",
            "format": "date-time"
        },
        {
            "name": "boosted_tdh",
            "baseName": "boosted_tdh",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "artist_seize_handle",
            "baseName": "artist_seize_handle",
            "type": "string",
            "format": ""
        },
        {
            "name": "has_distribution",
            "baseName": "has_distribution",
            "type": "boolean",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return Nft.attributeTypeMap;
    }

    public constructor() {
    }
}


export enum NftTokenTypeEnum {
    Erc1155 = 'ERC1155',
    Eec721 = 'EEC721'
}

