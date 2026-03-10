// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiNftOwnerPage } from '../models/ApiNftOwnerPage';

/**
 * no description
 */
export class NFTOwnersApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get NFT owners
     * @param pageSize Default is 50
     * @param page Default is 1
     * @param sortDirection Default is DESC
     * @param contract Filter by contract address
     * @param tokenId Filter by token ID
     */
    public async getNftOwners(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', contract?: string, tokenId?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;






        // Path Params
        const localVarPath = '/nft-owners';

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
            requestContext.setQueryParam("sort_direction", ObjectSerializer.serialize(sortDirection, "'ASC' | 'DESC'", ""));
        }

        // Query Params
        if (contract !== undefined) {
            requestContext.setQueryParam("contract", ObjectSerializer.serialize(contract, "string", ""));
        }

        // Query Params
        if (tokenId !== undefined) {
            requestContext.setQueryParam("token_id", ObjectSerializer.serialize(tokenId, "string", ""));
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
     * Get NFT owners by consolidation key
     * @param consolidationKey 
     * @param pageSize Default is 50
     * @param page Default is 1
     * @param sortDirection Default is DESC
     * @param contract Filter by contract address
     * @param tokenId Filter by token ID
     */
    public async getNftOwnersByConsolidationKey(consolidationKey: string, pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', contract?: string, tokenId?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("NFTOwnersApi", "getNftOwnersByConsolidationKey", "consolidationKey");
        }







        // Path Params
        const localVarPath = '/nft-owners/consolidation/{consolidation_key}'
            .replace('{' + 'consolidation_key' + '}', encodeURIComponent(String(consolidationKey)));

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
            requestContext.setQueryParam("sort_direction", ObjectSerializer.serialize(sortDirection, "'ASC' | 'DESC'", ""));
        }

        // Query Params
        if (contract !== undefined) {
            requestContext.setQueryParam("contract", ObjectSerializer.serialize(contract, "string", ""));
        }

        // Query Params
        if (tokenId !== undefined) {
            requestContext.setQueryParam("token_id", ObjectSerializer.serialize(tokenId, "string", ""));
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

export class NFTOwnersApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getNftOwners
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getNftOwnersWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<ApiNftOwnerPage> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<ApiNftOwnerPage> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiNftOwnerPage>", ""
            ) as Array<ApiNftOwnerPage>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<ApiNftOwnerPage> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiNftOwnerPage>", ""
            ) as Array<ApiNftOwnerPage>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getNftOwnersByConsolidationKey
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getNftOwnersByConsolidationKeyWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<ApiNftOwnerPage> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<ApiNftOwnerPage> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiNftOwnerPage>", ""
            ) as Array<ApiNftOwnerPage>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<ApiNftOwnerPage> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiNftOwnerPage>", ""
            ) as Array<ApiNftOwnerPage>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
