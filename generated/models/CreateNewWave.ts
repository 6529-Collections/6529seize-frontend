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

import { CreateNewWaveParticipationConfig } from '../models/CreateNewWaveParticipationConfig';
import { CreateNewWaveVisibilityConfig } from '../models/CreateNewWaveVisibilityConfig';
import { CreateNewWaveVotingConfig } from '../models/CreateNewWaveVotingConfig';
import { WaveConfig } from '../models/WaveConfig';
import { WaveOutcome } from '../models/WaveOutcome';
import { HttpFile } from '../http/http';

export class CreateNewWave {
    /**
    * The name of the wave
    */
    'name': string;
    /**
    * The description of the wave
    */
    'description': string;
    'voting': CreateNewWaveVotingConfig;
    'visibility': CreateNewWaveVisibilityConfig;
    'participation': CreateNewWaveParticipationConfig;
    'wave': WaveConfig;
    'outcomes': Array<WaveOutcome>;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "name",
            "baseName": "name",
            "type": "string",
            "format": ""
        },
        {
            "name": "description",
            "baseName": "description",
            "type": "string",
            "format": ""
        },
        {
            "name": "voting",
            "baseName": "voting",
            "type": "CreateNewWaveVotingConfig",
            "format": ""
        },
        {
            "name": "visibility",
            "baseName": "visibility",
            "type": "CreateNewWaveVisibilityConfig",
            "format": ""
        },
        {
            "name": "participation",
            "baseName": "participation",
            "type": "CreateNewWaveParticipationConfig",
            "format": ""
        },
        {
            "name": "wave",
            "baseName": "wave",
            "type": "WaveConfig",
            "format": ""
        },
        {
            "name": "outcomes",
            "baseName": "outcomes",
            "type": "Array<WaveOutcome>",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return CreateNewWave.attributeTypeMap;
    }

    public constructor() {
    }
}

