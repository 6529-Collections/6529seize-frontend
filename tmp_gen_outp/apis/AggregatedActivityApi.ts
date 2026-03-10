// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiAggregatedActivity } from '../models/ApiAggregatedActivity';
import { ApiAggregatedActivityMemes } from '../models/ApiAggregatedActivityMemes';
import { ApiAggregatedActivityPage } from '../models/ApiAggregatedActivityPage';

/**
 * no description
 */
export class AggregatedActivityApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get aggregated activity
     * @param pageSize Default is 50
     * @param page Default is 1
     * @param sortDirection Default is ASC; applied to id sort
     * @param sort Default is primary_purchases_count
     * @param search Search by wallet address, profile handle or ENS
     * @param content Filter by content
     * @param season Filter by season
     * @param collector Filter by collector type
     */
    public async getAggregatedActivity(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'primary_purchases_count' | 'primary_purchases_value' | 'secondary_purchases_count' | 'secondary_purchases_value' | 'sales_count' | 'sales_value' | 'transfers_in' | 'transfers_out' | 'airdrops' | 'burns', search?: string, content?: 'Memes' | 'Gradient' | 'MemeLab' | 'NextGen', season?: number, collector?: 'All' | 'Memes' | 'Meme SZN Set' | 'Genesis Set' | 'Gradient' | 'MemeLab' | 'NextGen', _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;









        // Path Params
        const localVarPath = '/aggregated-activity';

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
        if (sort !== undefined) {
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'primary_purchases_count' | 'primary_purchases_value' | 'secondary_purchases_count' | 'secondary_purchases_value' | 'sales_count' | 'sales_value' | 'transfers_in' | 'transfers_out' | 'airdrops' | 'burns'", ""));
        }

        // Query Params
        if (search !== undefined) {
            requestContext.setQueryParam("search", ObjectSerializer.serialize(search, "string", ""));
        }

        // Query Params
        if (content !== undefined) {
            requestContext.setQueryParam("content", ObjectSerializer.serialize(content, "'Memes' | 'Gradient' | 'MemeLab' | 'NextGen'", ""));
        }

        // Query Params
        if (season !== undefined) {
            requestContext.setQueryParam("season", ObjectSerializer.serialize(season, "number", "int64"));
        }

        // Query Params
        if (collector !== undefined) {
            requestContext.setQueryParam("collector", ObjectSerializer.serialize(collector, "'All' | 'Memes' | 'Meme SZN Set' | 'Genesis Set' | 'Gradient' | 'MemeLab' | 'NextGen'", ""));
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
     * Get aggregated activity by consolidation key.
     * @param consolidationKey 
     */
    public async getAggregatedActivityByConsolidationKey(consolidationKey: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("AggregatedActivityApi", "getAggregatedActivityByConsolidationKey", "consolidationKey");
        }


        // Path Params
        const localVarPath = '/aggregated-activity/consolidation/{consolidation_key}'
            .replace('{' + 'consolidation_key' + '}', encodeURIComponent(String(consolidationKey)));

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
     * Get memes aggregated activity by consolidation key per season.
     * @param consolidationKey 
     */
    public async getMemesAggregatedActivityByConsolidationKey(consolidationKey: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("AggregatedActivityApi", "getMemesAggregatedActivityByConsolidationKey", "consolidationKey");
        }


        // Path Params
        const localVarPath = '/aggregated-activity/consolidation/{consolidation_key}/memes'
            .replace('{' + 'consolidation_key' + '}', encodeURIComponent(String(consolidationKey)));

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

}

export class AggregatedActivityApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getAggregatedActivity
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getAggregatedActivityWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<ApiAggregatedActivityPage> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<ApiAggregatedActivityPage> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiAggregatedActivityPage>", ""
            ) as Array<ApiAggregatedActivityPage>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<ApiAggregatedActivityPage> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiAggregatedActivityPage>", ""
            ) as Array<ApiAggregatedActivityPage>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getAggregatedActivityByConsolidationKey
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getAggregatedActivityByConsolidationKeyWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiAggregatedActivity >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiAggregatedActivity = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiAggregatedActivity", ""
            ) as ApiAggregatedActivity;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Aggregated Activity for consolidation key not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiAggregatedActivity = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiAggregatedActivity", ""
            ) as ApiAggregatedActivity;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getMemesAggregatedActivityByConsolidationKey
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getMemesAggregatedActivityByConsolidationKeyWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<ApiAggregatedActivityMemes> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<ApiAggregatedActivityMemes> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiAggregatedActivityMemes>", ""
            ) as Array<ApiAggregatedActivityMemes>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Memes Aggregated Activity for consolidation key not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<ApiAggregatedActivityMemes> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiAggregatedActivityMemes>", ""
            ) as Array<ApiAggregatedActivityMemes>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
