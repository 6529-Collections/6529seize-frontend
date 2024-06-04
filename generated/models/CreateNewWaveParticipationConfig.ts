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

import { CreateNewWaveScope } from '../models/CreateNewWaveScope';
import { IntRange } from '../models/IntRange';
import { WaveRequiredMetadata } from '../models/WaveRequiredMetadata';
import { HttpFile } from '../http/http';

export class CreateNewWaveParticipationConfig {
    'scope': CreateNewWaveScope;
    /**
    * The number of applications allowed per participant. Infinite if omitted.
    */
    'no_of_applications_allowed_per_participant': number | null;
    /**
    * The metadata that must be provided by the participant.  Empty array if nothing is required. 
    */
    'required_metadata': Array<WaveRequiredMetadata>;
    /**
    * If true then the votes must be signed by voters.
    */
    'signature_required': boolean;
    'period'?: IntRange;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "scope",
            "baseName": "scope",
            "type": "CreateNewWaveScope",
            "format": ""
        },
        {
            "name": "no_of_applications_allowed_per_participant",
            "baseName": "no_of_applications_allowed_per_participant",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "required_metadata",
            "baseName": "required_metadata",
            "type": "Array<WaveRequiredMetadata>",
            "format": ""
        },
        {
            "name": "signature_required",
            "baseName": "signature_required",
            "type": "boolean",
            "format": ""
        },
        {
            "name": "period",
            "baseName": "period",
            "type": "IntRange",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return CreateNewWaveParticipationConfig.attributeTypeMap;
    }

    public constructor() {
    }
}

