// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { AirdropAddressResponse } from '../models/AirdropAddressResponse';
import { ApiIncomingIdentitySubscriptionsPage } from '../models/ApiIncomingIdentitySubscriptionsPage';
import { ApiOutgoingIdentitySubscriptionsPage } from '../models/ApiOutgoingIdentitySubscriptionsPage';
import { ApiUpcomingMemeSubscriptionStatus } from '../models/ApiUpcomingMemeSubscriptionStatus';
import { NFTFinalSubscription } from '../models/NFTFinalSubscription';
import { NFTFinalSubscriptionUploadPage } from '../models/NFTFinalSubscriptionUploadPage';
import { NFTSubscription } from '../models/NFTSubscription';
import { RedeemedSubscriptionCountsPage } from '../models/RedeemedSubscriptionCountsPage';
import { RedeemedSubscriptionPage } from '../models/RedeemedSubscriptionPage';
import { SubscribeAllEditionsResponse } from '../models/SubscribeAllEditionsResponse';
import { SubscriptionCountResponse } from '../models/SubscriptionCountResponse';
import { SubscriptionCounts } from '../models/SubscriptionCounts';
import { SubscriptionDetails } from '../models/SubscriptionDetails';
import { SubscriptionLogPage } from '../models/SubscriptionLogPage';
import { SubscriptionModeResponse } from '../models/SubscriptionModeResponse';
import { SubscriptionResponse } from '../models/SubscriptionResponse';
import { SubscriptionTopUpPage } from '../models/SubscriptionTopUpPage';
import { UpdateSubscribeAllEditionsRequest } from '../models/UpdateSubscribeAllEditionsRequest';
import { UpdateSubscriptionCountRequest } from '../models/UpdateSubscriptionCountRequest';
import { UpdateSubscriptionModeRequest } from '../models/UpdateSubscriptionModeRequest';
import { UpdateSubscriptionRequest } from '../models/UpdateSubscriptionRequest';

/**
 * no description
 */
export class SubscriptionsApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get airdrop address for a consolidation
     * @param consolidationKey Consolidation key
     */
    public async getAirdropAddress(consolidationKey: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("SubscriptionsApi", "getAirdropAddress", "consolidationKey");
        }


        // Path Params
        const localVarPath = '/subscriptions/consolidation/{consolidation_key}/airdrop-address'
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
     * Get final subscription for a consolidation
     * @param consolidationKey Consolidation key
     * @param contract Contract address
     * @param tokenId Token ID
     */
    public async getFinalSubscription(consolidationKey: string, contract: string, tokenId: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("SubscriptionsApi", "getFinalSubscription", "consolidationKey");
        }


        // verify required parameter 'contract' is not null or undefined
        if (contract === null || contract === undefined) {
            throw new RequiredError("SubscriptionsApi", "getFinalSubscription", "contract");
        }


        // verify required parameter 'tokenId' is not null or undefined
        if (tokenId === null || tokenId === undefined) {
            throw new RequiredError("SubscriptionsApi", "getFinalSubscription", "tokenId");
        }


        // Path Params
        const localVarPath = '/subscriptions/consolidation/final/{consolidation_key}/{contract}/{token_id}'
            .replace('{' + 'consolidation_key' + '}', encodeURIComponent(String(consolidationKey)))
            .replace('{' + 'contract' + '}', encodeURIComponent(String(contract)))
            .replace('{' + 'token_id' + '}', encodeURIComponent(String(tokenId)));

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
     * Get identities subscribed to target.
     * @param targetType 
     * @param targetId 
     * @param pageSize 
     * @param page 
     */
    public async getIncomingSubscriptionsForTarget(targetType: 'IDENTITY' | 'WAVE' | 'DROP', targetId: string, pageSize?: number, page?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'targetType' is not null or undefined
        if (targetType === null || targetType === undefined) {
            throw new RequiredError("SubscriptionsApi", "getIncomingSubscriptionsForTarget", "targetType");
        }


        // verify required parameter 'targetId' is not null or undefined
        if (targetId === null || targetId === undefined) {
            throw new RequiredError("SubscriptionsApi", "getIncomingSubscriptionsForTarget", "targetId");
        }




        // Path Params
        const localVarPath = '/identity-subscriptions/incoming/{target_type}/{target_id}'
            .replace('{' + 'target_type' + '}', encodeURIComponent(String(targetType)))
            .replace('{' + 'target_id' + '}', encodeURIComponent(String(targetId)));

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
     * Get outgoing subscriptions for authenticated user.
     * @param targetType 
     * @param pageSize 
     * @param page 
     */
    public async getOutgoingSubscriptions(targetType: 'IDENTITY' | 'WAVE' | 'DROP', pageSize?: number, page?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'targetType' is not null or undefined
        if (targetType === null || targetType === undefined) {
            throw new RequiredError("SubscriptionsApi", "getOutgoingSubscriptions", "targetType");
        }




        // Path Params
        const localVarPath = '/identity-subscriptions/outgoing/{target_type}'
            .replace('{' + 'target_type' + '}', encodeURIComponent(String(targetType)));

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
     * Get redeemed meme subscription counts
     * @param pageSize Default is 20
     * @param page Default is 1
     */
    public async getRedeemedMemeSubscriptionCounts(pageSize?: number, page?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;



        // Path Params
        const localVarPath = '/subscriptions/redeemed-memes-counts';

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
     * Get redeemed subscriptions for a consolidation
     * @param consolidationKey Consolidation key
     * @param pageSize Default is 20
     * @param page Default is 1
     */
    public async getRedeemedSubscriptions(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("SubscriptionsApi", "getRedeemedSubscriptions", "consolidationKey");
        }




        // Path Params
        const localVarPath = '/subscriptions/consolidation/redeemed/{consolidation_key}'
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
     * Get subscription details for a consolidation
     * @param consolidationKey Consolidation key
     */
    public async getSubscriptionDetails(consolidationKey: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("SubscriptionsApi", "getSubscriptionDetails", "consolidationKey");
        }


        // Path Params
        const localVarPath = '/subscriptions/consolidation/details/{consolidation_key}'
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
     * Get subscription logs for a consolidation
     * @param consolidationKey Consolidation key
     * @param pageSize Default is 20
     * @param page Default is 1
     */
    public async getSubscriptionLogs(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("SubscriptionsApi", "getSubscriptionLogs", "consolidationKey");
        }




        // Path Params
        const localVarPath = '/subscriptions/consolidation/logs/{consolidation_key}'
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
     * Get top-ups for a consolidation
     * @param consolidationKey Consolidation key
     * @param pageSize Default is 20
     * @param page Default is 1
     */
    public async getSubscriptionTopUps(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("SubscriptionsApi", "getSubscriptionTopUps", "consolidationKey");
        }




        // Path Params
        const localVarPath = '/subscriptions/consolidation/top-up/{consolidation_key}'
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
     * Get subscription uploads
     * @param contract Contract address (required)
     * @param pageSize Default is 20
     * @param page Default is 1
     */
    public async getSubscriptionUploads(contract: string, pageSize?: number, page?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'contract' is not null or undefined
        if (contract === null || contract === undefined) {
            throw new RequiredError("SubscriptionsApi", "getSubscriptionUploads", "contract");
        }




        // Path Params
        const localVarPath = '/subscriptions/uploads';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (contract !== undefined) {
            requestContext.setQueryParam("contract", ObjectSerializer.serialize(contract, "string", ""));
        }

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
     * Get upcoming meme subscription counts
     * @param cardCount Number of upcoming cards to fetch. Default is 3
     */
    public async getUpcomingMemeSubscriptionCounts(cardCount?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;


        // Path Params
        const localVarPath = '/subscriptions/upcoming-memes-counts';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (cardCount !== undefined) {
            requestContext.setQueryParam("card_count", ObjectSerializer.serialize(cardCount, "number", "int64"));
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
     * Get upcoming meme subscription status for a consolidation
     * @param memeId Meme token id
     * @param consolidationKey Consolidation key
     */
    public async getUpcomingMemeSubscriptionStatus(memeId: number, consolidationKey: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'memeId' is not null or undefined
        if (memeId === null || memeId === undefined) {
            throw new RequiredError("SubscriptionsApi", "getUpcomingMemeSubscriptionStatus", "memeId");
        }


        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("SubscriptionsApi", "getUpcomingMemeSubscriptionStatus", "consolidationKey");
        }


        // Path Params
        const localVarPath = '/subscriptions/consolidation/upcoming-memes/{meme_id}/{consolidation_key}'
            .replace('{' + 'meme_id' + '}', encodeURIComponent(String(memeId)))
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
     * Get upcoming meme subscriptions for a consolidation
     * @param consolidationKey Consolidation key
     * @param cardCount Number of upcoming cards to fetch. Default is 3
     */
    public async getUpcomingMemeSubscriptions(consolidationKey: string, cardCount?: number, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("SubscriptionsApi", "getUpcomingMemeSubscriptions", "consolidationKey");
        }



        // Path Params
        const localVarPath = '/subscriptions/consolidation/upcoming-memes/{consolidation_key}'
            .replace('{' + 'consolidation_key' + '}', encodeURIComponent(String(consolidationKey)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (cardCount !== undefined) {
            requestContext.setQueryParam("card_count", ObjectSerializer.serialize(cardCount, "number", "int64"));
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
     * Requires authentication. User can only change this setting for their own consolidation.
     * Toggle subscribe all editions preference
     * @param consolidationKey Consolidation key
     * @param updateSubscribeAllEditionsRequest 
     */
    public async updateSubscribeAllEditions(consolidationKey: string, updateSubscribeAllEditionsRequest: UpdateSubscribeAllEditionsRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("SubscriptionsApi", "updateSubscribeAllEditions", "consolidationKey");
        }


        // verify required parameter 'updateSubscribeAllEditionsRequest' is not null or undefined
        if (updateSubscribeAllEditionsRequest === null || updateSubscribeAllEditionsRequest === undefined) {
            throw new RequiredError("SubscriptionsApi", "updateSubscribeAllEditions", "updateSubscribeAllEditionsRequest");
        }


        // Path Params
        const localVarPath = '/subscriptions/{consolidation_key}/subscribe-all-editions'
            .replace('{' + 'consolidation_key' + '}', encodeURIComponent(String(consolidationKey)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(updateSubscribeAllEditionsRequest, "UpdateSubscribeAllEditionsRequest", ""),
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
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription for a specific NFT
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionRequest 
     */
    public async updateSubscription(consolidationKey: string, updateSubscriptionRequest: UpdateSubscriptionRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("SubscriptionsApi", "updateSubscription", "consolidationKey");
        }


        // verify required parameter 'updateSubscriptionRequest' is not null or undefined
        if (updateSubscriptionRequest === null || updateSubscriptionRequest === undefined) {
            throw new RequiredError("SubscriptionsApi", "updateSubscription", "updateSubscriptionRequest");
        }


        // Path Params
        const localVarPath = '/subscriptions/{consolidation_key}/subscription'
            .replace('{' + 'consolidation_key' + '}', encodeURIComponent(String(consolidationKey)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(updateSubscriptionRequest, "UpdateSubscriptionRequest", ""),
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
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription count for a specific NFT
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionCountRequest 
     */
    public async updateSubscriptionCount(consolidationKey: string, updateSubscriptionCountRequest: UpdateSubscriptionCountRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("SubscriptionsApi", "updateSubscriptionCount", "consolidationKey");
        }


        // verify required parameter 'updateSubscriptionCountRequest' is not null or undefined
        if (updateSubscriptionCountRequest === null || updateSubscriptionCountRequest === undefined) {
            throw new RequiredError("SubscriptionsApi", "updateSubscriptionCount", "updateSubscriptionCountRequest");
        }


        // Path Params
        const localVarPath = '/subscriptions/{consolidation_key}/subscription-count'
            .replace('{' + 'consolidation_key' + '}', encodeURIComponent(String(consolidationKey)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(updateSubscriptionCountRequest, "UpdateSubscriptionCountRequest", ""),
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
     * Requires authentication. User can only change subscription mode for their own consolidation.
     * Update subscription mode
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionModeRequest 
     */
    public async updateSubscriptionMode(consolidationKey: string, updateSubscriptionModeRequest: UpdateSubscriptionModeRequest, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'consolidationKey' is not null or undefined
        if (consolidationKey === null || consolidationKey === undefined) {
            throw new RequiredError("SubscriptionsApi", "updateSubscriptionMode", "consolidationKey");
        }


        // verify required parameter 'updateSubscriptionModeRequest' is not null or undefined
        if (updateSubscriptionModeRequest === null || updateSubscriptionModeRequest === undefined) {
            throw new RequiredError("SubscriptionsApi", "updateSubscriptionMode", "updateSubscriptionModeRequest");
        }


        // Path Params
        const localVarPath = '/subscriptions/{consolidation_key}/subscription-mode'
            .replace('{' + 'consolidation_key' + '}', encodeURIComponent(String(consolidationKey)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(updateSubscriptionModeRequest, "UpdateSubscriptionModeRequest", ""),
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

export class SubscriptionsApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getAirdropAddress
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getAirdropAddressWithHttpInfo(response: ResponseContext): Promise<HttpInfo<AirdropAddressResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: AirdropAddressResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "AirdropAddressResponse", ""
            ) as AirdropAddressResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: AirdropAddressResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "AirdropAddressResponse", ""
            ) as AirdropAddressResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getFinalSubscription
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getFinalSubscriptionWithHttpInfo(response: ResponseContext): Promise<HttpInfo<NFTFinalSubscription >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: NFTFinalSubscription = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "NFTFinalSubscription", ""
            ) as NFTFinalSubscription;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Invalid token ID", undefined, response.headers);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: NFTFinalSubscription = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "NFTFinalSubscription", ""
            ) as NFTFinalSubscription;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getIncomingSubscriptionsForTarget
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getIncomingSubscriptionsForTargetWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<ApiIncomingIdentitySubscriptionsPage> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<ApiIncomingIdentitySubscriptionsPage> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiIncomingIdentitySubscriptionsPage>", ""
            ) as Array<ApiIncomingIdentitySubscriptionsPage>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<ApiIncomingIdentitySubscriptionsPage> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiIncomingIdentitySubscriptionsPage>", ""
            ) as Array<ApiIncomingIdentitySubscriptionsPage>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getOutgoingSubscriptions
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getOutgoingSubscriptionsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<ApiOutgoingIdentitySubscriptionsPage> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<ApiOutgoingIdentitySubscriptionsPage> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiOutgoingIdentitySubscriptionsPage>", ""
            ) as Array<ApiOutgoingIdentitySubscriptionsPage>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<ApiOutgoingIdentitySubscriptionsPage> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<ApiOutgoingIdentitySubscriptionsPage>", ""
            ) as Array<ApiOutgoingIdentitySubscriptionsPage>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getRedeemedMemeSubscriptionCounts
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getRedeemedMemeSubscriptionCountsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<RedeemedSubscriptionCountsPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: RedeemedSubscriptionCountsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RedeemedSubscriptionCountsPage", ""
            ) as RedeemedSubscriptionCountsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: RedeemedSubscriptionCountsPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RedeemedSubscriptionCountsPage", ""
            ) as RedeemedSubscriptionCountsPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getRedeemedSubscriptions
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getRedeemedSubscriptionsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<RedeemedSubscriptionPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: RedeemedSubscriptionPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RedeemedSubscriptionPage", ""
            ) as RedeemedSubscriptionPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: RedeemedSubscriptionPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "RedeemedSubscriptionPage", ""
            ) as RedeemedSubscriptionPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getSubscriptionDetails
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getSubscriptionDetailsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<SubscriptionDetails >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: SubscriptionDetails = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscriptionDetails", ""
            ) as SubscriptionDetails;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: SubscriptionDetails = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscriptionDetails", ""
            ) as SubscriptionDetails;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getSubscriptionLogs
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getSubscriptionLogsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<SubscriptionLogPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: SubscriptionLogPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscriptionLogPage", ""
            ) as SubscriptionLogPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: SubscriptionLogPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscriptionLogPage", ""
            ) as SubscriptionLogPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getSubscriptionTopUps
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getSubscriptionTopUpsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<SubscriptionTopUpPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: SubscriptionTopUpPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscriptionTopUpPage", ""
            ) as SubscriptionTopUpPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Not found", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: SubscriptionTopUpPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscriptionTopUpPage", ""
            ) as SubscriptionTopUpPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getSubscriptionUploads
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getSubscriptionUploadsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<NFTFinalSubscriptionUploadPage >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: NFTFinalSubscriptionUploadPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "NFTFinalSubscriptionUploadPage", ""
            ) as NFTFinalSubscriptionUploadPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Contract is required", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: NFTFinalSubscriptionUploadPage = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "NFTFinalSubscriptionUploadPage", ""
            ) as NFTFinalSubscriptionUploadPage;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getUpcomingMemeSubscriptionCounts
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getUpcomingMemeSubscriptionCountsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<SubscriptionCounts> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<SubscriptionCounts> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<SubscriptionCounts>", ""
            ) as Array<SubscriptionCounts>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<SubscriptionCounts> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<SubscriptionCounts>", ""
            ) as Array<SubscriptionCounts>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getUpcomingMemeSubscriptionStatus
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getUpcomingMemeSubscriptionStatusWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ApiUpcomingMemeSubscriptionStatus >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: ApiUpcomingMemeSubscriptionStatus = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiUpcomingMemeSubscriptionStatus", ""
            ) as ApiUpcomingMemeSubscriptionStatus;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Meme already dropped", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: ApiUpcomingMemeSubscriptionStatus = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ApiUpcomingMemeSubscriptionStatus", ""
            ) as ApiUpcomingMemeSubscriptionStatus;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getUpcomingMemeSubscriptions
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getUpcomingMemeSubscriptionsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<Array<NFTSubscription> >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: Array<NFTSubscription> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<NFTSubscription>", ""
            ) as Array<NFTSubscription>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: Array<NFTSubscription> = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "Array<NFTSubscription>", ""
            ) as Array<NFTSubscription>;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to updateSubscribeAllEditions
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async updateSubscribeAllEditionsWithHttpInfo(response: ResponseContext): Promise<HttpInfo<SubscribeAllEditionsResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: SubscribeAllEditionsResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscribeAllEditionsResponse", ""
            ) as SubscribeAllEditionsResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "User can only change subscription mode for their own consolidation", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: SubscribeAllEditionsResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscribeAllEditionsResponse", ""
            ) as SubscribeAllEditionsResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to updateSubscription
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async updateSubscriptionWithHttpInfo(response: ResponseContext): Promise<HttpInfo<SubscriptionResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: SubscriptionResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscriptionResponse", ""
            ) as SubscriptionResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Not enough balance or NFT already released", undefined, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "User can only change subscription mode for their own consolidation", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: SubscriptionResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscriptionResponse", ""
            ) as SubscriptionResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to updateSubscriptionCount
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async updateSubscriptionCountWithHttpInfo(response: ResponseContext): Promise<HttpInfo<SubscriptionCountResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: SubscriptionCountResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscriptionCountResponse", ""
            ) as SubscriptionCountResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Not enough balance, NFT already released, or exceeds eligibility", undefined, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "User can only change subscription mode for their own consolidation", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: SubscriptionCountResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscriptionCountResponse", ""
            ) as SubscriptionCountResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to updateSubscriptionMode
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async updateSubscriptionModeWithHttpInfo(response: ResponseContext): Promise<HttpInfo<SubscriptionModeResponse >> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: SubscriptionModeResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscriptionModeResponse", ""
            ) as SubscriptionModeResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "Not enough balance", undefined, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "User can only change subscription mode for their own consolidation", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: SubscriptionModeResponse = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SubscriptionModeResponse", ""
            ) as SubscriptionModeResponse;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
