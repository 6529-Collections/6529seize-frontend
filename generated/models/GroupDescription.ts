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

import { GroupCicFilter } from '../models/GroupCicFilter';
import { GroupLevelFilter } from '../models/GroupLevelFilter';
import { GroupOwnsNft } from '../models/GroupOwnsNft';
import { GroupRepFilter } from '../models/GroupRepFilter';
import { GroupTdhFilter } from '../models/GroupTdhFilter';
import { HttpFile } from '../http/http';

export class GroupDescription {
    'tdh': GroupTdhFilter;
    'rep': GroupRepFilter;
    'cic': GroupCicFilter;
    'level': GroupLevelFilter;
    'owns_nfts': Array<GroupOwnsNft>;
    'identity_group_id': string | null;
    'identity_group_identities_count': number;
    'excluded_identity_group_id': string | null;
    'excluded_identity_group_identities_count': number;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "tdh",
            "baseName": "tdh",
            "type": "GroupTdhFilter",
            "format": ""
        },
        {
            "name": "rep",
            "baseName": "rep",
            "type": "GroupRepFilter",
            "format": ""
        },
        {
            "name": "cic",
            "baseName": "cic",
            "type": "GroupCicFilter",
            "format": ""
        },
        {
            "name": "level",
            "baseName": "level",
            "type": "GroupLevelFilter",
            "format": ""
        },
        {
            "name": "owns_nfts",
            "baseName": "owns_nfts",
            "type": "Array<GroupOwnsNft>",
            "format": ""
        },
        {
            "name": "identity_group_id",
            "baseName": "identity_group_id",
            "type": "string",
            "format": ""
        },
        {
            "name": "identity_group_identities_count",
            "baseName": "identity_group_identities_count",
            "type": "number",
            "format": "int64"
        },
        {
            "name": "excluded_identity_group_id",
            "baseName": "excluded_identity_group_id",
            "type": "string",
            "format": ""
        },
        {
            "name": "excluded_identity_group_identities_count",
            "baseName": "excluded_identity_group_identities_count",
            "type": "number",
            "format": "int64"
        }    ];

    static getAttributeTypeMap() {
        return GroupDescription.attributeTypeMap;
    }

    public constructor() {
    }
}

