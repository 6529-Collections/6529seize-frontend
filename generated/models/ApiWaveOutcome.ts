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

import { ApiWaveOutcomeCredit } from '../models/ApiWaveOutcomeCredit';
import { ApiWaveOutcomeDistributionItem } from '../models/ApiWaveOutcomeDistributionItem';
import { ApiWaveOutcomeSubType } from '../models/ApiWaveOutcomeSubType';
import { ApiWaveOutcomeType } from '../models/ApiWaveOutcomeType';
import { HttpFile } from '../http/http';

export class ApiWaveOutcome {
    'type': ApiWaveOutcomeType;
    'subtype'?: ApiWaveOutcomeSubType;
    'description': string;
    'credit'?: ApiWaveOutcomeCredit;
    'rep_category'?: string;
    'amount'?: number;
    'distribution'?: Array<ApiWaveOutcomeDistributionItem>;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "type",
            "baseName": "type",
            "type": "ApiWaveOutcomeType",
            "format": ""
        },
        {
            "name": "subtype",
            "baseName": "subtype",
            "type": "ApiWaveOutcomeSubType",
            "format": ""
        },
        {
            "name": "description",
            "baseName": "description",
            "type": "string",
            "format": ""
        },
        {
            "name": "credit",
            "baseName": "credit",
            "type": "ApiWaveOutcomeCredit",
            "format": ""
        },
        {
            "name": "rep_category",
            "baseName": "rep_category",
            "type": "string",
            "format": ""
        },
        {
            "name": "amount",
            "baseName": "amount",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "distribution",
            "baseName": "distribution",
            "type": "Array<ApiWaveOutcomeDistributionItem>",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return ApiWaveOutcome.attributeTypeMap;
    }

    public constructor() {
    }
}



