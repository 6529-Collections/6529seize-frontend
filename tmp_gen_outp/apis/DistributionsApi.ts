// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { ApiCompleteMultipartUploadRequest } from '../models/ApiCompleteMultipartUploadRequest';
import { ApiCompleteMultipartUploadResponse } from '../models/ApiCompleteMultipartUploadResponse';
import { ApiCreateMediaUploadUrlRequest } from '../models/ApiCreateMediaUploadUrlRequest';
import { ApiCreateMediaUrlResponse } from '../models/ApiCreateMediaUrlResponse';
import { ApiStartMultipartMediaUploadResponse } from '../models/ApiStartMultipartMediaUploadResponse';
import { ApiUploadPartOfMultipartUploadRequest } from '../models/ApiUploadPartOfMultipartUploadRequest';
import { ApiUploadPartOfMultipartUploadResponse } from '../models/ApiUploadPartOfMultipartUploadResponse';
import { DistributionNormalizedPage } from '../models/DistributionNormalizedPage';
import { DistributionOverview } from '../models/DistributionOverview';
import { DistributionPhasesPage } from '../models/DistributionPhasesPage';
import { DistributionPhotoCompleteRequest } from '../models/DistributionPhotoCompleteRequest';
import { DistributionPhotoCompleteResponse } from '../models/DistributionPhotoCompleteResponse';
import { DistributionPhotosPage } from '../models/DistributionPhotosPage';

/**
 * no description
 */
export class DistributionsApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Complete multipart upload for distribution photo
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCompleteMultipartUploadRequest 
     */
    public async completeDistributionPhotoMultipartUpload(contract: string, nftId: number, apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'contract' is not null or undefined
        if (contract === null || contract === undefined) {
            throw new RequiredError("DistributionsApi", "completeDistributionPhotoMultipartUpload", "contract");
        }


        // verify required parameter 'nftId' is not null or undefined
        if (nftId === null || nftId === undefined) {
            throw new RequiredError("DistributionsApi", "completeDistributionPhotoMultipartUpload", "nftId");
        }


        // verify required parameter 'apiCompleteMultipartUploadRequest' is not null or undefined
        if (apiCompleteMultipartUploadRequest === null || apiCompleteMultipartUploadRequest === undefined) {
            throw new RequiredError("DistributionsApi", "completeDistributionPhotoMultipartUpload", "apiCompleteMultipartUploadRequest");
        }


        // Path Params
        const localVarPath = '/distribution_photos/{contract}/{nft_id}/multipart-upload/completion'
            .replace('{' + 'contract' + '}', encodeURIComponent(String(contract)))
            .replace('{' + 'nft_id' + '}', encodeURIComponent(String(nftId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiCompleteMultipartUploadRequest, "ApiCompleteMultipartUploadRequest", ""),
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
     * Requires the user to be authenticated as a Subscription Admin. Replaces all existing photos for the card.
     * Save uploaded distribution photos to database
     * @param contract Contract address
     * @param nftId NFT ID
     * @param distributionPhotoCompleteRequest 
     */
    public async completeDistributionPhotosUpload(contract: string, nftId: number, distributionPhotoCompleteRequest: DistributionPhotoCompleteRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'contract' is not null or undefined
        if (contract === null || contract === undefined) {
            throw new RequiredError("DistributionsApi", "completeDistributionPhotosUpload", "contract");
        }


        // verify required parameter 'nftId' is not null or undefined
        if (nftId === null || nftId === undefined) {
            throw new RequiredError("DistributionsApi", "completeDistributionPhotosUpload", "nftId");
        }


        // verify required parameter 'distributionPhotoCompleteRequest' is not null or undefined
        if (distributionPhotoCompleteRequest === null || distributionPhotoCompleteRequest === undefined) {
            throw new RequiredError("DistributionsApi", "completeDistributionPhotosUpload", "distributionPhotoCompleteRequest");
        }


        // Path Params
        const localVarPath = '/distribution_photos/{contract}/{nft_id}/complete'
            .replace('{' + 'contract' + '}', encodeURIComponent(String(contract)))
            .replace('{' + 'nft_id' + '}', encodeURIComponent(String(nftId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(distributionPhotoCompleteRequest, "DistributionPhotoCompleteRequest", ""),
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
     * Requires the user to be authenticated as a Subscription Admin
     * Start multipart upload for distribution photo
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCreateMediaUploadUrlRequest 
     */
    public async createDistributionPhotoMultipartUpload(contract: string, nftId: number, apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'contract' is not null or undefined
        if (contract === null || contract === undefined) {
            throw new RequiredError("DistributionsApi", "createDistributionPhotoMultipartUpload", "contract");
        }


        // verify required parameter 'nftId' is not null or undefined
        if (nftId === null || nftId === undefined) {
            throw new RequiredError("DistributionsApi", "createDistributionPhotoMultipartUpload", "nftId");
        }


        // verify required parameter 'apiCreateMediaUploadUrlRequest' is not null or undefined
        if (apiCreateMediaUploadUrlRequest === null || apiCreateMediaUploadUrlRequest === undefined) {
            throw new RequiredError("DistributionsApi", "createDistributionPhotoMultipartUpload", "apiCreateMediaUploadUrlRequest");
        }


        // Path Params
        const localVarPath = '/distribution_photos/{contract}/{nft_id}/multipart-upload'
            .replace('{' + 'contract' + '}', encodeURIComponent(String(contract)))
            .replace('{' + 'nft_id' + '}', encodeURIComponent(String(nftId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiCreateMediaUploadUrlRequest, "ApiCreateMediaUploadUrlRequest", ""),
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
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned S3 URL for distribution photo upload
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCreateMediaUploadUrlRequest 
     */
    public async createDistributionPhotoUploadUrl(contract: string, nftId: number, apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'contract' is not null or undefined
        if (contract === null || contract === undefined) {
            throw new RequiredError("DistributionsApi", "createDistributionPhotoUploadUrl", "contract");
        }


        // verify required parameter 'nftId' is not null or undefined
        if (nftId === null || nftId === undefined) {
            throw new RequiredError("DistributionsApi", "createDistributionPhotoUploadUrl", "nftId");
        }


        // verify required parameter 'apiCreateMediaUploadUrlRequest' is not null or undefined
        if (apiCreateMediaUploadUrlRequest === null || apiCreateMediaUploadUrlRequest === undefined) {
            throw new RequiredError("DistributionsApi", "createDistributionPhotoUploadUrl", "apiCreateMediaUploadUrlRequest");
        }


        // Path Params
        const localVarPath = '/distribution_photos/{contract}/{nft_id}/prep'
            .replace('{' + 'contract' + '}', encodeURIComponent(String(contract)))
            .replace('{' + 'nft_id' + '}', encodeURIComponent(String(nftId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiCreateMediaUploadUrlRequest, "ApiCreateMediaUploadUrlRequest", ""),
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
     * Requires the user to be authenticated as a Subscription Admin
     * Get distribution overview for a specific contract and card
     * @param contract Contract address
     * @param id Card ID
     */
    public async getDistributionOverview(contract: string, id: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'contract' is not null or undefined
        if (contract === null || contract === undefined) {
            throw new RequiredError("DistributionsApi", "getDistributionOverview", "contract");
        }


        // verify required parameter 'id' is not null or undefined
        if (id === null || id === undefined) {
            throw new RequiredError("DistributionsApi", "getDistributionOverview", "id");
        }


        // Path Params
        const localVarPath = '/distributions/{contract}/{id}/overview'
            .replace('{' + 'contract' + '}', encodeURIComponent(String(contract)))
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
     * Get distribution phases for a specific contract and NFT
     * @param contract Contract address
     * @param nftId NFT ID
     */
    public async getDistributionPhases(contract: string, nftId: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'contract' is not null or undefined
        if (contract === null || contract === undefined) {
            throw new RequiredError("DistributionsApi", "getDistributionPhases", "contract");
        }


        // verify required parameter 'nftId' is not null or undefined
        if (nftId === null || nftId === undefined) {
            throw new RequiredError("DistributionsApi", "getDistributionPhases", "nftId");
        }


        // Path Params
        const localVarPath = '/distribution_phases/{contract}/{nft_id}'
            .replace('{' + 'contract' + '}', encodeURIComponent(String(contract)))
            .replace('{' + 'nft_id' + '}', encodeURIComponent(String(nftId)));

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
     * Get distribution photos for a specific contract and NFT
     * @param contract Contract address
     * @param nftId NFT ID
     * @param pageSize Default is 50
     * @param page Default is 1
     */
    public async getDistributionPhotos(contract: string, nftId: number, pageSize?: number, page?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'contract' is not null or undefined
        if (contract === null || contract === undefined) {
            throw new RequiredError("DistributionsApi", "getDistributionPhotos", "contract");
        }


        // verify required parameter 'nftId' is not null or undefined
        if (nftId === null || nftId === undefined) {
            throw new RequiredError("DistributionsApi", "getDistributionPhotos", "nftId");
        }




        // Path Params
        const localVarPath = '/distribution_photos/{contract}/{nft_id}'
            .replace('{' + 'contract' + '}', encodeURIComponent(String(contract)))
            .replace('{' + 'nft_id' + '}', encodeURIComponent(String(nftId)));

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
     * At least one filter parameter (search, card_id, contract, or wallet) is required
     * Get distributions
     * @param pageSize Default is 2000
     * @param page Default is 1
     * @param search Search by wallet address or display name
     * @param cardId Filter by card ID(s), comma-separated for multiple
     * @param contract Filter by contract address(es), comma-separated for multiple
     * @param wallet Filter by wallet address(es), comma-separated for multiple
     */
    public async getDistributions(pageSize?: number, page?: number, search?: string, cardId?: string, contract?: string, wallet?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;







        // Path Params
        const localVarPath = '/distributions';

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
        if (search !== undefined) {
            requestContext.setQueryParam("search", ObjectSerializer.serialize(search, "string", ""));
        }

        // Query Params
        if (cardId !== undefined) {
            requestContext.setQueryParam("card_id", ObjectSerializer.serialize(cardId, "string", ""));
        }

        // Query Params
        if (contract !== undefined) {
            requestContext.setQueryParam("contract", ObjectSerializer.serialize(contract, "string", ""));
        }

        // Query Params
        if (wallet !== undefined) {
            requestContext.setQueryParam("wallet", ObjectSerializer.serialize(wallet, "string", ""));
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
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned URL for multipart upload part
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiUploadPartOfMultipartUploadRequest 
     */
    public async uploadPartOfDistributionPhotoMultipartUpload(contract: string, nftId: number, apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'contract' is not null or undefined
        if (contract === null || contract === undefined) {
            throw new RequiredError("DistributionsApi", "uploadPartOfDistributionPhotoMultipartUpload", "contract");
        }


        // verify required parameter 'nftId' is not null or undefined
        if (nftId === null || nftId === undefined) {
            throw new RequiredError("DistributionsApi", "uploadPartOfDistributionPhotoMultipartUpload", "nftId");
        }


        // verify required parameter 'apiUploadPartOfMultipartUploadRequest' is not null or undefined
        if (apiUploadPartOfMultipartUploadRequest === null || apiUploadPartOfMultipartUploadRequest === undefined) {
            throw new RequiredError("DistributionsApi", "uploadPartOfDistributionPhotoMultipartUpload", "apiUploadPartOfMultipartUploadRequest");
        }


        // Path Params
        const localVarPath = '/distribution_photos/{contract}/{nft_id}/multipart-upload/part'
            .replace('{' + 'contract' + '}', encodeURIComponent(String(contract)))
            .replace('{' + 'nft_id' + '}', encodeURIComponent(String(nftId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(apiUploadPartOfMultipartUploadRequest, "ApiUploadPartOfMultipartUploadRequest", ""),
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

export class DistributionsApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to completeDistributionPhotoMultipartUpload
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async completeDistributionPhotoMultipartUploadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiCompleteMultipartUploadResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiCompleteMultipartUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCompleteMultipartUploadResponse", ""
            ) as ApiCompleteMultipartUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Unauthorized", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiCompleteMultipartUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCompleteMultipartUploadResponse", ""
            ) as ApiCompleteMultipartUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to completeDistributionPhotosUpload
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async completeDistributionPhotosUploadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<DistributionPhotoCompleteResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: DistributionPhotoCompleteResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DistributionPhotoCompleteResponse", ""
            ) as DistributionPhotoCompleteResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Unauthorized", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: DistributionPhotoCompleteResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DistributionPhotoCompleteResponse", ""
            ) as DistributionPhotoCompleteResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to createDistributionPhotoMultipartUpload
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async createDistributionPhotoMultipartUploadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiStartMultipartMediaUploadResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiStartMultipartMediaUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiStartMultipartMediaUploadResponse", ""
            ) as ApiStartMultipartMediaUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Unauthorized", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiStartMultipartMediaUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiStartMultipartMediaUploadResponse", ""
            ) as ApiStartMultipartMediaUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to createDistributionPhotoUploadUrl
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async createDistributionPhotoUploadUrlWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiCreateMediaUrlResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiCreateMediaUrlResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCreateMediaUrlResponse", ""
            ) as ApiCreateMediaUrlResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Unauthorized", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiCreateMediaUrlResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiCreateMediaUrlResponse", ""
            ) as ApiCreateMediaUrlResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getDistributionOverview
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getDistributionOverviewWithHttpInfo(response: ResponseContext): Promise<HttpInfo<DistributionOverview >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: DistributionOverview = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DistributionOverview", ""
            ) as DistributionOverview;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Forbidden - not a Subscription Admin", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: DistributionOverview = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DistributionOverview", ""
            ) as DistributionOverview;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getDistributionPhases
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getDistributionPhasesWithHttpInfo(response: ResponseContext): Promise<HttpInfo<DistributionPhasesPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: DistributionPhasesPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DistributionPhasesPage", ""
            ) as DistributionPhasesPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: DistributionPhasesPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DistributionPhasesPage", ""
            ) as DistributionPhasesPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getDistributionPhotos
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getDistributionPhotosWithHttpInfo(response: ResponseContext): Promise<HttpInfo<DistributionPhotosPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: DistributionPhotosPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DistributionPhotosPage", ""
            ) as DistributionPhotosPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: DistributionPhotosPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DistributionPhotosPage", ""
            ) as DistributionPhotosPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getDistributions
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getDistributionsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<DistributionNormalizedPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: DistributionNormalizedPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DistributionNormalizedPage", ""
            ) as DistributionNormalizedPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: DistributionNormalizedPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DistributionNormalizedPage", ""
            ) as DistributionNormalizedPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to uploadPartOfDistributionPhotoMultipartUpload
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async uploadPartOfDistributionPhotoMultipartUploadWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiUploadPartOfMultipartUploadResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: ApiUploadPartOfMultipartUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiUploadPartOfMultipartUploadResponse", ""
            ) as ApiUploadPartOfMultipartUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid request", undefined, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Unauthorized", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiUploadPartOfMultipartUploadResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiUploadPartOfMultipartUploadResponse", ""
            ) as ApiUploadPartOfMultipartUploadResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
