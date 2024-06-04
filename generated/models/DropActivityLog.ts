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

import { ProfileMin } from '../models/ProfileMin';
import { HttpFile } from '../http/http';

export class DropActivityLog {
    'id': string;
    'profile_id': string;
    'author': ProfileMin;
    'target_id': string;
    'contents': any;
    'type': DropActivityLogTypeEnum;
    'created_at': number;

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
            "type": "number",
            "format": "int64"
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

