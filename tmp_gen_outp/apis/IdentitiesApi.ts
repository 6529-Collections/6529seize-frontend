// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiIdentity } from '../models/ApiIdentity';
import { ApiIdentitySubscriptionActions } from '../models/ApiIdentitySubscriptionActions';

/**
 * no description
 */
export class IdentitiesApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get identity by it\"s key. Key can be id, wallet, handle, ENS name, etc...
     * @param identityKey 
     */
    public async getIdentityByKey(identityKey: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identityKey' is not null or undefined
        if (identityKey === null || identityKey === undefined) {
            throw new RequiredError("IdentitiesApi", "getIdentityByKey", "identityKey");
        }


        // Path Params
        const localVarPath = '/identities/{identity_key}'
            .replace('{' + 'identity_key' + '}', encodeURIComponent(String(identityKey)));

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
     * Get identity by wallet
     * @param wallet 
     */
    public async getIdentityByWallet(wallet: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'wallet' is not null or undefined
        if (wallet === null || wallet === undefined) {
            throw new RequiredError("IdentitiesApi", "getIdentityByWallet", "wallet");
        }


        // Path Params
        const localVarPath = '/identities/by-wallet/{wallet}'
            .replace('{' + 'wallet' + '}', encodeURIComponent(String(wallet)));

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
     * Get subscribed actions to identity for authenticated user.
     * @param id 
     */
    public async getIdentitySubscriptions(id: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'id' is not null or undefined
        if (id === null || id === undefined) {
            throw new RequiredError("IdentitiesApi", "getIdentitySubscriptions", "id");
        }


        // Path Params
        const localVarPath = '/identities/{id}/subscriptions'
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
     * Search for identities
     * @param handle At least 3 characters of a handle
     * @param waveId Search only users who can view given wave
     * @param limit Number of results (20 by default)
     * @param groupId Search only users who can view given group
     * @param ignoreAuthenticatedUser Ignore authenticated user
     */
    public async searchIdentities(handle: string, waveId?: string, limit?: number, groupId?: string, ignoreAuthenticatedUser?: boolean, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'handle' is not null or undefined
        if (handle === null || handle === undefined) {
            throw new RequiredError("IdentitiesApi", "searchIdentities", "handle");
        }






        // Path Params
        const localVarPath = '/identities';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (handle !== undefined) {
            requestContext.setQueryParam("handle", ObjectSerializer.serialize(handle, "string", ""));
        }

        // Query Params
        if (waveId !== undefined) {
            requestContext.setQueryParam("wave_id", ObjectSerializer.serialize(waveId, "string", ""));
        }

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", "int64"));
        }

        // Query Params
        if (groupId !== undefined) {
            requestContext.setQueryParam("group_id", ObjectSerializer.serialize(groupId, "string", ""));
        }

        // Query Params
        if (ignoreAuthenticatedUser !== undefined) {
            requestContext.setQueryParam("ignore_authenticated_user", ObjectSerializer.serialize(ignoreAuthenticatedUser, "boolean", ""));
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
     * Subscribe authenticated user to identities actions.
     * @param id 
     * @param apiIdentitySubscriptionActions 
     */
    public async subscribeToIdentityActions(id: string, apiIdentitySubscriptionActions: ApiIdentitySubscriptionActions, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'id' is not null or undefined
        if (id === null || id === undefined) {
            throw new RequiredError("IdentitiesApi", "subscribeToIdentityActions", "id");
        }


        // verify required parameter 'apiIdentitySubscriptionActions' is not null or undefined
        if (apiIdentitySubscriptionActions === null || apiIdentitySubscriptionActions === undefined) {
            throw new RequiredError("IdentitiesApi", "subscribeToIdentityActions", "apiIdentitySubscriptionActions");
        }


        // Path Params
        const localVarPath = '/identities/{id}/subscriptions'
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
            ObjectSerializer.serialize(apiIdentitySubscriptionActions, "ApiIdentitySubscriptionActions", ""),
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
     * Unsubscribe authenticated user from identity actions.
     * @param id 
     * @param apiIdentitySubscriptionActions 
     */
    public async unsubscribeFromIdentityActions(id: string, apiIdentitySubscriptionActions: ApiIdentitySubscriptionActions, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'id' is not null or undefined
        if (id === null || id === undefined) {
            throw new RequiredError("IdentitiesApi", "unsubscribeFromIdentityActions", "id");
        }


        // verify required parameter 'apiIdentitySubscriptionActions' is not null or undefined
        if (apiIdentitySubscriptionActions === null || apiIdentitySubscriptionActions === undefined) {
            throw new RequiredError("IdentitiesApi", "unsubscribeFromIdentityActions", "apiIdentitySubscriptionActions");
        }


        // Path Params
        const localVarPath = '/identities/{id}/subscriptions'
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.DELETE);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiIdentitySubscriptionActions, "ApiIdentitySubscriptionActions", ""),
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

export class IdentitiesApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getIdentityByKey
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getIdentityByKeyWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiIdentity >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiIdentity = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiIdentity", ""
            ) as ApiIdentity;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiIdentity = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiIdentity", ""
            ) as ApiIdentity;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getIdentityByWallet
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getIdentityByWalletWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiIdentity >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiIdentity = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiIdentity", ""
            ) as ApiIdentity;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiIdentity = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiIdentity", ""
            ) as ApiIdentity;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getIdentitySubscriptions
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getIdentitySubscriptionsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiIdentitySubscriptionActions >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiIdentitySubscriptionActions = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiIdentitySubscriptionActions", ""
            ) as ApiIdentitySubscriptionActions;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Identity not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiIdentitySubscriptionActions = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiIdentitySubscriptionActions", ""
            ) as ApiIdentitySubscriptionActions;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to searchIdentities
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async searchIdentitiesWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<ApiIdentity> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<ApiIdentity> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiIdentity>", ""
            ) as Array<ApiIdentity>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<ApiIdentity> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiIdentity>", ""
            ) as Array<ApiIdentity>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to subscribeToIdentityActions
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async subscribeToIdentityActionsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiIdentitySubscriptionActions >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiIdentitySubscriptionActions = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiIdentitySubscriptionActions", ""
            ) as ApiIdentitySubscriptionActions;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Identity not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiIdentitySubscriptionActions = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiIdentitySubscriptionActions", ""
            ) as ApiIdentitySubscriptionActions;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to unsubscribeFromIdentityActions
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async unsubscribeFromIdentityActionsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiIdentitySubscriptionActions >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiIdentitySubscriptionActions = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiIdentitySubscriptionActions", ""
            ) as ApiIdentitySubscriptionActions;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiIdentitySubscriptionActions = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiIdentitySubscriptionActions", ""
            ) as ApiIdentitySubscriptionActions;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
