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

/**
* What will be counted as a credit. UNIQUE means each voter gets one vote. 
*/
export enum WaveCreditType {
    Tdh = 'TDH',
    Rep = 'REP',
    Unique = 'UNIQUE'
}