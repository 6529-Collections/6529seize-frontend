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

import { ProfileMin } from '../models/ProfileMin';
import { HttpFile } from '../http/http';

export class DropActivityLog {
    'id': string;
    'profile_id': string;
    'author': ProfileMin;
    'target_id': string;
    'contents': any;
    'type': DropActivityLogTypeEnum;
    'created_at': Date;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "id",
            "baseName": "id",
            "type": "string",
            "format": ""
        },
        {
            "name": "profile_id",
            "baseName": "profile_id",
            "type": "string",
            "format": "uuid"
        },
        {
            "name": "author",
            "baseName": "author",
            "type": "ProfileMin",
            "format": ""
        },
        {
            "name": "target_id",
            "baseName": "target_id",
            "type": "string",
            "format": ""
        },
        {
            "name": "contents",
            "baseName": "contents",
            "type": "any",
            "format": ""
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "DropActivityLogTypeEnum",
            "format": ""
        },
        {
            "name": "created_at",
            "baseName": "created_at",
            "type": "Date",
            "format": "date-time"
        }    ];

    static getAttributeTypeMap() {
        return DropActivityLog.attributeTypeMap;
    }

    public constructor() {
    }
}


export enum DropActivityLogTypeEnum {
    Comment = 'DROP_COMMENT',
    RatingEdit = 'DROP_RATING_EDIT',
    Created = 'DROP_CREATED'
}

