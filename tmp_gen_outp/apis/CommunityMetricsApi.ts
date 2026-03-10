// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiCommunityMetrics } from '../models/ApiCommunityMetrics';
import { ApiCommunityMetricsSeries } from '../models/ApiCommunityMetricsSeries';
import { ApiMintMetricsPage } from '../models/ApiMintMetricsPage';
import { ApiPageSortDirection } from '../models/ApiPageSortDirection';

/**
 * no description
 */
export class CommunityMetricsApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get community metrics.
     * @param interval Metrics interval
     */
    public async getCommunityMetrics(interval: 'DAY' | 'WEEK', _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'interval' is not null or undefined
        if (interval === null || interval === undefined) {
            throw new RequiredError("CommunityMetricsApi", "getCommunityMetrics", "interval");
        }


        // Path Params
        const localVarPath = '/community-metrics';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (interval !== undefined) {
            requestContext.setQueryParam("interval", ObjectSerializer.serialize(interval, "'DAY' | 'WEEK'", ""));
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
     * Get community metrics series.
     * @param since Unix millis timestamp for start of series.
     * @param to Unix millis timestamp for end of series.
     */
    public async getCommunityMetricsSeries(since: number, to: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'since' is not null or undefined
        if (since === null || since === undefined) {
            throw new RequiredError("CommunityMetricsApi", "getCommunityMetricsSeries", "since");
        }


        // verify required parameter 'to' is not null or undefined
        if (to === null || to === undefined) {
            throw new RequiredError("CommunityMetricsApi", "getCommunityMetricsSeries", "to");
        }


        // Path Params
        const localVarPath = '/community-metrics/series';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (since !== undefined) {
            requestContext.setQueryParam("since", ObjectSerializer.serialize(since, "number", "int64"));
        }

        // Query Params
        if (to !== undefined) {
            requestContext.setQueryParam("to", ObjectSerializer.serialize(to, "number", "int64"));
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
     * Get community mint metrics.
     * @param pageSize 
     * @param page 
     * @param sortDirection 
     * @param sort 
     */
    public async getCommunityMintMetrics(pageSize?: number, page?: number, sortDirection?: ApiPageSortDirection, sort?: 'mint_time', _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;





        // Path Params
        const localVarPath = '/community-metrics/mints';

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
            requestContext.setQueryParam("sort", ObjectSerializer.serialize(sort, "'mint_time'", ""));
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

export class CommunityMetricsApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getCommunityMetrics
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getCommunityMetricsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiCommunityMetrics >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiCommunityMetrics = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCommunityMetrics", ""
            ) as ApiCommunityMetrics;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiCommunityMetrics = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCommunityMetrics", ""
            ) as ApiCommunityMetrics;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getCommunityMetricsSeries
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getCommunityMetricsSeriesWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiCommunityMetricsSeries >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiCommunityMetricsSeries = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCommunityMetricsSeries", ""
            ) as ApiCommunityMetricsSeries;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiCommunityMetricsSeries = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCommunityMetricsSeries", ""
            ) as ApiCommunityMetricsSeries;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getCommunityMintMetrics
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getCommunityMintMetricsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiMintMetricsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiMintMetricsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiMintMetricsPage", ""
            ) as ApiMintMetricsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiMintMetricsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiMintMetricsPage", ""
            ) as ApiMintMetricsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
