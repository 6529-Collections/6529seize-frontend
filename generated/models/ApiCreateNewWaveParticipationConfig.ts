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

import { ApiCreateNewWaveScope } from '../models/ApiCreateNewWaveScope';
import { ApiIntRange } from '../models/ApiIntRange';
import { ApiWaveParticipationRequirement } from '../models/ApiWaveParticipationRequirement';
import { ApiWaveRequiredMetadata } from '../models/ApiWaveRequiredMetadata';
import { HttpFile } from '../http/http';

export class ApiCreateNewWaveParticipationConfig {
    'scope': ApiCreateNewWaveScope;
    /**
    * The number of applications allowed per participant. Infinite if omitted.
    */
    'no_of_applications_allowed_per_participant': number | null;
    'required_media': Array<ApiWaveParticipationRequirement>;
    /**
    * The metadata that must be provided by the participant.  Empty array if nothing is required. 
    */
    'required_metadata': Array<ApiWaveRequiredMetadata>;
    /**
    * If true then the votes must be signed by voters.
    */
    'signature_required': boolean;
    /**
    * If this is and the \"signature_required\" is set then this will be embedded as a signature input data component for each drop.
    */
    'terms': string | null;
    'period'?: ApiIntRange;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "scope",
            "baseName": "scope",
            "type": "ApiCreateNewWaveScope",
            "format": ""
        },
        {
            "name": "no_of_applications_allowed_per_participant",
            "baseName": "no_of_applications_allowed_per_participant",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "required_media",
            "baseName": "required_media",
            "type": "Array<ApiWaveParticipationRequirement>",
            "format": ""
        },
        {
            "name": "required_metadata",
            "baseName": "required_metadata",
            "type": "Array<ApiWaveRequiredMetadata>",
            "format": ""
        },
        {
            "name": "signature_required",
            "baseName": "signature_required",
            "type": "boolean",
            "format": ""
        },
        {
            "name": "terms",
            "baseName": "terms",
            "type": "string",
            "format": ""
        },
        {
            "name": "period",
            "baseName": "period",
            "type": "ApiIntRange",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return ApiCreateNewWaveParticipationConfig.attributeTypeMap;
    }

    public constructor() {
    }
}

