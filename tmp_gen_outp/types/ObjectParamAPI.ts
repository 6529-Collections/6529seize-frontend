import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration} from '../configuration'

import { AcceptActionRequest } from '../models/AcceptActionRequest';
import { AddActionToProxyRequest } from '../models/AddActionToProxyRequest';
import { AirdropAddressResponse } from '../models/AirdropAddressResponse';
import { AirdropAddressResponseTdhWallet } from '../models/AirdropAddressResponseTdhWallet';
import { AllowlistNormalizedEntry } from '../models/AllowlistNormalizedEntry';
import { ApiAddReactionToDropRequest } from '../models/ApiAddReactionToDropRequest';
import { ApiAggregatedActivity } from '../models/ApiAggregatedActivity';
import { ApiAggregatedActivityMemes } from '../models/ApiAggregatedActivityMemes';
import { ApiAggregatedActivityPage } from '../models/ApiAggregatedActivityPage';
import { ApiArtistNameItem } from '../models/ApiArtistNameItem';
import { ApiAvailableRatingCredit } from '../models/ApiAvailableRatingCredit';
import { ApiBlockItem } from '../models/ApiBlockItem';
import { ApiBlocksPage } from '../models/ApiBlocksPage';
import { ApiBulkRateRequest } from '../models/ApiBulkRateRequest';
import { ApiBulkRateResponse } from '../models/ApiBulkRateResponse';
import { ApiBulkRateSkippedIdentity } from '../models/ApiBulkRateSkippedIdentity';
import { ApiBulkRepRequest } from '../models/ApiBulkRepRequest';
import { ApiBulkRepTarget } from '../models/ApiBulkRepTarget';
import { ApiChangeGroupVisibility } from '../models/ApiChangeGroupVisibility';
import { ApiChangeProfileCicRating } from '../models/ApiChangeProfileCicRating';
import { ApiChangeProfileRepRating } from '../models/ApiChangeProfileRepRating';
import { ApiCicContributor } from '../models/ApiCicContributor';
import { ApiCicContributorsPage } from '../models/ApiCicContributorsPage';
import { ApiCicOverview } from '../models/ApiCicOverview';
import { ApiCollectedStats } from '../models/ApiCollectedStats';
import { ApiCollectedStatsSeason } from '../models/ApiCollectedStatsSeason';
import { ApiCommunityMemberMinimal } from '../models/ApiCommunityMemberMinimal';
import { ApiCommunityMemberOverview } from '../models/ApiCommunityMemberOverview';
import { ApiCommunityMembersPage } from '../models/ApiCommunityMembersPage';
import { ApiCommunityMembersSortOption } from '../models/ApiCommunityMembersSortOption';
import { ApiCommunityMetric } from '../models/ApiCommunityMetric';
import { ApiCommunityMetricSample } from '../models/ApiCommunityMetricSample';
import { ApiCommunityMetrics } from '../models/ApiCommunityMetrics';
import { ApiCommunityMetricsSeries } from '../models/ApiCommunityMetricsSeries';
import { ApiCompleteMultipartUploadRequest } from '../models/ApiCompleteMultipartUploadRequest';
import { ApiCompleteMultipartUploadRequestPart } from '../models/ApiCompleteMultipartUploadRequestPart';
import { ApiCompleteMultipartUploadResponse } from '../models/ApiCompleteMultipartUploadResponse';
import { ApiConsolidatedTdh } from '../models/ApiConsolidatedTdh';
import { ApiCreateDropPart } from '../models/ApiCreateDropPart';
import { ApiCreateDropRequest } from '../models/ApiCreateDropRequest';
import { ApiCreateGroup } from '../models/ApiCreateGroup';
import { ApiCreateGroupDescription } from '../models/ApiCreateGroupDescription';
import { ApiCreateMediaUploadUrlRequest } from '../models/ApiCreateMediaUploadUrlRequest';
import { ApiCreateMediaUrlResponse } from '../models/ApiCreateMediaUrlResponse';
import { ApiCreateMentionedWave } from '../models/ApiCreateMentionedWave';
import { ApiCreateNewProfileProxy } from '../models/ApiCreateNewProfileProxy';
import { ApiCreateNewProfileProxyAllocateCicAction } from '../models/ApiCreateNewProfileProxyAllocateCicAction';
import { ApiCreateNewProfileProxyAllocateRepAction } from '../models/ApiCreateNewProfileProxyAllocateRepAction';
import { ApiCreateNewProfileProxyCreateWaveAction } from '../models/ApiCreateNewProfileProxyCreateWaveAction';
import { ApiCreateNewProfileProxyCreateWaveParticipationDropAction } from '../models/ApiCreateNewProfileProxyCreateWaveParticipationDropAction';
import { ApiCreateNewProfileProxyRateWaveDropAction } from '../models/ApiCreateNewProfileProxyRateWaveDropAction';
import { ApiCreateNewProfileProxyReadWaveAction } from '../models/ApiCreateNewProfileProxyReadWaveAction';
import { ApiCreateNewWave } from '../models/ApiCreateNewWave';
import { ApiCreateNewWaveChatConfig } from '../models/ApiCreateNewWaveChatConfig';
import { ApiCreateNewWaveParticipationConfig } from '../models/ApiCreateNewWaveParticipationConfig';
import { ApiCreateNewWaveScope } from '../models/ApiCreateNewWaveScope';
import { ApiCreateNewWaveVisibilityConfig } from '../models/ApiCreateNewWaveVisibilityConfig';
import { ApiCreateNewWaveVotingConfig } from '../models/ApiCreateNewWaveVotingConfig';
import { ApiCreateOrUpdateProfileRequest } from '../models/ApiCreateOrUpdateProfileRequest';
import { ApiCreateWaveConfig } from '../models/ApiCreateWaveConfig';
import { ApiCreateWaveDropRequest } from '../models/ApiCreateWaveDropRequest';
import { ApiCreateWaveOutcome } from '../models/ApiCreateWaveOutcome';
import { ApiCreateWaveOutcomeDistributionItem } from '../models/ApiCreateWaveOutcomeDistributionItem';
import { ApiDrop } from '../models/ApiDrop';
import { ApiDropAndDropVote } from '../models/ApiDropAndDropVote';
import { ApiDropBoost } from '../models/ApiDropBoost';
import { ApiDropBoostsPage } from '../models/ApiDropBoostsPage';
import { ApiDropContextProfileContext } from '../models/ApiDropContextProfileContext';
import { ApiDropId } from '../models/ApiDropId';
import { ApiDropMedia } from '../models/ApiDropMedia';
import { ApiDropMentionedUser } from '../models/ApiDropMentionedUser';
import { ApiDropMetadata } from '../models/ApiDropMetadata';
import { ApiDropNftLink } from '../models/ApiDropNftLink';
import { ApiDropPart } from '../models/ApiDropPart';
import { ApiDropRater } from '../models/ApiDropRater';
import { ApiDropRatingRequest } from '../models/ApiDropRatingRequest';
import { ApiDropReaction } from '../models/ApiDropReaction';
import { ApiDropReferencedNFT } from '../models/ApiDropReferencedNFT';
import { ApiDropSearchStrategy } from '../models/ApiDropSearchStrategy';
import { ApiDropSubscriptionActions } from '../models/ApiDropSubscriptionActions';
import { ApiDropSubscriptionTargetAction } from '../models/ApiDropSubscriptionTargetAction';
import { ApiDropTraceItem } from '../models/ApiDropTraceItem';
import { ApiDropType } from '../models/ApiDropType';
import { ApiDropVote } from '../models/ApiDropVote';
import { ApiDropWinningContext } from '../models/ApiDropWinningContext';
import { ApiDropWithoutWave } from '../models/ApiDropWithoutWave';
import { ApiDropWithoutWavesPageWithoutCount } from '../models/ApiDropWithoutWavesPageWithoutCount';
import { ApiDropsLeaderboardPage } from '../models/ApiDropsLeaderboardPage';
import { ApiDropsPage } from '../models/ApiDropsPage';
import { ApiFeedItem } from '../models/ApiFeedItem';
import { ApiFeedItemType } from '../models/ApiFeedItemType';
import { ApiGroup } from '../models/ApiGroup';
import { ApiGroupCicFilter } from '../models/ApiGroupCicFilter';
import { ApiGroupDescription } from '../models/ApiGroupDescription';
import { ApiGroupFilterDirection } from '../models/ApiGroupFilterDirection';
import { ApiGroupFull } from '../models/ApiGroupFull';
import { ApiGroupLevelFilter } from '../models/ApiGroupLevelFilter';
import { ApiGroupOwnsNft } from '../models/ApiGroupOwnsNft';
import { ApiGroupRepFilter } from '../models/ApiGroupRepFilter';
import { ApiGroupTdhFilter } from '../models/ApiGroupTdhFilter';
import { ApiGroupTdhInclusionStrategy } from '../models/ApiGroupTdhInclusionStrategy';
import { ApiIdentity } from '../models/ApiIdentity';
import { ApiIdentityAndSubscriptionActions } from '../models/ApiIdentityAndSubscriptionActions';
import { ApiIdentitySubscriptionActions } from '../models/ApiIdentitySubscriptionActions';
import { ApiIdentitySubscriptionTargetAction } from '../models/ApiIdentitySubscriptionTargetAction';
import { ApiIdentitySubscriptionTargetType } from '../models/ApiIdentitySubscriptionTargetType';
import { ApiIncomingIdentitySubscriptionsPage } from '../models/ApiIncomingIdentitySubscriptionsPage';
import { ApiIntRange } from '../models/ApiIntRange';
import { ApiLightDrop } from '../models/ApiLightDrop';
import { ApiLoginRequest } from '../models/ApiLoginRequest';
import { ApiLoginResponse } from '../models/ApiLoginResponse';
import { ApiMarkDropUnreadResponse } from '../models/ApiMarkDropUnreadResponse';
import { ApiMemesMintStat } from '../models/ApiMemesMintStat';
import { ApiMemesMintStatsPage } from '../models/ApiMemesMintStatsPage';
import { ApiMemesMintStatsTotals } from '../models/ApiMemesMintStatsTotals';
import { ApiMemesMintStatsYearly } from '../models/ApiMemesMintStatsYearly';
import { ApiMentionedWave } from '../models/ApiMentionedWave';
import { ApiMintMetrics } from '../models/ApiMintMetrics';
import { ApiMintMetricsPage } from '../models/ApiMintMetricsPage';
import { ApiNft } from '../models/ApiNft';
import { ApiNftLinkData } from '../models/ApiNftLinkData';
import { ApiNftLinkMediaPreview } from '../models/ApiNftLinkMediaPreview';
import { ApiNftLinkResponse } from '../models/ApiNftLinkResponse';
import { ApiNftMedia } from '../models/ApiNftMedia';
import { ApiNftOwner } from '../models/ApiNftOwner';
import { ApiNftOwnerPage } from '../models/ApiNftOwnerPage';
import { ApiNftsPage } from '../models/ApiNftsPage';
import { ApiNonceResponse } from '../models/ApiNonceResponse';
import { ApiNotification } from '../models/ApiNotification';
import { ApiNotificationCause } from '../models/ApiNotificationCause';
import { ApiNotificationsResponse } from '../models/ApiNotificationsResponse';
import { ApiOutgoingIdentitySubscriptionsPage } from '../models/ApiOutgoingIdentitySubscriptionsPage';
import { ApiOwnerBalance } from '../models/ApiOwnerBalance';
import { ApiOwnerBalanceMemes } from '../models/ApiOwnerBalanceMemes';
import { ApiOwnerBalancePage } from '../models/ApiOwnerBalancePage';
import { ApiPageBase } from '../models/ApiPageBase';
import { ApiPageSortDirection } from '../models/ApiPageSortDirection';
import { ApiPageWithNextUriBase } from '../models/ApiPageWithNextUriBase';
import { ApiPageWithoutCount } from '../models/ApiPageWithoutCount';
import { ApiProfileClassification } from '../models/ApiProfileClassification';
import { ApiProfileMin } from '../models/ApiProfileMin';
import { ApiProfileMinsPage } from '../models/ApiProfileMinsPage';
import { ApiProfileProxy } from '../models/ApiProfileProxy';
import { ApiProfileProxyAction } from '../models/ApiProfileProxyAction';
import { ApiProfileProxyActionType } from '../models/ApiProfileProxyActionType';
import { ApiPushNotificationDevice } from '../models/ApiPushNotificationDevice';
import { ApiPushNotificationSettings } from '../models/ApiPushNotificationSettings';
import { ApiPushNotificationSettingsUpdate } from '../models/ApiPushNotificationSettingsUpdate';
import { ApiQuotedDrop } from '../models/ApiQuotedDrop';
import { ApiQuotedDropResponse } from '../models/ApiQuotedDropResponse';
import { ApiRateMatter } from '../models/ApiRateMatter';
import { ApiRatingWithProfileInfoAndLevel } from '../models/ApiRatingWithProfileInfoAndLevel';
import { ApiRatingWithProfileInfoAndLevelPage } from '../models/ApiRatingWithProfileInfoAndLevelPage';
import { ApiRedeemRefreshTokenRequest } from '../models/ApiRedeemRefreshTokenRequest';
import { ApiRedeemRefreshTokenResponse } from '../models/ApiRedeemRefreshTokenResponse';
import { ApiRegisterPushNotificationTokenRequest } from '../models/ApiRegisterPushNotificationTokenRequest';
import { ApiRepCategoriesPage } from '../models/ApiRepCategoriesPage';
import { ApiRepCategory } from '../models/ApiRepCategory';
import { ApiRepContributor } from '../models/ApiRepContributor';
import { ApiRepContributorsPage } from '../models/ApiRepContributorsPage';
import { ApiRepDirection } from '../models/ApiRepDirection';
import { ApiRepOverview } from '../models/ApiRepOverview';
import { ApiRepRating } from '../models/ApiRepRating';
import { ApiReplyToDrop } from '../models/ApiReplyToDrop';
import { ApiReplyToDropResponse } from '../models/ApiReplyToDropResponse';
import { ApiSeizeSettings } from '../models/ApiSeizeSettings';
import { ApiStartMultipartMediaUploadResponse } from '../models/ApiStartMultipartMediaUploadResponse';
import { ApiTargetAndSubscriptionActions } from '../models/ApiTargetAndSubscriptionActions';
import { ApiTdhEdition } from '../models/ApiTdhEdition';
import { ApiTdhEditionsPage } from '../models/ApiTdhEditionsPage';
import { ApiTokenTdh } from '../models/ApiTokenTdh';
import { ApiTokenTdhRank } from '../models/ApiTokenTdhRank';
import { ApiTransaction } from '../models/ApiTransaction';
import { ApiTransactionPage } from '../models/ApiTransactionPage';
import { ApiUpcomingMemeSubscriptionStatus } from '../models/ApiUpcomingMemeSubscriptionStatus';
import { ApiUpdateDropRequest } from '../models/ApiUpdateDropRequest';
import { ApiUpdateProxyActionRequest } from '../models/ApiUpdateProxyActionRequest';
import { ApiUpdateWaveDecisionPause } from '../models/ApiUpdateWaveDecisionPause';
import { ApiUpdateWaveRequest } from '../models/ApiUpdateWaveRequest';
import { ApiUploadItem } from '../models/ApiUploadItem';
import { ApiUploadPartOfMultipartUploadRequest } from '../models/ApiUploadPartOfMultipartUploadRequest';
import { ApiUploadPartOfMultipartUploadResponse } from '../models/ApiUploadPartOfMultipartUploadResponse';
import { ApiUploadsPage } from '../models/ApiUploadsPage';
import { ApiWallet } from '../models/ApiWallet';
import { ApiWave } from '../models/ApiWave';
import { ApiWaveChatConfig } from '../models/ApiWaveChatConfig';
import { ApiWaveConfig } from '../models/ApiWaveConfig';
import { ApiWaveContributorOverview } from '../models/ApiWaveContributorOverview';
import { ApiWaveCreditScope } from '../models/ApiWaveCreditScope';
import { ApiWaveCreditType } from '../models/ApiWaveCreditType';
import { ApiWaveCurationGroup } from '../models/ApiWaveCurationGroup';
import { ApiWaveCurationGroupRequest } from '../models/ApiWaveCurationGroupRequest';
import { ApiWaveDecision } from '../models/ApiWaveDecision';
import { ApiWaveDecisionAward } from '../models/ApiWaveDecisionAward';
import { ApiWaveDecisionPause } from '../models/ApiWaveDecisionPause';
import { ApiWaveDecisionWinner } from '../models/ApiWaveDecisionWinner';
import { ApiWaveDecisionsPage } from '../models/ApiWaveDecisionsPage';
import { ApiWaveDecisionsStrategy } from '../models/ApiWaveDecisionsStrategy';
import { ApiWaveDropsFeed } from '../models/ApiWaveDropsFeed';
import { ApiWaveLog } from '../models/ApiWaveLog';
import { ApiWaveMetadataType } from '../models/ApiWaveMetadataType';
import { ApiWaveMetrics } from '../models/ApiWaveMetrics';
import { ApiWaveMin } from '../models/ApiWaveMin';
import { ApiWaveOutcome } from '../models/ApiWaveOutcome';
import { ApiWaveOutcomeCredit } from '../models/ApiWaveOutcomeCredit';
import { ApiWaveOutcomeDistributionItem } from '../models/ApiWaveOutcomeDistributionItem';
import { ApiWaveOutcomeDistributionItemsPage } from '../models/ApiWaveOutcomeDistributionItemsPage';
import { ApiWaveOutcomeSubType } from '../models/ApiWaveOutcomeSubType';
import { ApiWaveOutcomeType } from '../models/ApiWaveOutcomeType';
import { ApiWaveOutcomesPage } from '../models/ApiWaveOutcomesPage';
import { ApiWaveParticipationConfig } from '../models/ApiWaveParticipationConfig';
import { ApiWaveParticipationRequirement } from '../models/ApiWaveParticipationRequirement';
import { ApiWaveRequiredMetadata } from '../models/ApiWaveRequiredMetadata';
import { ApiWaveScope } from '../models/ApiWaveScope';
import { ApiWaveSubscriptionActions } from '../models/ApiWaveSubscriptionActions';
import { ApiWaveSubscriptionTargetAction } from '../models/ApiWaveSubscriptionTargetAction';
import { ApiWaveType } from '../models/ApiWaveType';
import { ApiWaveVisibilityConfig } from '../models/ApiWaveVisibilityConfig';
import { ApiWaveVoter } from '../models/ApiWaveVoter';
import { ApiWaveVotersPage } from '../models/ApiWaveVotersPage';
import { ApiWaveVotingConfig } from '../models/ApiWaveVotingConfig';
import { ApiWavesOverviewType } from '../models/ApiWavesOverviewType';
import { ApiWavesPinFilter } from '../models/ApiWavesPinFilter';
import { ApiXTdhCollection } from '../models/ApiXTdhCollection';
import { ApiXTdhCollectionsPage } from '../models/ApiXTdhCollectionsPage';
import { ApiXTdhContribution } from '../models/ApiXTdhContribution';
import { ApiXTdhContributionsPage } from '../models/ApiXTdhContributionsPage';
import { ApiXTdhCreateGrant } from '../models/ApiXTdhCreateGrant';
import { ApiXTdhGlobalStats } from '../models/ApiXTdhGlobalStats';
import { ApiXTdhGrant } from '../models/ApiXTdhGrant';
import { ApiXTdhGrantStatus } from '../models/ApiXTdhGrantStatus';
import { ApiXTdhGrantTargetChain } from '../models/ApiXTdhGrantTargetChain';
import { ApiXTdhGrantToken } from '../models/ApiXTdhGrantToken';
import { ApiXTdhGrantTokensPage } from '../models/ApiXTdhGrantTokensPage';
import { ApiXTdhGrantUpdateRequest } from '../models/ApiXTdhGrantUpdateRequest';
import { ApiXTdhGrantee } from '../models/ApiXTdhGrantee';
import { ApiXTdhGranteesPage } from '../models/ApiXTdhGranteesPage';
import { ApiXTdhGrantsPage } from '../models/ApiXTdhGrantsPage';
import { ApiXTdhStats } from '../models/ApiXTdhStats';
import { ApiXTdhToken } from '../models/ApiXTdhToken';
import { ApiXTdhTokensPage } from '../models/ApiXTdhTokensPage';
import { CreateDirectMessageWaveRequest } from '../models/CreateDirectMessageWaveRequest';
import { DistributionNormalized } from '../models/DistributionNormalized';
import { DistributionNormalizedPage } from '../models/DistributionNormalizedPage';
import { DistributionOverview } from '../models/DistributionOverview';
import { DistributionPhasesPage } from '../models/DistributionPhasesPage';
import { DistributionPhoto } from '../models/DistributionPhoto';
import { DistributionPhotoCompleteRequest } from '../models/DistributionPhotoCompleteRequest';
import { DistributionPhotoCompleteRequestPhoto } from '../models/DistributionPhotoCompleteRequestPhoto';
import { DistributionPhotoCompleteResponse } from '../models/DistributionPhotoCompleteResponse';
import { DistributionPhotosPage } from '../models/DistributionPhotosPage';
import { GetWaveSubscription200Response } from '../models/GetWaveSubscription200Response';
import { NFTFinalSubscription } from '../models/NFTFinalSubscription';
import { NFTFinalSubscriptionUpload } from '../models/NFTFinalSubscriptionUpload';
import { NFTFinalSubscriptionUploadPage } from '../models/NFTFinalSubscriptionUploadPage';
import { NFTSubscription } from '../models/NFTSubscription';
import { RedeemedSubscription } from '../models/RedeemedSubscription';
import { RedeemedSubscriptionCounts } from '../models/RedeemedSubscriptionCounts';
import { RedeemedSubscriptionCountsPage } from '../models/RedeemedSubscriptionCountsPage';
import { RedeemedSubscriptionPage } from '../models/RedeemedSubscriptionPage';
import { SubscribeAllEditionsResponse } from '../models/SubscribeAllEditionsResponse';
import { SubscriptionCountResponse } from '../models/SubscriptionCountResponse';
import { SubscriptionCounts } from '../models/SubscriptionCounts';
import { SubscriptionDetails } from '../models/SubscriptionDetails';
import { SubscriptionLog } from '../models/SubscriptionLog';
import { SubscriptionLogPage } from '../models/SubscriptionLogPage';
import { SubscriptionModeResponse } from '../models/SubscriptionModeResponse';
import { SubscriptionResponse } from '../models/SubscriptionResponse';
import { SubscriptionTopUp } from '../models/SubscriptionTopUp';
import { SubscriptionTopUpPage } from '../models/SubscriptionTopUpPage';
import { UpdateSubscribeAllEditionsRequest } from '../models/UpdateSubscribeAllEditionsRequest';
import { UpdateSubscriptionCountRequest } from '../models/UpdateSubscriptionCountRequest';
import { UpdateSubscriptionModeRequest } from '../models/UpdateSubscriptionModeRequest';
import { UpdateSubscriptionRequest } from '../models/UpdateSubscriptionRequest';

import { ObservableAggregatedActivityApi } from "./ObservableAPI";
import { AggregatedActivityApiRequestFactory, AggregatedActivityApiResponseProcessor} from "../apis/AggregatedActivityApi";

export interface AggregatedActivityApiGetAggregatedActivityRequest {
    /**
     * Default is 50
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof AggregatedActivityApigetAggregatedActivity
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof AggregatedActivityApigetAggregatedActivity
     */
    page?: number
    /**
     * Default is ASC; applied to id sort
     * Defaults to: undefined
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof AggregatedActivityApigetAggregatedActivity
     */
    sortDirection?: 'ASC' | 'DESC'
    /**
     * Default is primary_purchases_count
     * Defaults to: undefined
     * @type &#39;primary_purchases_count&#39; | &#39;primary_purchases_value&#39; | &#39;secondary_purchases_count&#39; | &#39;secondary_purchases_value&#39; | &#39;sales_count&#39; | &#39;sales_value&#39; | &#39;transfers_in&#39; | &#39;transfers_out&#39; | &#39;airdrops&#39; | &#39;burns&#39;
     * @memberof AggregatedActivityApigetAggregatedActivity
     */
    sort?: 'primary_purchases_count' | 'primary_purchases_value' | 'secondary_purchases_count' | 'secondary_purchases_value' | 'sales_count' | 'sales_value' | 'transfers_in' | 'transfers_out' | 'airdrops' | 'burns'
    /**
     * Search by wallet address, profile handle or ENS
     * Defaults to: undefined
     * @type string
     * @memberof AggregatedActivityApigetAggregatedActivity
     */
    search?: string
    /**
     * Filter by content
     * Defaults to: undefined
     * @type &#39;Memes&#39; | &#39;Gradient&#39; | &#39;MemeLab&#39; | &#39;NextGen&#39;
     * @memberof AggregatedActivityApigetAggregatedActivity
     */
    content?: 'Memes' | 'Gradient' | 'MemeLab' | 'NextGen'
    /**
     * Filter by season
     * Defaults to: undefined
     * @type number
     * @memberof AggregatedActivityApigetAggregatedActivity
     */
    season?: number
    /**
     * Filter by collector type
     * Defaults to: undefined
     * @type &#39;All&#39; | &#39;Memes&#39; | &#39;Meme SZN Set&#39; | &#39;Genesis Set&#39; | &#39;Gradient&#39; | &#39;MemeLab&#39; | &#39;NextGen&#39;
     * @memberof AggregatedActivityApigetAggregatedActivity
     */
    collector?: 'All' | 'Memes' | 'Meme SZN Set' | 'Genesis Set' | 'Gradient' | 'MemeLab' | 'NextGen'
}

export interface AggregatedActivityApiGetAggregatedActivityByConsolidationKeyRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AggregatedActivityApigetAggregatedActivityByConsolidationKey
     */
    consolidationKey: string
}

export interface AggregatedActivityApiGetMemesAggregatedActivityByConsolidationKeyRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AggregatedActivityApigetMemesAggregatedActivityByConsolidationKey
     */
    consolidationKey: string
}

export class ObjectAggregatedActivityApi {
    private api: ObservableAggregatedActivityApi

    public constructor(configuration: Configuration, requestFactory?: AggregatedActivityApiRequestFactory, responseProcessor?: AggregatedActivityApiResponseProcessor) {
        this.api = new ObservableAggregatedActivityApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get aggregated activity
     * @param param the request object
     */
    public getAggregatedActivityWithHttpInfo(param: AggregatedActivityApiGetAggregatedActivityRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiAggregatedActivityPage>>> {
        return this.api.getAggregatedActivityWithHttpInfo(param.pageSize, param.page, param.sortDirection, param.sort, param.search, param.content, param.season, param.collector,  options).toPromise();
    }

    /**
     * Get aggregated activity
     * @param param the request object
     */
    public getAggregatedActivity(param: AggregatedActivityApiGetAggregatedActivityRequest = {}, options?: Configuration): Promise<Array<ApiAggregatedActivityPage>> {
        return this.api.getAggregatedActivity(param.pageSize, param.page, param.sortDirection, param.sort, param.search, param.content, param.season, param.collector,  options).toPromise();
    }

    /**
     * Get aggregated activity by consolidation key.
     * @param param the request object
     */
    public getAggregatedActivityByConsolidationKeyWithHttpInfo(param: AggregatedActivityApiGetAggregatedActivityByConsolidationKeyRequest, options?: Configuration): Promise<HttpInfo<ApiAggregatedActivity>> {
        return this.api.getAggregatedActivityByConsolidationKeyWithHttpInfo(param.consolidationKey,  options).toPromise();
    }

    /**
     * Get aggregated activity by consolidation key.
     * @param param the request object
     */
    public getAggregatedActivityByConsolidationKey(param: AggregatedActivityApiGetAggregatedActivityByConsolidationKeyRequest, options?: Configuration): Promise<ApiAggregatedActivity> {
        return this.api.getAggregatedActivityByConsolidationKey(param.consolidationKey,  options).toPromise();
    }

    /**
     * Get memes aggregated activity by consolidation key per season.
     * @param param the request object
     */
    public getMemesAggregatedActivityByConsolidationKeyWithHttpInfo(param: AggregatedActivityApiGetMemesAggregatedActivityByConsolidationKeyRequest, options?: Configuration): Promise<HttpInfo<Array<ApiAggregatedActivityMemes>>> {
        return this.api.getMemesAggregatedActivityByConsolidationKeyWithHttpInfo(param.consolidationKey,  options).toPromise();
    }

    /**
     * Get memes aggregated activity by consolidation key per season.
     * @param param the request object
     */
    public getMemesAggregatedActivityByConsolidationKey(param: AggregatedActivityApiGetMemesAggregatedActivityByConsolidationKeyRequest, options?: Configuration): Promise<Array<ApiAggregatedActivityMemes>> {
        return this.api.getMemesAggregatedActivityByConsolidationKey(param.consolidationKey,  options).toPromise();
    }

}

import { ObservableAuthenticationApi } from "./ObservableAPI";
import { AuthenticationApiRequestFactory, AuthenticationApiResponseProcessor} from "../apis/AuthenticationApi";

export interface AuthenticationApiGetAuthTokenRequest {
    /**
     * Your wallet address
     * Defaults to: undefined
     * @type string
     * @memberof AuthenticationApigetAuthToken
     */
    signerAddress: string
    /**
     * 
     * @type ApiLoginRequest
     * @memberof AuthenticationApigetAuthToken
     */
    apiLoginRequest: ApiLoginRequest
}

export interface AuthenticationApiGetNonceRequest {
    /**
     * Your wallet address
     * Defaults to: undefined
     * @type string
     * @memberof AuthenticationApigetNonce
     */
    signerAddress: string
    /**
     * If true, the nonce will be shorter and easier to sign. Default is false.
     * Defaults to: undefined
     * @type boolean
     * @memberof AuthenticationApigetNonce
     */
    shortNonce?: boolean
}

export interface AuthenticationApiRedeemRefreshTokenRequest {
    /**
     * 
     * @type ApiRedeemRefreshTokenRequest
     * @memberof AuthenticationApiredeemRefreshToken
     */
    apiRedeemRefreshTokenRequest: ApiRedeemRefreshTokenRequest
}

export class ObjectAuthenticationApi {
    private api: ObservableAuthenticationApi

    public constructor(configuration: Configuration, requestFactory?: AuthenticationApiRequestFactory, responseProcessor?: AuthenticationApiResponseProcessor) {
        this.api = new ObservableAuthenticationApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Authenticate and get JWT token
     * @param param the request object
     */
    public getAuthTokenWithHttpInfo(param: AuthenticationApiGetAuthTokenRequest, options?: Configuration): Promise<HttpInfo<ApiLoginResponse>> {
        return this.api.getAuthTokenWithHttpInfo(param.signerAddress, param.apiLoginRequest,  options).toPromise();
    }

    /**
     * Authenticate and get JWT token
     * @param param the request object
     */
    public getAuthToken(param: AuthenticationApiGetAuthTokenRequest, options?: Configuration): Promise<ApiLoginResponse> {
        return this.api.getAuthToken(param.signerAddress, param.apiLoginRequest,  options).toPromise();
    }

    /**
     * Get a message to sign with your web3 wallet
     * @param param the request object
     */
    public getNonceWithHttpInfo(param: AuthenticationApiGetNonceRequest, options?: Configuration): Promise<HttpInfo<ApiNonceResponse>> {
        return this.api.getNonceWithHttpInfo(param.signerAddress, param.shortNonce,  options).toPromise();
    }

    /**
     * Get a message to sign with your web3 wallet
     * @param param the request object
     */
    public getNonce(param: AuthenticationApiGetNonceRequest, options?: Configuration): Promise<ApiNonceResponse> {
        return this.api.getNonce(param.signerAddress, param.shortNonce,  options).toPromise();
    }

    /**
     * Redeem refresh token
     * @param param the request object
     */
    public redeemRefreshTokenWithHttpInfo(param: AuthenticationApiRedeemRefreshTokenRequest, options?: Configuration): Promise<HttpInfo<ApiRedeemRefreshTokenResponse>> {
        return this.api.redeemRefreshTokenWithHttpInfo(param.apiRedeemRefreshTokenRequest,  options).toPromise();
    }

    /**
     * Redeem refresh token
     * @param param the request object
     */
    public redeemRefreshToken(param: AuthenticationApiRedeemRefreshTokenRequest, options?: Configuration): Promise<ApiRedeemRefreshTokenResponse> {
        return this.api.redeemRefreshToken(param.apiRedeemRefreshTokenRequest,  options).toPromise();
    }

}

import { ObservableCollectedStatsApi } from "./ObservableAPI";
import { CollectedStatsApiRequestFactory, CollectedStatsApiResponseProcessor} from "../apis/CollectedStatsApi";

export interface CollectedStatsApiGetCollectedStatsRequest {
    /**
     * Profile handle, wallet address, or ENS name
     * Defaults to: undefined
     * @type string
     * @memberof CollectedStatsApigetCollectedStats
     */
    identityKey: string
}

export class ObjectCollectedStatsApi {
    private api: ObservableCollectedStatsApi

    public constructor(configuration: Configuration, requestFactory?: CollectedStatsApiRequestFactory, responseProcessor?: CollectedStatsApiResponseProcessor) {
        this.api = new ObservableCollectedStatsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get consolidated collection stats for an identity
     * @param param the request object
     */
    public getCollectedStatsWithHttpInfo(param: CollectedStatsApiGetCollectedStatsRequest, options?: Configuration): Promise<HttpInfo<ApiCollectedStats>> {
        return this.api.getCollectedStatsWithHttpInfo(param.identityKey,  options).toPromise();
    }

    /**
     * Get consolidated collection stats for an identity
     * @param param the request object
     */
    public getCollectedStats(param: CollectedStatsApiGetCollectedStatsRequest, options?: Configuration): Promise<ApiCollectedStats> {
        return this.api.getCollectedStats(param.identityKey,  options).toPromise();
    }

}

import { ObservableCommunityMembersApi } from "./ObservableAPI";
import { CommunityMembersApiRequestFactory, CommunityMembersApiResponseProcessor} from "../apis/CommunityMembersApi";

export interface CommunityMembersApiGetCommunityMembersRequest {
    /**
     * Return only profile owners?
     * Defaults to: undefined
     * @type boolean
     * @memberof CommunityMembersApigetCommunityMembers
     */
    onlyProfileOwners?: boolean
    /**
     * Search param
     * Defaults to: undefined
     * @type string
     * @memberof CommunityMembersApigetCommunityMembers
     */
    param?: string
}

export interface CommunityMembersApiGetTopCommunityMembersRequest {
    /**
     * Default is 50
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof CommunityMembersApigetTopCommunityMembers
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof CommunityMembersApigetTopCommunityMembers
     */
    page?: number
    /**
     * Default is DESC
     * Defaults to: undefined
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof CommunityMembersApigetTopCommunityMembers
     */
    sortDirection?: 'ASC' | 'DESC'
    /**
     * Default is level
     * Defaults to: undefined
     * @type ApiCommunityMembersSortOption
     * @memberof CommunityMembersApigetTopCommunityMembers
     */
    sort?: ApiCommunityMembersSortOption
    /**
     * Filter by group ID
     * Defaults to: undefined
     * @type string
     * @memberof CommunityMembersApigetTopCommunityMembers
     */
    groupId?: string
}

export class ObjectCommunityMembersApi {
    private api: ObservableCommunityMembersApi

    public constructor(configuration: Configuration, requestFactory?: CommunityMembersApiRequestFactory, responseProcessor?: CommunityMembersApiResponseProcessor) {
        this.api = new ObservableCommunityMembersApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get community members.
     * @param param the request object
     */
    public getCommunityMembersWithHttpInfo(param: CommunityMembersApiGetCommunityMembersRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiCommunityMemberMinimal>>> {
        return this.api.getCommunityMembersWithHttpInfo(param.onlyProfileOwners, param.param,  options).toPromise();
    }

    /**
     * Get community members.
     * @param param the request object
     */
    public getCommunityMembers(param: CommunityMembersApiGetCommunityMembersRequest = {}, options?: Configuration): Promise<Array<ApiCommunityMemberMinimal>> {
        return this.api.getCommunityMembers(param.onlyProfileOwners, param.param,  options).toPromise();
    }

    /**
     * Get top community members with pagination and sorting.
     * @param param the request object
     */
    public getTopCommunityMembersWithHttpInfo(param: CommunityMembersApiGetTopCommunityMembersRequest = {}, options?: Configuration): Promise<HttpInfo<ApiCommunityMembersPage>> {
        return this.api.getTopCommunityMembersWithHttpInfo(param.pageSize, param.page, param.sortDirection, param.sort, param.groupId,  options).toPromise();
    }

    /**
     * Get top community members with pagination and sorting.
     * @param param the request object
     */
    public getTopCommunityMembers(param: CommunityMembersApiGetTopCommunityMembersRequest = {}, options?: Configuration): Promise<ApiCommunityMembersPage> {
        return this.api.getTopCommunityMembers(param.pageSize, param.page, param.sortDirection, param.sort, param.groupId,  options).toPromise();
    }

}

import { ObservableCommunityMetricsApi } from "./ObservableAPI";
import { CommunityMetricsApiRequestFactory, CommunityMetricsApiResponseProcessor} from "../apis/CommunityMetricsApi";

export interface CommunityMetricsApiGetCommunityMetricsRequest {
    /**
     * Metrics interval
     * Defaults to: undefined
     * @type &#39;DAY&#39; | &#39;WEEK&#39;
     * @memberof CommunityMetricsApigetCommunityMetrics
     */
    interval: 'DAY' | 'WEEK'
}

export interface CommunityMetricsApiGetCommunityMetricsSeriesRequest {
    /**
     * Unix millis timestamp for start of series.
     * Defaults to: undefined
     * @type number
     * @memberof CommunityMetricsApigetCommunityMetricsSeries
     */
    since: number
    /**
     * Unix millis timestamp for end of series.
     * Defaults to: undefined
     * @type number
     * @memberof CommunityMetricsApigetCommunityMetricsSeries
     */
    to: number
}

export interface CommunityMetricsApiGetCommunityMintMetricsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof CommunityMetricsApigetCommunityMintMetrics
     */
    pageSize?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof CommunityMetricsApigetCommunityMintMetrics
     */
    page?: number
    /**
     * 
     * Defaults to: undefined
     * @type ApiPageSortDirection
     * @memberof CommunityMetricsApigetCommunityMintMetrics
     */
    sortDirection?: ApiPageSortDirection
    /**
     * 
     * Defaults to: undefined
     * @type &#39;mint_time&#39;
     * @memberof CommunityMetricsApigetCommunityMintMetrics
     */
    sort?: 'mint_time'
}

export class ObjectCommunityMetricsApi {
    private api: ObservableCommunityMetricsApi

    public constructor(configuration: Configuration, requestFactory?: CommunityMetricsApiRequestFactory, responseProcessor?: CommunityMetricsApiResponseProcessor) {
        this.api = new ObservableCommunityMetricsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get community metrics.
     * @param param the request object
     */
    public getCommunityMetricsWithHttpInfo(param: CommunityMetricsApiGetCommunityMetricsRequest, options?: Configuration): Promise<HttpInfo<ApiCommunityMetrics>> {
        return this.api.getCommunityMetricsWithHttpInfo(param.interval,  options).toPromise();
    }

    /**
     * Get community metrics.
     * @param param the request object
     */
    public getCommunityMetrics(param: CommunityMetricsApiGetCommunityMetricsRequest, options?: Configuration): Promise<ApiCommunityMetrics> {
        return this.api.getCommunityMetrics(param.interval,  options).toPromise();
    }

    /**
     * Get community metrics series.
     * @param param the request object
     */
    public getCommunityMetricsSeriesWithHttpInfo(param: CommunityMetricsApiGetCommunityMetricsSeriesRequest, options?: Configuration): Promise<HttpInfo<ApiCommunityMetricsSeries>> {
        return this.api.getCommunityMetricsSeriesWithHttpInfo(param.since, param.to,  options).toPromise();
    }

    /**
     * Get community metrics series.
     * @param param the request object
     */
    public getCommunityMetricsSeries(param: CommunityMetricsApiGetCommunityMetricsSeriesRequest, options?: Configuration): Promise<ApiCommunityMetricsSeries> {
        return this.api.getCommunityMetricsSeries(param.since, param.to,  options).toPromise();
    }

    /**
     * Get community mint metrics.
     * @param param the request object
     */
    public getCommunityMintMetricsWithHttpInfo(param: CommunityMetricsApiGetCommunityMintMetricsRequest = {}, options?: Configuration): Promise<HttpInfo<ApiMintMetricsPage>> {
        return this.api.getCommunityMintMetricsWithHttpInfo(param.pageSize, param.page, param.sortDirection, param.sort,  options).toPromise();
    }

    /**
     * Get community mint metrics.
     * @param param the request object
     */
    public getCommunityMintMetrics(param: CommunityMetricsApiGetCommunityMintMetricsRequest = {}, options?: Configuration): Promise<ApiMintMetricsPage> {
        return this.api.getCommunityMintMetrics(param.pageSize, param.page, param.sortDirection, param.sort,  options).toPromise();
    }

}

import { ObservableDistributionsApi } from "./ObservableAPI";
import { DistributionsApiRequestFactory, DistributionsApiResponseProcessor} from "../apis/DistributionsApi";

export interface DistributionsApiCompleteDistributionPhotoMultipartUploadRequest {
    /**
     * Contract address
     * Defaults to: undefined
     * @type string
     * @memberof DistributionsApicompleteDistributionPhotoMultipartUpload
     */
    contract: string
    /**
     * NFT ID
     * Defaults to: undefined
     * @type number
     * @memberof DistributionsApicompleteDistributionPhotoMultipartUpload
     */
    nftId: number
    /**
     * 
     * @type ApiCompleteMultipartUploadRequest
     * @memberof DistributionsApicompleteDistributionPhotoMultipartUpload
     */
    apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest
}

export interface DistributionsApiCompleteDistributionPhotosUploadRequest {
    /**
     * Contract address
     * Defaults to: undefined
     * @type string
     * @memberof DistributionsApicompleteDistributionPhotosUpload
     */
    contract: string
    /**
     * NFT ID
     * Defaults to: undefined
     * @type number
     * @memberof DistributionsApicompleteDistributionPhotosUpload
     */
    nftId: number
    /**
     * 
     * @type DistributionPhotoCompleteRequest
     * @memberof DistributionsApicompleteDistributionPhotosUpload
     */
    distributionPhotoCompleteRequest: DistributionPhotoCompleteRequest
}

export interface DistributionsApiCreateDistributionPhotoMultipartUploadRequest {
    /**
     * Contract address
     * Defaults to: undefined
     * @type string
     * @memberof DistributionsApicreateDistributionPhotoMultipartUpload
     */
    contract: string
    /**
     * NFT ID
     * Defaults to: undefined
     * @type number
     * @memberof DistributionsApicreateDistributionPhotoMultipartUpload
     */
    nftId: number
    /**
     * 
     * @type ApiCreateMediaUploadUrlRequest
     * @memberof DistributionsApicreateDistributionPhotoMultipartUpload
     */
    apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest
}

export interface DistributionsApiCreateDistributionPhotoUploadUrlRequest {
    /**
     * Contract address
     * Defaults to: undefined
     * @type string
     * @memberof DistributionsApicreateDistributionPhotoUploadUrl
     */
    contract: string
    /**
     * NFT ID
     * Defaults to: undefined
     * @type number
     * @memberof DistributionsApicreateDistributionPhotoUploadUrl
     */
    nftId: number
    /**
     * 
     * @type ApiCreateMediaUploadUrlRequest
     * @memberof DistributionsApicreateDistributionPhotoUploadUrl
     */
    apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest
}

export interface DistributionsApiGetDistributionOverviewRequest {
    /**
     * Contract address
     * Defaults to: undefined
     * @type string
     * @memberof DistributionsApigetDistributionOverview
     */
    contract: string
    /**
     * Card ID
     * Defaults to: undefined
     * @type number
     * @memberof DistributionsApigetDistributionOverview
     */
    id: number
}

export interface DistributionsApiGetDistributionPhasesRequest {
    /**
     * Contract address
     * Defaults to: undefined
     * @type string
     * @memberof DistributionsApigetDistributionPhases
     */
    contract: string
    /**
     * NFT ID
     * Defaults to: undefined
     * @type number
     * @memberof DistributionsApigetDistributionPhases
     */
    nftId: number
}

export interface DistributionsApiGetDistributionPhotosRequest {
    /**
     * Contract address
     * Defaults to: undefined
     * @type string
     * @memberof DistributionsApigetDistributionPhotos
     */
    contract: string
    /**
     * NFT ID
     * Defaults to: undefined
     * @type number
     * @memberof DistributionsApigetDistributionPhotos
     */
    nftId: number
    /**
     * Default is 50
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof DistributionsApigetDistributionPhotos
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof DistributionsApigetDistributionPhotos
     */
    page?: number
}

export interface DistributionsApiGetDistributionsRequest {
    /**
     * Default is 2000
     * Minimum: 1
     * Maximum: 2000
     * Defaults to: undefined
     * @type number
     * @memberof DistributionsApigetDistributions
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof DistributionsApigetDistributions
     */
    page?: number
    /**
     * Search by wallet address or display name
     * Defaults to: undefined
     * @type string
     * @memberof DistributionsApigetDistributions
     */
    search?: string
    /**
     * Filter by card ID(s), comma-separated for multiple
     * Defaults to: undefined
     * @type string
     * @memberof DistributionsApigetDistributions
     */
    cardId?: string
    /**
     * Filter by contract address(es), comma-separated for multiple
     * Defaults to: undefined
     * @type string
     * @memberof DistributionsApigetDistributions
     */
    contract?: string
    /**
     * Filter by wallet address(es), comma-separated for multiple
     * Defaults to: undefined
     * @type string
     * @memberof DistributionsApigetDistributions
     */
    wallet?: string
}

export interface DistributionsApiUploadPartOfDistributionPhotoMultipartUploadRequest {
    /**
     * Contract address
     * Defaults to: undefined
     * @type string
     * @memberof DistributionsApiuploadPartOfDistributionPhotoMultipartUpload
     */
    contract: string
    /**
     * NFT ID
     * Defaults to: undefined
     * @type number
     * @memberof DistributionsApiuploadPartOfDistributionPhotoMultipartUpload
     */
    nftId: number
    /**
     * 
     * @type ApiUploadPartOfMultipartUploadRequest
     * @memberof DistributionsApiuploadPartOfDistributionPhotoMultipartUpload
     */
    apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest
}

export class ObjectDistributionsApi {
    private api: ObservableDistributionsApi

    public constructor(configuration: Configuration, requestFactory?: DistributionsApiRequestFactory, responseProcessor?: DistributionsApiResponseProcessor) {
        this.api = new ObservableDistributionsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Complete multipart upload for distribution photo
     * @param param the request object
     */
    public completeDistributionPhotoMultipartUploadWithHttpInfo(param: DistributionsApiCompleteDistributionPhotoMultipartUploadRequest, options?: Configuration): Promise<HttpInfo<ApiCompleteMultipartUploadResponse>> {
        return this.api.completeDistributionPhotoMultipartUploadWithHttpInfo(param.contract, param.nftId, param.apiCompleteMultipartUploadRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Complete multipart upload for distribution photo
     * @param param the request object
     */
    public completeDistributionPhotoMultipartUpload(param: DistributionsApiCompleteDistributionPhotoMultipartUploadRequest, options?: Configuration): Promise<ApiCompleteMultipartUploadResponse> {
        return this.api.completeDistributionPhotoMultipartUpload(param.contract, param.nftId, param.apiCompleteMultipartUploadRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin. Replaces all existing photos for the card.
     * Save uploaded distribution photos to database
     * @param param the request object
     */
    public completeDistributionPhotosUploadWithHttpInfo(param: DistributionsApiCompleteDistributionPhotosUploadRequest, options?: Configuration): Promise<HttpInfo<DistributionPhotoCompleteResponse>> {
        return this.api.completeDistributionPhotosUploadWithHttpInfo(param.contract, param.nftId, param.distributionPhotoCompleteRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin. Replaces all existing photos for the card.
     * Save uploaded distribution photos to database
     * @param param the request object
     */
    public completeDistributionPhotosUpload(param: DistributionsApiCompleteDistributionPhotosUploadRequest, options?: Configuration): Promise<DistributionPhotoCompleteResponse> {
        return this.api.completeDistributionPhotosUpload(param.contract, param.nftId, param.distributionPhotoCompleteRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Start multipart upload for distribution photo
     * @param param the request object
     */
    public createDistributionPhotoMultipartUploadWithHttpInfo(param: DistributionsApiCreateDistributionPhotoMultipartUploadRequest, options?: Configuration): Promise<HttpInfo<ApiStartMultipartMediaUploadResponse>> {
        return this.api.createDistributionPhotoMultipartUploadWithHttpInfo(param.contract, param.nftId, param.apiCreateMediaUploadUrlRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Start multipart upload for distribution photo
     * @param param the request object
     */
    public createDistributionPhotoMultipartUpload(param: DistributionsApiCreateDistributionPhotoMultipartUploadRequest, options?: Configuration): Promise<ApiStartMultipartMediaUploadResponse> {
        return this.api.createDistributionPhotoMultipartUpload(param.contract, param.nftId, param.apiCreateMediaUploadUrlRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned S3 URL for distribution photo upload
     * @param param the request object
     */
    public createDistributionPhotoUploadUrlWithHttpInfo(param: DistributionsApiCreateDistributionPhotoUploadUrlRequest, options?: Configuration): Promise<HttpInfo<ApiCreateMediaUrlResponse>> {
        return this.api.createDistributionPhotoUploadUrlWithHttpInfo(param.contract, param.nftId, param.apiCreateMediaUploadUrlRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned S3 URL for distribution photo upload
     * @param param the request object
     */
    public createDistributionPhotoUploadUrl(param: DistributionsApiCreateDistributionPhotoUploadUrlRequest, options?: Configuration): Promise<ApiCreateMediaUrlResponse> {
        return this.api.createDistributionPhotoUploadUrl(param.contract, param.nftId, param.apiCreateMediaUploadUrlRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get distribution overview for a specific contract and card
     * @param param the request object
     */
    public getDistributionOverviewWithHttpInfo(param: DistributionsApiGetDistributionOverviewRequest, options?: Configuration): Promise<HttpInfo<DistributionOverview>> {
        return this.api.getDistributionOverviewWithHttpInfo(param.contract, param.id,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get distribution overview for a specific contract and card
     * @param param the request object
     */
    public getDistributionOverview(param: DistributionsApiGetDistributionOverviewRequest, options?: Configuration): Promise<DistributionOverview> {
        return this.api.getDistributionOverview(param.contract, param.id,  options).toPromise();
    }

    /**
     * Get distribution phases for a specific contract and NFT
     * @param param the request object
     */
    public getDistributionPhasesWithHttpInfo(param: DistributionsApiGetDistributionPhasesRequest, options?: Configuration): Promise<HttpInfo<DistributionPhasesPage>> {
        return this.api.getDistributionPhasesWithHttpInfo(param.contract, param.nftId,  options).toPromise();
    }

    /**
     * Get distribution phases for a specific contract and NFT
     * @param param the request object
     */
    public getDistributionPhases(param: DistributionsApiGetDistributionPhasesRequest, options?: Configuration): Promise<DistributionPhasesPage> {
        return this.api.getDistributionPhases(param.contract, param.nftId,  options).toPromise();
    }

    /**
     * Get distribution photos for a specific contract and NFT
     * @param param the request object
     */
    public getDistributionPhotosWithHttpInfo(param: DistributionsApiGetDistributionPhotosRequest, options?: Configuration): Promise<HttpInfo<DistributionPhotosPage>> {
        return this.api.getDistributionPhotosWithHttpInfo(param.contract, param.nftId, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get distribution photos for a specific contract and NFT
     * @param param the request object
     */
    public getDistributionPhotos(param: DistributionsApiGetDistributionPhotosRequest, options?: Configuration): Promise<DistributionPhotosPage> {
        return this.api.getDistributionPhotos(param.contract, param.nftId, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * At least one filter parameter (search, card_id, contract, or wallet) is required
     * Get distributions
     * @param param the request object
     */
    public getDistributionsWithHttpInfo(param: DistributionsApiGetDistributionsRequest = {}, options?: Configuration): Promise<HttpInfo<DistributionNormalizedPage>> {
        return this.api.getDistributionsWithHttpInfo(param.pageSize, param.page, param.search, param.cardId, param.contract, param.wallet,  options).toPromise();
    }

    /**
     * At least one filter parameter (search, card_id, contract, or wallet) is required
     * Get distributions
     * @param param the request object
     */
    public getDistributions(param: DistributionsApiGetDistributionsRequest = {}, options?: Configuration): Promise<DistributionNormalizedPage> {
        return this.api.getDistributions(param.pageSize, param.page, param.search, param.cardId, param.contract, param.wallet,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned URL for multipart upload part
     * @param param the request object
     */
    public uploadPartOfDistributionPhotoMultipartUploadWithHttpInfo(param: DistributionsApiUploadPartOfDistributionPhotoMultipartUploadRequest, options?: Configuration): Promise<HttpInfo<ApiUploadPartOfMultipartUploadResponse>> {
        return this.api.uploadPartOfDistributionPhotoMultipartUploadWithHttpInfo(param.contract, param.nftId, param.apiUploadPartOfMultipartUploadRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned URL for multipart upload part
     * @param param the request object
     */
    public uploadPartOfDistributionPhotoMultipartUpload(param: DistributionsApiUploadPartOfDistributionPhotoMultipartUploadRequest, options?: Configuration): Promise<ApiUploadPartOfMultipartUploadResponse> {
        return this.api.uploadPartOfDistributionPhotoMultipartUpload(param.contract, param.nftId, param.apiUploadPartOfMultipartUploadRequest,  options).toPromise();
    }

}

import { ObservableDropsApi } from "./ObservableAPI";
import { DropsApiRequestFactory, DropsApiResponseProcessor} from "../apis/DropsApi";

export interface DropsApiAddDropCurationRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApiaddDropCuration
     */
    dropId: string
}

export interface DropsApiBookmarkDropRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApibookmarkDrop
     */
    dropId: string
}

export interface DropsApiBoostDropRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApiboostDrop
     */
    dropId: string
}

export interface DropsApiCompleteDropMultipartUploadRequest {
    /**
     * 
     * @type ApiCompleteMultipartUploadRequest
     * @memberof DropsApicompleteDropMultipartUpload
     */
    apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest
}

export interface DropsApiCompleteWaveMultipartUploadRequest {
    /**
     * 
     * @type ApiCompleteMultipartUploadRequest
     * @memberof DropsApicompleteWaveMultipartUpload
     */
    apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest
}

export interface DropsApiCreateDropRequest {
    /**
     * 
     * @type ApiCreateDropRequest
     * @memberof DropsApicreateDrop
     */
    apiCreateDropRequest: ApiCreateDropRequest
}

export interface DropsApiCreateDropMediaUrlRequest {
    /**
     * 
     * @type ApiCreateMediaUploadUrlRequest
     * @memberof DropsApicreateDropMediaUrl
     */
    apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest
}

export interface DropsApiCreateMultipartDropMediaUrlRequest {
    /**
     * 
     * @type ApiCreateMediaUploadUrlRequest
     * @memberof DropsApicreateMultipartDropMediaUrl
     */
    apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest
}

export interface DropsApiCreateMultipartWaveMediaUrlRequest {
    /**
     * 
     * @type ApiCreateMediaUploadUrlRequest
     * @memberof DropsApicreateMultipartWaveMediaUrl
     */
    apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest
}

export interface DropsApiDeleteDropBoostRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApideleteDropBoost
     */
    dropId: string
}

export interface DropsApiDeleteDropByIdRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApideleteDropById
     */
    dropId: string
}

export interface DropsApiGetBookmarkedDropsRequest {
    /**
     * Filter by wave
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetBookmarkedDrops
     */
    waveId?: string
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetBookmarkedDrops
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 200
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetBookmarkedDrops
     */
    pageSize?: number
    /**
     * Default is DESC (newest bookmarks first)
     * Defaults to: undefined
     * @type ApiPageSortDirection
     * @memberof DropsApigetBookmarkedDrops
     */
    sortDirection?: ApiPageSortDirection
}

export interface DropsApiGetBoostedDropsRequest {
    /**
     * Drops by author
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetBoostedDrops
     */
    author?: string
    /**
     * Drops boosted by given identity
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetBoostedDrops
     */
    booster?: string
    /**
     * Drops by wave
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetBoostedDrops
     */
    waveId?: string
    /**
     * Must be boosted at least so many times
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetBoostedDrops
     */
    minBoosts?: number
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetBoostedDrops
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 200
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetBoostedDrops
     */
    pageSize?: number
    /**
     * Default is DESC
     * Defaults to: undefined
     * @type ApiPageSortDirection
     * @memberof DropsApigetBoostedDrops
     */
    sortDirection?: ApiPageSortDirection
    /**
     * Default is last_boosted_at
     * Defaults to: undefined
     * @type &#39;last_boosted_at&#39; | &#39;first_boosted_at&#39; | &#39;drop_created_at&#39; | &#39;boosts&#39;
     * @memberof DropsApigetBoostedDrops
     */
    sort?: 'last_boosted_at' | 'first_boosted_at' | 'drop_created_at' | 'boosts'
    /**
     * Timestamp in millis
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetBoostedDrops
     */
    countOnlyBoostsAfter?: number
}

export interface DropsApiGetDropBoostsByIdRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetDropBoostsById
     */
    dropId: string
    /**
     * 
     * Minimum: 1
     * Maximum: 2000
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetDropBoostsById
     */
    pageSize?: number
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetDropBoostsById
     */
    page?: number
    /**
     * Default is DESC
     * Defaults to: undefined
     * @type ApiPageSortDirection
     * @memberof DropsApigetDropBoostsById
     */
    sortDirection?: ApiPageSortDirection
    /**
     * Default is boosted_at
     * Defaults to: undefined
     * @type &#39;boosted_at&#39;
     * @memberof DropsApigetDropBoostsById
     */
    sort?: 'boosted_at'
}

export interface DropsApiGetDropByIdRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetDropById
     */
    dropId: string
}

export interface DropsApiGetDropCuratorsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetDropCurators
     */
    dropId: string
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetDropCurators
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 2000
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetDropCurators
     */
    pageSize?: number
    /**
     * Default is DESC
     * Defaults to: undefined
     * @type ApiPageSortDirection
     * @memberof DropsApigetDropCurators
     */
    sortDirection?: ApiPageSortDirection
}

export interface DropsApiGetDropIdsRequest {
    /**
     * Drops in wave with given ID
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetDropIds
     */
    waveId: string
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetDropIds
     */
    minSerialNo: number
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetDropIds
     */
    maxSerialNo?: number
    /**
     * How many IDs to return (100 by default)
     * Minimum: 1
     * Maximum: 5000
     * Defaults to: 100
     * @type number
     * @memberof DropsApigetDropIds
     */
    limit?: number
}

export interface DropsApiGetLatestDropsRequest {
    /**
     * How many drops to return (10 by default)
     * Minimum: 1
     * Maximum: 20
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetLatestDrops
     */
    limit?: number
    /**
     * Drops by author
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetLatestDrops
     */
    author?: string
    /**
     * Drops by authors that fall into supplied group
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetLatestDrops
     */
    groupId?: string
    /**
     * Drops in wave with given ID
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetLatestDrops
     */
    waveId?: string
    /**
     * Used to find older drops
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetLatestDrops
     */
    serialNoLessThan?: number
    /**
     * If true then reply drops will be included in top level (false by default)
     * Defaults to: undefined
     * @type boolean
     * @memberof DropsApigetLatestDrops
     */
    includeReplies?: boolean
    /**
     * Filter by drop type
     * Defaults to: undefined
     * @type ApiDropType
     * @memberof DropsApigetLatestDrops
     */
    dropType?: ApiDropType
    /**
     * Comma-separated list of drop IDs to fetch
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetLatestDrops
     */
    ids?: string
    /**
     * If true then only drops that have at least one media attachment will be returned (false by default)
     * Defaults to: undefined
     * @type boolean
     * @memberof DropsApigetLatestDrops
     */
    containsMedia?: boolean
}

export interface DropsApiGetLightDropsRequest {
    /**
     * 
     * Minimum: 1
     * Maximum: 2000
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetLightDrops
     */
    limit: number
    /**
     * Drops in wave with given ID
     * Defaults to: undefined
     * @type string
     * @memberof DropsApigetLightDrops
     */
    waveId: string
    /**
     * Latest message if null
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof DropsApigetLightDrops
     */
    maxSerialNo?: number
}

export interface DropsApiMarkDropUnreadRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApimarkDropUnread
     */
    dropId: string
}

export interface DropsApiRateDropRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApirateDrop
     */
    dropId: string
    /**
     * 
     * @type ApiDropRatingRequest
     * @memberof DropsApirateDrop
     */
    apiDropRatingRequest: ApiDropRatingRequest
}

export interface DropsApiReactToDropRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApireactToDrop
     */
    dropId: string
    /**
     * 
     * @type ApiAddReactionToDropRequest
     * @memberof DropsApireactToDrop
     */
    apiAddReactionToDropRequest: ApiAddReactionToDropRequest
}

export interface DropsApiRemoveDropCurationRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApiremoveDropCuration
     */
    dropId: string
}

export interface DropsApiRemoveReactionFromDropRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApiremoveReactionFromDrop
     */
    dropId: string
    /**
     * 
     * @type ApiAddReactionToDropRequest
     * @memberof DropsApiremoveReactionFromDrop
     */
    apiAddReactionToDropRequest: ApiAddReactionToDropRequest
}

export interface DropsApiSubscribeToDropActionsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApisubscribeToDropActions
     */
    dropId: string
    /**
     * 
     * @type ApiDropSubscriptionActions
     * @memberof DropsApisubscribeToDropActions
     */
    apiDropSubscriptionActions: ApiDropSubscriptionActions
}

export interface DropsApiToggleHideLinkPreviewRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApitoggleHideLinkPreview
     */
    dropId: string
}

export interface DropsApiUnbookmarkDropRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApiunbookmarkDrop
     */
    dropId: string
}

export interface DropsApiUnsubscribeFromDropActionsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApiunsubscribeFromDropActions
     */
    dropId: string
    /**
     * 
     * @type ApiDropSubscriptionActions
     * @memberof DropsApiunsubscribeFromDropActions
     */
    apiDropSubscriptionActions: ApiDropSubscriptionActions
}

export interface DropsApiUpdateDropByIdRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DropsApiupdateDropById
     */
    dropId: string
    /**
     * 
     * @type ApiUpdateDropRequest
     * @memberof DropsApiupdateDropById
     */
    apiUpdateDropRequest: ApiUpdateDropRequest
}

export interface DropsApiUploadPartOfDropMultipartUploadRequest {
    /**
     * 
     * @type ApiUploadPartOfMultipartUploadRequest
     * @memberof DropsApiuploadPartOfDropMultipartUpload
     */
    apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest
}

export interface DropsApiUploadPartOfWaveMultipartUploadRequest {
    /**
     * 
     * @type ApiUploadPartOfMultipartUploadRequest
     * @memberof DropsApiuploadPartOfWaveMultipartUpload
     */
    apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest
}

export class ObjectDropsApi {
    private api: ObservableDropsApi

    public constructor(configuration: Configuration, requestFactory?: DropsApiRequestFactory, responseProcessor?: DropsApiResponseProcessor) {
        this.api = new ObservableDropsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Mark a drop as curated by authenticated user
     * @param param the request object
     */
    public addDropCurationWithHttpInfo(param: DropsApiAddDropCurationRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.addDropCurationWithHttpInfo(param.dropId,  options).toPromise();
    }

    /**
     * Mark a drop as curated by authenticated user
     * @param param the request object
     */
    public addDropCuration(param: DropsApiAddDropCurationRequest, options?: Configuration): Promise<void> {
        return this.api.addDropCuration(param.dropId,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Bookmark a drop
     * @param param the request object
     */
    public bookmarkDropWithHttpInfo(param: DropsApiBookmarkDropRequest, options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        return this.api.bookmarkDropWithHttpInfo(param.dropId,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Bookmark a drop
     * @param param the request object
     */
    public bookmarkDrop(param: DropsApiBookmarkDropRequest, options?: Configuration): Promise<ApiDrop> {
        return this.api.bookmarkDrop(param.dropId,  options).toPromise();
    }

    /**
     * Boost drop
     * @param param the request object
     */
    public boostDropWithHttpInfo(param: DropsApiBoostDropRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.boostDropWithHttpInfo(param.dropId,  options).toPromise();
    }

    /**
     * Boost drop
     * @param param the request object
     */
    public boostDrop(param: DropsApiBoostDropRequest, options?: Configuration): Promise<void> {
        return this.api.boostDrop(param.dropId,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param param the request object
     */
    public completeDropMultipartUploadWithHttpInfo(param: DropsApiCompleteDropMultipartUploadRequest, options?: Configuration): Promise<HttpInfo<ApiCompleteMultipartUploadResponse>> {
        return this.api.completeDropMultipartUploadWithHttpInfo(param.apiCompleteMultipartUploadRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param param the request object
     */
    public completeDropMultipartUpload(param: DropsApiCompleteDropMultipartUploadRequest, options?: Configuration): Promise<ApiCompleteMultipartUploadResponse> {
        return this.api.completeDropMultipartUpload(param.apiCompleteMultipartUploadRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param param the request object
     */
    public completeWaveMultipartUploadWithHttpInfo(param: DropsApiCompleteWaveMultipartUploadRequest, options?: Configuration): Promise<HttpInfo<ApiCompleteMultipartUploadResponse>> {
        return this.api.completeWaveMultipartUploadWithHttpInfo(param.apiCompleteMultipartUploadRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param param the request object
     */
    public completeWaveMultipartUpload(param: DropsApiCompleteWaveMultipartUploadRequest, options?: Configuration): Promise<ApiCompleteMultipartUploadResponse> {
        return this.api.completeWaveMultipartUpload(param.apiCompleteMultipartUploadRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create a drop
     * @param param the request object
     */
    public createDropWithHttpInfo(param: DropsApiCreateDropRequest, options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        return this.api.createDropWithHttpInfo(param.apiCreateDropRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create a drop
     * @param param the request object
     */
    public createDrop(param: DropsApiCreateDropRequest, options?: Configuration): Promise<ApiDrop> {
        return this.api.createDrop(param.apiCreateDropRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for drop media upload
     * @param param the request object
     */
    public createDropMediaUrlWithHttpInfo(param: DropsApiCreateDropMediaUrlRequest, options?: Configuration): Promise<HttpInfo<ApiCreateMediaUrlResponse>> {
        return this.api.createDropMediaUrlWithHttpInfo(param.apiCreateMediaUploadUrlRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for drop media upload
     * @param param the request object
     */
    public createDropMediaUrl(param: DropsApiCreateDropMediaUrlRequest, options?: Configuration): Promise<ApiCreateMediaUrlResponse> {
        return this.api.createDropMediaUrl(param.apiCreateMediaUploadUrlRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param param the request object
     */
    public createMultipartDropMediaUrlWithHttpInfo(param: DropsApiCreateMultipartDropMediaUrlRequest, options?: Configuration): Promise<HttpInfo<ApiStartMultipartMediaUploadResponse>> {
        return this.api.createMultipartDropMediaUrlWithHttpInfo(param.apiCreateMediaUploadUrlRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param param the request object
     */
    public createMultipartDropMediaUrl(param: DropsApiCreateMultipartDropMediaUrlRequest, options?: Configuration): Promise<ApiStartMultipartMediaUploadResponse> {
        return this.api.createMultipartDropMediaUrl(param.apiCreateMediaUploadUrlRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param param the request object
     */
    public createMultipartWaveMediaUrlWithHttpInfo(param: DropsApiCreateMultipartWaveMediaUrlRequest, options?: Configuration): Promise<HttpInfo<ApiStartMultipartMediaUploadResponse>> {
        return this.api.createMultipartWaveMediaUrlWithHttpInfo(param.apiCreateMediaUploadUrlRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param param the request object
     */
    public createMultipartWaveMediaUrl(param: DropsApiCreateMultipartWaveMediaUrlRequest, options?: Configuration): Promise<ApiStartMultipartMediaUploadResponse> {
        return this.api.createMultipartWaveMediaUrl(param.apiCreateMediaUploadUrlRequest,  options).toPromise();
    }

    /**
     * Delete drop boost
     * @param param the request object
     */
    public deleteDropBoostWithHttpInfo(param: DropsApiDeleteDropBoostRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.deleteDropBoostWithHttpInfo(param.dropId,  options).toPromise();
    }

    /**
     * Delete drop boost
     * @param param the request object
     */
    public deleteDropBoost(param: DropsApiDeleteDropBoostRequest, options?: Configuration): Promise<void> {
        return this.api.deleteDropBoost(param.dropId,  options).toPromise();
    }

    /**
     * Delete drop by ID
     * @param param the request object
     */
    public deleteDropByIdWithHttpInfo(param: DropsApiDeleteDropByIdRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.deleteDropByIdWithHttpInfo(param.dropId,  options).toPromise();
    }

    /**
     * Delete drop by ID
     * @param param the request object
     */
    public deleteDropById(param: DropsApiDeleteDropByIdRequest, options?: Configuration): Promise<void> {
        return this.api.deleteDropById(param.dropId,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated. Returns drops bookmarked by the current user, sorted by bookmark time.
     * Get bookmarked drops for authenticated user
     * @param param the request object
     */
    public getBookmarkedDropsWithHttpInfo(param: DropsApiGetBookmarkedDropsRequest = {}, options?: Configuration): Promise<HttpInfo<ApiDropsPage>> {
        return this.api.getBookmarkedDropsWithHttpInfo(param.waveId, param.page, param.pageSize, param.sortDirection,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated. Returns drops bookmarked by the current user, sorted by bookmark time.
     * Get bookmarked drops for authenticated user
     * @param param the request object
     */
    public getBookmarkedDrops(param: DropsApiGetBookmarkedDropsRequest = {}, options?: Configuration): Promise<ApiDropsPage> {
        return this.api.getBookmarkedDrops(param.waveId, param.page, param.pageSize, param.sortDirection,  options).toPromise();
    }

    /**
     * Get boosted drops.
     * @param param the request object
     */
    public getBoostedDropsWithHttpInfo(param: DropsApiGetBoostedDropsRequest = {}, options?: Configuration): Promise<HttpInfo<ApiDropsPage>> {
        return this.api.getBoostedDropsWithHttpInfo(param.author, param.booster, param.waveId, param.minBoosts, param.page, param.pageSize, param.sortDirection, param.sort, param.countOnlyBoostsAfter,  options).toPromise();
    }

    /**
     * Get boosted drops.
     * @param param the request object
     */
    public getBoostedDrops(param: DropsApiGetBoostedDropsRequest = {}, options?: Configuration): Promise<ApiDropsPage> {
        return this.api.getBoostedDrops(param.author, param.booster, param.waveId, param.minBoosts, param.page, param.pageSize, param.sortDirection, param.sort, param.countOnlyBoostsAfter,  options).toPromise();
    }

    /**
     * Get drop boosts by Drop ID.
     * @param param the request object
     */
    public getDropBoostsByIdWithHttpInfo(param: DropsApiGetDropBoostsByIdRequest, options?: Configuration): Promise<HttpInfo<ApiDropBoostsPage>> {
        return this.api.getDropBoostsByIdWithHttpInfo(param.dropId, param.pageSize, param.page, param.sortDirection, param.sort,  options).toPromise();
    }

    /**
     * Get drop boosts by Drop ID.
     * @param param the request object
     */
    public getDropBoostsById(param: DropsApiGetDropBoostsByIdRequest, options?: Configuration): Promise<ApiDropBoostsPage> {
        return this.api.getDropBoostsById(param.dropId, param.pageSize, param.page, param.sortDirection, param.sort,  options).toPromise();
    }

    /**
     * Get drop by ID.
     * @param param the request object
     */
    public getDropByIdWithHttpInfo(param: DropsApiGetDropByIdRequest, options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        return this.api.getDropByIdWithHttpInfo(param.dropId,  options).toPromise();
    }

    /**
     * Get drop by ID.
     * @param param the request object
     */
    public getDropById(param: DropsApiGetDropByIdRequest, options?: Configuration): Promise<ApiDrop> {
        return this.api.getDropById(param.dropId,  options).toPromise();
    }

    /**
     * Get identities who curated a drop
     * @param param the request object
     */
    public getDropCuratorsWithHttpInfo(param: DropsApiGetDropCuratorsRequest, options?: Configuration): Promise<HttpInfo<ApiProfileMinsPage>> {
        return this.api.getDropCuratorsWithHttpInfo(param.dropId, param.page, param.pageSize, param.sortDirection,  options).toPromise();
    }

    /**
     * Get identities who curated a drop
     * @param param the request object
     */
    public getDropCurators(param: DropsApiGetDropCuratorsRequest, options?: Configuration): Promise<ApiProfileMinsPage> {
        return this.api.getDropCurators(param.dropId, param.page, param.pageSize, param.sortDirection,  options).toPromise();
    }

    /**
     * Get drop IDs in wave by serial range.
     * @param param the request object
     */
    public getDropIdsWithHttpInfo(param: DropsApiGetDropIdsRequest, options?: Configuration): Promise<HttpInfo<Array<ApiDropId>>> {
        return this.api.getDropIdsWithHttpInfo(param.waveId, param.minSerialNo, param.maxSerialNo, param.limit,  options).toPromise();
    }

    /**
     * Get drop IDs in wave by serial range.
     * @param param the request object
     */
    public getDropIds(param: DropsApiGetDropIdsRequest, options?: Configuration): Promise<Array<ApiDropId>> {
        return this.api.getDropIds(param.waveId, param.minSerialNo, param.maxSerialNo, param.limit,  options).toPromise();
    }

    /**
     * Get latest drops.
     * @param param the request object
     */
    public getLatestDropsWithHttpInfo(param: DropsApiGetLatestDropsRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiDrop>>> {
        return this.api.getLatestDropsWithHttpInfo(param.limit, param.author, param.groupId, param.waveId, param.serialNoLessThan, param.includeReplies, param.dropType, param.ids, param.containsMedia,  options).toPromise();
    }

    /**
     * Get latest drops.
     * @param param the request object
     */
    public getLatestDrops(param: DropsApiGetLatestDropsRequest = {}, options?: Configuration): Promise<Array<ApiDrop>> {
        return this.api.getLatestDrops(param.limit, param.author, param.groupId, param.waveId, param.serialNoLessThan, param.includeReplies, param.dropType, param.ids, param.containsMedia,  options).toPromise();
    }

    /**
     * Get light drops
     * @param param the request object
     */
    public getLightDropsWithHttpInfo(param: DropsApiGetLightDropsRequest, options?: Configuration): Promise<HttpInfo<Array<ApiLightDrop>>> {
        return this.api.getLightDropsWithHttpInfo(param.limit, param.waveId, param.maxSerialNo,  options).toPromise();
    }

    /**
     * Get light drops
     * @param param the request object
     */
    public getLightDrops(param: DropsApiGetLightDropsRequest, options?: Configuration): Promise<Array<ApiLightDrop>> {
        return this.api.getLightDrops(param.limit, param.waveId, param.maxSerialNo,  options).toPromise();
    }

    /**
     * Sets the user\"s latest_read_timestamp to just before this drop\"s created_at, making this drop and all newer drops unread.
     * Mark a drop and all subsequent drops in the wave as unread
     * @param param the request object
     */
    public markDropUnreadWithHttpInfo(param: DropsApiMarkDropUnreadRequest, options?: Configuration): Promise<HttpInfo<ApiMarkDropUnreadResponse>> {
        return this.api.markDropUnreadWithHttpInfo(param.dropId,  options).toPromise();
    }

    /**
     * Sets the user\"s latest_read_timestamp to just before this drop\"s created_at, making this drop and all newer drops unread.
     * Mark a drop and all subsequent drops in the wave as unread
     * @param param the request object
     */
    public markDropUnread(param: DropsApiMarkDropUnreadRequest, options?: Configuration): Promise<ApiMarkDropUnreadResponse> {
        return this.api.markDropUnread(param.dropId,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Rate a drop
     * @param param the request object
     */
    public rateDropWithHttpInfo(param: DropsApiRateDropRequest, options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        return this.api.rateDropWithHttpInfo(param.dropId, param.apiDropRatingRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Rate a drop
     * @param param the request object
     */
    public rateDrop(param: DropsApiRateDropRequest, options?: Configuration): Promise<ApiDrop> {
        return this.api.rateDrop(param.dropId, param.apiDropRatingRequest,  options).toPromise();
    }

    /**
     * React to a drop
     * @param param the request object
     */
    public reactToDropWithHttpInfo(param: DropsApiReactToDropRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.reactToDropWithHttpInfo(param.dropId, param.apiAddReactionToDropRequest,  options).toPromise();
    }

    /**
     * React to a drop
     * @param param the request object
     */
    public reactToDrop(param: DropsApiReactToDropRequest, options?: Configuration): Promise<void> {
        return this.api.reactToDrop(param.dropId, param.apiAddReactionToDropRequest,  options).toPromise();
    }

    /**
     * Remove authenticated user\"s curation from a drop
     * @param param the request object
     */
    public removeDropCurationWithHttpInfo(param: DropsApiRemoveDropCurationRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.removeDropCurationWithHttpInfo(param.dropId,  options).toPromise();
    }

    /**
     * Remove authenticated user\"s curation from a drop
     * @param param the request object
     */
    public removeDropCuration(param: DropsApiRemoveDropCurationRequest, options?: Configuration): Promise<void> {
        return this.api.removeDropCuration(param.dropId,  options).toPromise();
    }

    /**
     * Remove reaction from a drop
     * @param param the request object
     */
    public removeReactionFromDropWithHttpInfo(param: DropsApiRemoveReactionFromDropRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.removeReactionFromDropWithHttpInfo(param.dropId, param.apiAddReactionToDropRequest,  options).toPromise();
    }

    /**
     * Remove reaction from a drop
     * @param param the request object
     */
    public removeReactionFromDrop(param: DropsApiRemoveReactionFromDropRequest, options?: Configuration): Promise<void> {
        return this.api.removeReactionFromDrop(param.dropId, param.apiAddReactionToDropRequest,  options).toPromise();
    }

    /**
     * Subscribe authenticated user to drop actions.
     * @param param the request object
     */
    public subscribeToDropActionsWithHttpInfo(param: DropsApiSubscribeToDropActionsRequest, options?: Configuration): Promise<HttpInfo<ApiDropSubscriptionActions>> {
        return this.api.subscribeToDropActionsWithHttpInfo(param.dropId, param.apiDropSubscriptionActions,  options).toPromise();
    }

    /**
     * Subscribe authenticated user to drop actions.
     * @param param the request object
     */
    public subscribeToDropActions(param: DropsApiSubscribeToDropActionsRequest, options?: Configuration): Promise<ApiDropSubscriptionActions> {
        return this.api.subscribeToDropActions(param.dropId, param.apiDropSubscriptionActions,  options).toPromise();
    }

    /**
     * Toggles (flips) hide_link_preview for a drop. Only the author can call this endpoint.
     * Toggle hide link preview for a drop
     * @param param the request object
     */
    public toggleHideLinkPreviewWithHttpInfo(param: DropsApiToggleHideLinkPreviewRequest, options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        return this.api.toggleHideLinkPreviewWithHttpInfo(param.dropId,  options).toPromise();
    }

    /**
     * Toggles (flips) hide_link_preview for a drop. Only the author can call this endpoint.
     * Toggle hide link preview for a drop
     * @param param the request object
     */
    public toggleHideLinkPreview(param: DropsApiToggleHideLinkPreviewRequest, options?: Configuration): Promise<ApiDrop> {
        return this.api.toggleHideLinkPreview(param.dropId,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Remove bookmark from drop
     * @param param the request object
     */
    public unbookmarkDropWithHttpInfo(param: DropsApiUnbookmarkDropRequest, options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        return this.api.unbookmarkDropWithHttpInfo(param.dropId,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Remove bookmark from drop
     * @param param the request object
     */
    public unbookmarkDrop(param: DropsApiUnbookmarkDropRequest, options?: Configuration): Promise<ApiDrop> {
        return this.api.unbookmarkDrop(param.dropId,  options).toPromise();
    }

    /**
     * Unsubscribe authenticated user from drop actions.
     * @param param the request object
     */
    public unsubscribeFromDropActionsWithHttpInfo(param: DropsApiUnsubscribeFromDropActionsRequest, options?: Configuration): Promise<HttpInfo<ApiDropSubscriptionActions>> {
        return this.api.unsubscribeFromDropActionsWithHttpInfo(param.dropId, param.apiDropSubscriptionActions,  options).toPromise();
    }

    /**
     * Unsubscribe authenticated user from drop actions.
     * @param param the request object
     */
    public unsubscribeFromDropActions(param: DropsApiUnsubscribeFromDropActionsRequest, options?: Configuration): Promise<ApiDropSubscriptionActions> {
        return this.api.unsubscribeFromDropActions(param.dropId, param.apiDropSubscriptionActions,  options).toPromise();
    }

    /**
     * Update drop by ID
     * @param param the request object
     */
    public updateDropByIdWithHttpInfo(param: DropsApiUpdateDropByIdRequest, options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        return this.api.updateDropByIdWithHttpInfo(param.dropId, param.apiUpdateDropRequest,  options).toPromise();
    }

    /**
     * Update drop by ID
     * @param param the request object
     */
    public updateDropById(param: DropsApiUpdateDropByIdRequest, options?: Configuration): Promise<ApiDrop> {
        return this.api.updateDropById(param.dropId, param.apiUpdateDropRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param param the request object
     */
    public uploadPartOfDropMultipartUploadWithHttpInfo(param: DropsApiUploadPartOfDropMultipartUploadRequest, options?: Configuration): Promise<HttpInfo<ApiUploadPartOfMultipartUploadResponse>> {
        return this.api.uploadPartOfDropMultipartUploadWithHttpInfo(param.apiUploadPartOfMultipartUploadRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param param the request object
     */
    public uploadPartOfDropMultipartUpload(param: DropsApiUploadPartOfDropMultipartUploadRequest, options?: Configuration): Promise<ApiUploadPartOfMultipartUploadResponse> {
        return this.api.uploadPartOfDropMultipartUpload(param.apiUploadPartOfMultipartUploadRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param param the request object
     */
    public uploadPartOfWaveMultipartUploadWithHttpInfo(param: DropsApiUploadPartOfWaveMultipartUploadRequest, options?: Configuration): Promise<HttpInfo<ApiUploadPartOfMultipartUploadResponse>> {
        return this.api.uploadPartOfWaveMultipartUploadWithHttpInfo(param.apiUploadPartOfMultipartUploadRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param param the request object
     */
    public uploadPartOfWaveMultipartUpload(param: DropsApiUploadPartOfWaveMultipartUploadRequest, options?: Configuration): Promise<ApiUploadPartOfMultipartUploadResponse> {
        return this.api.uploadPartOfWaveMultipartUpload(param.apiUploadPartOfMultipartUploadRequest,  options).toPromise();
    }

}

import { ObservableFeedApi } from "./ObservableAPI";
import { FeedApiRequestFactory, FeedApiResponseProcessor} from "../apis/FeedApi";

export interface FeedApiGetFeedRequest {
    /**
     * Used to find older items
     * Defaults to: undefined
     * @type number
     * @memberof FeedApigetFeed
     */
    serialNoLessThan?: number
}

export class ObjectFeedApi {
    private api: ObservableFeedApi

    public constructor(configuration: Configuration, requestFactory?: FeedApiRequestFactory, responseProcessor?: FeedApiResponseProcessor) {
        this.api = new ObservableFeedApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get feed
     * @param param the request object
     */
    public getFeedWithHttpInfo(param: FeedApiGetFeedRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiFeedItem>>> {
        return this.api.getFeedWithHttpInfo(param.serialNoLessThan,  options).toPromise();
    }

    /**
     * Get feed
     * @param param the request object
     */
    public getFeed(param: FeedApiGetFeedRequest = {}, options?: Configuration): Promise<Array<ApiFeedItem>> {
        return this.api.getFeed(param.serialNoLessThan,  options).toPromise();
    }

}

import { ObservableGroupsApi } from "./ObservableAPI";
import { GroupsApiRequestFactory, GroupsApiResponseProcessor} from "../apis/GroupsApi";

export interface GroupsApiChangeGroupVisibilityRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof GroupsApichangeGroupVisibility
     */
    id: string
    /**
     * 
     * @type ApiChangeGroupVisibility
     * @memberof GroupsApichangeGroupVisibility
     */
    apiChangeGroupVisibility: ApiChangeGroupVisibility
}

export interface GroupsApiCreateGroupRequest {
    /**
     * 
     * @type ApiCreateGroup
     * @memberof GroupsApicreateGroup
     */
    apiCreateGroup: ApiCreateGroup
}

export interface GroupsApiGetIdentityGroupIdentitiesRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof GroupsApigetIdentityGroupIdentities
     */
    id: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof GroupsApigetIdentityGroupIdentities
     */
    identityGroupId: string
}

export interface GroupsApiSearchUserGroupsRequest {
    /**
     * Partial or full name
     * Defaults to: undefined
     * @type string
     * @memberof GroupsApisearchUserGroups
     */
    groupName?: string
    /**
     * Group author identity
     * Defaults to: undefined
     * @type string
     * @memberof GroupsApisearchUserGroups
     */
    authorIdentity?: string
    /**
     * created at date less than
     * Defaults to: undefined
     * @type number
     * @memberof GroupsApisearchUserGroups
     */
    createdAtLessThan?: number
}

export class ObjectGroupsApi {
    private api: ObservableGroupsApi

    public constructor(configuration: Configuration, requestFactory?: GroupsApiRequestFactory, responseProcessor?: GroupsApiResponseProcessor) {
        this.api = new ObservableGroupsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Change group visibility
     * @param param the request object
     */
    public changeGroupVisibilityWithHttpInfo(param: GroupsApiChangeGroupVisibilityRequest, options?: Configuration): Promise<HttpInfo<ApiGroupFull>> {
        return this.api.changeGroupVisibilityWithHttpInfo(param.id, param.apiChangeGroupVisibility,  options).toPromise();
    }

    /**
     * Change group visibility
     * @param param the request object
     */
    public changeGroupVisibility(param: GroupsApiChangeGroupVisibilityRequest, options?: Configuration): Promise<ApiGroupFull> {
        return this.api.changeGroupVisibility(param.id, param.apiChangeGroupVisibility,  options).toPromise();
    }

    /**
     * Create a group
     * @param param the request object
     */
    public createGroupWithHttpInfo(param: GroupsApiCreateGroupRequest, options?: Configuration): Promise<HttpInfo<ApiGroupFull>> {
        return this.api.createGroupWithHttpInfo(param.apiCreateGroup,  options).toPromise();
    }

    /**
     * Create a group
     * @param param the request object
     */
    public createGroup(param: GroupsApiCreateGroupRequest, options?: Configuration): Promise<ApiGroupFull> {
        return this.api.createGroup(param.apiCreateGroup,  options).toPromise();
    }

    /**
     * Get identity groups identities. Identities are represented as primary wallet addresses
     * @param param the request object
     */
    public getIdentityGroupIdentitiesWithHttpInfo(param: GroupsApiGetIdentityGroupIdentitiesRequest, options?: Configuration): Promise<HttpInfo<Array<string>>> {
        return this.api.getIdentityGroupIdentitiesWithHttpInfo(param.id, param.identityGroupId,  options).toPromise();
    }

    /**
     * Get identity groups identities. Identities are represented as primary wallet addresses
     * @param param the request object
     */
    public getIdentityGroupIdentities(param: GroupsApiGetIdentityGroupIdentitiesRequest, options?: Configuration): Promise<Array<string>> {
        return this.api.getIdentityGroupIdentities(param.id, param.identityGroupId,  options).toPromise();
    }

    /**
     * Search for user groups
     * @param param the request object
     */
    public searchUserGroupsWithHttpInfo(param: GroupsApiSearchUserGroupsRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiGroupFull>>> {
        return this.api.searchUserGroupsWithHttpInfo(param.groupName, param.authorIdentity, param.createdAtLessThan,  options).toPromise();
    }

    /**
     * Search for user groups
     * @param param the request object
     */
    public searchUserGroups(param: GroupsApiSearchUserGroupsRequest = {}, options?: Configuration): Promise<Array<ApiGroupFull>> {
        return this.api.searchUserGroups(param.groupName, param.authorIdentity, param.createdAtLessThan,  options).toPromise();
    }

}

import { ObservableIdentitiesApi } from "./ObservableAPI";
import { IdentitiesApiRequestFactory, IdentitiesApiResponseProcessor} from "../apis/IdentitiesApi";

export interface IdentitiesApiGetIdentityByKeyRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof IdentitiesApigetIdentityByKey
     */
    identityKey: string
}

export interface IdentitiesApiGetIdentityByWalletRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof IdentitiesApigetIdentityByWallet
     */
    wallet: string
}

export interface IdentitiesApiGetIdentitySubscriptionsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof IdentitiesApigetIdentitySubscriptions
     */
    id: string
}

export interface IdentitiesApiSearchIdentitiesRequest {
    /**
     * At least 3 characters of a handle
     * Defaults to: undefined
     * @type string
     * @memberof IdentitiesApisearchIdentities
     */
    handle: string
    /**
     * Search only users who can view given wave
     * Defaults to: undefined
     * @type string
     * @memberof IdentitiesApisearchIdentities
     */
    waveId?: string
    /**
     * Number of results (20 by default)
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof IdentitiesApisearchIdentities
     */
    limit?: number
    /**
     * Search only users who can view given group
     * Defaults to: undefined
     * @type string
     * @memberof IdentitiesApisearchIdentities
     */
    groupId?: string
    /**
     * Ignore authenticated user
     * Defaults to: undefined
     * @type boolean
     * @memberof IdentitiesApisearchIdentities
     */
    ignoreAuthenticatedUser?: boolean
}

export interface IdentitiesApiSubscribeToIdentityActionsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof IdentitiesApisubscribeToIdentityActions
     */
    id: string
    /**
     * 
     * @type ApiIdentitySubscriptionActions
     * @memberof IdentitiesApisubscribeToIdentityActions
     */
    apiIdentitySubscriptionActions: ApiIdentitySubscriptionActions
}

export interface IdentitiesApiUnsubscribeFromIdentityActionsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof IdentitiesApiunsubscribeFromIdentityActions
     */
    id: string
    /**
     * 
     * @type ApiIdentitySubscriptionActions
     * @memberof IdentitiesApiunsubscribeFromIdentityActions
     */
    apiIdentitySubscriptionActions: ApiIdentitySubscriptionActions
}

export class ObjectIdentitiesApi {
    private api: ObservableIdentitiesApi

    public constructor(configuration: Configuration, requestFactory?: IdentitiesApiRequestFactory, responseProcessor?: IdentitiesApiResponseProcessor) {
        this.api = new ObservableIdentitiesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get identity by it\"s key. Key can be id, wallet, handle, ENS name, etc...
     * @param param the request object
     */
    public getIdentityByKeyWithHttpInfo(param: IdentitiesApiGetIdentityByKeyRequest, options?: Configuration): Promise<HttpInfo<ApiIdentity>> {
        return this.api.getIdentityByKeyWithHttpInfo(param.identityKey,  options).toPromise();
    }

    /**
     * Get identity by it\"s key. Key can be id, wallet, handle, ENS name, etc...
     * @param param the request object
     */
    public getIdentityByKey(param: IdentitiesApiGetIdentityByKeyRequest, options?: Configuration): Promise<ApiIdentity> {
        return this.api.getIdentityByKey(param.identityKey,  options).toPromise();
    }

    /**
     * Get identity by wallet
     * @param param the request object
     */
    public getIdentityByWalletWithHttpInfo(param: IdentitiesApiGetIdentityByWalletRequest, options?: Configuration): Promise<HttpInfo<ApiIdentity>> {
        return this.api.getIdentityByWalletWithHttpInfo(param.wallet,  options).toPromise();
    }

    /**
     * Get identity by wallet
     * @param param the request object
     */
    public getIdentityByWallet(param: IdentitiesApiGetIdentityByWalletRequest, options?: Configuration): Promise<ApiIdentity> {
        return this.api.getIdentityByWallet(param.wallet,  options).toPromise();
    }

    /**
     * Get subscribed actions to identity for authenticated user.
     * @param param the request object
     */
    public getIdentitySubscriptionsWithHttpInfo(param: IdentitiesApiGetIdentitySubscriptionsRequest, options?: Configuration): Promise<HttpInfo<ApiIdentitySubscriptionActions>> {
        return this.api.getIdentitySubscriptionsWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Get subscribed actions to identity for authenticated user.
     * @param param the request object
     */
    public getIdentitySubscriptions(param: IdentitiesApiGetIdentitySubscriptionsRequest, options?: Configuration): Promise<ApiIdentitySubscriptionActions> {
        return this.api.getIdentitySubscriptions(param.id,  options).toPromise();
    }

    /**
     * Search for identities
     * @param param the request object
     */
    public searchIdentitiesWithHttpInfo(param: IdentitiesApiSearchIdentitiesRequest, options?: Configuration): Promise<HttpInfo<Array<ApiIdentity>>> {
        return this.api.searchIdentitiesWithHttpInfo(param.handle, param.waveId, param.limit, param.groupId, param.ignoreAuthenticatedUser,  options).toPromise();
    }

    /**
     * Search for identities
     * @param param the request object
     */
    public searchIdentities(param: IdentitiesApiSearchIdentitiesRequest, options?: Configuration): Promise<Array<ApiIdentity>> {
        return this.api.searchIdentities(param.handle, param.waveId, param.limit, param.groupId, param.ignoreAuthenticatedUser,  options).toPromise();
    }

    /**
     * Subscribe authenticated user to identities actions.
     * @param param the request object
     */
    public subscribeToIdentityActionsWithHttpInfo(param: IdentitiesApiSubscribeToIdentityActionsRequest, options?: Configuration): Promise<HttpInfo<ApiIdentitySubscriptionActions>> {
        return this.api.subscribeToIdentityActionsWithHttpInfo(param.id, param.apiIdentitySubscriptionActions,  options).toPromise();
    }

    /**
     * Subscribe authenticated user to identities actions.
     * @param param the request object
     */
    public subscribeToIdentityActions(param: IdentitiesApiSubscribeToIdentityActionsRequest, options?: Configuration): Promise<ApiIdentitySubscriptionActions> {
        return this.api.subscribeToIdentityActions(param.id, param.apiIdentitySubscriptionActions,  options).toPromise();
    }

    /**
     * Unsubscribe authenticated user from identity actions.
     * @param param the request object
     */
    public unsubscribeFromIdentityActionsWithHttpInfo(param: IdentitiesApiUnsubscribeFromIdentityActionsRequest, options?: Configuration): Promise<HttpInfo<ApiIdentitySubscriptionActions>> {
        return this.api.unsubscribeFromIdentityActionsWithHttpInfo(param.id, param.apiIdentitySubscriptionActions,  options).toPromise();
    }

    /**
     * Unsubscribe authenticated user from identity actions.
     * @param param the request object
     */
    public unsubscribeFromIdentityActions(param: IdentitiesApiUnsubscribeFromIdentityActionsRequest, options?: Configuration): Promise<ApiIdentitySubscriptionActions> {
        return this.api.unsubscribeFromIdentityActions(param.id, param.apiIdentitySubscriptionActions,  options).toPromise();
    }

}

import { ObservableMemesMintStatsApi } from "./ObservableAPI";
import { MemesMintStatsApiRequestFactory, MemesMintStatsApiResponseProcessor} from "../apis/MemesMintStatsApi";

export interface MemesMintStatsApiGetMemesMintStatsRequest {
    /**
     * Default is 50
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof MemesMintStatsApigetMemesMintStats
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof MemesMintStatsApigetMemesMintStats
     */
    page?: number
    /**
     * Default is ASC
     * Defaults to: undefined
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof MemesMintStatsApigetMemesMintStats
     */
    sortDirection?: 'ASC' | 'DESC'
}

export interface MemesMintStatsApiGetMemesMintStatsByIdRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof MemesMintStatsApigetMemesMintStatsById
     */
    id: number
}

export interface MemesMintStatsApiGetMemesMintStatsTotalRequest {
}

export interface MemesMintStatsApiGetMemesMintStatsYearlyRequest {
}

export class ObjectMemesMintStatsApi {
    private api: ObservableMemesMintStatsApi

    public constructor(configuration: Configuration, requestFactory?: MemesMintStatsApiRequestFactory, responseProcessor?: MemesMintStatsApiResponseProcessor) {
        this.api = new ObservableMemesMintStatsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get paginated memes mint stats
     * @param param the request object
     */
    public getMemesMintStatsWithHttpInfo(param: MemesMintStatsApiGetMemesMintStatsRequest = {}, options?: Configuration): Promise<HttpInfo<ApiMemesMintStatsPage>> {
        return this.api.getMemesMintStatsWithHttpInfo(param.pageSize, param.page, param.sortDirection,  options).toPromise();
    }

    /**
     * Get paginated memes mint stats
     * @param param the request object
     */
    public getMemesMintStats(param: MemesMintStatsApiGetMemesMintStatsRequest = {}, options?: Configuration): Promise<ApiMemesMintStatsPage> {
        return this.api.getMemesMintStats(param.pageSize, param.page, param.sortDirection,  options).toPromise();
    }

    /**
     * Get memes mint stats for one meme id
     * @param param the request object
     */
    public getMemesMintStatsByIdWithHttpInfo(param: MemesMintStatsApiGetMemesMintStatsByIdRequest, options?: Configuration): Promise<HttpInfo<ApiMemesMintStat>> {
        return this.api.getMemesMintStatsByIdWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Get memes mint stats for one meme id
     * @param param the request object
     */
    public getMemesMintStatsById(param: MemesMintStatsApiGetMemesMintStatsByIdRequest, options?: Configuration): Promise<ApiMemesMintStat> {
        return this.api.getMemesMintStatsById(param.id,  options).toPromise();
    }

    /**
     * Get total memes mint stats
     * @param param the request object
     */
    public getMemesMintStatsTotalWithHttpInfo(param: MemesMintStatsApiGetMemesMintStatsTotalRequest = {}, options?: Configuration): Promise<HttpInfo<ApiMemesMintStatsTotals>> {
        return this.api.getMemesMintStatsTotalWithHttpInfo( options).toPromise();
    }

    /**
     * Get total memes mint stats
     * @param param the request object
     */
    public getMemesMintStatsTotal(param: MemesMintStatsApiGetMemesMintStatsTotalRequest = {}, options?: Configuration): Promise<ApiMemesMintStatsTotals> {
        return this.api.getMemesMintStatsTotal( options).toPromise();
    }

    /**
     * Get yearly aggregated memes mint stats
     * @param param the request object
     */
    public getMemesMintStatsYearlyWithHttpInfo(param: MemesMintStatsApiGetMemesMintStatsYearlyRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiMemesMintStatsYearly>>> {
        return this.api.getMemesMintStatsYearlyWithHttpInfo( options).toPromise();
    }

    /**
     * Get yearly aggregated memes mint stats
     * @param param the request object
     */
    public getMemesMintStatsYearly(param: MemesMintStatsApiGetMemesMintStatsYearlyRequest = {}, options?: Configuration): Promise<Array<ApiMemesMintStatsYearly>> {
        return this.api.getMemesMintStatsYearly( options).toPromise();
    }

}

import { ObservableNFTLinkApi } from "./ObservableAPI";
import { NFTLinkApiRequestFactory, NFTLinkApiResponseProcessor} from "../apis/NFTLinkApi";

export interface NFTLinkApiGetNftLinkDataRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof NFTLinkApigetNftLinkData
     */
    url: string
}

export class ObjectNFTLinkApi {
    private api: ObservableNFTLinkApi

    public constructor(configuration: Configuration, requestFactory?: NFTLinkApiRequestFactory, responseProcessor?: NFTLinkApiResponseProcessor) {
        this.api = new ObservableNFTLinkApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get marketplace data about NFT link
     * @param param the request object
     */
    public getNftLinkDataWithHttpInfo(param: NFTLinkApiGetNftLinkDataRequest, options?: Configuration): Promise<HttpInfo<Array<ApiNftLinkResponse>>> {
        return this.api.getNftLinkDataWithHttpInfo(param.url,  options).toPromise();
    }

    /**
     * Get marketplace data about NFT link
     * @param param the request object
     */
    public getNftLinkData(param: NFTLinkApiGetNftLinkDataRequest, options?: Configuration): Promise<Array<ApiNftLinkResponse>> {
        return this.api.getNftLinkData(param.url,  options).toPromise();
    }

}

import { ObservableNFTOwnersApi } from "./ObservableAPI";
import { NFTOwnersApiRequestFactory, NFTOwnersApiResponseProcessor} from "../apis/NFTOwnersApi";

export interface NFTOwnersApiGetNftOwnersRequest {
    /**
     * Default is 50
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof NFTOwnersApigetNftOwners
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof NFTOwnersApigetNftOwners
     */
    page?: number
    /**
     * Default is DESC
     * Defaults to: undefined
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof NFTOwnersApigetNftOwners
     */
    sortDirection?: 'ASC' | 'DESC'
    /**
     * Filter by contract address
     * Defaults to: undefined
     * @type string
     * @memberof NFTOwnersApigetNftOwners
     */
    contract?: string
    /**
     * Filter by token ID
     * Defaults to: undefined
     * @type string
     * @memberof NFTOwnersApigetNftOwners
     */
    tokenId?: string
}

export interface NFTOwnersApiGetNftOwnersByConsolidationKeyRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof NFTOwnersApigetNftOwnersByConsolidationKey
     */
    consolidationKey: string
    /**
     * Default is 50
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof NFTOwnersApigetNftOwnersByConsolidationKey
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof NFTOwnersApigetNftOwnersByConsolidationKey
     */
    page?: number
    /**
     * Default is DESC
     * Defaults to: undefined
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof NFTOwnersApigetNftOwnersByConsolidationKey
     */
    sortDirection?: 'ASC' | 'DESC'
    /**
     * Filter by contract address
     * Defaults to: undefined
     * @type string
     * @memberof NFTOwnersApigetNftOwnersByConsolidationKey
     */
    contract?: string
    /**
     * Filter by token ID
     * Defaults to: undefined
     * @type string
     * @memberof NFTOwnersApigetNftOwnersByConsolidationKey
     */
    tokenId?: string
}

export class ObjectNFTOwnersApi {
    private api: ObservableNFTOwnersApi

    public constructor(configuration: Configuration, requestFactory?: NFTOwnersApiRequestFactory, responseProcessor?: NFTOwnersApiResponseProcessor) {
        this.api = new ObservableNFTOwnersApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get NFT owners
     * @param param the request object
     */
    public getNftOwnersWithHttpInfo(param: NFTOwnersApiGetNftOwnersRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiNftOwnerPage>>> {
        return this.api.getNftOwnersWithHttpInfo(param.pageSize, param.page, param.sortDirection, param.contract, param.tokenId,  options).toPromise();
    }

    /**
     * Get NFT owners
     * @param param the request object
     */
    public getNftOwners(param: NFTOwnersApiGetNftOwnersRequest = {}, options?: Configuration): Promise<Array<ApiNftOwnerPage>> {
        return this.api.getNftOwners(param.pageSize, param.page, param.sortDirection, param.contract, param.tokenId,  options).toPromise();
    }

    /**
     * Get NFT owners by consolidation key
     * @param param the request object
     */
    public getNftOwnersByConsolidationKeyWithHttpInfo(param: NFTOwnersApiGetNftOwnersByConsolidationKeyRequest, options?: Configuration): Promise<HttpInfo<Array<ApiNftOwnerPage>>> {
        return this.api.getNftOwnersByConsolidationKeyWithHttpInfo(param.consolidationKey, param.pageSize, param.page, param.sortDirection, param.contract, param.tokenId,  options).toPromise();
    }

    /**
     * Get NFT owners by consolidation key
     * @param param the request object
     */
    public getNftOwnersByConsolidationKey(param: NFTOwnersApiGetNftOwnersByConsolidationKeyRequest, options?: Configuration): Promise<Array<ApiNftOwnerPage>> {
        return this.api.getNftOwnersByConsolidationKey(param.consolidationKey, param.pageSize, param.page, param.sortDirection, param.contract, param.tokenId,  options).toPromise();
    }

}

import { ObservableNFTsApi } from "./ObservableAPI";
import { NFTsApiRequestFactory, NFTsApiResponseProcessor} from "../apis/NFTsApi";

export interface NFTsApiGetNftMediaByContractRequest {
    /**
     * The NFT contract address to filter the media by
     * Defaults to: undefined
     * @type string
     * @memberof NFTsApigetNftMediaByContract
     */
    contract: string
}

export interface NFTsApiGetNftsRequest {
    /**
     * Default is 50
     * Minimum: 1
     * Maximum: 101
     * Defaults to: undefined
     * @type number
     * @memberof NFTsApigetNfts
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof NFTsApigetNfts
     */
    page?: number
    /**
     * Default is DESC
     * Defaults to: undefined
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof NFTsApigetNfts
     */
    sortDirection?: 'ASC' | 'DESC'
    /**
     * Filter by NFT ID
     * Defaults to: undefined
     * @type string
     * @memberof NFTsApigetNfts
     */
    id?: string
    /**
     * Filter by NFT ID
     * Defaults to: undefined
     * @type string
     * @memberof NFTsApigetNfts
     */
    contract?: string
}

export class ObjectNFTsApi {
    private api: ObservableNFTsApi

    public constructor(configuration: Configuration, requestFactory?: NFTsApiRequestFactory, responseProcessor?: NFTsApiResponseProcessor) {
        this.api = new ObservableNFTsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get NFT Media by Contract
     * @param param the request object
     */
    public getNftMediaByContractWithHttpInfo(param: NFTsApiGetNftMediaByContractRequest, options?: Configuration): Promise<HttpInfo<Array<ApiNftMedia>>> {
        return this.api.getNftMediaByContractWithHttpInfo(param.contract,  options).toPromise();
    }

    /**
     * Get NFT Media by Contract
     * @param param the request object
     */
    public getNftMediaByContract(param: NFTsApiGetNftMediaByContractRequest, options?: Configuration): Promise<Array<ApiNftMedia>> {
        return this.api.getNftMediaByContract(param.contract,  options).toPromise();
    }

    /**
     * Get NFTs
     * @param param the request object
     */
    public getNftsWithHttpInfo(param: NFTsApiGetNftsRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiNftsPage>>> {
        return this.api.getNftsWithHttpInfo(param.pageSize, param.page, param.sortDirection, param.id, param.contract,  options).toPromise();
    }

    /**
     * Get NFTs
     * @param param the request object
     */
    public getNfts(param: NFTsApiGetNftsRequest = {}, options?: Configuration): Promise<Array<ApiNftsPage>> {
        return this.api.getNfts(param.pageSize, param.page, param.sortDirection, param.id, param.contract,  options).toPromise();
    }

}

import { ObservableNotificationsApi } from "./ObservableAPI";
import { NotificationsApiRequestFactory, NotificationsApiResponseProcessor} from "../apis/NotificationsApi";

export interface NotificationsApiGetNotificationsRequest {
    /**
     * Default is 10
     * Minimum: 1
     * Maximum: 101
     * Defaults to: undefined
     * @type number
     * @memberof NotificationsApigetNotifications
     */
    limit?: number
    /**
     * Used to find older notifications
     * Defaults to: undefined
     * @type number
     * @memberof NotificationsApigetNotifications
     */
    idLessThan?: number
    /**
     * Comma-separated list of notification causes to include
     * Defaults to: undefined
     * @type string
     * @memberof NotificationsApigetNotifications
     */
    cause?: string
    /**
     * Comma-separated list of notification causes to exclude
     * Defaults to: undefined
     * @type string
     * @memberof NotificationsApigetNotifications
     */
    causeExclude?: string
    /**
     * Only return unread notifications
     * Defaults to: undefined
     * @type boolean
     * @memberof NotificationsApigetNotifications
     */
    unreadOnly?: boolean
}

export interface NotificationsApiGetWaveSubscriptionRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof NotificationsApigetWaveSubscription
     */
    waveId: string
}

export interface NotificationsApiMarkAllNotificationsAsReadRequest {
}

export interface NotificationsApiMarkNotificationAsReadRequest {
    /**
     * Notification ID or string \&quot;all\&quot; to mark all notifications as read
     * Defaults to: undefined
     * @type string
     * @memberof NotificationsApimarkNotificationAsRead
     */
    id: string
}

export interface NotificationsApiMarkWaveNotificationsAsReadRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof NotificationsApimarkWaveNotificationsAsRead
     */
    waveId: string
}

export interface NotificationsApiSubscribeToWaveNotificationsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof NotificationsApisubscribeToWaveNotifications
     */
    waveId: string
}

export interface NotificationsApiUnsubscribeFromWaveNotificationsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof NotificationsApiunsubscribeFromWaveNotifications
     */
    waveId: string
}

export class ObjectNotificationsApi {
    private api: ObservableNotificationsApi

    public constructor(configuration: Configuration, requestFactory?: NotificationsApiRequestFactory, responseProcessor?: NotificationsApiResponseProcessor) {
        this.api = new ObservableNotificationsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get notifications for authenticated user.
     * @param param the request object
     */
    public getNotificationsWithHttpInfo(param: NotificationsApiGetNotificationsRequest = {}, options?: Configuration): Promise<HttpInfo<ApiNotificationsResponse>> {
        return this.api.getNotificationsWithHttpInfo(param.limit, param.idLessThan, param.cause, param.causeExclude, param.unreadOnly,  options).toPromise();
    }

    /**
     * Get notifications for authenticated user.
     * @param param the request object
     */
    public getNotifications(param: NotificationsApiGetNotificationsRequest = {}, options?: Configuration): Promise<ApiNotificationsResponse> {
        return this.api.getNotifications(param.limit, param.idLessThan, param.cause, param.causeExclude, param.unreadOnly,  options).toPromise();
    }

    /**
     * Get wave subscription
     * @param param the request object
     */
    public getWaveSubscriptionWithHttpInfo(param: NotificationsApiGetWaveSubscriptionRequest, options?: Configuration): Promise<HttpInfo<GetWaveSubscription200Response>> {
        return this.api.getWaveSubscriptionWithHttpInfo(param.waveId,  options).toPromise();
    }

    /**
     * Get wave subscription
     * @param param the request object
     */
    public getWaveSubscription(param: NotificationsApiGetWaveSubscriptionRequest, options?: Configuration): Promise<GetWaveSubscription200Response> {
        return this.api.getWaveSubscription(param.waveId,  options).toPromise();
    }

    /**
     * Mark all notifications as read
     * @param param the request object
     */
    public markAllNotificationsAsReadWithHttpInfo(param: NotificationsApiMarkAllNotificationsAsReadRequest = {}, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.markAllNotificationsAsReadWithHttpInfo( options).toPromise();
    }

    /**
     * Mark all notifications as read
     * @param param the request object
     */
    public markAllNotificationsAsRead(param: NotificationsApiMarkAllNotificationsAsReadRequest = {}, options?: Configuration): Promise<void> {
        return this.api.markAllNotificationsAsRead( options).toPromise();
    }

    /**
     * Mark notification as read
     * @param param the request object
     */
    public markNotificationAsReadWithHttpInfo(param: NotificationsApiMarkNotificationAsReadRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.markNotificationAsReadWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Mark notification as read
     * @param param the request object
     */
    public markNotificationAsRead(param: NotificationsApiMarkNotificationAsReadRequest, options?: Configuration): Promise<void> {
        return this.api.markNotificationAsRead(param.id,  options).toPromise();
    }

    /**
     * Mark wave notifications as read
     * @param param the request object
     */
    public markWaveNotificationsAsReadWithHttpInfo(param: NotificationsApiMarkWaveNotificationsAsReadRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.markWaveNotificationsAsReadWithHttpInfo(param.waveId,  options).toPromise();
    }

    /**
     * Mark wave notifications as read
     * @param param the request object
     */
    public markWaveNotificationsAsRead(param: NotificationsApiMarkWaveNotificationsAsReadRequest, options?: Configuration): Promise<void> {
        return this.api.markWaveNotificationsAsRead(param.waveId,  options).toPromise();
    }

    /**
     * Subscribe to wave notifications
     * @param param the request object
     */
    public subscribeToWaveNotificationsWithHttpInfo(param: NotificationsApiSubscribeToWaveNotificationsRequest, options?: Configuration): Promise<HttpInfo<GetWaveSubscription200Response>> {
        return this.api.subscribeToWaveNotificationsWithHttpInfo(param.waveId,  options).toPromise();
    }

    /**
     * Subscribe to wave notifications
     * @param param the request object
     */
    public subscribeToWaveNotifications(param: NotificationsApiSubscribeToWaveNotificationsRequest, options?: Configuration): Promise<GetWaveSubscription200Response> {
        return this.api.subscribeToWaveNotifications(param.waveId,  options).toPromise();
    }

    /**
     * Unsubscribe from wave notifications
     * @param param the request object
     */
    public unsubscribeFromWaveNotificationsWithHttpInfo(param: NotificationsApiUnsubscribeFromWaveNotificationsRequest, options?: Configuration): Promise<HttpInfo<GetWaveSubscription200Response>> {
        return this.api.unsubscribeFromWaveNotificationsWithHttpInfo(param.waveId,  options).toPromise();
    }

    /**
     * Unsubscribe from wave notifications
     * @param param the request object
     */
    public unsubscribeFromWaveNotifications(param: NotificationsApiUnsubscribeFromWaveNotificationsRequest, options?: Configuration): Promise<GetWaveSubscription200Response> {
        return this.api.unsubscribeFromWaveNotifications(param.waveId,  options).toPromise();
    }

}

import { ObservableOtherApi } from "./ObservableAPI";
import { OtherApiRequestFactory, OtherApiResponseProcessor} from "../apis/OtherApi";

export interface OtherApiGetBlocksRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OtherApigetBlocks
     */
    page?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OtherApigetBlocks
     */
    pageSize?: number
}

export interface OtherApiGetConsolidatedUploadsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OtherApigetConsolidatedUploads
     */
    page?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OtherApigetConsolidatedUploads
     */
    pageSize?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OtherApigetConsolidatedUploads
     */
    block?: number
    /**
     * 
     * Defaults to: undefined
     * @type Date
     * @memberof OtherApigetConsolidatedUploads
     */
    date?: Date
}

export interface OtherApiGetMemeArtistsNamesRequest {
}

export interface OtherApiGetMemelabArtistsNamesRequest {
}

export interface OtherApiGetSettingsRequest {
}

export interface OtherApiGetUploadsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OtherApigetUploads
     */
    page?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OtherApigetUploads
     */
    pageSize?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof OtherApigetUploads
     */
    block?: number
    /**
     * 
     * Defaults to: undefined
     * @type Date
     * @memberof OtherApigetUploads
     */
    date?: Date
}

export class ObjectOtherApi {
    private api: ObservableOtherApi

    public constructor(configuration: Configuration, requestFactory?: OtherApiRequestFactory, responseProcessor?: OtherApiResponseProcessor) {
        this.api = new ObservableOtherApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get blocks and related timestamps
     * @param param the request object
     */
    public getBlocksWithHttpInfo(param: OtherApiGetBlocksRequest = {}, options?: Configuration): Promise<HttpInfo<ApiBlocksPage>> {
        return this.api.getBlocksWithHttpInfo(param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get blocks and related timestamps
     * @param param the request object
     */
    public getBlocks(param: OtherApiGetBlocksRequest = {}, options?: Configuration): Promise<ApiBlocksPage> {
        return this.api.getBlocks(param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get consolidated TDH snapshots links
     * @param param the request object
     */
    public getConsolidatedUploadsWithHttpInfo(param: OtherApiGetConsolidatedUploadsRequest = {}, options?: Configuration): Promise<HttpInfo<ApiUploadsPage>> {
        return this.api.getConsolidatedUploadsWithHttpInfo(param.page, param.pageSize, param.block, param.date,  options).toPromise();
    }

    /**
     * Get consolidated TDH snapshots links
     * @param param the request object
     */
    public getConsolidatedUploads(param: OtherApiGetConsolidatedUploadsRequest = {}, options?: Configuration): Promise<ApiUploadsPage> {
        return this.api.getConsolidatedUploads(param.page, param.pageSize, param.block, param.date,  options).toPromise();
    }

    /**
     * meme artists names
     * @param param the request object
     */
    public getMemeArtistsNamesWithHttpInfo(param: OtherApiGetMemeArtistsNamesRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiArtistNameItem>>> {
        return this.api.getMemeArtistsNamesWithHttpInfo( options).toPromise();
    }

    /**
     * meme artists names
     * @param param the request object
     */
    public getMemeArtistsNames(param: OtherApiGetMemeArtistsNamesRequest = {}, options?: Configuration): Promise<Array<ApiArtistNameItem>> {
        return this.api.getMemeArtistsNames( options).toPromise();
    }

    /**
     * memelab artists names
     * @param param the request object
     */
    public getMemelabArtistsNamesWithHttpInfo(param: OtherApiGetMemelabArtistsNamesRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiArtistNameItem>>> {
        return this.api.getMemelabArtistsNamesWithHttpInfo( options).toPromise();
    }

    /**
     * memelab artists names
     * @param param the request object
     */
    public getMemelabArtistsNames(param: OtherApiGetMemelabArtistsNamesRequest = {}, options?: Configuration): Promise<Array<ApiArtistNameItem>> {
        return this.api.getMemelabArtistsNames( options).toPromise();
    }

    /**
     * Seize settings
     * @param param the request object
     */
    public getSettingsWithHttpInfo(param: OtherApiGetSettingsRequest = {}, options?: Configuration): Promise<HttpInfo<ApiSeizeSettings>> {
        return this.api.getSettingsWithHttpInfo( options).toPromise();
    }

    /**
     * Seize settings
     * @param param the request object
     */
    public getSettings(param: OtherApiGetSettingsRequest = {}, options?: Configuration): Promise<ApiSeizeSettings> {
        return this.api.getSettings( options).toPromise();
    }

    /**
     * Get TDH snapshots links
     * @param param the request object
     */
    public getUploadsWithHttpInfo(param: OtherApiGetUploadsRequest = {}, options?: Configuration): Promise<HttpInfo<ApiUploadsPage>> {
        return this.api.getUploadsWithHttpInfo(param.page, param.pageSize, param.block, param.date,  options).toPromise();
    }

    /**
     * Get TDH snapshots links
     * @param param the request object
     */
    public getUploads(param: OtherApiGetUploadsRequest = {}, options?: Configuration): Promise<ApiUploadsPage> {
        return this.api.getUploads(param.page, param.pageSize, param.block, param.date,  options).toPromise();
    }

}

import { ObservableOwnersBalancesApi } from "./ObservableAPI";
import { OwnersBalancesApiRequestFactory, OwnersBalancesApiResponseProcessor} from "../apis/OwnersBalancesApi";

export interface OwnersBalancesApiGetMemesOwnerBalanceByConsolidationKeyRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof OwnersBalancesApigetMemesOwnerBalanceByConsolidationKey
     */
    consolidationKey: string
}

export interface OwnersBalancesApiGetOwnerBalanceByConsolidationKeyRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof OwnersBalancesApigetOwnerBalanceByConsolidationKey
     */
    consolidationKey: string
}

export interface OwnersBalancesApiGetOwnerBalancesRequest {
    /**
     * Default is 50
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof OwnersBalancesApigetOwnerBalances
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof OwnersBalancesApigetOwnerBalances
     */
    page?: number
    /**
     * Default is DESC
     * Defaults to: undefined
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof OwnersBalancesApigetOwnerBalances
     */
    sortDirection?: 'ASC' | 'DESC'
}

export class ObjectOwnersBalancesApi {
    private api: ObservableOwnersBalancesApi

    public constructor(configuration: Configuration, requestFactory?: OwnersBalancesApiRequestFactory, responseProcessor?: OwnersBalancesApiResponseProcessor) {
        this.api = new ObservableOwnersBalancesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get memes owner balance by consolidation key.
     * @param param the request object
     */
    public getMemesOwnerBalanceByConsolidationKeyWithHttpInfo(param: OwnersBalancesApiGetMemesOwnerBalanceByConsolidationKeyRequest, options?: Configuration): Promise<HttpInfo<Array<ApiOwnerBalanceMemes>>> {
        return this.api.getMemesOwnerBalanceByConsolidationKeyWithHttpInfo(param.consolidationKey,  options).toPromise();
    }

    /**
     * Get memes owner balance by consolidation key.
     * @param param the request object
     */
    public getMemesOwnerBalanceByConsolidationKey(param: OwnersBalancesApiGetMemesOwnerBalanceByConsolidationKeyRequest, options?: Configuration): Promise<Array<ApiOwnerBalanceMemes>> {
        return this.api.getMemesOwnerBalanceByConsolidationKey(param.consolidationKey,  options).toPromise();
    }

    /**
     * Get owner balance by consolidation key.
     * @param param the request object
     */
    public getOwnerBalanceByConsolidationKeyWithHttpInfo(param: OwnersBalancesApiGetOwnerBalanceByConsolidationKeyRequest, options?: Configuration): Promise<HttpInfo<ApiOwnerBalance>> {
        return this.api.getOwnerBalanceByConsolidationKeyWithHttpInfo(param.consolidationKey,  options).toPromise();
    }

    /**
     * Get owner balance by consolidation key.
     * @param param the request object
     */
    public getOwnerBalanceByConsolidationKey(param: OwnersBalancesApiGetOwnerBalanceByConsolidationKeyRequest, options?: Configuration): Promise<ApiOwnerBalance> {
        return this.api.getOwnerBalanceByConsolidationKey(param.consolidationKey,  options).toPromise();
    }

    /**
     * Get owner balances
     * @param param the request object
     */
    public getOwnerBalancesWithHttpInfo(param: OwnersBalancesApiGetOwnerBalancesRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiOwnerBalancePage>>> {
        return this.api.getOwnerBalancesWithHttpInfo(param.pageSize, param.page, param.sortDirection,  options).toPromise();
    }

    /**
     * Get owner balances
     * @param param the request object
     */
    public getOwnerBalances(param: OwnersBalancesApiGetOwnerBalancesRequest = {}, options?: Configuration): Promise<Array<ApiOwnerBalancePage>> {
        return this.api.getOwnerBalances(param.pageSize, param.page, param.sortDirection,  options).toPromise();
    }

}

import { ObservableProfileCICApi } from "./ObservableAPI";
import { ProfileCICApiRequestFactory, ProfileCICApiResponseProcessor} from "../apis/ProfileCICApi";

export interface ProfileCICApiGetProfileCicContributorsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileCICApigetProfileCicContributors
     */
    identity: string
    /**
     * 
     * Defaults to: undefined
     * @type ApiRepDirection
     * @memberof ProfileCICApigetProfileCicContributors
     */
    direction?: ApiRepDirection
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof ProfileCICApigetProfileCicContributors
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 200
     * Defaults to: undefined
     * @type number
     * @memberof ProfileCICApigetProfileCicContributors
     */
    pageSize?: number
}

export interface ProfileCICApiGetProfileCicOverviewRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileCICApigetProfileCicOverview
     */
    identity: string
    /**
     * 
     * Defaults to: undefined
     * @type ApiRepDirection
     * @memberof ProfileCICApigetProfileCicOverview
     */
    direction?: ApiRepDirection
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof ProfileCICApigetProfileCicOverview
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 200
     * Defaults to: undefined
     * @type number
     * @memberof ProfileCICApigetProfileCicOverview
     */
    pageSize?: number
}

export interface ProfileCICApiGetProfileCicRatingsByRaterRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileCICApigetProfileCicRatingsByRater
     */
    identity: string
    /**
     * 
     * Defaults to: undefined
     * @type boolean
     * @memberof ProfileCICApigetProfileCicRatingsByRater
     */
    given?: boolean
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof ProfileCICApigetProfileCicRatingsByRater
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 2000
     * Defaults to: undefined
     * @type number
     * @memberof ProfileCICApigetProfileCicRatingsByRater
     */
    pageSize?: number
    /**
     * 
     * Defaults to: undefined
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof ProfileCICApigetProfileCicRatingsByRater
     */
    order?: 'ASC' | 'DESC'
    /**
     * 
     * Defaults to: undefined
     * @type &#39;last_modified&#39; | &#39;rating&#39;
     * @memberof ProfileCICApigetProfileCicRatingsByRater
     */
    orderBy?: 'last_modified' | 'rating'
}

export interface ProfileCICApiRateProfileCicRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileCICApirateProfileCic
     */
    identity: string
    /**
     * 
     * @type ApiChangeProfileCicRating
     * @memberof ProfileCICApirateProfileCic
     */
    apiChangeProfileCicRating: ApiChangeProfileCicRating
}

export class ObjectProfileCICApi {
    private api: ObservableProfileCICApi

    public constructor(configuration: Configuration, requestFactory?: ProfileCICApiRequestFactory, responseProcessor?: ProfileCICApiResponseProcessor) {
        this.api = new ObservableProfileCICApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get profile CIC contributors
     * @param param the request object
     */
    public getProfileCicContributorsWithHttpInfo(param: ProfileCICApiGetProfileCicContributorsRequest, options?: Configuration): Promise<HttpInfo<ApiCicContributorsPage>> {
        return this.api.getProfileCicContributorsWithHttpInfo(param.identity, param.direction, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get profile CIC contributors
     * @param param the request object
     */
    public getProfileCicContributors(param: ProfileCICApiGetProfileCicContributorsRequest, options?: Configuration): Promise<ApiCicContributorsPage> {
        return this.api.getProfileCicContributors(param.identity, param.direction, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get profile CIC overview
     * @param param the request object
     */
    public getProfileCicOverviewWithHttpInfo(param: ProfileCICApiGetProfileCicOverviewRequest, options?: Configuration): Promise<HttpInfo<ApiCicOverview>> {
        return this.api.getProfileCicOverviewWithHttpInfo(param.identity, param.direction, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get profile CIC overview
     * @param param the request object
     */
    public getProfileCicOverview(param: ProfileCICApiGetProfileCicOverviewRequest, options?: Configuration): Promise<ApiCicOverview> {
        return this.api.getProfileCicOverview(param.identity, param.direction, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get profile CIC ratings by rater
     * @param param the request object
     */
    public getProfileCicRatingsByRaterWithHttpInfo(param: ProfileCICApiGetProfileCicRatingsByRaterRequest, options?: Configuration): Promise<HttpInfo<ApiRatingWithProfileInfoAndLevelPage>> {
        return this.api.getProfileCicRatingsByRaterWithHttpInfo(param.identity, param.given, param.page, param.pageSize, param.order, param.orderBy,  options).toPromise();
    }

    /**
     * Get profile CIC ratings by rater
     * @param param the request object
     */
    public getProfileCicRatingsByRater(param: ProfileCICApiGetProfileCicRatingsByRaterRequest, options?: Configuration): Promise<ApiRatingWithProfileInfoAndLevelPage> {
        return this.api.getProfileCicRatingsByRater(param.identity, param.given, param.page, param.pageSize, param.order, param.orderBy,  options).toPromise();
    }

    /**
     * Change profile CIC rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param param the request object
     */
    public rateProfileCicWithHttpInfo(param: ProfileCICApiRateProfileCicRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.rateProfileCicWithHttpInfo(param.identity, param.apiChangeProfileCicRating,  options).toPromise();
    }

    /**
     * Change profile CIC rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param param the request object
     */
    public rateProfileCic(param: ProfileCICApiRateProfileCicRequest, options?: Configuration): Promise<void> {
        return this.api.rateProfileCic(param.identity, param.apiChangeProfileCicRating,  options).toPromise();
    }

}

import { ObservableProfileREPApi } from "./ObservableAPI";
import { ProfileREPApiRequestFactory, ProfileREPApiResponseProcessor} from "../apis/ProfileREPApi";

export interface ProfileREPApiGetProfileRepCategoriesRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileREPApigetProfileRepCategories
     */
    identity: string
    /**
     * 
     * Defaults to: undefined
     * @type ApiRepDirection
     * @memberof ProfileREPApigetProfileRepCategories
     */
    direction?: ApiRepDirection
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof ProfileREPApigetProfileRepCategories
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof ProfileREPApigetProfileRepCategories
     */
    pageSize?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 10
     * Defaults to: undefined
     * @type number
     * @memberof ProfileREPApigetProfileRepCategories
     */
    topContributorsLimit?: number
}

export interface ProfileREPApiGetProfileRepCategoryContributorsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileREPApigetProfileRepCategoryContributors
     */
    identity: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileREPApigetProfileRepCategoryContributors
     */
    category: string
    /**
     * 
     * Defaults to: undefined
     * @type ApiRepDirection
     * @memberof ProfileREPApigetProfileRepCategoryContributors
     */
    direction?: ApiRepDirection
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof ProfileREPApigetProfileRepCategoryContributors
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 200
     * Defaults to: undefined
     * @type number
     * @memberof ProfileREPApigetProfileRepCategoryContributors
     */
    pageSize?: number
}

export interface ProfileREPApiGetProfileRepOverviewRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileREPApigetProfileRepOverview
     */
    identity: string
    /**
     * 
     * Defaults to: undefined
     * @type ApiRepDirection
     * @memberof ProfileREPApigetProfileRepOverview
     */
    direction?: ApiRepDirection
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof ProfileREPApigetProfileRepOverview
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 200
     * Defaults to: undefined
     * @type number
     * @memberof ProfileREPApigetProfileRepOverview
     */
    pageSize?: number
}

export interface ProfileREPApiGetProfileRepRatingRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileREPApigetProfileRepRating
     */
    identity: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileREPApigetProfileRepRating
     */
    fromIdentity?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileREPApigetProfileRepRating
     */
    category?: string
}

export interface ProfileREPApiGetProfileRepRatingsByRaterRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileREPApigetProfileRepRatingsByRater
     */
    identity: string
    /**
     * 
     * Defaults to: undefined
     * @type boolean
     * @memberof ProfileREPApigetProfileRepRatingsByRater
     */
    given?: boolean
    /**
     * 
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof ProfileREPApigetProfileRepRatingsByRater
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 2000
     * Defaults to: undefined
     * @type number
     * @memberof ProfileREPApigetProfileRepRatingsByRater
     */
    pageSize?: number
    /**
     * 
     * Defaults to: undefined
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof ProfileREPApigetProfileRepRatingsByRater
     */
    order?: 'ASC' | 'DESC'
    /**
     * 
     * Defaults to: undefined
     * @type &#39;last_modified&#39; | &#39;rating&#39;
     * @memberof ProfileREPApigetProfileRepRatingsByRater
     */
    orderBy?: 'last_modified' | 'rating'
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileREPApigetProfileRepRatingsByRater
     */
    category?: string
}

export interface ProfileREPApiRateProfileRepRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProfileREPApirateProfileRep
     */
    identity: string
    /**
     * 
     * @type ApiChangeProfileRepRating
     * @memberof ProfileREPApirateProfileRep
     */
    apiChangeProfileRepRating: ApiChangeProfileRepRating
}

export class ObjectProfileREPApi {
    private api: ObservableProfileREPApi

    public constructor(configuration: Configuration, requestFactory?: ProfileREPApiRequestFactory, responseProcessor?: ProfileREPApiResponseProcessor) {
        this.api = new ObservableProfileREPApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get profile REP categories
     * @param param the request object
     */
    public getProfileRepCategoriesWithHttpInfo(param: ProfileREPApiGetProfileRepCategoriesRequest, options?: Configuration): Promise<HttpInfo<ApiRepCategoriesPage>> {
        return this.api.getProfileRepCategoriesWithHttpInfo(param.identity, param.direction, param.page, param.pageSize, param.topContributorsLimit,  options).toPromise();
    }

    /**
     * Get profile REP categories
     * @param param the request object
     */
    public getProfileRepCategories(param: ProfileREPApiGetProfileRepCategoriesRequest, options?: Configuration): Promise<ApiRepCategoriesPage> {
        return this.api.getProfileRepCategories(param.identity, param.direction, param.page, param.pageSize, param.topContributorsLimit,  options).toPromise();
    }

    /**
     * Get profile REP contributors for category
     * @param param the request object
     */
    public getProfileRepCategoryContributorsWithHttpInfo(param: ProfileREPApiGetProfileRepCategoryContributorsRequest, options?: Configuration): Promise<HttpInfo<ApiRepContributorsPage>> {
        return this.api.getProfileRepCategoryContributorsWithHttpInfo(param.identity, param.category, param.direction, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get profile REP contributors for category
     * @param param the request object
     */
    public getProfileRepCategoryContributors(param: ProfileREPApiGetProfileRepCategoryContributorsRequest, options?: Configuration): Promise<ApiRepContributorsPage> {
        return this.api.getProfileRepCategoryContributors(param.identity, param.category, param.direction, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get profile REP overview
     * @param param the request object
     */
    public getProfileRepOverviewWithHttpInfo(param: ProfileREPApiGetProfileRepOverviewRequest, options?: Configuration): Promise<HttpInfo<ApiRepOverview>> {
        return this.api.getProfileRepOverviewWithHttpInfo(param.identity, param.direction, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get profile REP overview
     * @param param the request object
     */
    public getProfileRepOverview(param: ProfileREPApiGetProfileRepOverviewRequest, options?: Configuration): Promise<ApiRepOverview> {
        return this.api.getProfileRepOverview(param.identity, param.direction, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get profile REP rating
     * @param param the request object
     */
    public getProfileRepRatingWithHttpInfo(param: ProfileREPApiGetProfileRepRatingRequest, options?: Configuration): Promise<HttpInfo<ApiRepRating>> {
        return this.api.getProfileRepRatingWithHttpInfo(param.identity, param.fromIdentity, param.category,  options).toPromise();
    }

    /**
     * Get profile REP rating
     * @param param the request object
     */
    public getProfileRepRating(param: ProfileREPApiGetProfileRepRatingRequest, options?: Configuration): Promise<ApiRepRating> {
        return this.api.getProfileRepRating(param.identity, param.fromIdentity, param.category,  options).toPromise();
    }

    /**
     * Get profile REP ratings by rater
     * @param param the request object
     */
    public getProfileRepRatingsByRaterWithHttpInfo(param: ProfileREPApiGetProfileRepRatingsByRaterRequest, options?: Configuration): Promise<HttpInfo<ApiRatingWithProfileInfoAndLevelPage>> {
        return this.api.getProfileRepRatingsByRaterWithHttpInfo(param.identity, param.given, param.page, param.pageSize, param.order, param.orderBy, param.category,  options).toPromise();
    }

    /**
     * Get profile REP ratings by rater
     * @param param the request object
     */
    public getProfileRepRatingsByRater(param: ProfileREPApiGetProfileRepRatingsByRaterRequest, options?: Configuration): Promise<ApiRatingWithProfileInfoAndLevelPage> {
        return this.api.getProfileRepRatingsByRater(param.identity, param.given, param.page, param.pageSize, param.order, param.orderBy, param.category,  options).toPromise();
    }

    /**
     * Change profile REP rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param param the request object
     */
    public rateProfileRepWithHttpInfo(param: ProfileREPApiRateProfileRepRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.rateProfileRepWithHttpInfo(param.identity, param.apiChangeProfileRepRating,  options).toPromise();
    }

    /**
     * Change profile REP rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param param the request object
     */
    public rateProfileRep(param: ProfileREPApiRateProfileRepRequest, options?: Configuration): Promise<void> {
        return this.api.rateProfileRep(param.identity, param.apiChangeProfileRepRating,  options).toPromise();
    }

}

import { ObservableProfilesApi } from "./ObservableAPI";
import { ProfilesApiRequestFactory, ProfilesApiResponseProcessor} from "../apis/ProfilesApi";

export interface ProfilesApiCreateOrUpdateProfileRequest {
    /**
     * 
     * @type ApiCreateOrUpdateProfileRequest
     * @memberof ProfilesApicreateOrUpdateProfile
     */
    apiCreateOrUpdateProfileRequest: ApiCreateOrUpdateProfileRequest
}

export class ObjectProfilesApi {
    private api: ObservableProfilesApi

    public constructor(configuration: Configuration, requestFactory?: ProfilesApiRequestFactory, responseProcessor?: ProfilesApiResponseProcessor) {
        this.api = new ObservableProfilesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create or update a profile
     * @param param the request object
     */
    public createOrUpdateProfileWithHttpInfo(param: ProfilesApiCreateOrUpdateProfileRequest, options?: Configuration): Promise<HttpInfo<ApiIdentity>> {
        return this.api.createOrUpdateProfileWithHttpInfo(param.apiCreateOrUpdateProfileRequest,  options).toPromise();
    }

    /**
     * Create or update a profile
     * @param param the request object
     */
    public createOrUpdateProfile(param: ProfilesApiCreateOrUpdateProfileRequest, options?: Configuration): Promise<ApiIdentity> {
        return this.api.createOrUpdateProfile(param.apiCreateOrUpdateProfileRequest,  options).toPromise();
    }

}

import { ObservableProxiesApi } from "./ObservableAPI";
import { ProxiesApiRequestFactory, ProxiesApiResponseProcessor} from "../apis/ProxiesApi";

export interface ProxiesApiAcceptActionRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProxiesApiacceptAction
     */
    proxyId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProxiesApiacceptAction
     */
    actionId: string
    /**
     * 
     * @type AcceptActionRequest
     * @memberof ProxiesApiacceptAction
     */
    acceptActionRequest: AcceptActionRequest
}

export interface ProxiesApiAddActionToProxyRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProxiesApiaddActionToProxy
     */
    proxyId: string
    /**
     * 
     * @type AddActionToProxyRequest
     * @memberof ProxiesApiaddActionToProxy
     */
    addActionToProxyRequest: AddActionToProxyRequest
}

export interface ProxiesApiCreateProxyRequest {
    /**
     * 
     * @type ApiCreateNewProfileProxy
     * @memberof ProxiesApicreateProxy
     */
    apiCreateNewProfileProxy: ApiCreateNewProfileProxy
}

export interface ProxiesApiGetProfileProxiesRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProxiesApigetProfileProxies
     */
    identity: string
}

export interface ProxiesApiGetProxiesGrantedRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProxiesApigetProxiesGranted
     */
    identity: string
}

export interface ProxiesApiGetProxiesReceivedRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProxiesApigetProxiesReceived
     */
    identity: string
}

export interface ProxiesApiGetProxyByIdRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProxiesApigetProxyById
     */
    proxyId: string
}

export interface ProxiesApiUpdateActionRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProxiesApiupdateAction
     */
    proxyId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ProxiesApiupdateAction
     */
    actionId: string
    /**
     * 
     * @type ApiUpdateProxyActionRequest
     * @memberof ProxiesApiupdateAction
     */
    apiUpdateProxyActionRequest: ApiUpdateProxyActionRequest
}

export class ObjectProxiesApi {
    private api: ObservableProxiesApi

    public constructor(configuration: Configuration, requestFactory?: ProxiesApiRequestFactory, responseProcessor?: ProxiesApiResponseProcessor) {
        this.api = new ObservableProxiesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Accept action
     * @param param the request object
     */
    public acceptActionWithHttpInfo(param: ProxiesApiAcceptActionRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.acceptActionWithHttpInfo(param.proxyId, param.actionId, param.acceptActionRequest,  options).toPromise();
    }

    /**
     * Accept action
     * @param param the request object
     */
    public acceptAction(param: ProxiesApiAcceptActionRequest, options?: Configuration): Promise<void> {
        return this.api.acceptAction(param.proxyId, param.actionId, param.acceptActionRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Add action to proxy
     * @param param the request object
     */
    public addActionToProxyWithHttpInfo(param: ProxiesApiAddActionToProxyRequest, options?: Configuration): Promise<HttpInfo<ApiProfileProxyAction>> {
        return this.api.addActionToProxyWithHttpInfo(param.proxyId, param.addActionToProxyRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Add action to proxy
     * @param param the request object
     */
    public addActionToProxy(param: ProxiesApiAddActionToProxyRequest, options?: Configuration): Promise<ApiProfileProxyAction> {
        return this.api.addActionToProxy(param.proxyId, param.addActionToProxyRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create a new proxy
     * @param param the request object
     */
    public createProxyWithHttpInfo(param: ProxiesApiCreateProxyRequest, options?: Configuration): Promise<HttpInfo<ApiProfileProxy>> {
        return this.api.createProxyWithHttpInfo(param.apiCreateNewProfileProxy,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create a new proxy
     * @param param the request object
     */
    public createProxy(param: ProxiesApiCreateProxyRequest, options?: Configuration): Promise<ApiProfileProxy> {
        return this.api.createProxy(param.apiCreateNewProfileProxy,  options).toPromise();
    }

    /**
     * Get profile proxies
     * @param param the request object
     */
    public getProfileProxiesWithHttpInfo(param: ProxiesApiGetProfileProxiesRequest, options?: Configuration): Promise<HttpInfo<Array<ApiProfileProxy>>> {
        return this.api.getProfileProxiesWithHttpInfo(param.identity,  options).toPromise();
    }

    /**
     * Get profile proxies
     * @param param the request object
     */
    public getProfileProxies(param: ProxiesApiGetProfileProxiesRequest, options?: Configuration): Promise<Array<ApiProfileProxy>> {
        return this.api.getProfileProxies(param.identity,  options).toPromise();
    }

    /**
     * Get proxies granted by a profile
     * @param param the request object
     */
    public getProxiesGrantedWithHttpInfo(param: ProxiesApiGetProxiesGrantedRequest, options?: Configuration): Promise<HttpInfo<Array<ApiProfileProxy>>> {
        return this.api.getProxiesGrantedWithHttpInfo(param.identity,  options).toPromise();
    }

    /**
     * Get proxies granted by a profile
     * @param param the request object
     */
    public getProxiesGranted(param: ProxiesApiGetProxiesGrantedRequest, options?: Configuration): Promise<Array<ApiProfileProxy>> {
        return this.api.getProxiesGranted(param.identity,  options).toPromise();
    }

    /**
     * Get proxies received by a profile
     * @param param the request object
     */
    public getProxiesReceivedWithHttpInfo(param: ProxiesApiGetProxiesReceivedRequest, options?: Configuration): Promise<HttpInfo<Array<ApiProfileProxy>>> {
        return this.api.getProxiesReceivedWithHttpInfo(param.identity,  options).toPromise();
    }

    /**
     * Get proxies received by a profile
     * @param param the request object
     */
    public getProxiesReceived(param: ProxiesApiGetProxiesReceivedRequest, options?: Configuration): Promise<Array<ApiProfileProxy>> {
        return this.api.getProxiesReceived(param.identity,  options).toPromise();
    }

    /**
     * Get proxy by ID
     * @param param the request object
     */
    public getProxyByIdWithHttpInfo(param: ProxiesApiGetProxyByIdRequest, options?: Configuration): Promise<HttpInfo<ApiProfileProxy>> {
        return this.api.getProxyByIdWithHttpInfo(param.proxyId,  options).toPromise();
    }

    /**
     * Get proxy by ID
     * @param param the request object
     */
    public getProxyById(param: ProxiesApiGetProxyByIdRequest, options?: Configuration): Promise<ApiProfileProxy> {
        return this.api.getProxyById(param.proxyId,  options).toPromise();
    }

    /**
     * Update action
     * @param param the request object
     */
    public updateActionWithHttpInfo(param: ProxiesApiUpdateActionRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.updateActionWithHttpInfo(param.proxyId, param.actionId, param.apiUpdateProxyActionRequest,  options).toPromise();
    }

    /**
     * Update action
     * @param param the request object
     */
    public updateAction(param: ProxiesApiUpdateActionRequest, options?: Configuration): Promise<void> {
        return this.api.updateAction(param.proxyId, param.actionId, param.apiUpdateProxyActionRequest,  options).toPromise();
    }

}

import { ObservablePushNotificationsApi } from "./ObservableAPI";
import { PushNotificationsApiRequestFactory, PushNotificationsApiResponseProcessor} from "../apis/PushNotificationsApi";

export interface PushNotificationsApiDeleteDeviceRequest {
    /**
     * The device ID to delete
     * Defaults to: undefined
     * @type string
     * @memberof PushNotificationsApideleteDevice
     */
    deviceId: string
}

export interface PushNotificationsApiGetDevicesRequest {
}

export interface PushNotificationsApiGetPushNotificationSettingsRequest {
    /**
     * The device ID to get settings for
     * Defaults to: undefined
     * @type string
     * @memberof PushNotificationsApigetPushNotificationSettings
     */
    deviceId: string
}

export interface PushNotificationsApiRegisterPushNotificationTokenRequest {
    /**
     * 
     * @type ApiRegisterPushNotificationTokenRequest
     * @memberof PushNotificationsApiregisterPushNotificationToken
     */
    apiRegisterPushNotificationTokenRequest: ApiRegisterPushNotificationTokenRequest
}

export interface PushNotificationsApiUpdatePushNotificationSettingsRequest {
    /**
     * The device ID to update settings for
     * Defaults to: undefined
     * @type string
     * @memberof PushNotificationsApiupdatePushNotificationSettings
     */
    deviceId: string
    /**
     * 
     * @type ApiPushNotificationSettingsUpdate
     * @memberof PushNotificationsApiupdatePushNotificationSettings
     */
    apiPushNotificationSettingsUpdate: ApiPushNotificationSettingsUpdate
}

export class ObjectPushNotificationsApi {
    private api: ObservablePushNotificationsApi

    public constructor(configuration: Configuration, requestFactory?: PushNotificationsApiRequestFactory, responseProcessor?: PushNotificationsApiResponseProcessor) {
        this.api = new ObservablePushNotificationsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Delete a registered device
     * @param param the request object
     */
    public deleteDeviceWithHttpInfo(param: PushNotificationsApiDeleteDeviceRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.deleteDeviceWithHttpInfo(param.deviceId,  options).toPromise();
    }

    /**
     * Delete a registered device
     * @param param the request object
     */
    public deleteDevice(param: PushNotificationsApiDeleteDeviceRequest, options?: Configuration): Promise<void> {
        return this.api.deleteDevice(param.deviceId,  options).toPromise();
    }

    /**
     * Get all registered devices for the authenticated user
     * @param param the request object
     */
    public getDevicesWithHttpInfo(param: PushNotificationsApiGetDevicesRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiPushNotificationDevice>>> {
        return this.api.getDevicesWithHttpInfo( options).toPromise();
    }

    /**
     * Get all registered devices for the authenticated user
     * @param param the request object
     */
    public getDevices(param: PushNotificationsApiGetDevicesRequest = {}, options?: Configuration): Promise<Array<ApiPushNotificationDevice>> {
        return this.api.getDevices( options).toPromise();
    }

    /**
     * Get push notification settings for a device
     * @param param the request object
     */
    public getPushNotificationSettingsWithHttpInfo(param: PushNotificationsApiGetPushNotificationSettingsRequest, options?: Configuration): Promise<HttpInfo<ApiPushNotificationSettings>> {
        return this.api.getPushNotificationSettingsWithHttpInfo(param.deviceId,  options).toPromise();
    }

    /**
     * Get push notification settings for a device
     * @param param the request object
     */
    public getPushNotificationSettings(param: PushNotificationsApiGetPushNotificationSettingsRequest, options?: Configuration): Promise<ApiPushNotificationSettings> {
        return this.api.getPushNotificationSettings(param.deviceId,  options).toPromise();
    }

    /**
     * Register a push notification token
     * @param param the request object
     */
    public registerPushNotificationTokenWithHttpInfo(param: PushNotificationsApiRegisterPushNotificationTokenRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.registerPushNotificationTokenWithHttpInfo(param.apiRegisterPushNotificationTokenRequest,  options).toPromise();
    }

    /**
     * Register a push notification token
     * @param param the request object
     */
    public registerPushNotificationToken(param: PushNotificationsApiRegisterPushNotificationTokenRequest, options?: Configuration): Promise<void> {
        return this.api.registerPushNotificationToken(param.apiRegisterPushNotificationTokenRequest,  options).toPromise();
    }

    /**
     * Update push notification settings for a device
     * @param param the request object
     */
    public updatePushNotificationSettingsWithHttpInfo(param: PushNotificationsApiUpdatePushNotificationSettingsRequest, options?: Configuration): Promise<HttpInfo<ApiPushNotificationSettings>> {
        return this.api.updatePushNotificationSettingsWithHttpInfo(param.deviceId, param.apiPushNotificationSettingsUpdate,  options).toPromise();
    }

    /**
     * Update push notification settings for a device
     * @param param the request object
     */
    public updatePushNotificationSettings(param: PushNotificationsApiUpdatePushNotificationSettingsRequest, options?: Configuration): Promise<ApiPushNotificationSettings> {
        return this.api.updatePushNotificationSettings(param.deviceId, param.apiPushNotificationSettingsUpdate,  options).toPromise();
    }

}

import { ObservableRatingsApi } from "./ObservableAPI";
import { RatingsApiRequestFactory, RatingsApiResponseProcessor} from "../apis/RatingsApi";

export interface RatingsApiBulkRateRequest {
    /**
     * 
     * @type ApiBulkRateRequest
     * @memberof RatingsApibulkRate
     */
    apiBulkRateRequest: ApiBulkRateRequest
}

export interface RatingsApiBulkRepRequest {
    /**
     * 
     * @type ApiBulkRepRequest
     * @memberof RatingsApibulkRep
     */
    apiBulkRepRequest: ApiBulkRepRequest
}

export interface RatingsApiGetCreditLeftRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof RatingsApigetCreditLeft
     */
    rater: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof RatingsApigetCreditLeft
     */
    raterRepresentative?: string
}

export class ObjectRatingsApi {
    private api: ObservableRatingsApi

    public constructor(configuration: Configuration, requestFactory?: RatingsApiRequestFactory, responseProcessor?: RatingsApiResponseProcessor) {
        this.api = new ObservableRatingsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * This is deprecated. Use bulk-rep instead. Bulk rate. Supplied amount will be added to all target identities. If same identity is supplied multiple times, all the additions will be summed up. Targets must be represented as Ethereum wallet addresses. ENS names and profile handles are not supported.
     * @param param the request object
     */
    public bulkRateWithHttpInfo(param: RatingsApiBulkRateRequest, options?: Configuration): Promise<HttpInfo<ApiBulkRateResponse>> {
        return this.api.bulkRateWithHttpInfo(param.apiBulkRateRequest,  options).toPromise();
    }

    /**
     * This is deprecated. Use bulk-rep instead. Bulk rate. Supplied amount will be added to all target identities. If same identity is supplied multiple times, all the additions will be summed up. Targets must be represented as Ethereum wallet addresses. ENS names and profile handles are not supported.
     * @param param the request object
     */
    public bulkRate(param: RatingsApiBulkRateRequest, options?: Configuration): Promise<ApiBulkRateResponse> {
        return this.api.bulkRate(param.apiBulkRateRequest,  options).toPromise();
    }

    /**
     * Change REP rating of multiple targets and categories in one go. Targets  final REP value will be the value you supply here. If you supply multiple  addresses for one consolidation group then those amounts will be summed together.
     * @param param the request object
     */
    public bulkRepWithHttpInfo(param: RatingsApiBulkRepRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.bulkRepWithHttpInfo(param.apiBulkRepRequest,  options).toPromise();
    }

    /**
     * Change REP rating of multiple targets and categories in one go. Targets  final REP value will be the value you supply here. If you supply multiple  addresses for one consolidation group then those amounts will be summed together.
     * @param param the request object
     */
    public bulkRep(param: RatingsApiBulkRepRequest, options?: Configuration): Promise<void> {
        return this.api.bulkRep(param.apiBulkRepRequest,  options).toPromise();
    }

    /**
     * Get available credit for rating
     * @param param the request object
     */
    public getCreditLeftWithHttpInfo(param: RatingsApiGetCreditLeftRequest, options?: Configuration): Promise<HttpInfo<ApiAvailableRatingCredit>> {
        return this.api.getCreditLeftWithHttpInfo(param.rater, param.raterRepresentative,  options).toPromise();
    }

    /**
     * Get available credit for rating
     * @param param the request object
     */
    public getCreditLeft(param: RatingsApiGetCreditLeftRequest, options?: Configuration): Promise<ApiAvailableRatingCredit> {
        return this.api.getCreditLeft(param.rater, param.raterRepresentative,  options).toPromise();
    }

}

import { ObservableSubscriptionsApi } from "./ObservableAPI";
import { SubscriptionsApiRequestFactory, SubscriptionsApiResponseProcessor} from "../apis/SubscriptionsApi";

export interface SubscriptionsApiGetAirdropAddressRequest {
    /**
     * Consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApigetAirdropAddress
     */
    consolidationKey: string
}

export interface SubscriptionsApiGetFinalSubscriptionRequest {
    /**
     * Consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApigetFinalSubscription
     */
    consolidationKey: string
    /**
     * Contract address
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApigetFinalSubscription
     */
    contract: string
    /**
     * Token ID
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetFinalSubscription
     */
    tokenId: number
}

export interface SubscriptionsApiGetIncomingSubscriptionsForTargetRequest {
    /**
     * 
     * Defaults to: undefined
     * @type &#39;IDENTITY&#39; | &#39;WAVE&#39; | &#39;DROP&#39;
     * @memberof SubscriptionsApigetIncomingSubscriptionsForTarget
     */
    targetType: 'IDENTITY' | 'WAVE' | 'DROP'
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApigetIncomingSubscriptionsForTarget
     */
    targetId: string
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 10
     * @type number
     * @memberof SubscriptionsApigetIncomingSubscriptionsForTarget
     */
    pageSize?: number
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof SubscriptionsApigetIncomingSubscriptionsForTarget
     */
    page?: number
}

export interface SubscriptionsApiGetOutgoingSubscriptionsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type &#39;IDENTITY&#39; | &#39;WAVE&#39; | &#39;DROP&#39;
     * @memberof SubscriptionsApigetOutgoingSubscriptions
     */
    targetType: 'IDENTITY' | 'WAVE' | 'DROP'
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 10
     * @type number
     * @memberof SubscriptionsApigetOutgoingSubscriptions
     */
    pageSize?: number
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof SubscriptionsApigetOutgoingSubscriptions
     */
    page?: number
}

export interface SubscriptionsApiGetRedeemedMemeSubscriptionCountsRequest {
    /**
     * Default is 20
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetRedeemedMemeSubscriptionCounts
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetRedeemedMemeSubscriptionCounts
     */
    page?: number
}

export interface SubscriptionsApiGetRedeemedSubscriptionsRequest {
    /**
     * Consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApigetRedeemedSubscriptions
     */
    consolidationKey: string
    /**
     * Default is 20
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetRedeemedSubscriptions
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetRedeemedSubscriptions
     */
    page?: number
}

export interface SubscriptionsApiGetSubscriptionDetailsRequest {
    /**
     * Consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApigetSubscriptionDetails
     */
    consolidationKey: string
}

export interface SubscriptionsApiGetSubscriptionLogsRequest {
    /**
     * Consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApigetSubscriptionLogs
     */
    consolidationKey: string
    /**
     * Default is 20
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetSubscriptionLogs
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetSubscriptionLogs
     */
    page?: number
}

export interface SubscriptionsApiGetSubscriptionTopUpsRequest {
    /**
     * Consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApigetSubscriptionTopUps
     */
    consolidationKey: string
    /**
     * Default is 20
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetSubscriptionTopUps
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetSubscriptionTopUps
     */
    page?: number
}

export interface SubscriptionsApiGetSubscriptionUploadsRequest {
    /**
     * Contract address (required)
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApigetSubscriptionUploads
     */
    contract: string
    /**
     * Default is 20
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetSubscriptionUploads
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetSubscriptionUploads
     */
    page?: number
}

export interface SubscriptionsApiGetUpcomingMemeSubscriptionCountsRequest {
    /**
     * Number of upcoming cards to fetch. Default is 3
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetUpcomingMemeSubscriptionCounts
     */
    cardCount?: number
}

export interface SubscriptionsApiGetUpcomingMemeSubscriptionStatusRequest {
    /**
     * Meme token id
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetUpcomingMemeSubscriptionStatus
     */
    memeId: number
    /**
     * Consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApigetUpcomingMemeSubscriptionStatus
     */
    consolidationKey: string
}

export interface SubscriptionsApiGetUpcomingMemeSubscriptionsRequest {
    /**
     * Consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApigetUpcomingMemeSubscriptions
     */
    consolidationKey: string
    /**
     * Number of upcoming cards to fetch. Default is 3
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof SubscriptionsApigetUpcomingMemeSubscriptions
     */
    cardCount?: number
}

export interface SubscriptionsApiUpdateSubscribeAllEditionsRequest {
    /**
     * Consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApiupdateSubscribeAllEditions
     */
    consolidationKey: string
    /**
     * 
     * @type UpdateSubscribeAllEditionsRequest
     * @memberof SubscriptionsApiupdateSubscribeAllEditions
     */
    updateSubscribeAllEditionsRequest: UpdateSubscribeAllEditionsRequest
}

export interface SubscriptionsApiUpdateSubscriptionRequest {
    /**
     * Consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApiupdateSubscription
     */
    consolidationKey: string
    /**
     * 
     * @type UpdateSubscriptionRequest
     * @memberof SubscriptionsApiupdateSubscription
     */
    updateSubscriptionRequest: UpdateSubscriptionRequest
}

export interface SubscriptionsApiUpdateSubscriptionCountRequest {
    /**
     * Consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApiupdateSubscriptionCount
     */
    consolidationKey: string
    /**
     * 
     * @type UpdateSubscriptionCountRequest
     * @memberof SubscriptionsApiupdateSubscriptionCount
     */
    updateSubscriptionCountRequest: UpdateSubscriptionCountRequest
}

export interface SubscriptionsApiUpdateSubscriptionModeRequest {
    /**
     * Consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof SubscriptionsApiupdateSubscriptionMode
     */
    consolidationKey: string
    /**
     * 
     * @type UpdateSubscriptionModeRequest
     * @memberof SubscriptionsApiupdateSubscriptionMode
     */
    updateSubscriptionModeRequest: UpdateSubscriptionModeRequest
}

export class ObjectSubscriptionsApi {
    private api: ObservableSubscriptionsApi

    public constructor(configuration: Configuration, requestFactory?: SubscriptionsApiRequestFactory, responseProcessor?: SubscriptionsApiResponseProcessor) {
        this.api = new ObservableSubscriptionsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get airdrop address for a consolidation
     * @param param the request object
     */
    public getAirdropAddressWithHttpInfo(param: SubscriptionsApiGetAirdropAddressRequest, options?: Configuration): Promise<HttpInfo<AirdropAddressResponse>> {
        return this.api.getAirdropAddressWithHttpInfo(param.consolidationKey,  options).toPromise();
    }

    /**
     * Get airdrop address for a consolidation
     * @param param the request object
     */
    public getAirdropAddress(param: SubscriptionsApiGetAirdropAddressRequest, options?: Configuration): Promise<AirdropAddressResponse> {
        return this.api.getAirdropAddress(param.consolidationKey,  options).toPromise();
    }

    /**
     * Get final subscription for a consolidation
     * @param param the request object
     */
    public getFinalSubscriptionWithHttpInfo(param: SubscriptionsApiGetFinalSubscriptionRequest, options?: Configuration): Promise<HttpInfo<NFTFinalSubscription>> {
        return this.api.getFinalSubscriptionWithHttpInfo(param.consolidationKey, param.contract, param.tokenId,  options).toPromise();
    }

    /**
     * Get final subscription for a consolidation
     * @param param the request object
     */
    public getFinalSubscription(param: SubscriptionsApiGetFinalSubscriptionRequest, options?: Configuration): Promise<NFTFinalSubscription> {
        return this.api.getFinalSubscription(param.consolidationKey, param.contract, param.tokenId,  options).toPromise();
    }

    /**
     * Get identities subscribed to target.
     * @param param the request object
     */
    public getIncomingSubscriptionsForTargetWithHttpInfo(param: SubscriptionsApiGetIncomingSubscriptionsForTargetRequest, options?: Configuration): Promise<HttpInfo<Array<ApiIncomingIdentitySubscriptionsPage>>> {
        return this.api.getIncomingSubscriptionsForTargetWithHttpInfo(param.targetType, param.targetId, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get identities subscribed to target.
     * @param param the request object
     */
    public getIncomingSubscriptionsForTarget(param: SubscriptionsApiGetIncomingSubscriptionsForTargetRequest, options?: Configuration): Promise<Array<ApiIncomingIdentitySubscriptionsPage>> {
        return this.api.getIncomingSubscriptionsForTarget(param.targetType, param.targetId, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get outgoing subscriptions for authenticated user.
     * @param param the request object
     */
    public getOutgoingSubscriptionsWithHttpInfo(param: SubscriptionsApiGetOutgoingSubscriptionsRequest, options?: Configuration): Promise<HttpInfo<Array<ApiOutgoingIdentitySubscriptionsPage>>> {
        return this.api.getOutgoingSubscriptionsWithHttpInfo(param.targetType, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get outgoing subscriptions for authenticated user.
     * @param param the request object
     */
    public getOutgoingSubscriptions(param: SubscriptionsApiGetOutgoingSubscriptionsRequest, options?: Configuration): Promise<Array<ApiOutgoingIdentitySubscriptionsPage>> {
        return this.api.getOutgoingSubscriptions(param.targetType, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get redeemed meme subscription counts
     * @param param the request object
     */
    public getRedeemedMemeSubscriptionCountsWithHttpInfo(param: SubscriptionsApiGetRedeemedMemeSubscriptionCountsRequest = {}, options?: Configuration): Promise<HttpInfo<RedeemedSubscriptionCountsPage>> {
        return this.api.getRedeemedMemeSubscriptionCountsWithHttpInfo(param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get redeemed meme subscription counts
     * @param param the request object
     */
    public getRedeemedMemeSubscriptionCounts(param: SubscriptionsApiGetRedeemedMemeSubscriptionCountsRequest = {}, options?: Configuration): Promise<RedeemedSubscriptionCountsPage> {
        return this.api.getRedeemedMemeSubscriptionCounts(param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get redeemed subscriptions for a consolidation
     * @param param the request object
     */
    public getRedeemedSubscriptionsWithHttpInfo(param: SubscriptionsApiGetRedeemedSubscriptionsRequest, options?: Configuration): Promise<HttpInfo<RedeemedSubscriptionPage>> {
        return this.api.getRedeemedSubscriptionsWithHttpInfo(param.consolidationKey, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get redeemed subscriptions for a consolidation
     * @param param the request object
     */
    public getRedeemedSubscriptions(param: SubscriptionsApiGetRedeemedSubscriptionsRequest, options?: Configuration): Promise<RedeemedSubscriptionPage> {
        return this.api.getRedeemedSubscriptions(param.consolidationKey, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get subscription details for a consolidation
     * @param param the request object
     */
    public getSubscriptionDetailsWithHttpInfo(param: SubscriptionsApiGetSubscriptionDetailsRequest, options?: Configuration): Promise<HttpInfo<SubscriptionDetails>> {
        return this.api.getSubscriptionDetailsWithHttpInfo(param.consolidationKey,  options).toPromise();
    }

    /**
     * Get subscription details for a consolidation
     * @param param the request object
     */
    public getSubscriptionDetails(param: SubscriptionsApiGetSubscriptionDetailsRequest, options?: Configuration): Promise<SubscriptionDetails> {
        return this.api.getSubscriptionDetails(param.consolidationKey,  options).toPromise();
    }

    /**
     * Get subscription logs for a consolidation
     * @param param the request object
     */
    public getSubscriptionLogsWithHttpInfo(param: SubscriptionsApiGetSubscriptionLogsRequest, options?: Configuration): Promise<HttpInfo<SubscriptionLogPage>> {
        return this.api.getSubscriptionLogsWithHttpInfo(param.consolidationKey, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get subscription logs for a consolidation
     * @param param the request object
     */
    public getSubscriptionLogs(param: SubscriptionsApiGetSubscriptionLogsRequest, options?: Configuration): Promise<SubscriptionLogPage> {
        return this.api.getSubscriptionLogs(param.consolidationKey, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get top-ups for a consolidation
     * @param param the request object
     */
    public getSubscriptionTopUpsWithHttpInfo(param: SubscriptionsApiGetSubscriptionTopUpsRequest, options?: Configuration): Promise<HttpInfo<SubscriptionTopUpPage>> {
        return this.api.getSubscriptionTopUpsWithHttpInfo(param.consolidationKey, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get top-ups for a consolidation
     * @param param the request object
     */
    public getSubscriptionTopUps(param: SubscriptionsApiGetSubscriptionTopUpsRequest, options?: Configuration): Promise<SubscriptionTopUpPage> {
        return this.api.getSubscriptionTopUps(param.consolidationKey, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get subscription uploads
     * @param param the request object
     */
    public getSubscriptionUploadsWithHttpInfo(param: SubscriptionsApiGetSubscriptionUploadsRequest, options?: Configuration): Promise<HttpInfo<NFTFinalSubscriptionUploadPage>> {
        return this.api.getSubscriptionUploadsWithHttpInfo(param.contract, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get subscription uploads
     * @param param the request object
     */
    public getSubscriptionUploads(param: SubscriptionsApiGetSubscriptionUploadsRequest, options?: Configuration): Promise<NFTFinalSubscriptionUploadPage> {
        return this.api.getSubscriptionUploads(param.contract, param.pageSize, param.page,  options).toPromise();
    }

    /**
     * Get upcoming meme subscription counts
     * @param param the request object
     */
    public getUpcomingMemeSubscriptionCountsWithHttpInfo(param: SubscriptionsApiGetUpcomingMemeSubscriptionCountsRequest = {}, options?: Configuration): Promise<HttpInfo<Array<SubscriptionCounts>>> {
        return this.api.getUpcomingMemeSubscriptionCountsWithHttpInfo(param.cardCount,  options).toPromise();
    }

    /**
     * Get upcoming meme subscription counts
     * @param param the request object
     */
    public getUpcomingMemeSubscriptionCounts(param: SubscriptionsApiGetUpcomingMemeSubscriptionCountsRequest = {}, options?: Configuration): Promise<Array<SubscriptionCounts>> {
        return this.api.getUpcomingMemeSubscriptionCounts(param.cardCount,  options).toPromise();
    }

    /**
     * Get upcoming meme subscription status for a consolidation
     * @param param the request object
     */
    public getUpcomingMemeSubscriptionStatusWithHttpInfo(param: SubscriptionsApiGetUpcomingMemeSubscriptionStatusRequest, options?: Configuration): Promise<HttpInfo<ApiUpcomingMemeSubscriptionStatus>> {
        return this.api.getUpcomingMemeSubscriptionStatusWithHttpInfo(param.memeId, param.consolidationKey,  options).toPromise();
    }

    /**
     * Get upcoming meme subscription status for a consolidation
     * @param param the request object
     */
    public getUpcomingMemeSubscriptionStatus(param: SubscriptionsApiGetUpcomingMemeSubscriptionStatusRequest, options?: Configuration): Promise<ApiUpcomingMemeSubscriptionStatus> {
        return this.api.getUpcomingMemeSubscriptionStatus(param.memeId, param.consolidationKey,  options).toPromise();
    }

    /**
     * Get upcoming meme subscriptions for a consolidation
     * @param param the request object
     */
    public getUpcomingMemeSubscriptionsWithHttpInfo(param: SubscriptionsApiGetUpcomingMemeSubscriptionsRequest, options?: Configuration): Promise<HttpInfo<Array<NFTSubscription>>> {
        return this.api.getUpcomingMemeSubscriptionsWithHttpInfo(param.consolidationKey, param.cardCount,  options).toPromise();
    }

    /**
     * Get upcoming meme subscriptions for a consolidation
     * @param param the request object
     */
    public getUpcomingMemeSubscriptions(param: SubscriptionsApiGetUpcomingMemeSubscriptionsRequest, options?: Configuration): Promise<Array<NFTSubscription>> {
        return this.api.getUpcomingMemeSubscriptions(param.consolidationKey, param.cardCount,  options).toPromise();
    }

    /**
     * Requires authentication. User can only change this setting for their own consolidation.
     * Toggle subscribe all editions preference
     * @param param the request object
     */
    public updateSubscribeAllEditionsWithHttpInfo(param: SubscriptionsApiUpdateSubscribeAllEditionsRequest, options?: Configuration): Promise<HttpInfo<SubscribeAllEditionsResponse>> {
        return this.api.updateSubscribeAllEditionsWithHttpInfo(param.consolidationKey, param.updateSubscribeAllEditionsRequest,  options).toPromise();
    }

    /**
     * Requires authentication. User can only change this setting for their own consolidation.
     * Toggle subscribe all editions preference
     * @param param the request object
     */
    public updateSubscribeAllEditions(param: SubscriptionsApiUpdateSubscribeAllEditionsRequest, options?: Configuration): Promise<SubscribeAllEditionsResponse> {
        return this.api.updateSubscribeAllEditions(param.consolidationKey, param.updateSubscribeAllEditionsRequest,  options).toPromise();
    }

    /**
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription for a specific NFT
     * @param param the request object
     */
    public updateSubscriptionWithHttpInfo(param: SubscriptionsApiUpdateSubscriptionRequest, options?: Configuration): Promise<HttpInfo<SubscriptionResponse>> {
        return this.api.updateSubscriptionWithHttpInfo(param.consolidationKey, param.updateSubscriptionRequest,  options).toPromise();
    }

    /**
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription for a specific NFT
     * @param param the request object
     */
    public updateSubscription(param: SubscriptionsApiUpdateSubscriptionRequest, options?: Configuration): Promise<SubscriptionResponse> {
        return this.api.updateSubscription(param.consolidationKey, param.updateSubscriptionRequest,  options).toPromise();
    }

    /**
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription count for a specific NFT
     * @param param the request object
     */
    public updateSubscriptionCountWithHttpInfo(param: SubscriptionsApiUpdateSubscriptionCountRequest, options?: Configuration): Promise<HttpInfo<SubscriptionCountResponse>> {
        return this.api.updateSubscriptionCountWithHttpInfo(param.consolidationKey, param.updateSubscriptionCountRequest,  options).toPromise();
    }

    /**
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription count for a specific NFT
     * @param param the request object
     */
    public updateSubscriptionCount(param: SubscriptionsApiUpdateSubscriptionCountRequest, options?: Configuration): Promise<SubscriptionCountResponse> {
        return this.api.updateSubscriptionCount(param.consolidationKey, param.updateSubscriptionCountRequest,  options).toPromise();
    }

    /**
     * Requires authentication. User can only change subscription mode for their own consolidation.
     * Update subscription mode
     * @param param the request object
     */
    public updateSubscriptionModeWithHttpInfo(param: SubscriptionsApiUpdateSubscriptionModeRequest, options?: Configuration): Promise<HttpInfo<SubscriptionModeResponse>> {
        return this.api.updateSubscriptionModeWithHttpInfo(param.consolidationKey, param.updateSubscriptionModeRequest,  options).toPromise();
    }

    /**
     * Requires authentication. User can only change subscription mode for their own consolidation.
     * Update subscription mode
     * @param param the request object
     */
    public updateSubscriptionMode(param: SubscriptionsApiUpdateSubscriptionModeRequest, options?: Configuration): Promise<SubscriptionModeResponse> {
        return this.api.updateSubscriptionMode(param.consolidationKey, param.updateSubscriptionModeRequest,  options).toPromise();
    }

}

import { ObservableTDHApi } from "./ObservableAPI";
import { TDHApiRequestFactory, TDHApiResponseProcessor} from "../apis/TDHApi";

export interface TDHApiGetConsolidatedTdhRequest {
    /**
     * Profile handle, wallet address, ENS name, or consolidation key
     * Defaults to: undefined
     * @type string
     * @memberof TDHApigetConsolidatedTdh
     */
    identity: string
}

export class ObjectTDHApi {
    private api: ObservableTDHApi

    public constructor(configuration: Configuration, requestFactory?: TDHApiRequestFactory, responseProcessor?: TDHApiResponseProcessor) {
        this.api = new ObservableTDHApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Returns the consolidated TDH data for a given identity. The identity can be a profile handle, wallet address, ENS name, or consolidation key.
     * Get consolidated TDH for an identity
     * @param param the request object
     */
    public getConsolidatedTdhWithHttpInfo(param: TDHApiGetConsolidatedTdhRequest, options?: Configuration): Promise<HttpInfo<ApiConsolidatedTdh>> {
        return this.api.getConsolidatedTdhWithHttpInfo(param.identity,  options).toPromise();
    }

    /**
     * Returns the consolidated TDH data for a given identity. The identity can be a profile handle, wallet address, ENS name, or consolidation key.
     * Get consolidated TDH for an identity
     * @param param the request object
     */
    public getConsolidatedTdh(param: TDHApiGetConsolidatedTdhRequest, options?: Configuration): Promise<ApiConsolidatedTdh> {
        return this.api.getConsolidatedTdh(param.identity,  options).toPromise();
    }

}

import { ObservableTDHEditionsApi } from "./ObservableAPI";
import { TDHEditionsApiRequestFactory, TDHEditionsApiResponseProcessor} from "../apis/TDHEditionsApi";

export interface TDHEditionsApiGetTdhEditionsByConsolidationKeyRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TDHEditionsApigetTdhEditionsByConsolidationKey
     */
    consolidationKey: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TDHEditionsApigetTdhEditionsByConsolidationKey
     */
    contract?: string
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TDHEditionsApigetTdhEditionsByConsolidationKey
     */
    tokenId?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TDHEditionsApigetTdhEditionsByConsolidationKey
     */
    editionId?: number
    /**
     * 
     * Defaults to: &#39;id&#39;
     * @type &#39;id&#39; | &#39;hodl_rate&#39; | &#39;days_held&#39; | &#39;balance&#39; | &#39;edition_id&#39; | &#39;contract&#39;
     * @memberof TDHEditionsApigetTdhEditionsByConsolidationKey
     */
    sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract'
    /**
     * 
     * Defaults to: undefined
     * @type ApiPageSortDirection
     * @memberof TDHEditionsApigetTdhEditionsByConsolidationKey
     */
    sortDirection?: ApiPageSortDirection
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof TDHEditionsApigetTdhEditionsByConsolidationKey
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 50
     * @type number
     * @memberof TDHEditionsApigetTdhEditionsByConsolidationKey
     */
    pageSize?: number
}

export interface TDHEditionsApiGetTdhEditionsByIdentityRequest {
    /**
     * Identity handle, profile id, wallet address, or ENS name
     * Defaults to: undefined
     * @type string
     * @memberof TDHEditionsApigetTdhEditionsByIdentity
     */
    identity: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TDHEditionsApigetTdhEditionsByIdentity
     */
    contract?: string
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TDHEditionsApigetTdhEditionsByIdentity
     */
    tokenId?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TDHEditionsApigetTdhEditionsByIdentity
     */
    editionId?: number
    /**
     * 
     * Defaults to: &#39;id&#39;
     * @type &#39;id&#39; | &#39;hodl_rate&#39; | &#39;days_held&#39; | &#39;balance&#39; | &#39;edition_id&#39; | &#39;contract&#39;
     * @memberof TDHEditionsApigetTdhEditionsByIdentity
     */
    sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract'
    /**
     * 
     * Defaults to: undefined
     * @type ApiPageSortDirection
     * @memberof TDHEditionsApigetTdhEditionsByIdentity
     */
    sortDirection?: ApiPageSortDirection
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof TDHEditionsApigetTdhEditionsByIdentity
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 50
     * @type number
     * @memberof TDHEditionsApigetTdhEditionsByIdentity
     */
    pageSize?: number
}

export interface TDHEditionsApiGetTdhEditionsByWalletRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TDHEditionsApigetTdhEditionsByWallet
     */
    wallet: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof TDHEditionsApigetTdhEditionsByWallet
     */
    contract?: string
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TDHEditionsApigetTdhEditionsByWallet
     */
    tokenId?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof TDHEditionsApigetTdhEditionsByWallet
     */
    editionId?: number
    /**
     * 
     * Defaults to: &#39;id&#39;
     * @type &#39;id&#39; | &#39;hodl_rate&#39; | &#39;days_held&#39; | &#39;balance&#39; | &#39;edition_id&#39; | &#39;contract&#39;
     * @memberof TDHEditionsApigetTdhEditionsByWallet
     */
    sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract'
    /**
     * 
     * Defaults to: undefined
     * @type ApiPageSortDirection
     * @memberof TDHEditionsApigetTdhEditionsByWallet
     */
    sortDirection?: ApiPageSortDirection
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof TDHEditionsApigetTdhEditionsByWallet
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 50
     * @type number
     * @memberof TDHEditionsApigetTdhEditionsByWallet
     */
    pageSize?: number
}

export class ObjectTDHEditionsApi {
    private api: ObservableTDHEditionsApi

    public constructor(configuration: Configuration, requestFactory?: TDHEditionsApiRequestFactory, responseProcessor?: TDHEditionsApiResponseProcessor) {
        this.api = new ObservableTDHEditionsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get TDH editions by consolidation key
     * @param param the request object
     */
    public getTdhEditionsByConsolidationKeyWithHttpInfo(param: TDHEditionsApiGetTdhEditionsByConsolidationKeyRequest, options?: Configuration): Promise<HttpInfo<ApiTdhEditionsPage>> {
        return this.api.getTdhEditionsByConsolidationKeyWithHttpInfo(param.consolidationKey, param.contract, param.tokenId, param.editionId, param.sort, param.sortDirection, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get TDH editions by consolidation key
     * @param param the request object
     */
    public getTdhEditionsByConsolidationKey(param: TDHEditionsApiGetTdhEditionsByConsolidationKeyRequest, options?: Configuration): Promise<ApiTdhEditionsPage> {
        return this.api.getTdhEditionsByConsolidationKey(param.consolidationKey, param.contract, param.tokenId, param.editionId, param.sort, param.sortDirection, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get TDH editions for an identity, wallet address, or ENS
     * @param param the request object
     */
    public getTdhEditionsByIdentityWithHttpInfo(param: TDHEditionsApiGetTdhEditionsByIdentityRequest, options?: Configuration): Promise<HttpInfo<ApiTdhEditionsPage>> {
        return this.api.getTdhEditionsByIdentityWithHttpInfo(param.identity, param.contract, param.tokenId, param.editionId, param.sort, param.sortDirection, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get TDH editions for an identity, wallet address, or ENS
     * @param param the request object
     */
    public getTdhEditionsByIdentity(param: TDHEditionsApiGetTdhEditionsByIdentityRequest, options?: Configuration): Promise<ApiTdhEditionsPage> {
        return this.api.getTdhEditionsByIdentity(param.identity, param.contract, param.tokenId, param.editionId, param.sort, param.sortDirection, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get TDH editions for a wallet
     * @param param the request object
     */
    public getTdhEditionsByWalletWithHttpInfo(param: TDHEditionsApiGetTdhEditionsByWalletRequest, options?: Configuration): Promise<HttpInfo<ApiTdhEditionsPage>> {
        return this.api.getTdhEditionsByWalletWithHttpInfo(param.wallet, param.contract, param.tokenId, param.editionId, param.sort, param.sortDirection, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get TDH editions for a wallet
     * @param param the request object
     */
    public getTdhEditionsByWallet(param: TDHEditionsApiGetTdhEditionsByWalletRequest, options?: Configuration): Promise<ApiTdhEditionsPage> {
        return this.api.getTdhEditionsByWallet(param.wallet, param.contract, param.tokenId, param.editionId, param.sort, param.sortDirection, param.page, param.pageSize,  options).toPromise();
    }

}

import { ObservableTransactionsApi } from "./ObservableAPI";
import { TransactionsApiRequestFactory, TransactionsApiResponseProcessor} from "../apis/TransactionsApi";

export interface TransactionsApiGetTransactionsRequest {
    /**
     * Default is 50
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof TransactionsApigetTransactions
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof TransactionsApigetTransactions
     */
    page?: number
    /**
     * Filter by wallet address
     * Defaults to: undefined
     * @type string
     * @memberof TransactionsApigetTransactions
     */
    wallets?: string
    /**
     * Filter by contract address
     * Defaults to: undefined
     * @type string
     * @memberof TransactionsApigetTransactions
     */
    contract?: string
    /**
     * Filter by NFT ID
     * Defaults to: undefined
     * @type string
     * @memberof TransactionsApigetTransactions
     */
    nfts?: string
    /**
     * Filter by transaction type
     * Defaults to: undefined
     * @type &#39;sales&#39; | &#39;purchases&#39; | &#39;transfers&#39; | &#39;airdrops&#39; | &#39;burns&#39;
     * @memberof TransactionsApigetTransactions
     */
    filter?: 'sales' | 'purchases' | 'transfers' | 'airdrops' | 'burns'
}

export class ObjectTransactionsApi {
    private api: ObservableTransactionsApi

    public constructor(configuration: Configuration, requestFactory?: TransactionsApiRequestFactory, responseProcessor?: TransactionsApiResponseProcessor) {
        this.api = new ObservableTransactionsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get transactions
     * @param param the request object
     */
    public getTransactionsWithHttpInfo(param: TransactionsApiGetTransactionsRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiTransactionPage>>> {
        return this.api.getTransactionsWithHttpInfo(param.pageSize, param.page, param.wallets, param.contract, param.nfts, param.filter,  options).toPromise();
    }

    /**
     * Get transactions
     * @param param the request object
     */
    public getTransactions(param: TransactionsApiGetTransactionsRequest = {}, options?: Configuration): Promise<Array<ApiTransactionPage>> {
        return this.api.getTransactions(param.pageSize, param.page, param.wallets, param.contract, param.nfts, param.filter,  options).toPromise();
    }

}

import { ObservableWavesApi } from "./ObservableAPI";
import { WavesApiRequestFactory, WavesApiResponseProcessor} from "../apis/WavesApi";

export interface WavesApiCreateDirectMessageWaveRequest {
    /**
     * 
     * @type CreateDirectMessageWaveRequest
     * @memberof WavesApicreateDirectMessageWave
     */
    createDirectMessageWaveRequest: CreateDirectMessageWaveRequest
}

export interface WavesApiCreateWaveRequest {
    /**
     * 
     * @type ApiCreateNewWave
     * @memberof WavesApicreateWave
     */
    apiCreateNewWave: ApiCreateNewWave
}

export interface WavesApiCreateWaveCurationGroupRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApicreateWaveCurationGroup
     */
    id: string
    /**
     * 
     * @type ApiWaveCurationGroupRequest
     * @memberof WavesApicreateWaveCurationGroup
     */
    apiWaveCurationGroupRequest: ApiWaveCurationGroupRequest
}

export interface WavesApiCreateWaveMediaUrlRequest {
    /**
     * 
     * @type ApiCreateMediaUploadUrlRequest
     * @memberof WavesApicreateWaveMediaUrl
     */
    apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest
}

export interface WavesApiDeleteWaveByIdRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApideleteWaveById
     */
    id: string
}

export interface WavesApiDeleteWaveCurationGroupRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApideleteWaveCurationGroup
     */
    id: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApideleteWaveCurationGroup
     */
    curationGroupId: string
}

export interface WavesApiDeleteWaveDecisionPauseRequest {
    /**
     * wave id
     * Defaults to: undefined
     * @type string
     * @memberof WavesApideleteWaveDecisionPause
     */
    waveId: string
    /**
     * pause id
     * Defaults to: undefined
     * @type number
     * @memberof WavesApideleteWaveDecisionPause
     */
    id: number
}

export interface WavesApiGetDropLogsRequest {
    /**
     * Filter by wave ID
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetDropLogs
     */
    id: string
    /**
     * Filter by log type (comma separated)
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetDropLogs
     */
    logTypes?: string
    /**
     * Filter by drop ID
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetDropLogs
     */
    dropId?: string
    /**
     * 
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof WavesApigetDropLogs
     */
    offset?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 20
     * @type number
     * @memberof WavesApigetDropLogs
     */
    limit?: number
    /**
     * Default is DESC
     * Defaults to: undefined
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof WavesApigetDropLogs
     */
    sortDirection?: 'ASC' | 'DESC'
}

export interface WavesApiGetDropsOfWaveRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetDropsOfWave
     */
    id: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetDropsOfWave
     */
    dropId?: string
    /**
     * 
     * Minimum: 1
     * Maximum: 200
     * Defaults to: 20
     * @type number
     * @memberof WavesApigetDropsOfWave
     */
    limit?: number
    /**
     * Use instead of serial_no_less_than. If you use serial_no_less_than and this then serial_no_less_than is preferred (until future when it\&quot;s deleted)
     * Defaults to: undefined
     * @type number
     * @memberof WavesApigetDropsOfWave
     */
    serialNoLimit?: number
    /**
     * Use in combination with serial_no_limit. If this not set then FIND_OLDER is used. If serial_no_less_than is set then this is ignored.
     * Defaults to: undefined
     * @type ApiDropSearchStrategy
     * @memberof WavesApigetDropsOfWave
     */
    searchStrategy?: ApiDropSearchStrategy
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof WavesApigetDropsOfWave
     */
    serialNoLessThan?: number
    /**
     * Filter by drop type
     * Defaults to: undefined
     * @type ApiDropType
     * @memberof WavesApigetDropsOfWave
     */
    dropType?: ApiDropType
}

export interface WavesApiGetHotWavesOverviewRequest {
}

export interface WavesApiGetWaveByIdRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaveById
     */
    id: string
}

export interface WavesApiGetWaveDecisionsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaveDecisions
     */
    id: string
    /**
     * 
     * Defaults to: &#39;DESC&#39;
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof WavesApigetWaveDecisions
     */
    sortDirection?: 'ASC' | 'DESC'
    /**
     * 
     * Defaults to: &#39;decision_time&#39;
     * @type &#39;decision_time&#39;
     * @memberof WavesApigetWaveDecisions
     */
    sort?: 'decision_time'
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof WavesApigetWaveDecisions
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 2000
     * Defaults to: 100
     * @type number
     * @memberof WavesApigetWaveDecisions
     */
    pageSize?: number
}

export interface WavesApiGetWaveLeaderboardRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaveLeaderboard
     */
    id: string
    /**
     * Default is 50
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof WavesApigetWaveLeaderboard
     */
    pageSize?: number
    /**
     * Default is 1
     * Minimum: 1
     * Defaults to: undefined
     * @type number
     * @memberof WavesApigetWaveLeaderboard
     */
    page?: number
    /**
     * Default is ASC
     * Defaults to: undefined
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof WavesApigetWaveLeaderboard
     */
    sortDirection?: 'ASC' | 'DESC'
    /**
     * Default is rank
     * Defaults to: undefined
     * @type &#39;RANK&#39; | &#39;REALTIME_VOTE&#39; | &#39;MY_REALTIME_VOTE&#39; | &#39;CREATED_AT&#39; | &#39;PRICE&#39; | &#39;RATING_PREDICTION&#39; | &#39;TREND&#39;
     * @memberof WavesApigetWaveLeaderboard
     */
    sort?: 'RANK' | 'REALTIME_VOTE' | 'MY_REALTIME_VOTE' | 'CREATED_AT' | 'PRICE' | 'RATING_PREDICTION' | 'TREND'
    /**
     * Optional currency used for min_price/max_price filtering and PRICE sorting
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaveLeaderboard
     */
    priceCurrency?: string
    /**
     * Optional minimum price filter applied to leaderboard results
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof WavesApigetWaveLeaderboard
     */
    minPrice?: number
    /**
     * Optional maximum price filter applied to leaderboard results
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof WavesApigetWaveLeaderboard
     */
    maxPrice?: number
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaveLeaderboard
     */
    curatedByGroup?: string
}

export interface WavesApiGetWaveOutcomeDistributionRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaveOutcomeDistribution
     */
    waveId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaveOutcomeDistribution
     */
    outcomeIndex: string
    /**
     * 
     * Defaults to: &#39;DESC&#39;
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof WavesApigetWaveOutcomeDistribution
     */
    sortDirection?: 'ASC' | 'DESC'
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof WavesApigetWaveOutcomeDistribution
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 2000
     * Defaults to: 100
     * @type number
     * @memberof WavesApigetWaveOutcomeDistribution
     */
    pageSize?: number
}

export interface WavesApiGetWaveOutcomesRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaveOutcomes
     */
    waveId: string
    /**
     * 
     * Defaults to: &#39;DESC&#39;
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof WavesApigetWaveOutcomes
     */
    sortDirection?: 'ASC' | 'DESC'
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof WavesApigetWaveOutcomes
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 2000
     * Defaults to: 100
     * @type number
     * @memberof WavesApigetWaveOutcomes
     */
    pageSize?: number
}

export interface WavesApiGetWaveVotersInfoRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaveVotersInfo
     */
    id: string
    /**
     * If set then you\&quot;ll get stats for specific drop
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaveVotersInfo
     */
    dropId?: string
    /**
     * 
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof WavesApigetWaveVotersInfo
     */
    page?: number
    /**
     * Default is 20
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof WavesApigetWaveVotersInfo
     */
    pageSize?: number
    /**
     * Default is ASC
     * Defaults to: undefined
     * @type &#39;ASC&#39; | &#39;DESC&#39;
     * @memberof WavesApigetWaveVotersInfo
     */
    sortDirection?: 'ASC' | 'DESC'
    /**
     * Default is ABSOLUTE
     * Defaults to: undefined
     * @type &#39;ABSOLUTE&#39; | &#39;POSITIVE&#39; | &#39;NEGATIVE&#39;
     * @memberof WavesApigetWaveVotersInfo
     */
    sort?: 'ABSOLUTE' | 'POSITIVE' | 'NEGATIVE'
}

export interface WavesApiGetWavesRequest {
    /**
     * Search by name or part of name
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaves
     */
    name?: string
    /**
     * Search by author identity
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaves
     */
    author?: string
    /**
     * How many waves to return (10 by default)
     * Minimum: 1
     * Maximum: 20
     * Defaults to: undefined
     * @type number
     * @memberof WavesApigetWaves
     */
    limit?: number
    /**
     * Used to find older drops
     * Defaults to: undefined
     * @type number
     * @memberof WavesApigetWaves
     */
    serialNoLessThan?: number
    /**
     * Waves by authors that fall into supplied group
     * Defaults to: undefined
     * @type string
     * @memberof WavesApigetWaves
     */
    groupId?: string
    /**
     * Use true for DM waves, use false for non-DM waves, omit for all
     * Defaults to: undefined
     * @type boolean
     * @memberof WavesApigetWaves
     */
    directMessage?: boolean
}

export interface WavesApiGetWavesOverviewRequest {
    /**
     * Type of overview
     * Defaults to: undefined
     * @type ApiWavesOverviewType
     * @memberof WavesApigetWavesOverview
     */
    type: ApiWavesOverviewType
    /**
     * How many waves to return (10 by default)
     * Minimum: 1
     * Maximum: 20
     * Defaults to: 10
     * @type number
     * @memberof WavesApigetWavesOverview
     */
    limit?: number
    /**
     * Used to find next waves
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof WavesApigetWavesOverview
     */
    offset?: number
    /**
     * Filter only PINNED or UNPINNED waves
     * Defaults to: undefined
     * @type ApiWavesPinFilter
     * @memberof WavesApigetWavesOverview
     */
    pinned?: ApiWavesPinFilter
    /**
     * If true then result only includes waves what authenticated user follows
     * Defaults to: undefined
     * @type boolean
     * @memberof WavesApigetWavesOverview
     */
    onlyWavesFollowedByAuthenticatedUser?: boolean
    /**
     * Use true for DM waves, use false for non-DM waves, omit for all
     * Defaults to: undefined
     * @type boolean
     * @memberof WavesApigetWavesOverview
     */
    directMessage?: boolean
}

export interface WavesApiListWaveCurationGroupsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApilistWaveCurationGroups
     */
    id: string
}

export interface WavesApiMuteWaveRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApimuteWave
     */
    id: string
}

export interface WavesApiPinWaveRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApipinWave
     */
    id: string
}

export interface WavesApiSearchDropsInWaveRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApisearchDropsInWave
     */
    waveId: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApisearchDropsInWave
     */
    term: string
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof WavesApisearchDropsInWave
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 20
     * @type number
     * @memberof WavesApisearchDropsInWave
     */
    size?: number
}

export interface WavesApiSubscribeToWaveActionsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApisubscribeToWaveActions
     */
    id: string
    /**
     * 
     * @type ApiWaveSubscriptionActions
     * @memberof WavesApisubscribeToWaveActions
     */
    apiWaveSubscriptionActions: ApiWaveSubscriptionActions
}

export interface WavesApiUnPinWaveRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApiunPinWave
     */
    id: string
}

export interface WavesApiUnmuteWaveRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApiunmuteWave
     */
    id: string
}

export interface WavesApiUnsubscribeFromWaveActionsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApiunsubscribeFromWaveActions
     */
    id: string
    /**
     * 
     * @type ApiWaveSubscriptionActions
     * @memberof WavesApiunsubscribeFromWaveActions
     */
    apiWaveSubscriptionActions: ApiWaveSubscriptionActions
}

export interface WavesApiUpdateWaveByIdRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApiupdateWaveById
     */
    id: string
    /**
     * 
     * @type ApiUpdateWaveRequest
     * @memberof WavesApiupdateWaveById
     */
    apiUpdateWaveRequest: ApiUpdateWaveRequest
}

export interface WavesApiUpdateWaveCurationGroupRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApiupdateWaveCurationGroup
     */
    id: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof WavesApiupdateWaveCurationGroup
     */
    curationGroupId: string
    /**
     * 
     * @type ApiWaveCurationGroupRequest
     * @memberof WavesApiupdateWaveCurationGroup
     */
    apiWaveCurationGroupRequest: ApiWaveCurationGroupRequest
}

export interface WavesApiUpdateWaveDecisionPauseRequest {
    /**
     * wave id
     * Defaults to: undefined
     * @type string
     * @memberof WavesApiupdateWaveDecisionPause
     */
    id: string
    /**
     * 
     * @type ApiUpdateWaveDecisionPause
     * @memberof WavesApiupdateWaveDecisionPause
     */
    apiUpdateWaveDecisionPause: ApiUpdateWaveDecisionPause
}

export class ObjectWavesApi {
    private api: ObservableWavesApi

    public constructor(configuration: Configuration, requestFactory?: WavesApiRequestFactory, responseProcessor?: WavesApiResponseProcessor) {
        this.api = new ObservableWavesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create a direct message wave
     * @param param the request object
     */
    public createDirectMessageWaveWithHttpInfo(param: WavesApiCreateDirectMessageWaveRequest, options?: Configuration): Promise<HttpInfo<ApiWave>> {
        return this.api.createDirectMessageWaveWithHttpInfo(param.createDirectMessageWaveRequest,  options).toPromise();
    }

    /**
     * Create a direct message wave
     * @param param the request object
     */
    public createDirectMessageWave(param: WavesApiCreateDirectMessageWaveRequest, options?: Configuration): Promise<ApiWave> {
        return this.api.createDirectMessageWave(param.createDirectMessageWaveRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create new wave
     * @param param the request object
     */
    public createWaveWithHttpInfo(param: WavesApiCreateWaveRequest, options?: Configuration): Promise<HttpInfo<ApiWave>> {
        return this.api.createWaveWithHttpInfo(param.apiCreateNewWave,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create new wave
     * @param param the request object
     */
    public createWave(param: WavesApiCreateWaveRequest, options?: Configuration): Promise<ApiWave> {
        return this.api.createWave(param.apiCreateNewWave,  options).toPromise();
    }

    /**
     * Create curation group for wave
     * @param param the request object
     */
    public createWaveCurationGroupWithHttpInfo(param: WavesApiCreateWaveCurationGroupRequest, options?: Configuration): Promise<HttpInfo<ApiWaveCurationGroup>> {
        return this.api.createWaveCurationGroupWithHttpInfo(param.id, param.apiWaveCurationGroupRequest,  options).toPromise();
    }

    /**
     * Create curation group for wave
     * @param param the request object
     */
    public createWaveCurationGroup(param: WavesApiCreateWaveCurationGroupRequest, options?: Configuration): Promise<ApiWaveCurationGroup> {
        return this.api.createWaveCurationGroup(param.id, param.apiWaveCurationGroupRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for wave PFP
     * @param param the request object
     */
    public createWaveMediaUrlWithHttpInfo(param: WavesApiCreateWaveMediaUrlRequest, options?: Configuration): Promise<HttpInfo<ApiCreateMediaUrlResponse>> {
        return this.api.createWaveMediaUrlWithHttpInfo(param.apiCreateMediaUploadUrlRequest,  options).toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for wave PFP
     * @param param the request object
     */
    public createWaveMediaUrl(param: WavesApiCreateWaveMediaUrlRequest, options?: Configuration): Promise<ApiCreateMediaUrlResponse> {
        return this.api.createWaveMediaUrl(param.apiCreateMediaUploadUrlRequest,  options).toPromise();
    }

    /**
     * Delete wave by ID
     * @param param the request object
     */
    public deleteWaveByIdWithHttpInfo(param: WavesApiDeleteWaveByIdRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.deleteWaveByIdWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Delete wave by ID
     * @param param the request object
     */
    public deleteWaveById(param: WavesApiDeleteWaveByIdRequest, options?: Configuration): Promise<void> {
        return this.api.deleteWaveById(param.id,  options).toPromise();
    }

    /**
     * Delete curation group from wave
     * @param param the request object
     */
    public deleteWaveCurationGroupWithHttpInfo(param: WavesApiDeleteWaveCurationGroupRequest, options?: Configuration): Promise<HttpInfo<void>> {
        return this.api.deleteWaveCurationGroupWithHttpInfo(param.id, param.curationGroupId,  options).toPromise();
    }

    /**
     * Delete curation group from wave
     * @param param the request object
     */
    public deleteWaveCurationGroup(param: WavesApiDeleteWaveCurationGroupRequest, options?: Configuration): Promise<void> {
        return this.api.deleteWaveCurationGroup(param.id, param.curationGroupId,  options).toPromise();
    }

    /**
     * Pause can only be deleted if no past decisions have already been skipped based on it.
     * Delete wave decision pause
     * @param param the request object
     */
    public deleteWaveDecisionPauseWithHttpInfo(param: WavesApiDeleteWaveDecisionPauseRequest, options?: Configuration): Promise<HttpInfo<ApiWave>> {
        return this.api.deleteWaveDecisionPauseWithHttpInfo(param.waveId, param.id,  options).toPromise();
    }

    /**
     * Pause can only be deleted if no past decisions have already been skipped based on it.
     * Delete wave decision pause
     * @param param the request object
     */
    public deleteWaveDecisionPause(param: WavesApiDeleteWaveDecisionPauseRequest, options?: Configuration): Promise<ApiWave> {
        return this.api.deleteWaveDecisionPause(param.waveId, param.id,  options).toPromise();
    }

    /**
     * Get drop logs
     * @param param the request object
     */
    public getDropLogsWithHttpInfo(param: WavesApiGetDropLogsRequest, options?: Configuration): Promise<HttpInfo<Array<ApiWaveLog>>> {
        return this.api.getDropLogsWithHttpInfo(param.id, param.logTypes, param.dropId, param.offset, param.limit, param.sortDirection,  options).toPromise();
    }

    /**
     * Get drop logs
     * @param param the request object
     */
    public getDropLogs(param: WavesApiGetDropLogsRequest, options?: Configuration): Promise<Array<ApiWaveLog>> {
        return this.api.getDropLogs(param.id, param.logTypes, param.dropId, param.offset, param.limit, param.sortDirection,  options).toPromise();
    }

    /**
     * Get drops related to wave or parent drop
     * @param param the request object
     */
    public getDropsOfWaveWithHttpInfo(param: WavesApiGetDropsOfWaveRequest, options?: Configuration): Promise<HttpInfo<ApiWaveDropsFeed>> {
        return this.api.getDropsOfWaveWithHttpInfo(param.id, param.dropId, param.limit, param.serialNoLimit, param.searchStrategy, param.serialNoLessThan, param.dropType,  options).toPromise();
    }

    /**
     * Get drops related to wave or parent drop
     * @param param the request object
     */
    public getDropsOfWave(param: WavesApiGetDropsOfWaveRequest, options?: Configuration): Promise<ApiWaveDropsFeed> {
        return this.api.getDropsOfWave(param.id, param.dropId, param.limit, param.serialNoLimit, param.searchStrategy, param.serialNoLessThan, param.dropType,  options).toPromise();
    }

    /**
     * Returns up to 25 public waves ranked by activity in the last 24 hours.
     * Get hot waves overview.
     * @param param the request object
     */
    public getHotWavesOverviewWithHttpInfo(param: WavesApiGetHotWavesOverviewRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiWave>>> {
        return this.api.getHotWavesOverviewWithHttpInfo( options).toPromise();
    }

    /**
     * Returns up to 25 public waves ranked by activity in the last 24 hours.
     * Get hot waves overview.
     * @param param the request object
     */
    public getHotWavesOverview(param: WavesApiGetHotWavesOverviewRequest = {}, options?: Configuration): Promise<Array<ApiWave>> {
        return this.api.getHotWavesOverview( options).toPromise();
    }

    /**
     * Get wave by ID.
     * @param param the request object
     */
    public getWaveByIdWithHttpInfo(param: WavesApiGetWaveByIdRequest, options?: Configuration): Promise<HttpInfo<ApiWave>> {
        return this.api.getWaveByIdWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Get wave by ID.
     * @param param the request object
     */
    public getWaveById(param: WavesApiGetWaveByIdRequest, options?: Configuration): Promise<ApiWave> {
        return this.api.getWaveById(param.id,  options).toPromise();
    }

    /**
     * Get already decided wave decision outcomes
     * @param param the request object
     */
    public getWaveDecisionsWithHttpInfo(param: WavesApiGetWaveDecisionsRequest, options?: Configuration): Promise<HttpInfo<ApiWaveDecisionsPage>> {
        return this.api.getWaveDecisionsWithHttpInfo(param.id, param.sortDirection, param.sort, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get already decided wave decision outcomes
     * @param param the request object
     */
    public getWaveDecisions(param: WavesApiGetWaveDecisionsRequest, options?: Configuration): Promise<ApiWaveDecisionsPage> {
        return this.api.getWaveDecisions(param.id, param.sortDirection, param.sort, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get waves leaderboard
     * @param param the request object
     */
    public getWaveLeaderboardWithHttpInfo(param: WavesApiGetWaveLeaderboardRequest, options?: Configuration): Promise<HttpInfo<ApiDropsLeaderboardPage>> {
        return this.api.getWaveLeaderboardWithHttpInfo(param.id, param.pageSize, param.page, param.sortDirection, param.sort, param.priceCurrency, param.minPrice, param.maxPrice, param.curatedByGroup,  options).toPromise();
    }

    /**
     * Get waves leaderboard
     * @param param the request object
     */
    public getWaveLeaderboard(param: WavesApiGetWaveLeaderboardRequest, options?: Configuration): Promise<ApiDropsLeaderboardPage> {
        return this.api.getWaveLeaderboard(param.id, param.pageSize, param.page, param.sortDirection, param.sort, param.priceCurrency, param.minPrice, param.maxPrice, param.curatedByGroup,  options).toPromise();
    }

    /**
     * Get wave outcome distribution
     * @param param the request object
     */
    public getWaveOutcomeDistributionWithHttpInfo(param: WavesApiGetWaveOutcomeDistributionRequest, options?: Configuration): Promise<HttpInfo<ApiWaveOutcomeDistributionItemsPage>> {
        return this.api.getWaveOutcomeDistributionWithHttpInfo(param.waveId, param.outcomeIndex, param.sortDirection, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get wave outcome distribution
     * @param param the request object
     */
    public getWaveOutcomeDistribution(param: WavesApiGetWaveOutcomeDistributionRequest, options?: Configuration): Promise<ApiWaveOutcomeDistributionItemsPage> {
        return this.api.getWaveOutcomeDistribution(param.waveId, param.outcomeIndex, param.sortDirection, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get wave outcomes
     * @param param the request object
     */
    public getWaveOutcomesWithHttpInfo(param: WavesApiGetWaveOutcomesRequest, options?: Configuration): Promise<HttpInfo<ApiWaveOutcomesPage>> {
        return this.api.getWaveOutcomesWithHttpInfo(param.waveId, param.sortDirection, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get wave outcomes
     * @param param the request object
     */
    public getWaveOutcomes(param: WavesApiGetWaveOutcomesRequest, options?: Configuration): Promise<ApiWaveOutcomesPage> {
        return this.api.getWaveOutcomes(param.waveId, param.sortDirection, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get info about waves voters (top voters etc)
     * @param param the request object
     */
    public getWaveVotersInfoWithHttpInfo(param: WavesApiGetWaveVotersInfoRequest, options?: Configuration): Promise<HttpInfo<ApiWaveVotersPage>> {
        return this.api.getWaveVotersInfoWithHttpInfo(param.id, param.dropId, param.page, param.pageSize, param.sortDirection, param.sort,  options).toPromise();
    }

    /**
     * Get info about waves voters (top voters etc)
     * @param param the request object
     */
    public getWaveVotersInfo(param: WavesApiGetWaveVotersInfoRequest, options?: Configuration): Promise<ApiWaveVotersPage> {
        return this.api.getWaveVotersInfo(param.id, param.dropId, param.page, param.pageSize, param.sortDirection, param.sort,  options).toPromise();
    }

    /**
     * Get waves.
     * @param param the request object
     */
    public getWavesWithHttpInfo(param: WavesApiGetWavesRequest = {}, options?: Configuration): Promise<HttpInfo<Array<ApiWave>>> {
        return this.api.getWavesWithHttpInfo(param.name, param.author, param.limit, param.serialNoLessThan, param.groupId, param.directMessage,  options).toPromise();
    }

    /**
     * Get waves.
     * @param param the request object
     */
    public getWaves(param: WavesApiGetWavesRequest = {}, options?: Configuration): Promise<Array<ApiWave>> {
        return this.api.getWaves(param.name, param.author, param.limit, param.serialNoLessThan, param.groupId, param.directMessage,  options).toPromise();
    }

    /**
     * Get overview of waves by different criteria.
     * @param param the request object
     */
    public getWavesOverviewWithHttpInfo(param: WavesApiGetWavesOverviewRequest, options?: Configuration): Promise<HttpInfo<Array<ApiWave>>> {
        return this.api.getWavesOverviewWithHttpInfo(param.type, param.limit, param.offset, param.pinned, param.onlyWavesFollowedByAuthenticatedUser, param.directMessage,  options).toPromise();
    }

    /**
     * Get overview of waves by different criteria.
     * @param param the request object
     */
    public getWavesOverview(param: WavesApiGetWavesOverviewRequest, options?: Configuration): Promise<Array<ApiWave>> {
        return this.api.getWavesOverview(param.type, param.limit, param.offset, param.pinned, param.onlyWavesFollowedByAuthenticatedUser, param.directMessage,  options).toPromise();
    }

    /**
     * List curation groups configured for wave
     * @param param the request object
     */
    public listWaveCurationGroupsWithHttpInfo(param: WavesApiListWaveCurationGroupsRequest, options?: Configuration): Promise<HttpInfo<Array<ApiWaveCurationGroup>>> {
        return this.api.listWaveCurationGroupsWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * List curation groups configured for wave
     * @param param the request object
     */
    public listWaveCurationGroups(param: WavesApiListWaveCurationGroupsRequest, options?: Configuration): Promise<Array<ApiWaveCurationGroup>> {
        return this.api.listWaveCurationGroups(param.id,  options).toPromise();
    }

    /**
     * Mute a wave
     * @param param the request object
     */
    public muteWaveWithHttpInfo(param: WavesApiMuteWaveRequest, options?: Configuration): Promise<HttpInfo<any>> {
        return this.api.muteWaveWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Mute a wave
     * @param param the request object
     */
    public muteWave(param: WavesApiMuteWaveRequest, options?: Configuration): Promise<any> {
        return this.api.muteWave(param.id,  options).toPromise();
    }

    /**
     * Pin a wave
     * @param param the request object
     */
    public pinWaveWithHttpInfo(param: WavesApiPinWaveRequest, options?: Configuration): Promise<HttpInfo<any>> {
        return this.api.pinWaveWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Pin a wave
     * @param param the request object
     */
    public pinWave(param: WavesApiPinWaveRequest, options?: Configuration): Promise<any> {
        return this.api.pinWave(param.id,  options).toPromise();
    }

    /**
     * Search for drops in wave by content
     * @param param the request object
     */
    public searchDropsInWaveWithHttpInfo(param: WavesApiSearchDropsInWaveRequest, options?: Configuration): Promise<HttpInfo<ApiDropWithoutWavesPageWithoutCount>> {
        return this.api.searchDropsInWaveWithHttpInfo(param.waveId, param.term, param.page, param.size,  options).toPromise();
    }

    /**
     * Search for drops in wave by content
     * @param param the request object
     */
    public searchDropsInWave(param: WavesApiSearchDropsInWaveRequest, options?: Configuration): Promise<ApiDropWithoutWavesPageWithoutCount> {
        return this.api.searchDropsInWave(param.waveId, param.term, param.page, param.size,  options).toPromise();
    }

    /**
     * Subscribe authenticated user to wave actions.
     * @param param the request object
     */
    public subscribeToWaveActionsWithHttpInfo(param: WavesApiSubscribeToWaveActionsRequest, options?: Configuration): Promise<HttpInfo<ApiWaveSubscriptionActions>> {
        return this.api.subscribeToWaveActionsWithHttpInfo(param.id, param.apiWaveSubscriptionActions,  options).toPromise();
    }

    /**
     * Subscribe authenticated user to wave actions.
     * @param param the request object
     */
    public subscribeToWaveActions(param: WavesApiSubscribeToWaveActionsRequest, options?: Configuration): Promise<ApiWaveSubscriptionActions> {
        return this.api.subscribeToWaveActions(param.id, param.apiWaveSubscriptionActions,  options).toPromise();
    }

    /**
     * Unpin a wave
     * @param param the request object
     */
    public unPinWaveWithHttpInfo(param: WavesApiUnPinWaveRequest, options?: Configuration): Promise<HttpInfo<any>> {
        return this.api.unPinWaveWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Unpin a wave
     * @param param the request object
     */
    public unPinWave(param: WavesApiUnPinWaveRequest, options?: Configuration): Promise<any> {
        return this.api.unPinWave(param.id,  options).toPromise();
    }

    /**
     * Unmute a wave
     * @param param the request object
     */
    public unmuteWaveWithHttpInfo(param: WavesApiUnmuteWaveRequest, options?: Configuration): Promise<HttpInfo<any>> {
        return this.api.unmuteWaveWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Unmute a wave
     * @param param the request object
     */
    public unmuteWave(param: WavesApiUnmuteWaveRequest, options?: Configuration): Promise<any> {
        return this.api.unmuteWave(param.id,  options).toPromise();
    }

    /**
     * Unsubscribe authenticated user from wave actions.
     * @param param the request object
     */
    public unsubscribeFromWaveActionsWithHttpInfo(param: WavesApiUnsubscribeFromWaveActionsRequest, options?: Configuration): Promise<HttpInfo<ApiWaveSubscriptionActions>> {
        return this.api.unsubscribeFromWaveActionsWithHttpInfo(param.id, param.apiWaveSubscriptionActions,  options).toPromise();
    }

    /**
     * Unsubscribe authenticated user from wave actions.
     * @param param the request object
     */
    public unsubscribeFromWaveActions(param: WavesApiUnsubscribeFromWaveActionsRequest, options?: Configuration): Promise<ApiWaveSubscriptionActions> {
        return this.api.unsubscribeFromWaveActions(param.id, param.apiWaveSubscriptionActions,  options).toPromise();
    }

    /**
     * Update wave by ID
     * @param param the request object
     */
    public updateWaveByIdWithHttpInfo(param: WavesApiUpdateWaveByIdRequest, options?: Configuration): Promise<HttpInfo<ApiWave>> {
        return this.api.updateWaveByIdWithHttpInfo(param.id, param.apiUpdateWaveRequest,  options).toPromise();
    }

    /**
     * Update wave by ID
     * @param param the request object
     */
    public updateWaveById(param: WavesApiUpdateWaveByIdRequest, options?: Configuration): Promise<ApiWave> {
        return this.api.updateWaveById(param.id, param.apiUpdateWaveRequest,  options).toPromise();
    }

    /**
     * Update curation group for wave
     * @param param the request object
     */
    public updateWaveCurationGroupWithHttpInfo(param: WavesApiUpdateWaveCurationGroupRequest, options?: Configuration): Promise<HttpInfo<ApiWaveCurationGroup>> {
        return this.api.updateWaveCurationGroupWithHttpInfo(param.id, param.curationGroupId, param.apiWaveCurationGroupRequest,  options).toPromise();
    }

    /**
     * Update curation group for wave
     * @param param the request object
     */
    public updateWaveCurationGroup(param: WavesApiUpdateWaveCurationGroupRequest, options?: Configuration): Promise<ApiWaveCurationGroup> {
        return this.api.updateWaveCurationGroup(param.id, param.curationGroupId, param.apiWaveCurationGroupRequest,  options).toPromise();
    }

    /**
     * Create or edit wave decision pause
     * @param param the request object
     */
    public updateWaveDecisionPauseWithHttpInfo(param: WavesApiUpdateWaveDecisionPauseRequest, options?: Configuration): Promise<HttpInfo<ApiWave>> {
        return this.api.updateWaveDecisionPauseWithHttpInfo(param.id, param.apiUpdateWaveDecisionPause,  options).toPromise();
    }

    /**
     * Create or edit wave decision pause
     * @param param the request object
     */
    public updateWaveDecisionPause(param: WavesApiUpdateWaveDecisionPauseRequest, options?: Configuration): Promise<ApiWave> {
        return this.api.updateWaveDecisionPause(param.id, param.apiUpdateWaveDecisionPause,  options).toPromise();
    }

}

import { ObservableXTDHApi } from "./ObservableAPI";
import { XTDHApiRequestFactory, XTDHApiResponseProcessor} from "../apis/XTDHApi";

export interface XTDHApiGetGlobalXTdhStatsRequest {
}

export interface XTDHApiGetIdentitiesXTdhStatsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetIdentitiesXTdhStats
     */
    identity: string
}

export interface XTDHApiGetInfoAboutXTdhCollectionsRequest {
    /**
     * Filter by receiving identity
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetInfoAboutXTdhCollections
     */
    identity?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetInfoAboutXTdhCollections
     */
    collectionName?: string
    /**
     * 
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetInfoAboutXTdhCollections
     */
    page?: number
    /**
     * Default is 20
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetInfoAboutXTdhCollections
     */
    pageSize?: number
    /**
     * xtdh when omitted
     * Defaults to: undefined
     * @type &#39;xtdh&#39; | &#39;xtdh_rate&#39;
     * @memberof XTDHApigetInfoAboutXTdhCollections
     */
    sort?: 'xtdh' | 'xtdh_rate'
    /**
     * desc when omitted
     * Defaults to: undefined
     * @type &#39;asc&#39; | &#39;desc&#39;
     * @memberof XTDHApigetInfoAboutXTdhCollections
     */
    order?: 'asc' | 'desc'
}

export interface XTDHApiGetInfoAboutXTdhContributorsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetInfoAboutXTdhContributors
     */
    contract: string
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetInfoAboutXTdhContributors
     */
    token: number
    /**
     * Group by grant or grantor (grant when omitted)
     * Defaults to: undefined
     * @type &#39;grant&#39; | &#39;grantor&#39;
     * @memberof XTDHApigetInfoAboutXTdhContributors
     */
    groupBy?: 'grant' | 'grantor'
    /**
     * 
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetInfoAboutXTdhContributors
     */
    page?: number
    /**
     * Default is 20
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetInfoAboutXTdhContributors
     */
    pageSize?: number
    /**
     * xtdh when omitted
     * Defaults to: undefined
     * @type &#39;xtdh&#39; | &#39;xtdh_rate&#39;
     * @memberof XTDHApigetInfoAboutXTdhContributors
     */
    sort?: 'xtdh' | 'xtdh_rate'
    /**
     * desc when omitted
     * Defaults to: undefined
     * @type &#39;asc&#39; | &#39;desc&#39;
     * @memberof XTDHApigetInfoAboutXTdhContributors
     */
    order?: 'asc' | 'desc'
}

export interface XTDHApiGetInfoAboutXTdhGranteesRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetInfoAboutXTdhGrantees
     */
    contract?: string
    /**
     * 
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetInfoAboutXTdhGrantees
     */
    page?: number
    /**
     * Default is 20
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetInfoAboutXTdhGrantees
     */
    pageSize?: number
    /**
     * xtdh when omitted
     * Defaults to: undefined
     * @type &#39;xtdh&#39; | &#39;xtdh_rate&#39;
     * @memberof XTDHApigetInfoAboutXTdhGrantees
     */
    sort?: 'xtdh' | 'xtdh_rate'
    /**
     * desc when omitted
     * Defaults to: undefined
     * @type &#39;asc&#39; | &#39;desc&#39;
     * @memberof XTDHApigetInfoAboutXTdhGrantees
     */
    order?: 'asc' | 'desc'
}

export interface XTDHApiGetInfoAboutXTdhTokensRequest {
    /**
     * Filter by receiving identity
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetInfoAboutXTdhTokens
     */
    identity?: string
    /**
     * Filter by receiving contract
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetInfoAboutXTdhTokens
     */
    contract?: string
    /**
     * Filter by token. Needs to be paired with contract to work
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetInfoAboutXTdhTokens
     */
    token?: number
    /**
     * 
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetInfoAboutXTdhTokens
     */
    page?: number
    /**
     * Default is 20
     * Minimum: 1
     * Maximum: 100
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetInfoAboutXTdhTokens
     */
    pageSize?: number
    /**
     * xtdh when omitted
     * Defaults to: undefined
     * @type &#39;xtdh&#39; | &#39;xtdh_rate&#39;
     * @memberof XTDHApigetInfoAboutXTdhTokens
     */
    sort?: 'xtdh' | 'xtdh_rate'
    /**
     * desc when omitted
     * Defaults to: undefined
     * @type &#39;asc&#39; | &#39;desc&#39;
     * @memberof XTDHApigetInfoAboutXTdhTokens
     */
    order?: 'asc' | 'desc'
}

export interface XTDHApiGetXTdhGrantRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetXTdhGrant
     */
    id: string
}

export interface XTDHApiGetXTdhGrantTokensRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetXTdhGrantTokens
     */
    id: string
    /**
     * 
     * Defaults to: undefined
     * @type ApiPageSortDirection
     * @memberof XTDHApigetXTdhGrantTokens
     */
    sortDirection?: ApiPageSortDirection
    /**
     * 
     * Defaults to: &#39;token&#39;
     * @type &#39;token&#39;
     * @memberof XTDHApigetXTdhGrantTokens
     */
    sort?: 'token'
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof XTDHApigetXTdhGrantTokens
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 2000
     * Defaults to: 100
     * @type number
     * @memberof XTDHApigetXTdhGrantTokens
     */
    pageSize?: number
}

export interface XTDHApiGetXTdhGrantsRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetXTdhGrants
     */
    grantor?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetXTdhGrants
     */
    targetContract?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetXTdhGrants
     */
    targetCollectionName?: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetXTdhGrants
     */
    targetChain?: string
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetXTdhGrants
     */
    validFromGt?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetXTdhGrants
     */
    validFromLt?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetXTdhGrants
     */
    validToGt?: number
    /**
     * 
     * Defaults to: undefined
     * @type number
     * @memberof XTDHApigetXTdhGrants
     */
    validToLt?: number
    /**
     * One or more (comma separated) statuses you are interested in
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApigetXTdhGrants
     */
    status?: string
    /**
     * 
     * Defaults to: undefined
     * @type ApiPageSortDirection
     * @memberof XTDHApigetXTdhGrants
     */
    sortDirection?: ApiPageSortDirection
    /**
     * 
     * Defaults to: &#39;created_at&#39;
     * @type &#39;created_at&#39; | &#39;valid_from&#39; | &#39;valid_to&#39; | &#39;rate&#39;
     * @memberof XTDHApigetXTdhGrants
     */
    sort?: 'created_at' | 'valid_from' | 'valid_to' | 'rate'
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof XTDHApigetXTdhGrants
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 2000
     * Defaults to: 100
     * @type number
     * @memberof XTDHApigetXTdhGrants
     */
    pageSize?: number
}

export interface XTDHApiGrantXTdhRequest {
    /**
     * 
     * @type ApiXTdhCreateGrant
     * @memberof XTDHApigrantXTdh
     */
    apiXTdhCreateGrant: ApiXTdhCreateGrant
}

export interface XTDHApiUpdateXTdhGrantRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof XTDHApiupdateXTdhGrant
     */
    id: string
    /**
     * 
     * @type ApiXTdhGrantUpdateRequest
     * @memberof XTDHApiupdateXTdhGrant
     */
    apiXTdhGrantUpdateRequest: ApiXTdhGrantUpdateRequest
}

export class ObjectXTDHApi {
    private api: ObservableXTDHApi

    public constructor(configuration: Configuration, requestFactory?: XTDHApiRequestFactory, responseProcessor?: XTDHApiResponseProcessor) {
        this.api = new ObservableXTDHApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get global xTDH stats
     * @param param the request object
     */
    public getGlobalXTdhStatsWithHttpInfo(param: XTDHApiGetGlobalXTdhStatsRequest = {}, options?: Configuration): Promise<HttpInfo<ApiXTdhGlobalStats>> {
        return this.api.getGlobalXTdhStatsWithHttpInfo( options).toPromise();
    }

    /**
     * Get global xTDH stats
     * @param param the request object
     */
    public getGlobalXTdhStats(param: XTDHApiGetGlobalXTdhStatsRequest = {}, options?: Configuration): Promise<ApiXTdhGlobalStats> {
        return this.api.getGlobalXTdhStats( options).toPromise();
    }

    /**
     * Get identities xTDH stats
     * @param param the request object
     */
    public getIdentitiesXTdhStatsWithHttpInfo(param: XTDHApiGetIdentitiesXTdhStatsRequest, options?: Configuration): Promise<HttpInfo<ApiXTdhStats>> {
        return this.api.getIdentitiesXTdhStatsWithHttpInfo(param.identity,  options).toPromise();
    }

    /**
     * Get identities xTDH stats
     * @param param the request object
     */
    public getIdentitiesXTdhStats(param: XTDHApiGetIdentitiesXTdhStatsRequest, options?: Configuration): Promise<ApiXTdhStats> {
        return this.api.getIdentitiesXTdhStats(param.identity,  options).toPromise();
    }

    /**
     * Get info about xTDH collections
     * @param param the request object
     */
    public getInfoAboutXTdhCollectionsWithHttpInfo(param: XTDHApiGetInfoAboutXTdhCollectionsRequest = {}, options?: Configuration): Promise<HttpInfo<ApiXTdhCollectionsPage>> {
        return this.api.getInfoAboutXTdhCollectionsWithHttpInfo(param.identity, param.collectionName, param.page, param.pageSize, param.sort, param.order,  options).toPromise();
    }

    /**
     * Get info about xTDH collections
     * @param param the request object
     */
    public getInfoAboutXTdhCollections(param: XTDHApiGetInfoAboutXTdhCollectionsRequest = {}, options?: Configuration): Promise<ApiXTdhCollectionsPage> {
        return this.api.getInfoAboutXTdhCollections(param.identity, param.collectionName, param.page, param.pageSize, param.sort, param.order,  options).toPromise();
    }

    /**
     * Get info about xTDH contributors
     * @param param the request object
     */
    public getInfoAboutXTdhContributorsWithHttpInfo(param: XTDHApiGetInfoAboutXTdhContributorsRequest, options?: Configuration): Promise<HttpInfo<ApiXTdhContributionsPage>> {
        return this.api.getInfoAboutXTdhContributorsWithHttpInfo(param.contract, param.token, param.groupBy, param.page, param.pageSize, param.sort, param.order,  options).toPromise();
    }

    /**
     * Get info about xTDH contributors
     * @param param the request object
     */
    public getInfoAboutXTdhContributors(param: XTDHApiGetInfoAboutXTdhContributorsRequest, options?: Configuration): Promise<ApiXTdhContributionsPage> {
        return this.api.getInfoAboutXTdhContributors(param.contract, param.token, param.groupBy, param.page, param.pageSize, param.sort, param.order,  options).toPromise();
    }

    /**
     * Get info about xTDH grantees
     * @param param the request object
     */
    public getInfoAboutXTdhGranteesWithHttpInfo(param: XTDHApiGetInfoAboutXTdhGranteesRequest = {}, options?: Configuration): Promise<HttpInfo<ApiXTdhGranteesPage>> {
        return this.api.getInfoAboutXTdhGranteesWithHttpInfo(param.contract, param.page, param.pageSize, param.sort, param.order,  options).toPromise();
    }

    /**
     * Get info about xTDH grantees
     * @param param the request object
     */
    public getInfoAboutXTdhGrantees(param: XTDHApiGetInfoAboutXTdhGranteesRequest = {}, options?: Configuration): Promise<ApiXTdhGranteesPage> {
        return this.api.getInfoAboutXTdhGrantees(param.contract, param.page, param.pageSize, param.sort, param.order,  options).toPromise();
    }

    /**
     * Get info about xTDH tokens
     * @param param the request object
     */
    public getInfoAboutXTdhTokensWithHttpInfo(param: XTDHApiGetInfoAboutXTdhTokensRequest = {}, options?: Configuration): Promise<HttpInfo<ApiXTdhTokensPage>> {
        return this.api.getInfoAboutXTdhTokensWithHttpInfo(param.identity, param.contract, param.token, param.page, param.pageSize, param.sort, param.order,  options).toPromise();
    }

    /**
     * Get info about xTDH tokens
     * @param param the request object
     */
    public getInfoAboutXTdhTokens(param: XTDHApiGetInfoAboutXTdhTokensRequest = {}, options?: Configuration): Promise<ApiXTdhTokensPage> {
        return this.api.getInfoAboutXTdhTokens(param.identity, param.contract, param.token, param.page, param.pageSize, param.sort, param.order,  options).toPromise();
    }

    /**
     * Get xTDH grant
     * @param param the request object
     */
    public getXTdhGrantWithHttpInfo(param: XTDHApiGetXTdhGrantRequest, options?: Configuration): Promise<HttpInfo<ApiXTdhGrant>> {
        return this.api.getXTdhGrantWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Get xTDH grant
     * @param param the request object
     */
    public getXTdhGrant(param: XTDHApiGetXTdhGrantRequest, options?: Configuration): Promise<ApiXTdhGrant> {
        return this.api.getXTdhGrant(param.id,  options).toPromise();
    }

    /**
     * Get xTDH grant tokens
     * @param param the request object
     */
    public getXTdhGrantTokensWithHttpInfo(param: XTDHApiGetXTdhGrantTokensRequest, options?: Configuration): Promise<HttpInfo<ApiXTdhGrantTokensPage>> {
        return this.api.getXTdhGrantTokensWithHttpInfo(param.id, param.sortDirection, param.sort, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get xTDH grant tokens
     * @param param the request object
     */
    public getXTdhGrantTokens(param: XTDHApiGetXTdhGrantTokensRequest, options?: Configuration): Promise<ApiXTdhGrantTokensPage> {
        return this.api.getXTdhGrantTokens(param.id, param.sortDirection, param.sort, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get xTDH grants
     * @param param the request object
     */
    public getXTdhGrantsWithHttpInfo(param: XTDHApiGetXTdhGrantsRequest = {}, options?: Configuration): Promise<HttpInfo<ApiXTdhGrantsPage>> {
        return this.api.getXTdhGrantsWithHttpInfo(param.grantor, param.targetContract, param.targetCollectionName, param.targetChain, param.validFromGt, param.validFromLt, param.validToGt, param.validToLt, param.status, param.sortDirection, param.sort, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Get xTDH grants
     * @param param the request object
     */
    public getXTdhGrants(param: XTDHApiGetXTdhGrantsRequest = {}, options?: Configuration): Promise<ApiXTdhGrantsPage> {
        return this.api.getXTdhGrants(param.grantor, param.targetContract, param.targetCollectionName, param.targetChain, param.validFromGt, param.validFromLt, param.validToGt, param.validToLt, param.status, param.sortDirection, param.sort, param.page, param.pageSize,  options).toPromise();
    }

    /**
     * Create xTDH grant
     * @param param the request object
     */
    public grantXTdhWithHttpInfo(param: XTDHApiGrantXTdhRequest, options?: Configuration): Promise<HttpInfo<ApiXTdhGrant>> {
        return this.api.grantXTdhWithHttpInfo(param.apiXTdhCreateGrant,  options).toPromise();
    }

    /**
     * Create xTDH grant
     * @param param the request object
     */
    public grantXTdh(param: XTDHApiGrantXTdhRequest, options?: Configuration): Promise<ApiXTdhGrant> {
        return this.api.grantXTdh(param.apiXTdhCreateGrant,  options).toPromise();
    }

    /**
     * Update xTDH grant
     * @param param the request object
     */
    public updateXTdhGrantWithHttpInfo(param: XTDHApiUpdateXTdhGrantRequest, options?: Configuration): Promise<HttpInfo<ApiXTdhGrant>> {
        return this.api.updateXTdhGrantWithHttpInfo(param.id, param.apiXTdhGrantUpdateRequest,  options).toPromise();
    }

    /**
     * Update xTDH grant
     * @param param the request object
     */
    public updateXTdhGrant(param: XTDHApiUpdateXTdhGrantRequest, options?: Configuration): Promise<ApiXTdhGrant> {
        return this.api.updateXTdhGrant(param.id, param.apiXTdhGrantUpdateRequest,  options).toPromise();
    }

}
