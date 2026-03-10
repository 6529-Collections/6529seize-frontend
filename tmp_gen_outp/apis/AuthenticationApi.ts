// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiLoginRequest } from '../models/ApiLoginRequest';
import { ApiLoginResponse } from '../models/ApiLoginResponse';
import { ApiNonceResponse } from '../models/ApiNonceResponse';
import { ApiRedeemRefreshTokenRequest } from '../models/ApiRedeemRefreshTokenRequest';
import { ApiRedeemRefreshTokenResponse } from '../models/ApiRedeemRefreshTokenResponse';

/**
 * no description
 */
export class AuthenticationApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Authenticate and get JWT token
     * @param signerAddress Your wallet address
     * @param apiLoginRequest 
     */
    public async getAuthToken(signerAddress: string, apiLoginRequest: ApiLoginRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'signerAddress' is not null or undefined
        if (signerAddress === null || signerAddress === undefined) {
            throw new RequiredError("AuthenticationApi", "getAuthToken", "signerAddress");
        }


        // verify required parameter 'apiLoginRequest' is not null or undefined
        if (apiLoginRequest === null || apiLoginRequest === undefined) {
            throw new RequiredError("AuthenticationApi", "getAuthToken", "apiLoginRequest");
        }


        // Path Params
        const localVarPath = '/auth/login';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (signerAddress !== undefined) {
            requestContext.setQueryParam("signer_address", ObjectSerializer.serialize(signerAddress, "string", ""));
        }


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiLoginRequest, "ApiLoginRequest", ""),
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
     * Get a message to sign with your web3 wallet
     * @param signerAddress Your wallet address
     * @param shortNonce If true, the nonce will be shorter and easier to sign. Default is false.
     */
    public async getNonce(signerAddress: string, shortNonce?: boolean, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'signerAddress' is not null or undefined
        if (signerAddress === null || signerAddress === undefined) {
            throw new RequiredError("AuthenticationApi", "getNonce", "signerAddress");
        }



        // Path Params
        const localVarPath = '/auth/nonce';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (signerAddress !== undefined) {
            requestContext.setQueryParam("signer_address", ObjectSerializer.serialize(signerAddress, "string", ""));
        }

        // Query Params
        if (shortNonce !== undefined) {
            requestContext.setQueryParam("short_nonce", ObjectSerializer.serialize(shortNonce, "boolean", ""));
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
     * Redeem refresh token
     * @param apiRedeemRefreshTokenRequest 
     */
    public async redeemRefreshToken(apiRedeemRefreshTokenRequest: ApiRedeemRefreshTokenRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'apiRedeemRefreshTokenRequest' is not null or undefined
        if (apiRedeemRefreshTokenRequest === null || apiRedeemRefreshTokenRequest === undefined) {
            throw new RequiredError("AuthenticationApi", "redeemRefreshToken", "apiRedeemRefreshTokenRequest");
        }


        // Path Params
        const localVarPath = '/auth/redeem-refresh-token';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiRedeemRefreshTokenRequest, "ApiRedeemRefreshTokenRequest", ""),
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

export class AuthenticationApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getAuthToken
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getAuthTokenWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiLoginResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiLoginResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiLoginResponse", ""
            ) as ApiLoginResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiLoginResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiLoginResponse", ""
            ) as ApiLoginResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getNonce
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getNonceWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiNonceResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiNonceResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiNonceResponse", ""
            ) as ApiNonceResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiNonceResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiNonceResponse", ""
            ) as ApiNonceResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to redeemRefreshToken
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async redeemRefreshTokenWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiRedeemRefreshTokenResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiRedeemRefreshTokenResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiRedeemRefreshTokenResponse", ""
            ) as ApiRedeemRefreshTokenResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiRedeemRefreshTokenResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiRedeemRefreshTokenResponse", ""
            ) as ApiRedeemRefreshTokenResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
