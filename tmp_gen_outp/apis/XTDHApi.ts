// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiPageSortDirection } from '../models/ApiPageSortDirection';
import { ApiXTdhCollectionsPage } from '../models/ApiXTdhCollectionsPage';
import { ApiXTdhContributionsPage } from '../models/ApiXTdhContributionsPage';
import { ApiXTdhCreateGrant } from '../models/ApiXTdhCreateGrant';
import { ApiXTdhGlobalStats } from '../models/ApiXTdhGlobalStats';
import { ApiXTdhGrant } from '../models/ApiXTdhGrant';
import { ApiXTdhGrantTokensPage } from '../models/ApiXTdhGrantTokensPage';
import { ApiXTdhGrantUpdateRequest } from '../models/ApiXTdhGrantUpdateRequest';
import { ApiXTdhGranteesPage } from '../models/ApiXTdhGranteesPage';
import { ApiXTdhGrantsPage } from '../models/ApiXTdhGrantsPage';
import { ApiXTdhStats } from '../models/ApiXTdhStats';
import { ApiXTdhTokensPage } from '../models/ApiXTdhTokensPage';

/**
 * no description
 */
export class XTDHApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get global xTDH stats
     */
    public async getGlobalXTdhStats(_options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // Path Params
        const localVarPath = '/xtdh/stats';

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
     * Get identities xTDH stats
     * @param identity 
     */
    public async getIdentitiesXTdhStats(identity: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("XTDHApi", "getIdentitiesXTdhStats", "identity");
        }


        // Path Params
        const localVarPath = '/xtdh/stats/{identity}'
            .replace('{' + 'identity' + '}', encodeURIComponent(String(identity)));

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
     * Get info about xTDH collections
     * @param identity Filter by receiving identity
     * @param collectionName 
     * @param page 
     * @param pageSize Default is 20
     * @param sort xtdh when omitted
     * @param order desc when omitted
     */
    public async getInfoAboutXTdhCollections(identity?: string, collectionName?: string, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;







        // Path Params
        const localVarPath = '/xtdh/collections';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (identity !== undefined) {
            requestContext.setQueryParam("identity", ObjectSerializer.serialize(identity, "string", ""));
        }

        // Query Params
        if (collectionName !== undefined) {
            requestContext.setQueryParam("collection_name", ObjectSerializer.serialize(collectionName, "string", ""));
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
        if (sort !== undefined) {
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'xtdh' | 'xtdh_rate'", ""));
        }

        // Query Params
        if (order !== undefined) {
            requestContext.setQueryParam("order", ObjectSerializer.serialize(order, "'asc' | 'desc'", ""));
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
     * Get info about xTDH contributors
     * @param contract 
     * @param token 
     * @param groupBy Group by grant or grantor (grant when omitted)
     * @param page 
     * @param pageSize Default is 20
     * @param sort xtdh when omitted
     * @param order desc when omitted
     */
    public async getInfoAboutXTdhContributors(contract: string, token: number, groupBy?: 'grant' | 'grantor', page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'contract' is not null or undefined
        if (contract === null || contract === undefined) {
            throw new RequiredError("XTDHApi", "getInfoAboutXTdhContributors", "contract");
        }


        // verify required parameter 'token' is not null or undefined
        if (token === null || token === undefined) {
            throw new RequiredError("XTDHApi", "getInfoAboutXTdhContributors", "token");
        }







        // Path Params
        const localVarPath = '/xtdh/tokens/{contract}/{token}/contributors'
            .replace('{' + 'contract' + '}', encodeURIComponent(String(contract)))
            .replace('{' + 'token' + '}', encodeURIComponent(String(token)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (groupBy !== undefined) {
            requestContext.setQueryParam("group_by", ObjectSerializer.serialize(groupBy, "'grant' | 'grantor'", ""));
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
        if (sort !== undefined) {
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'xtdh' | 'xtdh_rate'", ""));
        }

        // Query Params
        if (order !== undefined) {
            requestContext.setQueryParam("order", ObjectSerializer.serialize(order, "'asc' | 'desc'", ""));
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
     * Get info about xTDH grantees
     * @param contract 
     * @param page 
     * @param pageSize Default is 20
     * @param sort xtdh when omitted
     * @param order desc when omitted
     */
    public async getInfoAboutXTdhGrantees(contract?: string, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;






        // Path Params
        const localVarPath = '/xtdh/grantees';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (contract !== undefined) {
            requestContext.setQueryParam("contract", ObjectSerializer.serialize(contract, "string", ""));
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
        if (sort !== undefined) {
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'xtdh' | 'xtdh_rate'", ""));
        }

        // Query Params
        if (order !== undefined) {
            requestContext.setQueryParam("order", ObjectSerializer.serialize(order, "'asc' | 'desc'", ""));
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
     * Get info about xTDH tokens
     * @param identity Filter by receiving identity
     * @param contract Filter by receiving contract
     * @param token Filter by token. Needs to be paired with contract to work
     * @param page 
     * @param pageSize Default is 20
     * @param sort xtdh when omitted
     * @param order desc when omitted
     */
    public async getInfoAboutXTdhTokens(identity?: string, contract?: string, token?: number, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;








        // Path Params
        const localVarPath = '/xtdh/tokens';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (identity !== undefined) {
            requestContext.setQueryParam("identity", ObjectSerializer.serialize(identity, "string", ""));
        }

        // Query Params
        if (contract !== undefined) {
            requestContext.setQueryParam("contract", ObjectSerializer.serialize(contract, "string", ""));
        }

        // Query Params
        if (token !== undefined) {
            requestContext.setQueryParam("token", ObjectSerializer.serialize(token, "number", "int64"));
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
        if (sort !== undefined) {
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'xtdh' | 'xtdh_rate'", ""));
        }

        // Query Params
        if (order !== undefined) {
            requestContext.setQueryParam("order", ObjectSerializer.serialize(order, "'asc' | 'desc'", ""));
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
     * Get xTDH grant
     * @param id 
     */
    public async getXTdhGrant(id: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'id' is not null or undefined
        if (id === null || id === undefined) {
            throw new RequiredError("XTDHApi", "getXTdhGrant", "id");
        }


        // Path Params
        const localVarPath = '/xtdh/grants/{id}'
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)));

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
     * Get xTDH grant tokens
     * @param id 
     * @param sortDirection 
     * @param sort 
     * @param page 
     * @param pageSize 
     */
    public async getXTdhGrantTokens(id: string, sortDirection?: ApiPageSortDirection, sort?: 'token', page?: number, pageSize?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'id' is not null or undefined
        if (id === null || id === undefined) {
            throw new RequiredError("XTDHApi", "getXTdhGrantTokens", "id");
        }






        // Path Params
        const localVarPath = '/xtdh/grants/{id}/tokens'
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (sortDirection !== undefined) {
            const serializedParams = ObjectSerializer.serialize(sortDirection, "ApiPageSortDirection", "");
            for (const key of Object.keys(serializedParams)) {
                requestContext.setQueryParam(key, serializedParams[key]);
            }
        }

        // Query Params
        if (sort !== undefined) {
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'token'", ""));
        }

        // Query Params
        if (page !== undefined) {
            requestContext.setQueryParam("page", ObjectSerializer.serialize(page, "number", "int64"));
        }

        // Query Params
        if (pageSize !== undefined) {
            requestContext.setQueryParam("page_size", ObjectSerializer.serialize(pageSize, "number", "int64"));
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
     * Get xTDH grants
     * @param grantor 
     * @param targetContract 
     * @param targetCollectionName 
     * @param targetChain 
     * @param validFromGt 
     * @param validFromLt 
     * @param validToGt 
     * @param validToLt 
     * @param status One or more (comma separated) statuses you are interested in
     * @param sortDirection 
     * @param sort 
     * @param page 
     * @param pageSize 
     */
    public async getXTdhGrants(grantor?: string, targetContract?: string, targetCollectionName?: string, targetChain?: string, validFromGt?: number, validFromLt?: number, validToGt?: number, validToLt?: number, status?: string, sortDirection?: ApiPageSortDirection, sort?: 'created_at' | 'valid_from' | 'valid_to' | 'rate', page?: number, pageSize?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;














        // Path Params
        const localVarPath = '/xtdh/grants';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (grantor !== undefined) {
            requestContext.setQueryParam("grantor", ObjectSerializer.serialize(grantor, "string", ""));
        }

        // Query Params
        if (targetContract !== undefined) {
            requestContext.setQueryParam("target_contract", ObjectSerializer.serialize(targetContract, "string", ""));
        }

        // Query Params
        if (targetCollectionName !== undefined) {
            requestContext.setQueryParam("target_collection_name", ObjectSerializer.serialize(targetCollectionName, "string", ""));
        }

        // Query Params
        if (targetChain !== undefined) {
            requestContext.setQueryParam("target_chain", ObjectSerializer.serialize(targetChain, "string", ""));
        }

        // Query Params
        if (validFromGt !== undefined) {
            requestContext.setQueryParam("valid_from_gt", ObjectSerializer.serialize(validFromGt, "number", "int64"));
        }

        // Query Params
        if (validFromLt !== undefined) {
            requestContext.setQueryParam("valid_from_lt", ObjectSerializer.serialize(validFromLt, "number", "int64"));
        }

        // Query Params
        if (validToGt !== undefined) {
            requestContext.setQueryParam("valid_to_gt", ObjectSerializer.serialize(validToGt, "number", "int64"));
        }

        // Query Params
        if (validToLt !== undefined) {
            requestContext.setQueryParam("valid_to_lt", ObjectSerializer.serialize(validToLt, "number", "int64"));
        }

        // Query Params
        if (status !== undefined) {
            requestContext.setQueryParam("status", ObjectSerializer.serialize(status, "string", ""));
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
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'created_at' | 'valid_from' | 'valid_to' | 'rate'", ""));
        }

        // Query Params
        if (page !== undefined) {
            requestContext.setQueryParam("page", ObjectSerializer.serialize(page, "number", "int64"));
        }

        // Query Params
        if (pageSize !== undefined) {
            requestContext.setQueryParam("page_size", ObjectSerializer.serialize(pageSize, "number", "int64"));
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
     * Create xTDH grant
     * @param apiXTdhCreateGrant 
     */
    public async grantXTdh(apiXTdhCreateGrant: ApiXTdhCreateGrant, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'apiXTdhCreateGrant' is not null or undefined
        if (apiXTdhCreateGrant === null || apiXTdhCreateGrant === undefined) {
            throw new RequiredError("XTDHApi", "grantXTdh", "apiXTdhCreateGrant");
        }


        // Path Params
        const localVarPath = '/xtdh/grants';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiXTdhCreateGrant, "ApiXTdhCreateGrant", ""),
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
     * Update xTDH grant
     * @param id 
     * @param apiXTdhGrantUpdateRequest 
     */
    public async updateXTdhGrant(id: string, apiXTdhGrantUpdateRequest: ApiXTdhGrantUpdateRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'id' is not null or undefined
        if (id === null || id === undefined) {
            throw new RequiredError("XTDHApi", "updateXTdhGrant", "id");
        }


        // verify required parameter 'apiXTdhGrantUpdateRequest' is not null or undefined
        if (apiXTdhGrantUpdateRequest === null || apiXTdhGrantUpdateRequest === undefined) {
            throw new RequiredError("XTDHApi", "updateXTdhGrant", "apiXTdhGrantUpdateRequest");
        }


        // Path Params
        const localVarPath = '/xtdh/grants/{id}'
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiXTdhGrantUpdateRequest, "ApiXTdhGrantUpdateRequest", ""),
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

export class XTDHApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getGlobalXTdhStats
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getGlobalXTdhStatsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiXTdhGlobalStats >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiXTdhGlobalStats = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGlobalStats", ""
            ) as ApiXTdhGlobalStats;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiXTdhGlobalStats = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGlobalStats", ""
            ) as ApiXTdhGlobalStats;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getIdentitiesXTdhStats
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getIdentitiesXTdhStatsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiXTdhStats >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiXTdhStats = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhStats", ""
            ) as ApiXTdhStats;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiXTdhStats = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhStats", ""
            ) as ApiXTdhStats;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getInfoAboutXTdhCollections
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getInfoAboutXTdhCollectionsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiXTdhCollectionsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiXTdhCollectionsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhCollectionsPage", ""
            ) as ApiXTdhCollectionsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiXTdhCollectionsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhCollectionsPage", ""
            ) as ApiXTdhCollectionsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getInfoAboutXTdhContributors
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getInfoAboutXTdhContributorsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiXTdhContributionsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiXTdhContributionsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhContributionsPage", ""
            ) as ApiXTdhContributionsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiXTdhContributionsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhContributionsPage", ""
            ) as ApiXTdhContributionsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getInfoAboutXTdhGrantees
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getInfoAboutXTdhGranteesWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiXTdhGranteesPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiXTdhGranteesPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGranteesPage", ""
            ) as ApiXTdhGranteesPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiXTdhGranteesPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGranteesPage", ""
            ) as ApiXTdhGranteesPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getInfoAboutXTdhTokens
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getInfoAboutXTdhTokensWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiXTdhTokensPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiXTdhTokensPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhTokensPage", ""
            ) as ApiXTdhTokensPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiXTdhTokensPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhTokensPage", ""
            ) as ApiXTdhTokensPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getXTdhGrant
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getXTdhGrantWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiXTdhGrant >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiXTdhGrant = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGrant", ""
            ) as ApiXTdhGrant;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Not Found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiXTdhGrant = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGrant", ""
            ) as ApiXTdhGrant;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getXTdhGrantTokens
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getXTdhGrantTokensWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiXTdhGrantTokensPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiXTdhGrantTokensPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGrantTokensPage", ""
            ) as ApiXTdhGrantTokensPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiXTdhGrantTokensPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGrantTokensPage", ""
            ) as ApiXTdhGrantTokensPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getXTdhGrants
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getXTdhGrantsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiXTdhGrantsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiXTdhGrantsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGrantsPage", ""
            ) as ApiXTdhGrantsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiXTdhGrantsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGrantsPage", ""
            ) as ApiXTdhGrantsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to grantXTdh
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async grantXTdhWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiXTdhGrant >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiXTdhGrant = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGrant", ""
            ) as ApiXTdhGrant;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiXTdhGrant = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGrant", ""
            ) as ApiXTdhGrant;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to updateXTdhGrant
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async updateXTdhGrantWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiXTdhGrant >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiXTdhGrant = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGrant", ""
            ) as ApiXTdhGrant;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid input", undefined, response.headers);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Not Found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiXTdhGrant = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiXTdhGrant", ""
            ) as ApiXTdhGrant;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
