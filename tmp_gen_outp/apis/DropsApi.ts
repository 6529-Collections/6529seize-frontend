// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiAddReactionToDropRequest } from '../models/ApiAddReactionToDropRequest';
import { ApiCompleteMultipartUploadRequest } from '../models/ApiCompleteMultipartUploadRequest';
import { ApiCompleteMultipartUploadResponse } from '../models/ApiCompleteMultipartUploadResponse';
import { ApiCreateDropRequest } from '../models/ApiCreateDropRequest';
import { ApiCreateMediaUploadUrlRequest } from '../models/ApiCreateMediaUploadUrlRequest';
import { ApiCreateMediaUrlResponse } from '../models/ApiCreateMediaUrlResponse';
import { ApiDrop } from '../models/ApiDrop';
import { ApiDropBoostsPage } from '../models/ApiDropBoostsPage';
import { ApiDropId } from '../models/ApiDropId';
import { ApiDropRatingRequest } from '../models/ApiDropRatingRequest';
import { ApiDropSubscriptionActions } from '../models/ApiDropSubscriptionActions';
import { ApiDropType } from '../models/ApiDropType';
import { ApiDropsPage } from '../models/ApiDropsPage';
import { ApiLightDrop } from '../models/ApiLightDrop';
import { ApiMarkDropUnreadResponse } from '../models/ApiMarkDropUnreadResponse';
import { ApiPageSortDirection } from '../models/ApiPageSortDirection';
import { ApiProfileMinsPage } from '../models/ApiProfileMinsPage';
import { ApiStartMultipartMediaUploadResponse } from '../models/ApiStartMultipartMediaUploadResponse';
import { ApiUpdateDropRequest } from '../models/ApiUpdateDropRequest';
import { ApiUploadPartOfMultipartUploadRequest } from '../models/ApiUploadPartOfMultipartUploadRequest';
import { ApiUploadPartOfMultipartUploadResponse } from '../models/ApiUploadPartOfMultipartUploadResponse';

/**
 * no description
 */
export class DropsApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Mark a drop as curated by authenticated user
     * @param dropId 
     */
    public async addDropCuration(dropId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "addDropCuration", "dropId");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/curations'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Requires the user to be authenticated
     * Bookmark a drop
     * @param dropId 
     */
    public async bookmarkDrop(dropId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "bookmarkDrop", "dropId");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/bookmark'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Boost drop
     * @param dropId 
     */
    public async boostDrop(dropId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "boostDrop", "dropId");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/boosts'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param apiCompleteMultipartUploadRequest 
     */
    public async completeDropMultipartUpload(apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'apiCompleteMultipartUploadRequest' is not null or undefined
        if (apiCompleteMultipartUploadRequest === null || apiCompleteMultipartUploadRequest === undefined) {
            throw new RequiredError("DropsApi", "completeDropMultipartUpload", "apiCompleteMultipartUploadRequest");
        }


        // Path Params
        const localVarPath = '/drop-media/multipart-upload/completion';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiCompleteMultipartUploadRequest, "ApiCompleteMultipartUploadRequest", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param apiCompleteMultipartUploadRequest 
     */
    public async completeWaveMultipartUpload(apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'apiCompleteMultipartUploadRequest' is not null or undefined
        if (apiCompleteMultipartUploadRequest === null || apiCompleteMultipartUploadRequest === undefined) {
            throw new RequiredError("DropsApi", "completeWaveMultipartUpload", "apiCompleteMultipartUploadRequest");
        }


        // Path Params
        const localVarPath = '/wave-media/multipart-upload/completion';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiCompleteMultipartUploadRequest, "ApiCompleteMultipartUploadRequest", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Requires the user to be authenticated
     * Create a drop
     * @param apiCreateDropRequest 
     */
    public async createDrop(apiCreateDropRequest: ApiCreateDropRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'apiCreateDropRequest' is not null or undefined
        if (apiCreateDropRequest === null || apiCreateDropRequest === undefined) {
            throw new RequiredError("DropsApi", "createDrop", "apiCreateDropRequest");
        }


        // Path Params
        const localVarPath = '/drops';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiCreateDropRequest, "ApiCreateDropRequest", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for drop media upload
     * @param apiCreateMediaUploadUrlRequest 
     */
    public async createDropMediaUrl(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'apiCreateMediaUploadUrlRequest' is not null or undefined
        if (apiCreateMediaUploadUrlRequest === null || apiCreateMediaUploadUrlRequest === undefined) {
            throw new RequiredError("DropsApi", "createDropMediaUrl", "apiCreateMediaUploadUrlRequest");
        }


        // Path Params
        const localVarPath = '/drop-media/prep';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiCreateMediaUploadUrlRequest, "ApiCreateMediaUploadUrlRequest", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param apiCreateMediaUploadUrlRequest 
     */
    public async createMultipartDropMediaUrl(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'apiCreateMediaUploadUrlRequest' is not null or undefined
        if (apiCreateMediaUploadUrlRequest === null || apiCreateMediaUploadUrlRequest === undefined) {
            throw new RequiredError("DropsApi", "createMultipartDropMediaUrl", "apiCreateMediaUploadUrlRequest");
        }


        // Path Params
        const localVarPath = '/drop-media/multipart-upload';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiCreateMediaUploadUrlRequest, "ApiCreateMediaUploadUrlRequest", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param apiCreateMediaUploadUrlRequest 
     */
    public async createMultipartWaveMediaUrl(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'apiCreateMediaUploadUrlRequest' is not null or undefined
        if (apiCreateMediaUploadUrlRequest === null || apiCreateMediaUploadUrlRequest === undefined) {
            throw new RequiredError("DropsApi", "createMultipartWaveMediaUrl", "apiCreateMediaUploadUrlRequest");
        }


        // Path Params
        const localVarPath = '/wave-media/multipart-upload';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiCreateMediaUploadUrlRequest, "ApiCreateMediaUploadUrlRequest", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Delete drop boost
     * @param dropId 
     */
    public async deleteDropBoost(dropId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "deleteDropBoost", "dropId");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/boosts'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.DELETE);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Delete drop by ID
     * @param dropId 
     */
    public async deleteDropById(dropId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "deleteDropById", "dropId");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.DELETE);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Requires the user to be authenticated. Returns drops bookmarked by the current user, sorted by bookmark time.
     * Get bookmarked drops for authenticated user
     * @param waveId Filter by wave
     * @param page 
     * @param pageSize 
     * @param sortDirection Default is DESC (newest bookmarks first)
     */
    public async getBookmarkedDrops(waveId?: string, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;





        // Path Params
        const localVarPath = '/drops-bookmarked/';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (waveId !== undefined) {
            requestContext.setQueryParam("wave_id", ObjectSerializer.serialize(waveId, "string", ""));
        }

        // Query Params
        if (page !== undefined) {
            requestContext.setQueryParam("page", ObjectSerializer.serialize(page, "number", "int64"));
        }

        // Query Params
        if (pageSize !== undefined) {
            requestContext.setQueryParam("page_size", ObjectSerializer.serialize(pageSize, "number", "int64"));
        }

        // Query Params
        if (sortDirection !== undefined) {
            const serializedParams = ObjectSerializer.serialize(sortDirection, "ApiPageSortDirection", "");
            for (const key of Object.keys(serializedParams)) {
                requestContext.setQueryParam(key, serializedParams[key]);
            }
        }


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get boosted drops.
     * @param author Drops by author
     * @param booster Drops boosted by given identity
     * @param waveId Drops by wave
     * @param minBoosts Must be boosted at least so many times
     * @param page 
     * @param pageSize 
     * @param sortDirection Default is DESC
     * @param sort Default is last_boosted_at
     * @param countOnlyBoostsAfter Timestamp in millis
     */
    public async getBoostedDrops(author?: string, booster?: string, waveId?: string, minBoosts?: number, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, sort?: 'last_boosted_at' | 'first_boosted_at' | 'drop_created_at' | 'boosts', countOnlyBoostsAfter?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;










        // Path Params
        const localVarPath = '/boosted-drops/';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (author !== undefined) {
            requestContext.setQueryParam("author", ObjectSerializer.serialize(author, "string", ""));
        }

        // Query Params
        if (booster !== undefined) {
            requestContext.setQueryParam("booster", ObjectSerializer.serialize(booster, "string", ""));
        }

        // Query Params
        if (waveId !== undefined) {
            requestContext.setQueryParam("wave_id", ObjectSerializer.serialize(waveId, "string", ""));
        }

        // Query Params
        if (minBoosts !== undefined) {
            requestContext.setQueryParam("min_boosts", ObjectSerializer.serialize(minBoosts, "number", "int64"));
        }

        // Query Params
        if (page !== undefined) {
            requestContext.setQueryParam("page", ObjectSerializer.serialize(page, "number", "int64"));
        }

        // Query Params
        if (pageSize !== undefined) {
            requestContext.setQueryParam("page_size", ObjectSerializer.serialize(pageSize, "number", "int64"));
        }

        // Query Params
        if (sortDirection !== undefined) {
            const serializedParams = ObjectSerializer.serialize(sortDirection, "ApiPageSortDirection", "");
            for (const key of Object.keys(serializedParams)) {
                requestContext.setQueryParam(key, serializedParams[key]);
            }
        }

        // Query Params
        if (sort !== undefined) {
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'last_boosted_at' | 'first_boosted_at' | 'drop_created_at' | 'boosts'", ""));
        }

        // Query Params
        if (countOnlyBoostsAfter !== undefined) {
            requestContext.setQueryParam("count_only_boosts_after", ObjectSerializer.serialize(countOnlyBoostsAfter, "number", "int64"));
        }


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get drop boosts by Drop ID.
     * @param dropId 
     * @param pageSize 
     * @param page 
     * @param sortDirection Default is DESC
     * @param sort Default is boosted_at
     */
    public async getDropBoostsById(dropId: string, pageSize?: number, page?: number, sortDirection?: ApiPageSortDirection, sort?: 'boosted_at', _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "getDropBoostsById", "dropId");
        }






        // Path Params
        const localVarPath = '/drops/{dropId}/boosts'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (pageSize !== undefined) {
            requestContext.setQueryParam("page_size", ObjectSerializer.serialize(pageSize, "number", "int64"));
        }

        // Query Params
        if (page !== undefined) {
            requestContext.setQueryParam("page", ObjectSerializer.serialize(page, "number", "int64"));
        }

        // Query Params
        if (sortDirection !== undefined) {
            const serializedParams = ObjectSerializer.serialize(sortDirection, "ApiPageSortDirection", "");
            for (const key of Object.keys(serializedParams)) {
                requestContext.setQueryParam(key, serializedParams[key]);
            }
        }

        // Query Params
        if (sort !== undefined) {
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'boosted_at'", ""));
        }


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get drop by ID.
     * @param dropId 
     */
    public async getDropById(dropId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "getDropById", "dropId");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get identities who curated a drop
     * @param dropId 
     * @param page 
     * @param pageSize 
     * @param sortDirection Default is DESC
     */
    public async getDropCurators(dropId: string, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "getDropCurators", "dropId");
        }





        // Path Params
        const localVarPath = '/drops/{dropId}/curations'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (page !== undefined) {
            requestContext.setQueryParam("page", ObjectSerializer.serialize(page, "number", "int64"));
        }

        // Query Params
        if (pageSize !== undefined) {
            requestContext.setQueryParam("page_size", ObjectSerializer.serialize(pageSize, "number", "int64"));
        }

        // Query Params
        if (sortDirection !== undefined) {
            const serializedParams = ObjectSerializer.serialize(sortDirection, "ApiPageSortDirection", "");
            for (const key of Object.keys(serializedParams)) {
                requestContext.setQueryParam(key, serializedParams[key]);
            }
        }


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get drop IDs in wave by serial range.
     * @param waveId Drops in wave with given ID
     * @param minSerialNo 
     * @param maxSerialNo 
     * @param limit How many IDs to return (100 by default)
     */
    public async getDropIds(waveId: string, minSerialNo: number, maxSerialNo?: number, limit?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'waveId' is not null or undefined
        if (waveId === null || waveId === undefined) {
            throw new RequiredError("DropsApi", "getDropIds", "waveId");
        }


        // verify required parameter 'minSerialNo' is not null or undefined
        if (minSerialNo === null || minSerialNo === undefined) {
            throw new RequiredError("DropsApi", "getDropIds", "minSerialNo");
        }




        // Path Params
        const localVarPath = '/drop-ids';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (waveId !== undefined) {
            requestContext.setQueryParam("wave_id", ObjectSerializer.serialize(waveId, "string", ""));
        }

        // Query Params
        if (minSerialNo !== undefined) {
            requestContext.setQueryParam("min_serial_no", ObjectSerializer.serialize(minSerialNo, "number", "int64"));
        }

        // Query Params
        if (maxSerialNo !== undefined) {
            requestContext.setQueryParam("max_serial_no", ObjectSerializer.serialize(maxSerialNo, "number", "int64"));
        }

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", "int64"));
        }


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get latest drops.
     * @param limit How many drops to return (10 by default)
     * @param author Drops by author
     * @param groupId Drops by authors that fall into supplied group
     * @param waveId Drops in wave with given ID
     * @param serialNoLessThan Used to find older drops
     * @param includeReplies If true then reply drops will be included in top level (false by default)
     * @param dropType Filter by drop type
     * @param ids Comma-separated list of drop IDs to fetch
     * @param containsMedia If true then only drops that have at least one media attachment will be returned (false by default)
     */
    public async getLatestDrops(limit?: number, author?: string, groupId?: string, waveId?: string, serialNoLessThan?: number, includeReplies?: boolean, dropType?: ApiDropType, ids?: string, containsMedia?: boolean, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;










        // Path Params
        const localVarPath = '/drops';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", "int64"));
        }

        // Query Params
        if (author !== undefined) {
            requestContext.setQueryParam("author", ObjectSerializer.serialize(author, "string", ""));
        }

        // Query Params
        if (groupId !== undefined) {
            requestContext.setQueryParam("group_id", ObjectSerializer.serialize(groupId, "string", ""));
        }

        // Query Params
        if (waveId !== undefined) {
            requestContext.setQueryParam("wave_id", ObjectSerializer.serialize(waveId, "string", ""));
        }

        // Query Params
        if (serialNoLessThan !== undefined) {
            requestContext.setQueryParam("serial_no_less_than", ObjectSerializer.serialize(serialNoLessThan, "number", "int64"));
        }

        // Query Params
        if (includeReplies !== undefined) {
            requestContext.setQueryParam("include_replies", ObjectSerializer.serialize(includeReplies, "boolean", ""));
        }

        // Query Params
        if (dropType !== undefined) {
            const serializedParams = ObjectSerializer.serialize(dropType, "ApiDropType", "");
            for (const key of Object.keys(serializedParams)) {
                requestContext.setQueryParam(key, serializedParams[key]);
            }
        }

        // Query Params
        if (ids !== undefined) {
            requestContext.setQueryParam("ids", ObjectSerializer.serialize(ids, "string", ""));
        }

        // Query Params
        if (containsMedia !== undefined) {
            requestContext.setQueryParam("contains_media", ObjectSerializer.serialize(containsMedia, "boolean", ""));
        }


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get light drops
     * @param limit 
     * @param waveId Drops in wave with given ID
     * @param maxSerialNo Latest message if null
     */
    public async getLightDrops(limit: number, waveId: string, maxSerialNo?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'limit' is not null or undefined
        if (limit === null || limit === undefined) {
            throw new RequiredError("DropsApi", "getLightDrops", "limit");
        }


        // verify required parameter 'waveId' is not null or undefined
        if (waveId === null || waveId === undefined) {
            throw new RequiredError("DropsApi", "getLightDrops", "waveId");
        }



        // Path Params
        const localVarPath = '/light-drops';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", "int64"));
        }

        // Query Params
        if (maxSerialNo !== undefined) {
            requestContext.setQueryParam("max_serial_no", ObjectSerializer.serialize(maxSerialNo, "number", "int64"));
        }

        // Query Params
        if (waveId !== undefined) {
            requestContext.setQueryParam("wave_id", ObjectSerializer.serialize(waveId, "string", ""));
        }


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Sets the user\"s latest_read_timestamp to just before this drop\"s created_at, making this drop and all newer drops unread.
     * Mark a drop and all subsequent drops in the wave as unread
     * @param dropId 
     */
    public async markDropUnread(dropId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "markDropUnread", "dropId");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/mark-unread'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Requires the user to be authenticated
     * Rate a drop
     * @param dropId 
     * @param apiDropRatingRequest 
     */
    public async rateDrop(dropId: string, apiDropRatingRequest: ApiDropRatingRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "rateDrop", "dropId");
        }


        // verify required parameter 'apiDropRatingRequest' is not null or undefined
        if (apiDropRatingRequest === null || apiDropRatingRequest === undefined) {
            throw new RequiredError("DropsApi", "rateDrop", "apiDropRatingRequest");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/ratings'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiDropRatingRequest, "ApiDropRatingRequest", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * React to a drop
     * @param dropId 
     * @param apiAddReactionToDropRequest 
     */
    public async reactToDrop(dropId: string, apiAddReactionToDropRequest: ApiAddReactionToDropRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "reactToDrop", "dropId");
        }


        // verify required parameter 'apiAddReactionToDropRequest' is not null or undefined
        if (apiAddReactionToDropRequest === null || apiAddReactionToDropRequest === undefined) {
            throw new RequiredError("DropsApi", "reactToDrop", "apiAddReactionToDropRequest");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/reactions'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiAddReactionToDropRequest, "ApiAddReactionToDropRequest", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Remove authenticated user\"s curation from a drop
     * @param dropId 
     */
    public async removeDropCuration(dropId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "removeDropCuration", "dropId");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/curations'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.DELETE);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Remove reaction from a drop
     * @param dropId 
     * @param apiAddReactionToDropRequest 
     */
    public async removeReactionFromDrop(dropId: string, apiAddReactionToDropRequest: ApiAddReactionToDropRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "removeReactionFromDrop", "dropId");
        }


        // verify required parameter 'apiAddReactionToDropRequest' is not null or undefined
        if (apiAddReactionToDropRequest === null || apiAddReactionToDropRequest === undefined) {
            throw new RequiredError("DropsApi", "removeReactionFromDrop", "apiAddReactionToDropRequest");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/reactions'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.DELETE);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiAddReactionToDropRequest, "ApiAddReactionToDropRequest", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Subscribe authenticated user to drop actions.
     * @param dropId 
     * @param apiDropSubscriptionActions 
     */
    public async subscribeToDropActions(dropId: string, apiDropSubscriptionActions: ApiDropSubscriptionActions, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "subscribeToDropActions", "dropId");
        }


        // verify required parameter 'apiDropSubscriptionActions' is not null or undefined
        if (apiDropSubscriptionActions === null || apiDropSubscriptionActions === undefined) {
            throw new RequiredError("DropsApi", "subscribeToDropActions", "apiDropSubscriptionActions");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/subscriptions'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiDropSubscriptionActions, "ApiDropSubscriptionActions", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Toggles (flips) hide_link_preview for a drop. Only the author can call this endpoint.
     * Toggle hide link preview for a drop
     * @param dropId 
     */
    public async toggleHideLinkPreview(dropId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "toggleHideLinkPreview", "dropId");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/toggle-hide-link-preview'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Requires the user to be authenticated
     * Remove bookmark from drop
     * @param dropId 
     */
    public async unbookmarkDrop(dropId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "unbookmarkDrop", "dropId");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/bookmark'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.DELETE);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Unsubscribe authenticated user from drop actions.
     * @param dropId 
     * @param apiDropSubscriptionActions 
     */
    public async unsubscribeFromDropActions(dropId: string, apiDropSubscriptionActions: ApiDropSubscriptionActions, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "unsubscribeFromDropActions", "dropId");
        }


        // verify required parameter 'apiDropSubscriptionActions' is not null or undefined
        if (apiDropSubscriptionActions === null || apiDropSubscriptionActions === undefined) {
            throw new RequiredError("DropsApi", "unsubscribeFromDropActions", "apiDropSubscriptionActions");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}/subscriptions'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.DELETE);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiDropSubscriptionActions, "ApiDropSubscriptionActions", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Update drop by ID
     * @param dropId 
     * @param apiUpdateDropRequest 
     */
    public async updateDropById(dropId: string, apiUpdateDropRequest: ApiUpdateDropRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'dropId' is not null or undefined
        if (dropId === null || dropId === undefined) {
            throw new RequiredError("DropsApi", "updateDropById", "dropId");
        }


        // verify required parameter 'apiUpdateDropRequest' is not null or undefined
        if (apiUpdateDropRequest === null || apiUpdateDropRequest === undefined) {
            throw new RequiredError("DropsApi", "updateDropById", "apiUpdateDropRequest");
        }


        // Path Params
        const localVarPath = '/drops/{dropId}'
            .replace('{' + 'dropId' + '}', encodeURIComponent(String(dropId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiUpdateDropRequest, "ApiUpdateDropRequest", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param apiUploadPartOfMultipartUploadRequest 
     */
    public async uploadPartOfDropMultipartUpload(apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'apiUploadPartOfMultipartUploadRequest' is not null or undefined
        if (apiUploadPartOfMultipartUploadRequest === null || apiUploadPartOfMultipartUploadRequest === undefined) {
            throw new RequiredError("DropsApi", "uploadPartOfDropMultipartUpload", "apiUploadPartOfMultipartUploadRequest");
        }


        // Path Params
        const localVarPath = '/drop-media/multipart-upload/part';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiUploadPartOfMultipartUploadRequest, "ApiUploadPartOfMultipartUploadRequest", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param apiUploadPartOfMultipartUploadRequest 
     */
    public async uploadPartOfWaveMultipartUpload(apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'apiUploadPartOfMultipartUploadRequest' is not null or undefined
        if (apiUploadPartOfMultipartUploadRequest === null || apiUploadPartOfMultipartUploadRequest === undefined) {
            throw new RequiredError("DropsApi", "uploadPartOfWaveMultipartUpload", "apiUploadPartOfMultipartUploadRequest");
        }


        // Path Params
        const localVarPath = '/wave-media/multipart-upload/part';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiUploadPartOfMultipartUploadRequest, "ApiUploadPartOfMultipartUploadRequest", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["bearerAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

}

export class DropsApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to addDropCuration
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async addDropCurationWithHttpInfo(response: ResponseContext): Promise<HttpInfo<void >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, undefined);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: void = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "void", ""
            ) as void;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to bookmarkDrop
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async bookmarkDropWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiDrop >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Drop not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to boostDrop
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async boostDropWithHttpInfo(response: ResponseContext): Promise<HttpInfo<void >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, undefined);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Drop not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: void = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "void", ""
            ) as void;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to completeDropMultipartUpload
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async completeDropMultipartUploadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiCompleteMultipartUploadResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiCompleteMultipartUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCompleteMultipartUploadResponse", ""
            ) as ApiCompleteMultipartUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiCompleteMultipartUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCompleteMultipartUploadResponse", ""
            ) as ApiCompleteMultipartUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to completeWaveMultipartUpload
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async completeWaveMultipartUploadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiCompleteMultipartUploadResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiCompleteMultipartUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCompleteMultipartUploadResponse", ""
            ) as ApiCompleteMultipartUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiCompleteMultipartUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCompleteMultipartUploadResponse", ""
            ) as ApiCompleteMultipartUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to createDrop
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async createDropWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiDrop >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to createDropMediaUrl
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async createDropMediaUrlWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiCreateMediaUrlResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiCreateMediaUrlResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCreateMediaUrlResponse", ""
            ) as ApiCreateMediaUrlResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiCreateMediaUrlResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCreateMediaUrlResponse", ""
            ) as ApiCreateMediaUrlResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to createMultipartDropMediaUrl
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async createMultipartDropMediaUrlWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiStartMultipartMediaUploadResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiStartMultipartMediaUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiStartMultipartMediaUploadResponse", ""
            ) as ApiStartMultipartMediaUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiStartMultipartMediaUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiStartMultipartMediaUploadResponse", ""
            ) as ApiStartMultipartMediaUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to createMultipartWaveMediaUrl
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async createMultipartWaveMediaUrlWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiStartMultipartMediaUploadResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiStartMultipartMediaUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiStartMultipartMediaUploadResponse", ""
            ) as ApiStartMultipartMediaUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiStartMultipartMediaUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiStartMultipartMediaUploadResponse", ""
            ) as ApiStartMultipartMediaUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to deleteDropBoost
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async deleteDropBoostWithHttpInfo(response: ResponseContext): Promise<HttpInfo<void >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, undefined);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Drop not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: void = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "void", ""
            ) as void;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to deleteDropById
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async deleteDropByIdWithHttpInfo(response: ResponseContext): Promise<HttpInfo<void >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, undefined);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Drop not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: void = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "void", ""
            ) as void;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getBookmarkedDrops
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getBookmarkedDropsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiDropsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiDropsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDropsPage", ""
            ) as ApiDropsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiDropsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDropsPage", ""
            ) as ApiDropsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getBoostedDrops
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getBoostedDropsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiDropsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiDropsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDropsPage", ""
            ) as ApiDropsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiDropsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDropsPage", ""
            ) as ApiDropsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getDropBoostsById
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getDropBoostsByIdWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiDropBoostsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiDropBoostsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDropBoostsPage", ""
            ) as ApiDropBoostsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Drop not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiDropBoostsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDropBoostsPage", ""
            ) as ApiDropBoostsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getDropById
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getDropByIdWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiDrop >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Drop not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getDropCurators
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getDropCuratorsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiProfileMinsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiProfileMinsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiProfileMinsPage", ""
            ) as ApiProfileMinsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Drop not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiProfileMinsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiProfileMinsPage", ""
            ) as ApiProfileMinsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getDropIds
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getDropIdsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<ApiDropId> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<ApiDropId> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiDropId>", ""
            ) as Array<ApiDropId>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<ApiDropId> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiDropId>", ""
            ) as Array<ApiDropId>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getLatestDrops
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getLatestDropsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<ApiDrop> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<ApiDrop> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiDrop>", ""
            ) as Array<ApiDrop>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<ApiDrop> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiDrop>", ""
            ) as Array<ApiDrop>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getLightDrops
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getLightDropsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<ApiLightDrop> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<ApiLightDrop> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiLightDrop>", ""
            ) as Array<ApiLightDrop>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<ApiLightDrop> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiLightDrop>", ""
            ) as Array<ApiLightDrop>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to markDropUnread
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async markDropUnreadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiMarkDropUnreadResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiMarkDropUnreadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiMarkDropUnreadResponse", ""
            ) as ApiMarkDropUnreadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Drop not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiMarkDropUnreadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiMarkDropUnreadResponse", ""
            ) as ApiMarkDropUnreadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to rateDrop
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async rateDropWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiDrop >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Drop not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to reactToDrop
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async reactToDropWithHttpInfo(response: ResponseContext): Promise<HttpInfo<void >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, undefined);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: void = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "void", ""
            ) as void;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to removeDropCuration
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async removeDropCurationWithHttpInfo(response: ResponseContext): Promise<HttpInfo<void >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, undefined);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: void = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "void", ""
            ) as void;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to removeReactionFromDrop
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async removeReactionFromDropWithHttpInfo(response: ResponseContext): Promise<HttpInfo<void >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, undefined);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: void = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "void", ""
            ) as void;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to subscribeToDropActions
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async subscribeToDropActionsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiDropSubscriptionActions >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiDropSubscriptionActions = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDropSubscriptionActions", ""
            ) as ApiDropSubscriptionActions;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Wave not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiDropSubscriptionActions = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDropSubscriptionActions", ""
            ) as ApiDropSubscriptionActions;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to toggleHideLinkPreview
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async toggleHideLinkPreviewWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiDrop >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Only the author can toggle hide link preview", undefined, response.headers);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Drop not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to unbookmarkDrop
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async unbookmarkDropWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiDrop >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Drop not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to unsubscribeFromDropActions
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async unsubscribeFromDropActionsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiDropSubscriptionActions >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiDropSubscriptionActions = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDropSubscriptionActions", ""
            ) as ApiDropSubscriptionActions;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Wave not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiDropSubscriptionActions = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDropSubscriptionActions", ""
            ) as ApiDropSubscriptionActions;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to updateDropById
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async updateDropByIdWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiDrop >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Drop not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiDrop = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiDrop", ""
            ) as ApiDrop;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to uploadPartOfDropMultipartUpload
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async uploadPartOfDropMultipartUploadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiUploadPartOfMultipartUploadResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiUploadPartOfMultipartUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiUploadPartOfMultipartUploadResponse", ""
            ) as ApiUploadPartOfMultipartUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiUploadPartOfMultipartUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiUploadPartOfMultipartUploadResponse", ""
            ) as ApiUploadPartOfMultipartUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to uploadPartOfWaveMultipartUpload
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async uploadPartOfWaveMultipartUploadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiUploadPartOfMultipartUploadResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiUploadPartOfMultipartUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiUploadPartOfMultipartUploadResponse", ""
            ) as ApiUploadPartOfMultipartUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiUploadPartOfMultipartUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiUploadPartOfMultipartUploadResponse", ""
            ) as ApiUploadPartOfMultipartUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
