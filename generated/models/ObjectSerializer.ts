export * from '../models/AcceptActionRequest';
export * from '../models/AddActionToProxyRequest';
export * from '../models/AvailableRatingCredit';
export * from '../models/BulkRateRequest';
export * from '../models/BulkRateResponse';
export * from '../models/BulkRateSkippedIdentity';
export * from '../models/ChangeGroupVisibility';
export * from '../models/ChangeProfileCicRating';
export * from '../models/ChangeProfileCicRatingResponse';
export * from '../models/ChangeProfileRepRating';
export * from '../models/ChangeProfileRepRatingResponse';
export * from '../models/CreateDropMediaUrl201Response';
export * from '../models/CreateDropMediaUrlRequest';
export * from '../models/CreateDropPart';
export * from '../models/CreateDropRequest';
export * from '../models/CreateGroup';
export * from '../models/CreateGroupDescription';
export * from '../models/CreateNewProfileProxy';
export * from '../models/CreateNewProfileProxyAllocateCicAction';
export * from '../models/CreateNewProfileProxyAllocateRepAction';
export * from '../models/CreateNewProfileProxyCreateWaveAction';
export * from '../models/CreateNewProfileProxyCreateWaveParticipationDropAction';
export * from '../models/CreateNewProfileProxyRateWaveDropAction';
export * from '../models/CreateNewProfileProxyReadWaveAction';
export * from '../models/CreateNewWave';
export * from '../models/CreateNewWaveParticipationConfig';
export * from '../models/CreateNewWaveScope';
export * from '../models/CreateNewWaveVisibilityConfig';
export * from '../models/CreateNewWaveVotingConfig';
export * from '../models/Drop';
export * from '../models/DropActivityLog';
export * from '../models/DropComment';
export * from '../models/DropCommentsPage';
export * from '../models/DropContextProfileContext';
export * from '../models/DropMedia';
export * from '../models/DropMentionedUser';
export * from '../models/DropMetadata';
export * from '../models/DropPart';
export * from '../models/DropPartContextProfileContext';
export * from '../models/DropRater';
export * from '../models/DropRatingCategory';
export * from '../models/DropRatingRequest';
export * from '../models/DropReferencedNFT';
export * from '../models/Group';
export * from '../models/GroupCicFilter';
export * from '../models/GroupDescription';
export * from '../models/GroupFilterDirection';
export * from '../models/GroupFull';
export * from '../models/GroupLevelFilter';
export * from '../models/GroupOwnsNft';
export * from '../models/GroupRepFilter';
export * from '../models/GroupTdhFilter';
export * from '../models/IntRange';
export * from '../models/LoginRequest';
export * from '../models/LoginResponse';
export * from '../models/NewDropComment';
export * from '../models/Nft';
export * from '../models/NftsPage';
export * from '../models/NonceResponse';
export * from '../models/PageBase';
export * from '../models/PageWithNextUriBase';
export * from '../models/ProfileMin';
export * from '../models/ProfileProxy';
export * from '../models/ProfileProxyAction';
export * from '../models/ProfileProxyActionType';
export * from '../models/QuotedDrop';
export * from '../models/RateMatter';
export * from '../models/RatingWithProfileInfoAndLevel';
export * from '../models/RatingWithProfileInfoAndLevelPage';
export * from '../models/RepRating';
export * from '../models/UpdateProxyActionRequest';
export * from '../models/Wave';
export * from '../models/WaveConfig';
export * from '../models/WaveCreditScope';
export * from '../models/WaveCreditType';
export * from '../models/WaveOutcome';
export * from '../models/WaveParticipationConfig';
export * from '../models/WaveRequiredMetadata';
export * from '../models/WaveScope';
export * from '../models/WaveType';
export * from '../models/WaveVisibilityConfig';
export * from '../models/WaveVotingConfig';

import { AcceptActionRequest, AcceptActionRequestActionEnum   } from '../models/AcceptActionRequest';
import { AddActionToProxyRequest    } from '../models/AddActionToProxyRequest';
import { AvailableRatingCredit } from '../models/AvailableRatingCredit';
import { BulkRateRequest     } from '../models/BulkRateRequest';
import { BulkRateResponse } from '../models/BulkRateResponse';
import { BulkRateSkippedIdentity } from '../models/BulkRateSkippedIdentity';
import { ChangeGroupVisibility } from '../models/ChangeGroupVisibility';
import { ChangeProfileCicRating } from '../models/ChangeProfileCicRating';
import { ChangeProfileCicRatingResponse } from '../models/ChangeProfileCicRatingResponse';
import { ChangeProfileRepRating } from '../models/ChangeProfileRepRating';
import { ChangeProfileRepRatingResponse } from '../models/ChangeProfileRepRatingResponse';
import { CreateDropMediaUrl201Response } from '../models/CreateDropMediaUrl201Response';
import { CreateDropMediaUrlRequest } from '../models/CreateDropMediaUrlRequest';
import { CreateDropPart } from '../models/CreateDropPart';
import { CreateDropRequest } from '../models/CreateDropRequest';
import { CreateGroup } from '../models/CreateGroup';
import { CreateGroupDescription } from '../models/CreateGroupDescription';
import { CreateNewProfileProxy } from '../models/CreateNewProfileProxy';
import { CreateNewProfileProxyAllocateCicAction    } from '../models/CreateNewProfileProxyAllocateCicAction';
import { CreateNewProfileProxyAllocateRepAction    } from '../models/CreateNewProfileProxyAllocateRepAction';
import { CreateNewProfileProxyCreateWaveAction   } from '../models/CreateNewProfileProxyCreateWaveAction';
import { CreateNewProfileProxyCreateWaveParticipationDropAction   } from '../models/CreateNewProfileProxyCreateWaveParticipationDropAction';
import { CreateNewProfileProxyRateWaveDropAction   } from '../models/CreateNewProfileProxyRateWaveDropAction';
import { CreateNewProfileProxyReadWaveAction   } from '../models/CreateNewProfileProxyReadWaveAction';
import { CreateNewWave } from '../models/CreateNewWave';
import { CreateNewWaveParticipationConfig } from '../models/CreateNewWaveParticipationConfig';
import { CreateNewWaveScope } from '../models/CreateNewWaveScope';
import { CreateNewWaveVisibilityConfig } from '../models/CreateNewWaveVisibilityConfig';
import { CreateNewWaveVotingConfig        } from '../models/CreateNewWaveVotingConfig';
import { Drop } from '../models/Drop';
import { DropActivityLog     , DropActivityLogTypeEnum    } from '../models/DropActivityLog';
import { DropComment } from '../models/DropComment';
import { DropCommentsPage } from '../models/DropCommentsPage';
import { DropContextProfileContext } from '../models/DropContextProfileContext';
import { DropMedia } from '../models/DropMedia';
import { DropMentionedUser } from '../models/DropMentionedUser';
import { DropMetadata } from '../models/DropMetadata';
import { DropPart } from '../models/DropPart';
import { DropPartContextProfileContext } from '../models/DropPartContextProfileContext';
import { DropRater } from '../models/DropRater';
import { DropRatingCategory } from '../models/DropRatingCategory';
import { DropRatingRequest } from '../models/DropRatingRequest';
import { DropReferencedNFT } from '../models/DropReferencedNFT';
import { Group } from '../models/Group';
import { GroupCicFilter     } from '../models/GroupCicFilter';
import { GroupDescription } from '../models/GroupDescription';
import { GroupFilterDirection } from '../models/GroupFilterDirection';
import { GroupFull } from '../models/GroupFull';
import { GroupLevelFilter } from '../models/GroupLevelFilter';
import { GroupOwnsNft, GroupOwnsNftNameEnum    } from '../models/GroupOwnsNft';
import { GroupRepFilter      } from '../models/GroupRepFilter';
import { GroupTdhFilter } from '../models/GroupTdhFilter';
import { IntRange } from '../models/IntRange';
import { LoginRequest } from '../models/LoginRequest';
import { LoginResponse } from '../models/LoginResponse';
import { NewDropComment } from '../models/NewDropComment';
import { Nft      , NftTokenTypeEnum                            } from '../models/Nft';
import { NftsPage } from '../models/NftsPage';
import { NonceResponse } from '../models/NonceResponse';
import { PageBase } from '../models/PageBase';
import { PageWithNextUriBase } from '../models/PageWithNextUriBase';
import { ProfileMin } from '../models/ProfileMin';
import { ProfileProxy } from '../models/ProfileProxy';
import { ProfileProxyAction             } from '../models/ProfileProxyAction';
import { ProfileProxyActionType } from '../models/ProfileProxyActionType';
import { QuotedDrop } from '../models/QuotedDrop';
import { RateMatter } from '../models/RateMatter';
import { RatingWithProfileInfoAndLevel } from '../models/RatingWithProfileInfoAndLevel';
import { RatingWithProfileInfoAndLevelPage } from '../models/RatingWithProfileInfoAndLevelPage';
import { RepRating } from '../models/RepRating';
import { UpdateProxyActionRequest } from '../models/UpdateProxyActionRequest';
import { Wave } from '../models/Wave';
import { WaveConfig       } from '../models/WaveConfig';
import { WaveCreditScope } from '../models/WaveCreditScope';
import { WaveCreditType } from '../models/WaveCreditType';
import { WaveOutcome } from '../models/WaveOutcome';
import { WaveParticipationConfig } from '../models/WaveParticipationConfig';
import { WaveRequiredMetadata } from '../models/WaveRequiredMetadata';
import { WaveScope } from '../models/WaveScope';
import { WaveType } from '../models/WaveType';
import { WaveVisibilityConfig } from '../models/WaveVisibilityConfig';
import { WaveVotingConfig        } from '../models/WaveVotingConfig';

/* tslint:disable:no-unused-variable */
let primitives = [
                    "string",
                    "boolean",
                    "double",
                    "integer",
                    "long",
                    "float",
                    "number",
                    "any"
                 ];

let enumsMap: Set<string> = new Set<string>([
    "AcceptActionRequestActionEnum",
    "DropActivityLogTypeEnum",
    "GroupFilterDirection",
    "GroupOwnsNftNameEnum",
    "NftTokenTypeEnum",
    "ProfileProxyActionType",
    "RateMatter",
    "WaveCreditScope",
    "WaveCreditType",
    "WaveType",
]);

let typeMap: {[index: string]: any} = {
    "AcceptActionRequest": AcceptActionRequest,
    "AddActionToProxyRequest": AddActionToProxyRequest,
    "AvailableRatingCredit": AvailableRatingCredit,
    "BulkRateRequest": BulkRateRequest,
    "BulkRateResponse": BulkRateResponse,
    "BulkRateSkippedIdentity": BulkRateSkippedIdentity,
    "ChangeGroupVisibility": ChangeGroupVisibility,
    "ChangeProfileCicRating": ChangeProfileCicRating,
    "ChangeProfileCicRatingResponse": ChangeProfileCicRatingResponse,
    "ChangeProfileRepRating": ChangeProfileRepRating,
    "ChangeProfileRepRatingResponse": ChangeProfileRepRatingResponse,
    "CreateDropMediaUrl201Response": CreateDropMediaUrl201Response,
    "CreateDropMediaUrlRequest": CreateDropMediaUrlRequest,
    "CreateDropPart": CreateDropPart,
    "CreateDropRequest": CreateDropRequest,
    "CreateGroup": CreateGroup,
    "CreateGroupDescription": CreateGroupDescription,
    "CreateNewProfileProxy": CreateNewProfileProxy,
    "CreateNewProfileProxyAllocateCicAction": CreateNewProfileProxyAllocateCicAction,
    "CreateNewProfileProxyAllocateRepAction": CreateNewProfileProxyAllocateRepAction,
    "CreateNewProfileProxyCreateWaveAction": CreateNewProfileProxyCreateWaveAction,
    "CreateNewProfileProxyCreateWaveParticipationDropAction": CreateNewProfileProxyCreateWaveParticipationDropAction,
    "CreateNewProfileProxyRateWaveDropAction": CreateNewProfileProxyRateWaveDropAction,
    "CreateNewProfileProxyReadWaveAction": CreateNewProfileProxyReadWaveAction,
    "CreateNewWave": CreateNewWave,
    "CreateNewWaveParticipationConfig": CreateNewWaveParticipationConfig,
    "CreateNewWaveScope": CreateNewWaveScope,
    "CreateNewWaveVisibilityConfig": CreateNewWaveVisibilityConfig,
    "CreateNewWaveVotingConfig": CreateNewWaveVotingConfig,
    "Drop": Drop,
    "DropActivityLog": DropActivityLog,
    "DropComment": DropComment,
    "DropCommentsPage": DropCommentsPage,
    "DropContextProfileContext": DropContextProfileContext,
    "DropMedia": DropMedia,
    "DropMentionedUser": DropMentionedUser,
    "DropMetadata": DropMetadata,
    "DropPart": DropPart,
    "DropPartContextProfileContext": DropPartContextProfileContext,
    "DropRater": DropRater,
    "DropRatingCategory": DropRatingCategory,
    "DropRatingRequest": DropRatingRequest,
    "DropReferencedNFT": DropReferencedNFT,
    "Group": Group,
    "GroupCicFilter": GroupCicFilter,
    "GroupDescription": GroupDescription,
    "GroupFull": GroupFull,
    "GroupLevelFilter": GroupLevelFilter,
    "GroupOwnsNft": GroupOwnsNft,
    "GroupRepFilter": GroupRepFilter,
    "GroupTdhFilter": GroupTdhFilter,
    "IntRange": IntRange,
    "LoginRequest": LoginRequest,
    "LoginResponse": LoginResponse,
    "NewDropComment": NewDropComment,
    "Nft": Nft,
    "NftsPage": NftsPage,
    "NonceResponse": NonceResponse,
    "PageBase": PageBase,
    "PageWithNextUriBase": PageWithNextUriBase,
    "ProfileMin": ProfileMin,
    "ProfileProxy": ProfileProxy,
    "ProfileProxyAction": ProfileProxyAction,
    "QuotedDrop": QuotedDrop,
    "RatingWithProfileInfoAndLevel": RatingWithProfileInfoAndLevel,
    "RatingWithProfileInfoAndLevelPage": RatingWithProfileInfoAndLevelPage,
    "RepRating": RepRating,
    "UpdateProxyActionRequest": UpdateProxyActionRequest,
    "Wave": Wave,
    "WaveConfig": WaveConfig,
    "WaveOutcome": WaveOutcome,
    "WaveParticipationConfig": WaveParticipationConfig,
    "WaveRequiredMetadata": WaveRequiredMetadata,
    "WaveScope": WaveScope,
    "WaveVisibilityConfig": WaveVisibilityConfig,
    "WaveVotingConfig": WaveVotingConfig,
}

type MimeTypeDescriptor = {
    type: string;
    subtype: string;
    subtypeTokens: string[];
};

/**
 * Every mime-type consists of a type, subtype, and optional parameters.
 * The subtype can be composite, including information about the content format.
 * For example: `application/json-patch+json`, `application/merge-patch+json`.
 *
 * This helper transforms a string mime-type into an internal representation.
 * This simplifies the implementation of predicates that in turn define common rules for parsing or stringifying
 * the payload.
 */
const parseMimeType = (mimeType: string): MimeTypeDescriptor => {
    const [type, subtype] = mimeType.split('/');
    return {
        type,
        subtype,
        subtypeTokens: subtype.split('+'),
    };
};

type MimeTypePredicate = (mimeType: string) => boolean;

// This factory creates a predicate function that checks a string mime-type against defined rules.
const mimeTypePredicateFactory = (predicate: (descriptor: MimeTypeDescriptor) => boolean): MimeTypePredicate => (mimeType) => predicate(parseMimeType(mimeType));

// Use this factory when you need to define a simple predicate based only on type and, if applicable, subtype.
const mimeTypeSimplePredicateFactory = (type: string, subtype?: string): MimeTypePredicate => mimeTypePredicateFactory((descriptor) => {
    if (descriptor.type !== type) return false;
    if (subtype != null && descriptor.subtype !== subtype) return false;
    return true;
});

// Creating a set of named predicates that will help us determine how to handle different mime-types
const isTextLikeMimeType = mimeTypeSimplePredicateFactory('text');
const isJsonMimeType = mimeTypeSimplePredicateFactory('application', 'json');
const isJsonLikeMimeType = mimeTypePredicateFactory((descriptor) => descriptor.type === 'application' && descriptor.subtypeTokens.some((item) => item === 'json'));
const isOctetStreamMimeType = mimeTypeSimplePredicateFactory('application', 'octet-stream');
const isFormUrlencodedMimeType = mimeTypeSimplePredicateFactory('application', 'x-www-form-urlencoded');

// Defining a list of mime-types in the order of prioritization for handling.
const supportedMimeTypePredicatesWithPriority: MimeTypePredicate[] = [
    isJsonMimeType,
    isJsonLikeMimeType,
    isTextLikeMimeType,
    isOctetStreamMimeType,
    isFormUrlencodedMimeType,
];

export class ObjectSerializer {
    public static findCorrectType(data: any, expectedType: string) {
        if (data == undefined) {
            return expectedType;
        } else if (primitives.indexOf(expectedType.toLowerCase()) !== -1) {
            return expectedType;
        } else if (expectedType === "Date") {
            return expectedType;
        } else {
            if (enumsMap.has(expectedType)) {
                return expectedType;
            }

            if (!typeMap[expectedType]) {
                return expectedType; // w/e we don't know the type
            }

            // Check the discriminator
            let discriminatorProperty = typeMap[expectedType].discriminator;
            if (discriminatorProperty == null) {
                return expectedType; // the type does not have a discriminator. use it.
            } else {
                if (data[discriminatorProperty]) {
                    var discriminatorType = data[discriminatorProperty];
                    if(typeMap[discriminatorType]){
                        return discriminatorType; // use the type given in the discriminator
                    } else {
                        return expectedType; // discriminator did not map to a type
                    }
                } else {
                    return expectedType; // discriminator was not present (or an empty string)
                }
            }
        }
    }

    public static serialize(data: any, type: string, format: string) {
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType: string = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData: any[] = [];
            for (let date of data) {
                transformedData.push(ObjectSerializer.serialize(date, subType, format));
            }
            return transformedData;
        } else if (type === "Date") {
            if (format == "date") {
                let month = data.getMonth()+1
                month = month < 10 ? "0" + month.toString() : month.toString()
                let day = data.getDate();
                day = day < 10 ? "0" + day.toString() : day.toString();

                return data.getFullYear() + "-" + month + "-" + day;
            } else {
                return data.toISOString();
            }
        } else {
            if (enumsMap.has(type)) {
                return data;
            }
            if (!typeMap[type]) { // in case we dont know the type
                return data;
            }

            // Get the actual type of this object
            type = this.findCorrectType(data, type);

            // get the map for the correct type.
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            let instance: {[index: string]: any} = {};
            for (let attributeType of attributeTypes) {
                instance[attributeType.baseName] = ObjectSerializer.serialize(data[attributeType.name], attributeType.type, attributeType.format);
            }
            return instance;
        }
    }

    public static deserialize(data: any, type: string, format: string) {
        // polymorphism may change the actual type.
        type = ObjectSerializer.findCorrectType(data, type);
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType: string = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData: any[] = [];
            for (let date of data) {
                transformedData.push(ObjectSerializer.deserialize(date, subType, format));
            }
            return transformedData;
        } else if (type === "Date") {
            return new Date(data);
        } else {
            if (enumsMap.has(type)) {// is Enum
                return data;
            }

            if (!typeMap[type]) { // dont know the type
                return data;
            }
            let instance = new typeMap[type]();
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            for (let attributeType of attributeTypes) {
                let value = ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type, attributeType.format);
                if (value !== undefined) {
                    instance[attributeType.name] = value;
                }
            }
            return instance;
        }
    }


    /**
     * Normalize media type
     *
     * We currently do not handle any media types attributes, i.e. anything
     * after a semicolon. All content is assumed to be UTF-8 compatible.
     */
    public static normalizeMediaType(mediaType: string | undefined): string | undefined {
        if (mediaType === undefined) {
            return undefined;
        }
        return mediaType.split(";")[0].trim().toLowerCase();
    }

    /**
     * From a list of possible media types, choose the one we can handle best.
     *
     * The order of the given media types does not have any impact on the choice
     * made.
     */
    public static getPreferredMediaType(mediaTypes: Array<string>): string {
        /** According to OAS 3 we should default to json */
        if (mediaTypes.length === 0) {
            return "application/json";
        }

        const normalMediaTypes = mediaTypes.map(this.normalizeMediaType);

        for (const predicate of supportedMimeTypePredicatesWithPriority) {
            for (const mediaType of normalMediaTypes) {
                if (mediaType != null && predicate(mediaType)) {
                    return mediaType;
                }
            }
        }

        throw new Error("None of the given media types are supported: " + mediaTypes.join(", "));
    }

    /**
     * Convert data to a string according the given media type
     */
    public static stringify(data: any, mediaType: string): string {
        if (isTextLikeMimeType(mediaType)) {
            return String(data);
        }

        if (isJsonLikeMimeType(mediaType)) {
            return JSON.stringify(data);
        }

        throw new Error("The mediaType " + mediaType + " is not supported by ObjectSerializer.stringify.");
    }

    /**
     * Parse data from a string according to the given media type
     */
    public static parse(rawData: string, mediaType: string | undefined) {
        if (mediaType === undefined) {
            throw new Error("Cannot parse content. No Content-Type defined.");
        }

        if (isTextLikeMimeType(mediaType)) {
            return rawData;
        }

        if (isJsonLikeMimeType(mediaType)) {
            return JSON.parse(rawData);
        }

        throw new Error("The mediaType " + mediaType + " is not supported by ObjectSerializer.parse.");
    }
}
