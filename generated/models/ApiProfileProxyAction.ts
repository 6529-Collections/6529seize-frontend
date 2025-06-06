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

import { ApiProfileProxyActionType } from '../models/ApiProfileProxyActionType';
import { HttpFile } from '../http/http';

export class ApiProfileProxyAction {
    'id': string;
    'proxy_id': string;
    'action_type': ApiProfileProxyActionType;
    'credit_amount': number | null;
    'credit_spent': number | null;
    'start_time': number;
    'end_time': number | null;
    'created_at': number;
    'accepted_at': number | null;
    'rejected_at': number | null;
    'revoked_at': number | null;
    'is_active': boolean;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "id",
            "baseName": "id",
            "type": "string",
            "format": ""
        },
        {
            "name": "proxy_id",
            "baseName": "proxy_id",
            "type": "string",
            "format": ""
        },
        {
            "name": "action_type",
            "baseName": "action_type",
            "type": "ApiProfileProxyActionType",
            "format": ""
        },
        {
            "name": "credit_amount",
            "baseName": "credit_amount",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "credit_spent",
            "baseName": "credit_spent",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "start_time",
            "baseName": "start_time",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "end_time",
            "baseName": "end_time",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "created_at",
            "baseName": "created_at",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "accepted_at",
            "baseName": "accepted_at",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "rejected_at",
            "baseName": "rejected_at",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "revoked_at",
            "baseName": "revoked_at",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "is_active",
            "baseName": "is_active",
            "type": "boolean",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return ApiProfileProxyAction.attributeTypeMap;
    }

    public constructor() {
    }
}



