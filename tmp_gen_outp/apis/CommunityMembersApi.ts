// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiCommunityMemberMinimal } from '../models/ApiCommunityMemberMinimal';
import { ApiCommunityMembersPage } from '../models/ApiCommunityMembersPage';
import { ApiCommunityMembersSortOption } from '../models/ApiCommunityMembersSortOption';

/**
 * no description
 */
export class CommunityMembersApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get community members.
     * @param onlyProfileOwners Return only profile owners?
     * @param param Search param
     */
    public async getCommunityMembers(onlyProfileOwners?: boolean, param?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;



        // Path Params
        const localVarPath = '/community-members';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (onlyProfileOwners !== undefined) {
            requestContext.setQueryParam("only_profile_owners", ObjectSerializer.serialize(onlyProfileOwners, "boolean", ""));
        }

        // Query Params
        if (param !== undefined) {
            requestContext.setQueryParam("param", ObjectSerializer.serialize(param, "string", ""));
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
     * Get top community members with pagination and sorting.
     * @param pageSize Default is 50
     * @param page Default is 1
     * @param sortDirection Default is DESC
     * @param sort Default is level
     * @param groupId Filter by group ID
     */
    public async getTopCommunityMembers(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: ApiCommunityMembersSortOption, groupId?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;






        // Path Params
        const localVarPath = '/community-members/top';

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
            const serializedParams = ObjectSerializer.serialize(sort, "ApiCommunityMembersSortOption", "");
            for (const key of Object.keys(serializedParams)) {
                requestContext.setQueryParam(key, serializedParams[key]);
            }
        }

        // Query Params
        if (groupId !== undefined) {
            requestContext.setQueryParam("group_id", ObjectSerializer.serialize(groupId, "string", ""));
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

export class CommunityMembersApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getCommunityMembers
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getCommunityMembersWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<ApiCommunityMemberMinimal> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<ApiCommunityMemberMinimal> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiCommunityMemberMinimal>", ""
            ) as Array<ApiCommunityMemberMinimal>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<ApiCommunityMemberMinimal> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiCommunityMemberMinimal>", ""
            ) as Array<ApiCommunityMemberMinimal>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getTopCommunityMembers
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getTopCommunityMembersWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiCommunityMembersPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiCommunityMembersPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCommunityMembersPage", ""
            ) as ApiCommunityMembersPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiCommunityMembersPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCommunityMembersPage", ""
            ) as ApiCommunityMembersPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
