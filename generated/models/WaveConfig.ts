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

import { IntRange } from '../models/IntRange';
import { WaveScope } from '../models/WaveScope';
import { WaveType } from '../models/WaveType';
import { HttpFile } from '../http/http';

export class WaveConfig {
    'type': WaveType;
    'winning_thresholds': IntRange | null;
    /**
    * This amount of top rated drops will win. Must be set if and only if type is RANK
    */
    'max_winners': number | null;
    /**
    * Vote of a voter is considered eligible after this amount of time after casting it. If not set then votes are eligible immediately after casting.
    */
    'time_lock_ms': number | null;
    'admin_group': WaveScope;
    'period': IntRange | null;
    'authenticated_user_eligible_for_admin': boolean;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "type",
            "baseName": "type",
            "type": "WaveType",
            "format": ""
        },
        {
            "name": "winning_thresholds",
            "baseName": "winning_thresholds",
            "type": "IntRange",
            "format": ""
        },
        {
            "name": "max_winners",
            "baseName": "max_winners",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "time_lock_ms",
            "baseName": "time_lock_ms",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "admin_group",
            "baseName": "admin_group",
            "type": "WaveScope",
            "format": ""
        },
        {
            "name": "period",
            "baseName": "period",
            "type": "IntRange",
            "format": ""
        },
        {
            "name": "authenticated_user_eligible_for_admin",
            "baseName": "authenticated_user_eligible_for_admin",
            "type": "boolean",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return WaveConfig.attributeTypeMap;
    }

    public constructor() {
    }
}



