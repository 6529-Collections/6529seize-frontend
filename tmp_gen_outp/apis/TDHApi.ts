// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiConsolidatedTdh } from '../models/ApiConsolidatedTdh';

/**
 * no description
 */
export class TDHApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Returns the consolidated TDH data for a given identity. The identity can be a profile handle, wallet address, ENS name, or consolidation key.
     * Get consolidated TDH for an identity
     * @param identity Profile handle, wallet address, ENS name, or consolidation key
     */
    public async getConsolidatedTdh(identity: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'identity' is not null or undefined
        if (identity === null || identity === undefined) {
            throw new RequiredError("TDHApi", "getConsolidatedTdh", "identity");
        }


        // Path Params
        const localVarPath = '/tdh/consolidation/{identity}'
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

}

export class TDHApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getConsolidatedTdh
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getConsolidatedTdhWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiConsolidatedTdh >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiConsolidatedTdh = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiConsolidatedTdh", ""
            ) as ApiConsolidatedTdh;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Consolidated TDH not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiConsolidatedTdh = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiConsolidatedTdh", ""
            ) as ApiConsolidatedTdh;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
