// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiChangeProfileCicRating } from '../models/ApiChangeProfileCicRating';
import { ApiCicContributorsPage } from '../models/ApiCicContributorsPage';
import { ApiCicOverview } from '../models/ApiCicOverview';
import { ApiRatingWithProfileInfoAndLevelPage } from '../models/ApiRatingWithProfileInfoAndLevelPage';
import { ApiRepDirection } from '../models/ApiRepDirection';

/**
 * no description
 */
export class ProfileCICApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get profile CIC contributors
     * @param identity 
     * @param direction 
     * @param page 
     * @param pageSize 
     */
    public async getProfileCicContributors(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("ProfileCICApi", "getProfileCicContributors", "identity");
        }





        // Path Params
        const localVarPath = '/profiles/{identity}/cic/contributors'
            .replace('{' + 'identity' + '}', encodeURIComponent(String(identity)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (direction !== undefined) {
            const serializedParams = ObjectSerializer.serialize(direction, "ApiRepDirection", "");
            for (const key of Object.keys(serializedParams)) {
                requestContext.setQueryParam(key, serializedParams[key]);
            }
        }

        // Query Params
        if (page !== undefined) {
            requestContext.setQueryParam("page", ObjectSerializer.serialize(page, "number", ""));
        }

        // Query Params
        if (pageSize !== undefined) {
            requestContext.setQueryParam("page_size", ObjectSerializer.serialize(pageSize, "number", ""));
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
     * Get profile CIC overview
     * @param identity 
     * @param direction 
     * @param page 
     * @param pageSize 
     */
    public async getProfileCicOverview(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("ProfileCICApi", "getProfileCicOverview", "identity");
        }





        // Path Params
        const localVarPath = '/profiles/{identity}/cic/overview'
            .replace('{' + 'identity' + '}', encodeURIComponent(String(identity)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (direction !== undefined) {
            const serializedParams = ObjectSerializer.serialize(direction, "ApiRepDirection", "");
            for (const key of Object.keys(serializedParams)) {
                requestContext.setQueryParam(key, serializedParams[key]);
            }
        }

        // Query Params
        if (page !== undefined) {
            requestContext.setQueryParam("page", ObjectSerializer.serialize(page, "number", ""));
        }

        // Query Params
        if (pageSize !== undefined) {
            requestContext.setQueryParam("page_size", ObjectSerializer.serialize(pageSize, "number", ""));
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
     * Get profile CIC ratings by rater
     * @param identity 
     * @param given 
     * @param page 
     * @param pageSize 
     * @param order 
     * @param orderBy 
     */
    public async getProfileCicRatingsByRater(identity: string, given?: boolean, page?: number, pageSize?: number, order?: 'ASC' | 'DESC', orderBy?: 'last_modified' | 'rating', _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("ProfileCICApi", "getProfileCicRatingsByRater", "identity");
        }







        // Path Params
        const localVarPath = '/profiles/{identity}/cic/ratings/by-rater'
            .replace('{' + 'identity' + '}', encodeURIComponent(String(identity)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (given !== undefined) {
            requestContext.setQueryParam("given", ObjectSerializer.serialize(given, "boolean", ""));
        }

        // Query Params
        if (page !== undefined) {
            requestContext.setQueryParam("page", ObjectSerializer.serialize(page, "number", ""));
        }

        // Query Params
        if (pageSize !== undefined) {
            requestContext.setQueryParam("page_size", ObjectSerializer.serialize(pageSize, "number", ""));
        }

        // Query Params
        if (order !== undefined) {
            requestContext.setQueryParam("order", ObjectSerializer.serialize(order, "'ASC' | 'DESC'", ""));
        }

        // Query Params
        if (orderBy !== undefined) {
            requestContext.setQueryParam("order_by", ObjectSerializer.serialize(orderBy, "'last_modified' | 'rating'", ""));
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
     * Change profile CIC rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param identity 
     * @param apiChangeProfileCicRating 
     */
    public async rateProfileCic(identity: string, apiChangeProfileCicRating: ApiChangeProfileCicRating, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("ProfileCICApi", "rateProfileCic", "identity");
        }


        // verify required parameter 'apiChangeProfileCicRating' is not null or undefined
        if (apiChangeProfileCicRating === null || apiChangeProfileCicRating === undefined) {
            throw new RequiredError("ProfileCICApi", "rateProfileCic", "apiChangeProfileCicRating");
        }


        // Path Params
        const localVarPath = '/profiles/{identity}/cic/rating'
            .replace('{' + 'identity' + '}', encodeURIComponent(String(identity)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiChangeProfileCicRating, "ApiChangeProfileCicRating", ""),
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

export class ProfileCICApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getProfileCicContributors
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getProfileCicContributorsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiCicContributorsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiCicContributorsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCicContributorsPage", ""
            ) as ApiCicContributorsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Profile not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiCicContributorsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCicContributorsPage", ""
            ) as ApiCicContributorsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getProfileCicOverview
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getProfileCicOverviewWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiCicOverview >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiCicOverview = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCicOverview", ""
            ) as ApiCicOverview;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Profile not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiCicOverview = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCicOverview", ""
            ) as ApiCicOverview;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getProfileCicRatingsByRater
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getProfileCicRatingsByRaterWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiRatingWithProfileInfoAndLevelPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiRatingWithProfileInfoAndLevelPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiRatingWithProfileInfoAndLevelPage", ""
            ) as ApiRatingWithProfileInfoAndLevelPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Profile not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiRatingWithProfileInfoAndLevelPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiRatingWithProfileInfoAndLevelPage", ""
            ) as ApiRatingWithProfileInfoAndLevelPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to rateProfileCic
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async rateProfileCicWithHttpInfo(response: ResponseContext): Promise<HttpInfo<void >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, undefined);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
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

}
