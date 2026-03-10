// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiPageSortDirection } from '../models/ApiPageSortDirection';
import { ApiTdhEditionsPage } from '../models/ApiTdhEditionsPage';

/**
 * no description
 */
export class TDHEditionsApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get TDH editions by consolidation key
     * @param consolidationKey 
     * @param contract 
     * @param tokenId 
     * @param editionId 
     * @param sort 
     * @param sortDirection 
     * @param page 
     * @param pageSize 
     */
    public async getTdhEditionsByConsolidationKey(consolidationKey: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("TDHEditionsApi", "getTdhEditionsByConsolidationKey", "consolidationKey");
        }









        // Path Params
        const localVarPath = '/tdh-editions/consolidation/{consolidation_key}'
            .replace('{' + 'consolidation_key' + '}', encodeURIComponent(String(consolidationKey)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (contract !== undefined) {
            requestContext.setQueryParam("contract", ObjectSerializer.serialize(contract, "string", ""));
        }

        // Query Params
        if (tokenId !== undefined) {
            requestContext.setQueryParam("token_id", ObjectSerializer.serialize(tokenId, "number", "int64"));
        }

        // Query Params
        if (editionId !== undefined) {
            requestContext.setQueryParam("edition_id", ObjectSerializer.serialize(editionId, "number", "int64"));
        }

        // Query Params
        if (sort !== undefined) {
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract'", ""));
        }

        // Query Params
        if (sortDirection !== undefined) {
            const serializedParams = ObjectSerializer.serialize(sortDirection, "ApiPageSortDirection", "");
            for (const key of Object.keys(serializedParams)) {
                requestContext.setQueryParam(key, serializedParams[key]);
            }
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
     * Get TDH editions for an identity, wallet address, or ENS
     * @param identity Identity handle, profile id, wallet address, or ENS name
     * @param contract 
     * @param tokenId 
     * @param editionId 
     * @param sort 
     * @param sortDirection 
     * @param page 
     * @param pageSize 
     */
    public async getTdhEditionsByIdentity(identity: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("TDHEditionsApi", "getTdhEditionsByIdentity", "identity");
        }









        // Path Params
        const localVarPath = '/tdh-editions/identity/{identity}'
            .replace('{' + 'identity' + '}', encodeURIComponent(String(identity)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (contract !== undefined) {
            requestContext.setQueryParam("contract", ObjectSerializer.serialize(contract, "string", ""));
        }

        // Query Params
        if (tokenId !== undefined) {
            requestContext.setQueryParam("token_id", ObjectSerializer.serialize(tokenId, "number", "int64"));
        }

        // Query Params
        if (editionId !== undefined) {
            requestContext.setQueryParam("edition_id", ObjectSerializer.serialize(editionId, "number", "int64"));
        }

        // Query Params
        if (sort !== undefined) {
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract'", ""));
        }

        // Query Params
        if (sortDirection !== undefined) {
            const serializedParams = ObjectSerializer.serialize(sortDirection, "ApiPageSortDirection", "");
            for (const key of Object.keys(serializedParams)) {
                requestContext.setQueryParam(key, serializedParams[key]);
            }
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
     * Get TDH editions for a wallet
     * @param wallet 
     * @param contract 
     * @param tokenId 
     * @param editionId 
     * @param sort 
     * @param sortDirection 
     * @param page 
     * @param pageSize 
     */
    public async getTdhEditionsByWallet(wallet: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'wallet' is not null or undefined
        if (wallet === null || wallet === undefined) {
            throw new RequiredError("TDHEditionsApi", "getTdhEditionsByWallet", "wallet");
        }









        // Path Params
        const localVarPath = '/tdh-editions/wallet/{wallet}'
            .replace('{' + 'wallet' + '}', encodeURIComponent(String(wallet)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (contract !== undefined) {
            requestContext.setQueryParam("contract", ObjectSerializer.serialize(contract, "string", ""));
        }

        // Query Params
        if (tokenId !== undefined) {
            requestContext.setQueryParam("token_id", ObjectSerializer.serialize(tokenId, "number", "int64"));
        }

        // Query Params
        if (editionId !== undefined) {
            requestContext.setQueryParam("edition_id", ObjectSerializer.serialize(editionId, "number", "int64"));
        }

        // Query Params
        if (sort !== undefined) {
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract'", ""));
        }

        // Query Params
        if (sortDirection !== undefined) {
            const serializedParams = ObjectSerializer.serialize(sortDirection, "ApiPageSortDirection", "");
            for (const key of Object.keys(serializedParams)) {
                requestContext.setQueryParam(key, serializedParams[key]);
            }
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

}

export class TDHEditionsApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getTdhEditionsByConsolidationKey
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getTdhEditionsByConsolidationKeyWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiTdhEditionsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiTdhEditionsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiTdhEditionsPage", ""
            ) as ApiTdhEditionsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Consolidation key not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiTdhEditionsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiTdhEditionsPage", ""
            ) as ApiTdhEditionsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getTdhEditionsByIdentity
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getTdhEditionsByIdentityWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiTdhEditionsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiTdhEditionsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiTdhEditionsPage", ""
            ) as ApiTdhEditionsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Identity not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiTdhEditionsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiTdhEditionsPage", ""
            ) as ApiTdhEditionsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getTdhEditionsByWallet
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getTdhEditionsByWalletWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiTdhEditionsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiTdhEditionsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiTdhEditionsPage", ""
            ) as ApiTdhEditionsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid wallet", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiTdhEditionsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiTdhEditionsPage", ""
            ) as ApiTdhEditionsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
