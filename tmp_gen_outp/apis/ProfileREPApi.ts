// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiChangeProfileRepRating } from '../models/ApiChangeProfileRepRating';
import { ApiRatingWithProfileInfoAndLevelPage } from '../models/ApiRatingWithProfileInfoAndLevelPage';
import { ApiRepCategoriesPage } from '../models/ApiRepCategoriesPage';
import { ApiRepContributorsPage } from '../models/ApiRepContributorsPage';
import { ApiRepDirection } from '../models/ApiRepDirection';
import { ApiRepOverview } from '../models/ApiRepOverview';
import { ApiRepRating } from '../models/ApiRepRating';

/**
 * no description
 */
export class ProfileREPApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get profile REP categories
     * @param identity 
     * @param direction 
     * @param page 
     * @param pageSize 
     * @param topContributorsLimit 
     */
    public async getProfileRepCategories(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, topContributorsLimit?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("ProfileREPApi", "getProfileRepCategories", "identity");
        }






        // Path Params
        const localVarPath = '/profiles/{identity}/rep/categories'
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

        // Query Params
        if (topContributorsLimit !== undefined) {
            requestContext.setQueryParam("top_contributors_limit", ObjectSerializer.serialize(topContributorsLimit, "number", ""));
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
     * Get profile REP contributors for category
     * @param identity 
     * @param category 
     * @param direction 
     * @param page 
     * @param pageSize 
     */
    public async getProfileRepCategoryContributors(identity: string, category: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("ProfileREPApi", "getProfileRepCategoryContributors", "identity");
        }


        // verify required parameter 'category' is not null or undefined
        if (category === null || category === undefined) {
            throw new RequiredError("ProfileREPApi", "getProfileRepCategoryContributors", "category");
        }





        // Path Params
        const localVarPath = '/profiles/{identity}/rep/categories/{category}/contributors'
            .replace('{' + 'identity' + '}', encodeURIComponent(String(identity)))
            .replace('{' + 'category' + '}', encodeURIComponent(String(category)));

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
     * Get profile REP overview
     * @param identity 
     * @param direction 
     * @param page 
     * @param pageSize 
     */
    public async getProfileRepOverview(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("ProfileREPApi", "getProfileRepOverview", "identity");
        }





        // Path Params
        const localVarPath = '/profiles/{identity}/rep/overview'
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
     * Get profile REP rating
     * @param identity 
     * @param fromIdentity 
     * @param category 
     */
    public async getProfileRepRating(identity: string, fromIdentity?: string, category?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("ProfileREPApi", "getProfileRepRating", "identity");
        }




        // Path Params
        const localVarPath = '/profiles/{identity}/rep/rating'
            .replace('{' + 'identity' + '}', encodeURIComponent(String(identity)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (fromIdentity !== undefined) {
            requestContext.setQueryParam("from_identity", ObjectSerializer.serialize(fromIdentity, "string", ""));
        }

        // Query Params
        if (category !== undefined) {
            requestContext.setQueryParam("category", ObjectSerializer.serialize(category, "string", ""));
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
     * Get profile REP ratings by rater
     * @param identity 
     * @param given 
     * @param page 
     * @param pageSize 
     * @param order 
     * @param orderBy 
     * @param category 
     */
    public async getProfileRepRatingsByRater(identity: string, given?: boolean, page?: number, pageSize?: number, order?: 'ASC' | 'DESC', orderBy?: 'last_modified' | 'rating', category?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("ProfileREPApi", "getProfileRepRatingsByRater", "identity");
        }








        // Path Params
        const localVarPath = '/profiles/{identity}/rep/ratings/by-rater'
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

        // Query Params
        if (category !== undefined) {
            requestContext.setQueryParam("category", ObjectSerializer.serialize(category, "string", ""));
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
     * Change profile REP rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param identity 
     * @param apiChangeProfileRepRating 
     */
    public async rateProfileRep(identity: string, apiChangeProfileRepRating: ApiChangeProfileRepRating, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("ProfileREPApi", "rateProfileRep", "identity");
        }


        // verify required parameter 'apiChangeProfileRepRating' is not null or undefined
        if (apiChangeProfileRepRating === null || apiChangeProfileRepRating === undefined) {
            throw new RequiredError("ProfileREPApi", "rateProfileRep", "apiChangeProfileRepRating");
        }


        // Path Params
        const localVarPath = '/profiles/{identity}/rep/rating'
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
            ObjectSerializer.serialize(apiChangeProfileRepRating, "ApiChangeProfileRepRating", ""),
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

export class ProfileREPApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getProfileRepCategories
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getProfileRepCategoriesWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiRepCategoriesPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiRepCategoriesPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiRepCategoriesPage", ""
            ) as ApiRepCategoriesPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Profile not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiRepCategoriesPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiRepCategoriesPage", ""
            ) as ApiRepCategoriesPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getProfileRepCategoryContributors
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getProfileRepCategoryContributorsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiRepContributorsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiRepContributorsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiRepContributorsPage", ""
            ) as ApiRepContributorsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Profile not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiRepContributorsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiRepContributorsPage", ""
            ) as ApiRepContributorsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getProfileRepOverview
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getProfileRepOverviewWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiRepOverview >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiRepOverview = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiRepOverview", ""
            ) as ApiRepOverview;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Profile not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiRepOverview = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiRepOverview", ""
            ) as ApiRepOverview;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getProfileRepRating
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getProfileRepRatingWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiRepRating >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiRepRating = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiRepRating", ""
            ) as ApiRepRating;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Profile not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiRepRating = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiRepRating", ""
            ) as ApiRepRating;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getProfileRepRatingsByRater
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getProfileRepRatingsByRaterWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiRatingWithProfileInfoAndLevelPage >> {
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
     * @params response Response returned by the server for a request to rateProfileRep
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async rateProfileRepWithHttpInfo(response: ResponseContext): Promise<HttpInfo<void >> {
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
