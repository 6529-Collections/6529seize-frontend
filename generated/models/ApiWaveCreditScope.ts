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

import { HttpFile } from '../http/http';

/**
* The scope of the credit.  * WAVE - Credit is spendable across all drops in wave.  * DROP - The amount of votes, voter can give to a drop is not affected by votes spent on other drops.  * PARTICIPANT: The amount of votes, voter can give to a drop by concrete participant is only affected by voted given by same user to other drops by the same participant. 
*/
export enum ApiWaveCreditScope {
    Wave = 'WAVE',
    Drop = 'DROP',
    Participant = 'PARTICIPANT'
}