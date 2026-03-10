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
import { ObservableAggregatedActivityApi } from './ObservableAPI';

import { AggregatedActivityApiRequestFactory, AggregatedActivityApiResponseProcessor} from "../apis/AggregatedActivityApi";
export class PromiseAggregatedActivityApi {
    private api: ObservableAggregatedActivityApi

    public constructor(
        configuration: Configuration,
        requestFactory?: AggregatedActivityApiRequestFactory,
        responseProcessor?: AggregatedActivityApiResponseProcessor
    ) {
        this.api = new ObservableAggregatedActivityApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get aggregated activity
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is ASC; applied to id sort
     * @param [sort] Default is primary_purchases_count
     * @param [search] Search by wallet address, profile handle or ENS
     * @param [content] Filter by content
     * @param [season] Filter by season
     * @param [collector] Filter by collector type
     */
    public getAggregatedActivityWithHttpInfo(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'primary_purchases_count' | 'primary_purchases_value' | 'secondary_purchases_count' | 'secondary_purchases_value' | 'sales_count' | 'sales_value' | 'transfers_in' | 'transfers_out' | 'airdrops' | 'burns', search?: string, content?: 'Memes' | 'Gradient' | 'MemeLab' | 'NextGen', season?: number, collector?: 'All' | 'Memes' | 'Meme SZN Set' | 'Genesis Set' | 'Gradient' | 'MemeLab' | 'NextGen', _options?: Configuration): Promise<HttpInfo<Array<ApiAggregatedActivityPage>>> {
        const result = this.api.getAggregatedActivityWithHttpInfo(pageSize, page, sortDirection, sort, search, content, season, collector, _options);
        return result.toPromise();
    }

    /**
     * Get aggregated activity
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is ASC; applied to id sort
     * @param [sort] Default is primary_purchases_count
     * @param [search] Search by wallet address, profile handle or ENS
     * @param [content] Filter by content
     * @param [season] Filter by season
     * @param [collector] Filter by collector type
     */
    public getAggregatedActivity(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'primary_purchases_count' | 'primary_purchases_value' | 'secondary_purchases_count' | 'secondary_purchases_value' | 'sales_count' | 'sales_value' | 'transfers_in' | 'transfers_out' | 'airdrops' | 'burns', search?: string, content?: 'Memes' | 'Gradient' | 'MemeLab' | 'NextGen', season?: number, collector?: 'All' | 'Memes' | 'Meme SZN Set' | 'Genesis Set' | 'Gradient' | 'MemeLab' | 'NextGen', _options?: Configuration): Promise<Array<ApiAggregatedActivityPage>> {
        const result = this.api.getAggregatedActivity(pageSize, page, sortDirection, sort, search, content, season, collector, _options);
        return result.toPromise();
    }

    /**
     * Get aggregated activity by consolidation key.
     * @param consolidationKey
     */
    public getAggregatedActivityByConsolidationKeyWithHttpInfo(consolidationKey: string, _options?: Configuration): Promise<HttpInfo<ApiAggregatedActivity>> {
        const result = this.api.getAggregatedActivityByConsolidationKeyWithHttpInfo(consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get aggregated activity by consolidation key.
     * @param consolidationKey
     */
    public getAggregatedActivityByConsolidationKey(consolidationKey: string, _options?: Configuration): Promise<ApiAggregatedActivity> {
        const result = this.api.getAggregatedActivityByConsolidationKey(consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get memes aggregated activity by consolidation key per season.
     * @param consolidationKey
     */
    public getMemesAggregatedActivityByConsolidationKeyWithHttpInfo(consolidationKey: string, _options?: Configuration): Promise<HttpInfo<Array<ApiAggregatedActivityMemes>>> {
        const result = this.api.getMemesAggregatedActivityByConsolidationKeyWithHttpInfo(consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get memes aggregated activity by consolidation key per season.
     * @param consolidationKey
     */
    public getMemesAggregatedActivityByConsolidationKey(consolidationKey: string, _options?: Configuration): Promise<Array<ApiAggregatedActivityMemes>> {
        const result = this.api.getMemesAggregatedActivityByConsolidationKey(consolidationKey, _options);
        return result.toPromise();
    }


}



import { ObservableAuthenticationApi } from './ObservableAPI';

import { AuthenticationApiRequestFactory, AuthenticationApiResponseProcessor} from "../apis/AuthenticationApi";
export class PromiseAuthenticationApi {
    private api: ObservableAuthenticationApi

    public constructor(
        configuration: Configuration,
        requestFactory?: AuthenticationApiRequestFactory,
        responseProcessor?: AuthenticationApiResponseProcessor
    ) {
        this.api = new ObservableAuthenticationApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Authenticate and get JWT token
     * @param signerAddress Your wallet address
     * @param apiLoginRequest
     */
    public getAuthTokenWithHttpInfo(signerAddress: string, apiLoginRequest: ApiLoginRequest, _options?: Configuration): Promise<HttpInfo<ApiLoginResponse>> {
        const result = this.api.getAuthTokenWithHttpInfo(signerAddress, apiLoginRequest, _options);
        return result.toPromise();
    }

    /**
     * Authenticate and get JWT token
     * @param signerAddress Your wallet address
     * @param apiLoginRequest
     */
    public getAuthToken(signerAddress: string, apiLoginRequest: ApiLoginRequest, _options?: Configuration): Promise<ApiLoginResponse> {
        const result = this.api.getAuthToken(signerAddress, apiLoginRequest, _options);
        return result.toPromise();
    }

    /**
     * Get a message to sign with your web3 wallet
     * @param signerAddress Your wallet address
     * @param [shortNonce] If true, the nonce will be shorter and easier to sign. Default is false.
     */
    public getNonceWithHttpInfo(signerAddress: string, shortNonce?: boolean, _options?: Configuration): Promise<HttpInfo<ApiNonceResponse>> {
        const result = this.api.getNonceWithHttpInfo(signerAddress, shortNonce, _options);
        return result.toPromise();
    }

    /**
     * Get a message to sign with your web3 wallet
     * @param signerAddress Your wallet address
     * @param [shortNonce] If true, the nonce will be shorter and easier to sign. Default is false.
     */
    public getNonce(signerAddress: string, shortNonce?: boolean, _options?: Configuration): Promise<ApiNonceResponse> {
        const result = this.api.getNonce(signerAddress, shortNonce, _options);
        return result.toPromise();
    }

    /**
     * Redeem refresh token
     * @param apiRedeemRefreshTokenRequest
     */
    public redeemRefreshTokenWithHttpInfo(apiRedeemRefreshTokenRequest: ApiRedeemRefreshTokenRequest, _options?: Configuration): Promise<HttpInfo<ApiRedeemRefreshTokenResponse>> {
        const result = this.api.redeemRefreshTokenWithHttpInfo(apiRedeemRefreshTokenRequest, _options);
        return result.toPromise();
    }

    /**
     * Redeem refresh token
     * @param apiRedeemRefreshTokenRequest
     */
    public redeemRefreshToken(apiRedeemRefreshTokenRequest: ApiRedeemRefreshTokenRequest, _options?: Configuration): Promise<ApiRedeemRefreshTokenResponse> {
        const result = this.api.redeemRefreshToken(apiRedeemRefreshTokenRequest, _options);
        return result.toPromise();
    }


}



import { ObservableCollectedStatsApi } from './ObservableAPI';

import { CollectedStatsApiRequestFactory, CollectedStatsApiResponseProcessor} from "../apis/CollectedStatsApi";
export class PromiseCollectedStatsApi {
    private api: ObservableCollectedStatsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: CollectedStatsApiRequestFactory,
        responseProcessor?: CollectedStatsApiResponseProcessor
    ) {
        this.api = new ObservableCollectedStatsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get consolidated collection stats for an identity
     * @param identityKey Profile handle, wallet address, or ENS name
     */
    public getCollectedStatsWithHttpInfo(identityKey: string, _options?: Configuration): Promise<HttpInfo<ApiCollectedStats>> {
        const result = this.api.getCollectedStatsWithHttpInfo(identityKey, _options);
        return result.toPromise();
    }

    /**
     * Get consolidated collection stats for an identity
     * @param identityKey Profile handle, wallet address, or ENS name
     */
    public getCollectedStats(identityKey: string, _options?: Configuration): Promise<ApiCollectedStats> {
        const result = this.api.getCollectedStats(identityKey, _options);
        return result.toPromise();
    }


}



import { ObservableCommunityMembersApi } from './ObservableAPI';

import { CommunityMembersApiRequestFactory, CommunityMembersApiResponseProcessor} from "../apis/CommunityMembersApi";
export class PromiseCommunityMembersApi {
    private api: ObservableCommunityMembersApi

    public constructor(
        configuration: Configuration,
        requestFactory?: CommunityMembersApiRequestFactory,
        responseProcessor?: CommunityMembersApiResponseProcessor
    ) {
        this.api = new ObservableCommunityMembersApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get community members.
     * @param [onlyProfileOwners] Return only profile owners?
     * @param [param] Search param
     */
    public getCommunityMembersWithHttpInfo(onlyProfileOwners?: boolean, param?: string, _options?: Configuration): Promise<HttpInfo<Array<ApiCommunityMemberMinimal>>> {
        const result = this.api.getCommunityMembersWithHttpInfo(onlyProfileOwners, param, _options);
        return result.toPromise();
    }

    /**
     * Get community members.
     * @param [onlyProfileOwners] Return only profile owners?
     * @param [param] Search param
     */
    public getCommunityMembers(onlyProfileOwners?: boolean, param?: string, _options?: Configuration): Promise<Array<ApiCommunityMemberMinimal>> {
        const result = this.api.getCommunityMembers(onlyProfileOwners, param, _options);
        return result.toPromise();
    }

    /**
     * Get top community members with pagination and sorting.
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [sort] Default is level
     * @param [groupId] Filter by group ID
     */
    public getTopCommunityMembersWithHttpInfo(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: ApiCommunityMembersSortOption, groupId?: string, _options?: Configuration): Promise<HttpInfo<ApiCommunityMembersPage>> {
        const result = this.api.getTopCommunityMembersWithHttpInfo(pageSize, page, sortDirection, sort, groupId, _options);
        return result.toPromise();
    }

    /**
     * Get top community members with pagination and sorting.
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [sort] Default is level
     * @param [groupId] Filter by group ID
     */
    public getTopCommunityMembers(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: ApiCommunityMembersSortOption, groupId?: string, _options?: Configuration): Promise<ApiCommunityMembersPage> {
        const result = this.api.getTopCommunityMembers(pageSize, page, sortDirection, sort, groupId, _options);
        return result.toPromise();
    }


}



import { ObservableCommunityMetricsApi } from './ObservableAPI';

import { CommunityMetricsApiRequestFactory, CommunityMetricsApiResponseProcessor} from "../apis/CommunityMetricsApi";
export class PromiseCommunityMetricsApi {
    private api: ObservableCommunityMetricsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: CommunityMetricsApiRequestFactory,
        responseProcessor?: CommunityMetricsApiResponseProcessor
    ) {
        this.api = new ObservableCommunityMetricsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get community metrics.
     * @param interval Metrics interval
     */
    public getCommunityMetricsWithHttpInfo(interval: 'DAY' | 'WEEK', _options?: Configuration): Promise<HttpInfo<ApiCommunityMetrics>> {
        const result = this.api.getCommunityMetricsWithHttpInfo(interval, _options);
        return result.toPromise();
    }

    /**
     * Get community metrics.
     * @param interval Metrics interval
     */
    public getCommunityMetrics(interval: 'DAY' | 'WEEK', _options?: Configuration): Promise<ApiCommunityMetrics> {
        const result = this.api.getCommunityMetrics(interval, _options);
        return result.toPromise();
    }

    /**
     * Get community metrics series.
     * @param since Unix millis timestamp for start of series.
     * @param to Unix millis timestamp for end of series.
     */
    public getCommunityMetricsSeriesWithHttpInfo(since: number, to: number, _options?: Configuration): Promise<HttpInfo<ApiCommunityMetricsSeries>> {
        const result = this.api.getCommunityMetricsSeriesWithHttpInfo(since, to, _options);
        return result.toPromise();
    }

    /**
     * Get community metrics series.
     * @param since Unix millis timestamp for start of series.
     * @param to Unix millis timestamp for end of series.
     */
    public getCommunityMetricsSeries(since: number, to: number, _options?: Configuration): Promise<ApiCommunityMetricsSeries> {
        const result = this.api.getCommunityMetricsSeries(since, to, _options);
        return result.toPromise();
    }

    /**
     * Get community mint metrics.
     * @param [pageSize]
     * @param [page]
     * @param [sortDirection]
     * @param [sort]
     */
    public getCommunityMintMetricsWithHttpInfo(pageSize?: number, page?: number, sortDirection?: ApiPageSortDirection, sort?: 'mint_time', _options?: Configuration): Promise<HttpInfo<ApiMintMetricsPage>> {
        const result = this.api.getCommunityMintMetricsWithHttpInfo(pageSize, page, sortDirection, sort, _options);
        return result.toPromise();
    }

    /**
     * Get community mint metrics.
     * @param [pageSize]
     * @param [page]
     * @param [sortDirection]
     * @param [sort]
     */
    public getCommunityMintMetrics(pageSize?: number, page?: number, sortDirection?: ApiPageSortDirection, sort?: 'mint_time', _options?: Configuration): Promise<ApiMintMetricsPage> {
        const result = this.api.getCommunityMintMetrics(pageSize, page, sortDirection, sort, _options);
        return result.toPromise();
    }


}



import { ObservableDistributionsApi } from './ObservableAPI';

import { DistributionsApiRequestFactory, DistributionsApiResponseProcessor} from "../apis/DistributionsApi";
export class PromiseDistributionsApi {
    private api: ObservableDistributionsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: DistributionsApiRequestFactory,
        responseProcessor?: DistributionsApiResponseProcessor
    ) {
        this.api = new ObservableDistributionsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Complete multipart upload for distribution photo
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCompleteMultipartUploadRequest
     */
    public completeDistributionPhotoMultipartUploadWithHttpInfo(contract: string, nftId: number, apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Promise<HttpInfo<ApiCompleteMultipartUploadResponse>> {
        const result = this.api.completeDistributionPhotoMultipartUploadWithHttpInfo(contract, nftId, apiCompleteMultipartUploadRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Complete multipart upload for distribution photo
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCompleteMultipartUploadRequest
     */
    public completeDistributionPhotoMultipartUpload(contract: string, nftId: number, apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Promise<ApiCompleteMultipartUploadResponse> {
        const result = this.api.completeDistributionPhotoMultipartUpload(contract, nftId, apiCompleteMultipartUploadRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin. Replaces all existing photos for the card.
     * Save uploaded distribution photos to database
     * @param contract Contract address
     * @param nftId NFT ID
     * @param distributionPhotoCompleteRequest
     */
    public completeDistributionPhotosUploadWithHttpInfo(contract: string, nftId: number, distributionPhotoCompleteRequest: DistributionPhotoCompleteRequest, _options?: Configuration): Promise<HttpInfo<DistributionPhotoCompleteResponse>> {
        const result = this.api.completeDistributionPhotosUploadWithHttpInfo(contract, nftId, distributionPhotoCompleteRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin. Replaces all existing photos for the card.
     * Save uploaded distribution photos to database
     * @param contract Contract address
     * @param nftId NFT ID
     * @param distributionPhotoCompleteRequest
     */
    public completeDistributionPhotosUpload(contract: string, nftId: number, distributionPhotoCompleteRequest: DistributionPhotoCompleteRequest, _options?: Configuration): Promise<DistributionPhotoCompleteResponse> {
        const result = this.api.completeDistributionPhotosUpload(contract, nftId, distributionPhotoCompleteRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Start multipart upload for distribution photo
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCreateMediaUploadUrlRequest
     */
    public createDistributionPhotoMultipartUploadWithHttpInfo(contract: string, nftId: number, apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<HttpInfo<ApiStartMultipartMediaUploadResponse>> {
        const result = this.api.createDistributionPhotoMultipartUploadWithHttpInfo(contract, nftId, apiCreateMediaUploadUrlRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Start multipart upload for distribution photo
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCreateMediaUploadUrlRequest
     */
    public createDistributionPhotoMultipartUpload(contract: string, nftId: number, apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<ApiStartMultipartMediaUploadResponse> {
        const result = this.api.createDistributionPhotoMultipartUpload(contract, nftId, apiCreateMediaUploadUrlRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned S3 URL for distribution photo upload
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCreateMediaUploadUrlRequest
     */
    public createDistributionPhotoUploadUrlWithHttpInfo(contract: string, nftId: number, apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<HttpInfo<ApiCreateMediaUrlResponse>> {
        const result = this.api.createDistributionPhotoUploadUrlWithHttpInfo(contract, nftId, apiCreateMediaUploadUrlRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned S3 URL for distribution photo upload
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCreateMediaUploadUrlRequest
     */
    public createDistributionPhotoUploadUrl(contract: string, nftId: number, apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<ApiCreateMediaUrlResponse> {
        const result = this.api.createDistributionPhotoUploadUrl(contract, nftId, apiCreateMediaUploadUrlRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get distribution overview for a specific contract and card
     * @param contract Contract address
     * @param id Card ID
     */
    public getDistributionOverviewWithHttpInfo(contract: string, id: number, _options?: Configuration): Promise<HttpInfo<DistributionOverview>> {
        const result = this.api.getDistributionOverviewWithHttpInfo(contract, id, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get distribution overview for a specific contract and card
     * @param contract Contract address
     * @param id Card ID
     */
    public getDistributionOverview(contract: string, id: number, _options?: Configuration): Promise<DistributionOverview> {
        const result = this.api.getDistributionOverview(contract, id, _options);
        return result.toPromise();
    }

    /**
     * Get distribution phases for a specific contract and NFT
     * @param contract Contract address
     * @param nftId NFT ID
     */
    public getDistributionPhasesWithHttpInfo(contract: string, nftId: number, _options?: Configuration): Promise<HttpInfo<DistributionPhasesPage>> {
        const result = this.api.getDistributionPhasesWithHttpInfo(contract, nftId, _options);
        return result.toPromise();
    }

    /**
     * Get distribution phases for a specific contract and NFT
     * @param contract Contract address
     * @param nftId NFT ID
     */
    public getDistributionPhases(contract: string, nftId: number, _options?: Configuration): Promise<DistributionPhasesPage> {
        const result = this.api.getDistributionPhases(contract, nftId, _options);
        return result.toPromise();
    }

    /**
     * Get distribution photos for a specific contract and NFT
     * @param contract Contract address
     * @param nftId NFT ID
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     */
    public getDistributionPhotosWithHttpInfo(contract: string, nftId: number, pageSize?: number, page?: number, _options?: Configuration): Promise<HttpInfo<DistributionPhotosPage>> {
        const result = this.api.getDistributionPhotosWithHttpInfo(contract, nftId, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get distribution photos for a specific contract and NFT
     * @param contract Contract address
     * @param nftId NFT ID
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     */
    public getDistributionPhotos(contract: string, nftId: number, pageSize?: number, page?: number, _options?: Configuration): Promise<DistributionPhotosPage> {
        const result = this.api.getDistributionPhotos(contract, nftId, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * At least one filter parameter (search, card_id, contract, or wallet) is required
     * Get distributions
     * @param [pageSize] Default is 2000
     * @param [page] Default is 1
     * @param [search] Search by wallet address or display name
     * @param [cardId] Filter by card ID(s), comma-separated for multiple
     * @param [contract] Filter by contract address(es), comma-separated for multiple
     * @param [wallet] Filter by wallet address(es), comma-separated for multiple
     */
    public getDistributionsWithHttpInfo(pageSize?: number, page?: number, search?: string, cardId?: string, contract?: string, wallet?: string, _options?: Configuration): Promise<HttpInfo<DistributionNormalizedPage>> {
        const result = this.api.getDistributionsWithHttpInfo(pageSize, page, search, cardId, contract, wallet, _options);
        return result.toPromise();
    }

    /**
     * At least one filter parameter (search, card_id, contract, or wallet) is required
     * Get distributions
     * @param [pageSize] Default is 2000
     * @param [page] Default is 1
     * @param [search] Search by wallet address or display name
     * @param [cardId] Filter by card ID(s), comma-separated for multiple
     * @param [contract] Filter by contract address(es), comma-separated for multiple
     * @param [wallet] Filter by wallet address(es), comma-separated for multiple
     */
    public getDistributions(pageSize?: number, page?: number, search?: string, cardId?: string, contract?: string, wallet?: string, _options?: Configuration): Promise<DistributionNormalizedPage> {
        const result = this.api.getDistributions(pageSize, page, search, cardId, contract, wallet, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned URL for multipart upload part
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiUploadPartOfMultipartUploadRequest
     */
    public uploadPartOfDistributionPhotoMultipartUploadWithHttpInfo(contract: string, nftId: number, apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Promise<HttpInfo<ApiUploadPartOfMultipartUploadResponse>> {
        const result = this.api.uploadPartOfDistributionPhotoMultipartUploadWithHttpInfo(contract, nftId, apiUploadPartOfMultipartUploadRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned URL for multipart upload part
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiUploadPartOfMultipartUploadRequest
     */
    public uploadPartOfDistributionPhotoMultipartUpload(contract: string, nftId: number, apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Promise<ApiUploadPartOfMultipartUploadResponse> {
        const result = this.api.uploadPartOfDistributionPhotoMultipartUpload(contract, nftId, apiUploadPartOfMultipartUploadRequest, _options);
        return result.toPromise();
    }


}



import { ObservableDropsApi } from './ObservableAPI';

import { DropsApiRequestFactory, DropsApiResponseProcessor} from "../apis/DropsApi";
export class PromiseDropsApi {
    private api: ObservableDropsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: DropsApiRequestFactory,
        responseProcessor?: DropsApiResponseProcessor
    ) {
        this.api = new ObservableDropsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Mark a drop as curated by authenticated user
     * @param dropId
     */
    public addDropCurationWithHttpInfo(dropId: string, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.addDropCurationWithHttpInfo(dropId, _options);
        return result.toPromise();
    }

    /**
     * Mark a drop as curated by authenticated user
     * @param dropId
     */
    public addDropCuration(dropId: string, _options?: Configuration): Promise<void> {
        const result = this.api.addDropCuration(dropId, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Bookmark a drop
     * @param dropId
     */
    public bookmarkDropWithHttpInfo(dropId: string, _options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        const result = this.api.bookmarkDropWithHttpInfo(dropId, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Bookmark a drop
     * @param dropId
     */
    public bookmarkDrop(dropId: string, _options?: Configuration): Promise<ApiDrop> {
        const result = this.api.bookmarkDrop(dropId, _options);
        return result.toPromise();
    }

    /**
     * Boost drop
     * @param dropId
     */
    public boostDropWithHttpInfo(dropId: string, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.boostDropWithHttpInfo(dropId, _options);
        return result.toPromise();
    }

    /**
     * Boost drop
     * @param dropId
     */
    public boostDrop(dropId: string, _options?: Configuration): Promise<void> {
        const result = this.api.boostDrop(dropId, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param apiCompleteMultipartUploadRequest
     */
    public completeDropMultipartUploadWithHttpInfo(apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Promise<HttpInfo<ApiCompleteMultipartUploadResponse>> {
        const result = this.api.completeDropMultipartUploadWithHttpInfo(apiCompleteMultipartUploadRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param apiCompleteMultipartUploadRequest
     */
    public completeDropMultipartUpload(apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Promise<ApiCompleteMultipartUploadResponse> {
        const result = this.api.completeDropMultipartUpload(apiCompleteMultipartUploadRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param apiCompleteMultipartUploadRequest
     */
    public completeWaveMultipartUploadWithHttpInfo(apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Promise<HttpInfo<ApiCompleteMultipartUploadResponse>> {
        const result = this.api.completeWaveMultipartUploadWithHttpInfo(apiCompleteMultipartUploadRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param apiCompleteMultipartUploadRequest
     */
    public completeWaveMultipartUpload(apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Promise<ApiCompleteMultipartUploadResponse> {
        const result = this.api.completeWaveMultipartUpload(apiCompleteMultipartUploadRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create a drop
     * @param apiCreateDropRequest
     */
    public createDropWithHttpInfo(apiCreateDropRequest: ApiCreateDropRequest, _options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        const result = this.api.createDropWithHttpInfo(apiCreateDropRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create a drop
     * @param apiCreateDropRequest
     */
    public createDrop(apiCreateDropRequest: ApiCreateDropRequest, _options?: Configuration): Promise<ApiDrop> {
        const result = this.api.createDrop(apiCreateDropRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for drop media upload
     * @param apiCreateMediaUploadUrlRequest
     */
    public createDropMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<HttpInfo<ApiCreateMediaUrlResponse>> {
        const result = this.api.createDropMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for drop media upload
     * @param apiCreateMediaUploadUrlRequest
     */
    public createDropMediaUrl(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<ApiCreateMediaUrlResponse> {
        const result = this.api.createDropMediaUrl(apiCreateMediaUploadUrlRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param apiCreateMediaUploadUrlRequest
     */
    public createMultipartDropMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<HttpInfo<ApiStartMultipartMediaUploadResponse>> {
        const result = this.api.createMultipartDropMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param apiCreateMediaUploadUrlRequest
     */
    public createMultipartDropMediaUrl(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<ApiStartMultipartMediaUploadResponse> {
        const result = this.api.createMultipartDropMediaUrl(apiCreateMediaUploadUrlRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param apiCreateMediaUploadUrlRequest
     */
    public createMultipartWaveMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<HttpInfo<ApiStartMultipartMediaUploadResponse>> {
        const result = this.api.createMultipartWaveMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param apiCreateMediaUploadUrlRequest
     */
    public createMultipartWaveMediaUrl(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<ApiStartMultipartMediaUploadResponse> {
        const result = this.api.createMultipartWaveMediaUrl(apiCreateMediaUploadUrlRequest, _options);
        return result.toPromise();
    }

    /**
     * Delete drop boost
     * @param dropId
     */
    public deleteDropBoostWithHttpInfo(dropId: string, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.deleteDropBoostWithHttpInfo(dropId, _options);
        return result.toPromise();
    }

    /**
     * Delete drop boost
     * @param dropId
     */
    public deleteDropBoost(dropId: string, _options?: Configuration): Promise<void> {
        const result = this.api.deleteDropBoost(dropId, _options);
        return result.toPromise();
    }

    /**
     * Delete drop by ID
     * @param dropId
     */
    public deleteDropByIdWithHttpInfo(dropId: string, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.deleteDropByIdWithHttpInfo(dropId, _options);
        return result.toPromise();
    }

    /**
     * Delete drop by ID
     * @param dropId
     */
    public deleteDropById(dropId: string, _options?: Configuration): Promise<void> {
        const result = this.api.deleteDropById(dropId, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated. Returns drops bookmarked by the current user, sorted by bookmark time.
     * Get bookmarked drops for authenticated user
     * @param [waveId] Filter by wave
     * @param [page]
     * @param [pageSize]
     * @param [sortDirection] Default is DESC (newest bookmarks first)
     */
    public getBookmarkedDropsWithHttpInfo(waveId?: string, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, _options?: Configuration): Promise<HttpInfo<ApiDropsPage>> {
        const result = this.api.getBookmarkedDropsWithHttpInfo(waveId, page, pageSize, sortDirection, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated. Returns drops bookmarked by the current user, sorted by bookmark time.
     * Get bookmarked drops for authenticated user
     * @param [waveId] Filter by wave
     * @param [page]
     * @param [pageSize]
     * @param [sortDirection] Default is DESC (newest bookmarks first)
     */
    public getBookmarkedDrops(waveId?: string, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, _options?: Configuration): Promise<ApiDropsPage> {
        const result = this.api.getBookmarkedDrops(waveId, page, pageSize, sortDirection, _options);
        return result.toPromise();
    }

    /**
     * Get boosted drops.
     * @param [author] Drops by author
     * @param [booster] Drops boosted by given identity
     * @param [waveId] Drops by wave
     * @param [minBoosts] Must be boosted at least so many times
     * @param [page]
     * @param [pageSize]
     * @param [sortDirection] Default is DESC
     * @param [sort] Default is last_boosted_at
     * @param [countOnlyBoostsAfter] Timestamp in millis
     */
    public getBoostedDropsWithHttpInfo(author?: string, booster?: string, waveId?: string, minBoosts?: number, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, sort?: 'last_boosted_at' | 'first_boosted_at' | 'drop_created_at' | 'boosts', countOnlyBoostsAfter?: number, _options?: Configuration): Promise<HttpInfo<ApiDropsPage>> {
        const result = this.api.getBoostedDropsWithHttpInfo(author, booster, waveId, minBoosts, page, pageSize, sortDirection, sort, countOnlyBoostsAfter, _options);
        return result.toPromise();
    }

    /**
     * Get boosted drops.
     * @param [author] Drops by author
     * @param [booster] Drops boosted by given identity
     * @param [waveId] Drops by wave
     * @param [minBoosts] Must be boosted at least so many times
     * @param [page]
     * @param [pageSize]
     * @param [sortDirection] Default is DESC
     * @param [sort] Default is last_boosted_at
     * @param [countOnlyBoostsAfter] Timestamp in millis
     */
    public getBoostedDrops(author?: string, booster?: string, waveId?: string, minBoosts?: number, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, sort?: 'last_boosted_at' | 'first_boosted_at' | 'drop_created_at' | 'boosts', countOnlyBoostsAfter?: number, _options?: Configuration): Promise<ApiDropsPage> {
        const result = this.api.getBoostedDrops(author, booster, waveId, minBoosts, page, pageSize, sortDirection, sort, countOnlyBoostsAfter, _options);
        return result.toPromise();
    }

    /**
     * Get drop boosts by Drop ID.
     * @param dropId
     * @param [pageSize]
     * @param [page]
     * @param [sortDirection] Default is DESC
     * @param [sort] Default is boosted_at
     */
    public getDropBoostsByIdWithHttpInfo(dropId: string, pageSize?: number, page?: number, sortDirection?: ApiPageSortDirection, sort?: 'boosted_at', _options?: Configuration): Promise<HttpInfo<ApiDropBoostsPage>> {
        const result = this.api.getDropBoostsByIdWithHttpInfo(dropId, pageSize, page, sortDirection, sort, _options);
        return result.toPromise();
    }

    /**
     * Get drop boosts by Drop ID.
     * @param dropId
     * @param [pageSize]
     * @param [page]
     * @param [sortDirection] Default is DESC
     * @param [sort] Default is boosted_at
     */
    public getDropBoostsById(dropId: string, pageSize?: number, page?: number, sortDirection?: ApiPageSortDirection, sort?: 'boosted_at', _options?: Configuration): Promise<ApiDropBoostsPage> {
        const result = this.api.getDropBoostsById(dropId, pageSize, page, sortDirection, sort, _options);
        return result.toPromise();
    }

    /**
     * Get drop by ID.
     * @param dropId
     */
    public getDropByIdWithHttpInfo(dropId: string, _options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        const result = this.api.getDropByIdWithHttpInfo(dropId, _options);
        return result.toPromise();
    }

    /**
     * Get drop by ID.
     * @param dropId
     */
    public getDropById(dropId: string, _options?: Configuration): Promise<ApiDrop> {
        const result = this.api.getDropById(dropId, _options);
        return result.toPromise();
    }

    /**
     * Get identities who curated a drop
     * @param dropId
     * @param [page]
     * @param [pageSize]
     * @param [sortDirection] Default is DESC
     */
    public getDropCuratorsWithHttpInfo(dropId: string, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, _options?: Configuration): Promise<HttpInfo<ApiProfileMinsPage>> {
        const result = this.api.getDropCuratorsWithHttpInfo(dropId, page, pageSize, sortDirection, _options);
        return result.toPromise();
    }

    /**
     * Get identities who curated a drop
     * @param dropId
     * @param [page]
     * @param [pageSize]
     * @param [sortDirection] Default is DESC
     */
    public getDropCurators(dropId: string, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, _options?: Configuration): Promise<ApiProfileMinsPage> {
        const result = this.api.getDropCurators(dropId, page, pageSize, sortDirection, _options);
        return result.toPromise();
    }

    /**
     * Get drop IDs in wave by serial range.
     * @param waveId Drops in wave with given ID
     * @param minSerialNo
     * @param [maxSerialNo]
     * @param [limit] How many IDs to return (100 by default)
     */
    public getDropIdsWithHttpInfo(waveId: string, minSerialNo: number, maxSerialNo?: number, limit?: number, _options?: Configuration): Promise<HttpInfo<Array<ApiDropId>>> {
        const result = this.api.getDropIdsWithHttpInfo(waveId, minSerialNo, maxSerialNo, limit, _options);
        return result.toPromise();
    }

    /**
     * Get drop IDs in wave by serial range.
     * @param waveId Drops in wave with given ID
     * @param minSerialNo
     * @param [maxSerialNo]
     * @param [limit] How many IDs to return (100 by default)
     */
    public getDropIds(waveId: string, minSerialNo: number, maxSerialNo?: number, limit?: number, _options?: Configuration): Promise<Array<ApiDropId>> {
        const result = this.api.getDropIds(waveId, minSerialNo, maxSerialNo, limit, _options);
        return result.toPromise();
    }

    /**
     * Get latest drops.
     * @param [limit] How many drops to return (10 by default)
     * @param [author] Drops by author
     * @param [groupId] Drops by authors that fall into supplied group
     * @param [waveId] Drops in wave with given ID
     * @param [serialNoLessThan] Used to find older drops
     * @param [includeReplies] If true then reply drops will be included in top level (false by default)
     * @param [dropType] Filter by drop type
     * @param [ids] Comma-separated list of drop IDs to fetch
     * @param [containsMedia] If true then only drops that have at least one media attachment will be returned (false by default)
     */
    public getLatestDropsWithHttpInfo(limit?: number, author?: string, groupId?: string, waveId?: string, serialNoLessThan?: number, includeReplies?: boolean, dropType?: ApiDropType, ids?: string, containsMedia?: boolean, _options?: Configuration): Promise<HttpInfo<Array<ApiDrop>>> {
        const result = this.api.getLatestDropsWithHttpInfo(limit, author, groupId, waveId, serialNoLessThan, includeReplies, dropType, ids, containsMedia, _options);
        return result.toPromise();
    }

    /**
     * Get latest drops.
     * @param [limit] How many drops to return (10 by default)
     * @param [author] Drops by author
     * @param [groupId] Drops by authors that fall into supplied group
     * @param [waveId] Drops in wave with given ID
     * @param [serialNoLessThan] Used to find older drops
     * @param [includeReplies] If true then reply drops will be included in top level (false by default)
     * @param [dropType] Filter by drop type
     * @param [ids] Comma-separated list of drop IDs to fetch
     * @param [containsMedia] If true then only drops that have at least one media attachment will be returned (false by default)
     */
    public getLatestDrops(limit?: number, author?: string, groupId?: string, waveId?: string, serialNoLessThan?: number, includeReplies?: boolean, dropType?: ApiDropType, ids?: string, containsMedia?: boolean, _options?: Configuration): Promise<Array<ApiDrop>> {
        const result = this.api.getLatestDrops(limit, author, groupId, waveId, serialNoLessThan, includeReplies, dropType, ids, containsMedia, _options);
        return result.toPromise();
    }

    /**
     * Get light drops
     * @param limit
     * @param waveId Drops in wave with given ID
     * @param [maxSerialNo] Latest message if null
     */
    public getLightDropsWithHttpInfo(limit: number, waveId: string, maxSerialNo?: number, _options?: Configuration): Promise<HttpInfo<Array<ApiLightDrop>>> {
        const result = this.api.getLightDropsWithHttpInfo(limit, waveId, maxSerialNo, _options);
        return result.toPromise();
    }

    /**
     * Get light drops
     * @param limit
     * @param waveId Drops in wave with given ID
     * @param [maxSerialNo] Latest message if null
     */
    public getLightDrops(limit: number, waveId: string, maxSerialNo?: number, _options?: Configuration): Promise<Array<ApiLightDrop>> {
        const result = this.api.getLightDrops(limit, waveId, maxSerialNo, _options);
        return result.toPromise();
    }

    /**
     * Sets the user\"s latest_read_timestamp to just before this drop\"s created_at, making this drop and all newer drops unread.
     * Mark a drop and all subsequent drops in the wave as unread
     * @param dropId
     */
    public markDropUnreadWithHttpInfo(dropId: string, _options?: Configuration): Promise<HttpInfo<ApiMarkDropUnreadResponse>> {
        const result = this.api.markDropUnreadWithHttpInfo(dropId, _options);
        return result.toPromise();
    }

    /**
     * Sets the user\"s latest_read_timestamp to just before this drop\"s created_at, making this drop and all newer drops unread.
     * Mark a drop and all subsequent drops in the wave as unread
     * @param dropId
     */
    public markDropUnread(dropId: string, _options?: Configuration): Promise<ApiMarkDropUnreadResponse> {
        const result = this.api.markDropUnread(dropId, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Rate a drop
     * @param dropId
     * @param apiDropRatingRequest
     */
    public rateDropWithHttpInfo(dropId: string, apiDropRatingRequest: ApiDropRatingRequest, _options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        const result = this.api.rateDropWithHttpInfo(dropId, apiDropRatingRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Rate a drop
     * @param dropId
     * @param apiDropRatingRequest
     */
    public rateDrop(dropId: string, apiDropRatingRequest: ApiDropRatingRequest, _options?: Configuration): Promise<ApiDrop> {
        const result = this.api.rateDrop(dropId, apiDropRatingRequest, _options);
        return result.toPromise();
    }

    /**
     * React to a drop
     * @param dropId
     * @param apiAddReactionToDropRequest
     */
    public reactToDropWithHttpInfo(dropId: string, apiAddReactionToDropRequest: ApiAddReactionToDropRequest, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.reactToDropWithHttpInfo(dropId, apiAddReactionToDropRequest, _options);
        return result.toPromise();
    }

    /**
     * React to a drop
     * @param dropId
     * @param apiAddReactionToDropRequest
     */
    public reactToDrop(dropId: string, apiAddReactionToDropRequest: ApiAddReactionToDropRequest, _options?: Configuration): Promise<void> {
        const result = this.api.reactToDrop(dropId, apiAddReactionToDropRequest, _options);
        return result.toPromise();
    }

    /**
     * Remove authenticated user\"s curation from a drop
     * @param dropId
     */
    public removeDropCurationWithHttpInfo(dropId: string, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.removeDropCurationWithHttpInfo(dropId, _options);
        return result.toPromise();
    }

    /**
     * Remove authenticated user\"s curation from a drop
     * @param dropId
     */
    public removeDropCuration(dropId: string, _options?: Configuration): Promise<void> {
        const result = this.api.removeDropCuration(dropId, _options);
        return result.toPromise();
    }

    /**
     * Remove reaction from a drop
     * @param dropId
     * @param apiAddReactionToDropRequest
     */
    public removeReactionFromDropWithHttpInfo(dropId: string, apiAddReactionToDropRequest: ApiAddReactionToDropRequest, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.removeReactionFromDropWithHttpInfo(dropId, apiAddReactionToDropRequest, _options);
        return result.toPromise();
    }

    /**
     * Remove reaction from a drop
     * @param dropId
     * @param apiAddReactionToDropRequest
     */
    public removeReactionFromDrop(dropId: string, apiAddReactionToDropRequest: ApiAddReactionToDropRequest, _options?: Configuration): Promise<void> {
        const result = this.api.removeReactionFromDrop(dropId, apiAddReactionToDropRequest, _options);
        return result.toPromise();
    }

    /**
     * Subscribe authenticated user to drop actions.
     * @param dropId
     * @param apiDropSubscriptionActions
     */
    public subscribeToDropActionsWithHttpInfo(dropId: string, apiDropSubscriptionActions: ApiDropSubscriptionActions, _options?: Configuration): Promise<HttpInfo<ApiDropSubscriptionActions>> {
        const result = this.api.subscribeToDropActionsWithHttpInfo(dropId, apiDropSubscriptionActions, _options);
        return result.toPromise();
    }

    /**
     * Subscribe authenticated user to drop actions.
     * @param dropId
     * @param apiDropSubscriptionActions
     */
    public subscribeToDropActions(dropId: string, apiDropSubscriptionActions: ApiDropSubscriptionActions, _options?: Configuration): Promise<ApiDropSubscriptionActions> {
        const result = this.api.subscribeToDropActions(dropId, apiDropSubscriptionActions, _options);
        return result.toPromise();
    }

    /**
     * Toggles (flips) hide_link_preview for a drop. Only the author can call this endpoint.
     * Toggle hide link preview for a drop
     * @param dropId
     */
    public toggleHideLinkPreviewWithHttpInfo(dropId: string, _options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        const result = this.api.toggleHideLinkPreviewWithHttpInfo(dropId, _options);
        return result.toPromise();
    }

    /**
     * Toggles (flips) hide_link_preview for a drop. Only the author can call this endpoint.
     * Toggle hide link preview for a drop
     * @param dropId
     */
    public toggleHideLinkPreview(dropId: string, _options?: Configuration): Promise<ApiDrop> {
        const result = this.api.toggleHideLinkPreview(dropId, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Remove bookmark from drop
     * @param dropId
     */
    public unbookmarkDropWithHttpInfo(dropId: string, _options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        const result = this.api.unbookmarkDropWithHttpInfo(dropId, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Remove bookmark from drop
     * @param dropId
     */
    public unbookmarkDrop(dropId: string, _options?: Configuration): Promise<ApiDrop> {
        const result = this.api.unbookmarkDrop(dropId, _options);
        return result.toPromise();
    }

    /**
     * Unsubscribe authenticated user from drop actions.
     * @param dropId
     * @param apiDropSubscriptionActions
     */
    public unsubscribeFromDropActionsWithHttpInfo(dropId: string, apiDropSubscriptionActions: ApiDropSubscriptionActions, _options?: Configuration): Promise<HttpInfo<ApiDropSubscriptionActions>> {
        const result = this.api.unsubscribeFromDropActionsWithHttpInfo(dropId, apiDropSubscriptionActions, _options);
        return result.toPromise();
    }

    /**
     * Unsubscribe authenticated user from drop actions.
     * @param dropId
     * @param apiDropSubscriptionActions
     */
    public unsubscribeFromDropActions(dropId: string, apiDropSubscriptionActions: ApiDropSubscriptionActions, _options?: Configuration): Promise<ApiDropSubscriptionActions> {
        const result = this.api.unsubscribeFromDropActions(dropId, apiDropSubscriptionActions, _options);
        return result.toPromise();
    }

    /**
     * Update drop by ID
     * @param dropId
     * @param apiUpdateDropRequest
     */
    public updateDropByIdWithHttpInfo(dropId: string, apiUpdateDropRequest: ApiUpdateDropRequest, _options?: Configuration): Promise<HttpInfo<ApiDrop>> {
        const result = this.api.updateDropByIdWithHttpInfo(dropId, apiUpdateDropRequest, _options);
        return result.toPromise();
    }

    /**
     * Update drop by ID
     * @param dropId
     * @param apiUpdateDropRequest
     */
    public updateDropById(dropId: string, apiUpdateDropRequest: ApiUpdateDropRequest, _options?: Configuration): Promise<ApiDrop> {
        const result = this.api.updateDropById(dropId, apiUpdateDropRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param apiUploadPartOfMultipartUploadRequest
     */
    public uploadPartOfDropMultipartUploadWithHttpInfo(apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Promise<HttpInfo<ApiUploadPartOfMultipartUploadResponse>> {
        const result = this.api.uploadPartOfDropMultipartUploadWithHttpInfo(apiUploadPartOfMultipartUploadRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param apiUploadPartOfMultipartUploadRequest
     */
    public uploadPartOfDropMultipartUpload(apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Promise<ApiUploadPartOfMultipartUploadResponse> {
        const result = this.api.uploadPartOfDropMultipartUpload(apiUploadPartOfMultipartUploadRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param apiUploadPartOfMultipartUploadRequest
     */
    public uploadPartOfWaveMultipartUploadWithHttpInfo(apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Promise<HttpInfo<ApiUploadPartOfMultipartUploadResponse>> {
        const result = this.api.uploadPartOfWaveMultipartUploadWithHttpInfo(apiUploadPartOfMultipartUploadRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param apiUploadPartOfMultipartUploadRequest
     */
    public uploadPartOfWaveMultipartUpload(apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Promise<ApiUploadPartOfMultipartUploadResponse> {
        const result = this.api.uploadPartOfWaveMultipartUpload(apiUploadPartOfMultipartUploadRequest, _options);
        return result.toPromise();
    }


}



import { ObservableFeedApi } from './ObservableAPI';

import { FeedApiRequestFactory, FeedApiResponseProcessor} from "../apis/FeedApi";
export class PromiseFeedApi {
    private api: ObservableFeedApi

    public constructor(
        configuration: Configuration,
        requestFactory?: FeedApiRequestFactory,
        responseProcessor?: FeedApiResponseProcessor
    ) {
        this.api = new ObservableFeedApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get feed
     * @param [serialNoLessThan] Used to find older items
     */
    public getFeedWithHttpInfo(serialNoLessThan?: number, _options?: Configuration): Promise<HttpInfo<Array<ApiFeedItem>>> {
        const result = this.api.getFeedWithHttpInfo(serialNoLessThan, _options);
        return result.toPromise();
    }

    /**
     * Get feed
     * @param [serialNoLessThan] Used to find older items
     */
    public getFeed(serialNoLessThan?: number, _options?: Configuration): Promise<Array<ApiFeedItem>> {
        const result = this.api.getFeed(serialNoLessThan, _options);
        return result.toPromise();
    }


}



import { ObservableGroupsApi } from './ObservableAPI';

import { GroupsApiRequestFactory, GroupsApiResponseProcessor} from "../apis/GroupsApi";
export class PromiseGroupsApi {
    private api: ObservableGroupsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: GroupsApiRequestFactory,
        responseProcessor?: GroupsApiResponseProcessor
    ) {
        this.api = new ObservableGroupsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Change group visibility
     * @param id
     * @param apiChangeGroupVisibility
     */
    public changeGroupVisibilityWithHttpInfo(id: string, apiChangeGroupVisibility: ApiChangeGroupVisibility, _options?: Configuration): Promise<HttpInfo<ApiGroupFull>> {
        const result = this.api.changeGroupVisibilityWithHttpInfo(id, apiChangeGroupVisibility, _options);
        return result.toPromise();
    }

    /**
     * Change group visibility
     * @param id
     * @param apiChangeGroupVisibility
     */
    public changeGroupVisibility(id: string, apiChangeGroupVisibility: ApiChangeGroupVisibility, _options?: Configuration): Promise<ApiGroupFull> {
        const result = this.api.changeGroupVisibility(id, apiChangeGroupVisibility, _options);
        return result.toPromise();
    }

    /**
     * Create a group
     * @param apiCreateGroup
     */
    public createGroupWithHttpInfo(apiCreateGroup: ApiCreateGroup, _options?: Configuration): Promise<HttpInfo<ApiGroupFull>> {
        const result = this.api.createGroupWithHttpInfo(apiCreateGroup, _options);
        return result.toPromise();
    }

    /**
     * Create a group
     * @param apiCreateGroup
     */
    public createGroup(apiCreateGroup: ApiCreateGroup, _options?: Configuration): Promise<ApiGroupFull> {
        const result = this.api.createGroup(apiCreateGroup, _options);
        return result.toPromise();
    }

    /**
     * Get identity groups identities. Identities are represented as primary wallet addresses
     * @param id
     * @param identityGroupId
     */
    public getIdentityGroupIdentitiesWithHttpInfo(id: string, identityGroupId: string, _options?: Configuration): Promise<HttpInfo<Array<string>>> {
        const result = this.api.getIdentityGroupIdentitiesWithHttpInfo(id, identityGroupId, _options);
        return result.toPromise();
    }

    /**
     * Get identity groups identities. Identities are represented as primary wallet addresses
     * @param id
     * @param identityGroupId
     */
    public getIdentityGroupIdentities(id: string, identityGroupId: string, _options?: Configuration): Promise<Array<string>> {
        const result = this.api.getIdentityGroupIdentities(id, identityGroupId, _options);
        return result.toPromise();
    }

    /**
     * Search for user groups
     * @param [groupName] Partial or full name
     * @param [authorIdentity] Group author identity
     * @param [createdAtLessThan] created at date less than
     */
    public searchUserGroupsWithHttpInfo(groupName?: string, authorIdentity?: string, createdAtLessThan?: number, _options?: Configuration): Promise<HttpInfo<Array<ApiGroupFull>>> {
        const result = this.api.searchUserGroupsWithHttpInfo(groupName, authorIdentity, createdAtLessThan, _options);
        return result.toPromise();
    }

    /**
     * Search for user groups
     * @param [groupName] Partial or full name
     * @param [authorIdentity] Group author identity
     * @param [createdAtLessThan] created at date less than
     */
    public searchUserGroups(groupName?: string, authorIdentity?: string, createdAtLessThan?: number, _options?: Configuration): Promise<Array<ApiGroupFull>> {
        const result = this.api.searchUserGroups(groupName, authorIdentity, createdAtLessThan, _options);
        return result.toPromise();
    }


}



import { ObservableIdentitiesApi } from './ObservableAPI';

import { IdentitiesApiRequestFactory, IdentitiesApiResponseProcessor} from "../apis/IdentitiesApi";
export class PromiseIdentitiesApi {
    private api: ObservableIdentitiesApi

    public constructor(
        configuration: Configuration,
        requestFactory?: IdentitiesApiRequestFactory,
        responseProcessor?: IdentitiesApiResponseProcessor
    ) {
        this.api = new ObservableIdentitiesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get identity by it\"s key. Key can be id, wallet, handle, ENS name, etc...
     * @param identityKey
     */
    public getIdentityByKeyWithHttpInfo(identityKey: string, _options?: Configuration): Promise<HttpInfo<ApiIdentity>> {
        const result = this.api.getIdentityByKeyWithHttpInfo(identityKey, _options);
        return result.toPromise();
    }

    /**
     * Get identity by it\"s key. Key can be id, wallet, handle, ENS name, etc...
     * @param identityKey
     */
    public getIdentityByKey(identityKey: string, _options?: Configuration): Promise<ApiIdentity> {
        const result = this.api.getIdentityByKey(identityKey, _options);
        return result.toPromise();
    }

    /**
     * Get identity by wallet
     * @param wallet
     */
    public getIdentityByWalletWithHttpInfo(wallet: string, _options?: Configuration): Promise<HttpInfo<ApiIdentity>> {
        const result = this.api.getIdentityByWalletWithHttpInfo(wallet, _options);
        return result.toPromise();
    }

    /**
     * Get identity by wallet
     * @param wallet
     */
    public getIdentityByWallet(wallet: string, _options?: Configuration): Promise<ApiIdentity> {
        const result = this.api.getIdentityByWallet(wallet, _options);
        return result.toPromise();
    }

    /**
     * Get subscribed actions to identity for authenticated user.
     * @param id
     */
    public getIdentitySubscriptionsWithHttpInfo(id: string, _options?: Configuration): Promise<HttpInfo<ApiIdentitySubscriptionActions>> {
        const result = this.api.getIdentitySubscriptionsWithHttpInfo(id, _options);
        return result.toPromise();
    }

    /**
     * Get subscribed actions to identity for authenticated user.
     * @param id
     */
    public getIdentitySubscriptions(id: string, _options?: Configuration): Promise<ApiIdentitySubscriptionActions> {
        const result = this.api.getIdentitySubscriptions(id, _options);
        return result.toPromise();
    }

    /**
     * Search for identities
     * @param handle At least 3 characters of a handle
     * @param [waveId] Search only users who can view given wave
     * @param [limit] Number of results (20 by default)
     * @param [groupId] Search only users who can view given group
     * @param [ignoreAuthenticatedUser] Ignore authenticated user
     */
    public searchIdentitiesWithHttpInfo(handle: string, waveId?: string, limit?: number, groupId?: string, ignoreAuthenticatedUser?: boolean, _options?: Configuration): Promise<HttpInfo<Array<ApiIdentity>>> {
        const result = this.api.searchIdentitiesWithHttpInfo(handle, waveId, limit, groupId, ignoreAuthenticatedUser, _options);
        return result.toPromise();
    }

    /**
     * Search for identities
     * @param handle At least 3 characters of a handle
     * @param [waveId] Search only users who can view given wave
     * @param [limit] Number of results (20 by default)
     * @param [groupId] Search only users who can view given group
     * @param [ignoreAuthenticatedUser] Ignore authenticated user
     */
    public searchIdentities(handle: string, waveId?: string, limit?: number, groupId?: string, ignoreAuthenticatedUser?: boolean, _options?: Configuration): Promise<Array<ApiIdentity>> {
        const result = this.api.searchIdentities(handle, waveId, limit, groupId, ignoreAuthenticatedUser, _options);
        return result.toPromise();
    }

    /**
     * Subscribe authenticated user to identities actions.
     * @param id
     * @param apiIdentitySubscriptionActions
     */
    public subscribeToIdentityActionsWithHttpInfo(id: string, apiIdentitySubscriptionActions: ApiIdentitySubscriptionActions, _options?: Configuration): Promise<HttpInfo<ApiIdentitySubscriptionActions>> {
        const result = this.api.subscribeToIdentityActionsWithHttpInfo(id, apiIdentitySubscriptionActions, _options);
        return result.toPromise();
    }

    /**
     * Subscribe authenticated user to identities actions.
     * @param id
     * @param apiIdentitySubscriptionActions
     */
    public subscribeToIdentityActions(id: string, apiIdentitySubscriptionActions: ApiIdentitySubscriptionActions, _options?: Configuration): Promise<ApiIdentitySubscriptionActions> {
        const result = this.api.subscribeToIdentityActions(id, apiIdentitySubscriptionActions, _options);
        return result.toPromise();
    }

    /**
     * Unsubscribe authenticated user from identity actions.
     * @param id
     * @param apiIdentitySubscriptionActions
     */
    public unsubscribeFromIdentityActionsWithHttpInfo(id: string, apiIdentitySubscriptionActions: ApiIdentitySubscriptionActions, _options?: Configuration): Promise<HttpInfo<ApiIdentitySubscriptionActions>> {
        const result = this.api.unsubscribeFromIdentityActionsWithHttpInfo(id, apiIdentitySubscriptionActions, _options);
        return result.toPromise();
    }

    /**
     * Unsubscribe authenticated user from identity actions.
     * @param id
     * @param apiIdentitySubscriptionActions
     */
    public unsubscribeFromIdentityActions(id: string, apiIdentitySubscriptionActions: ApiIdentitySubscriptionActions, _options?: Configuration): Promise<ApiIdentitySubscriptionActions> {
        const result = this.api.unsubscribeFromIdentityActions(id, apiIdentitySubscriptionActions, _options);
        return result.toPromise();
    }


}



import { ObservableMemesMintStatsApi } from './ObservableAPI';

import { MemesMintStatsApiRequestFactory, MemesMintStatsApiResponseProcessor} from "../apis/MemesMintStatsApi";
export class PromiseMemesMintStatsApi {
    private api: ObservableMemesMintStatsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: MemesMintStatsApiRequestFactory,
        responseProcessor?: MemesMintStatsApiResponseProcessor
    ) {
        this.api = new ObservableMemesMintStatsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get paginated memes mint stats
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is ASC
     */
    public getMemesMintStatsWithHttpInfo(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', _options?: Configuration): Promise<HttpInfo<ApiMemesMintStatsPage>> {
        const result = this.api.getMemesMintStatsWithHttpInfo(pageSize, page, sortDirection, _options);
        return result.toPromise();
    }

    /**
     * Get paginated memes mint stats
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is ASC
     */
    public getMemesMintStats(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', _options?: Configuration): Promise<ApiMemesMintStatsPage> {
        const result = this.api.getMemesMintStats(pageSize, page, sortDirection, _options);
        return result.toPromise();
    }

    /**
     * Get memes mint stats for one meme id
     * @param id
     */
    public getMemesMintStatsByIdWithHttpInfo(id: number, _options?: Configuration): Promise<HttpInfo<ApiMemesMintStat>> {
        const result = this.api.getMemesMintStatsByIdWithHttpInfo(id, _options);
        return result.toPromise();
    }

    /**
     * Get memes mint stats for one meme id
     * @param id
     */
    public getMemesMintStatsById(id: number, _options?: Configuration): Promise<ApiMemesMintStat> {
        const result = this.api.getMemesMintStatsById(id, _options);
        return result.toPromise();
    }

    /**
     * Get total memes mint stats
     */
    public getMemesMintStatsTotalWithHttpInfo(_options?: Configuration): Promise<HttpInfo<ApiMemesMintStatsTotals>> {
        const result = this.api.getMemesMintStatsTotalWithHttpInfo(_options);
        return result.toPromise();
    }

    /**
     * Get total memes mint stats
     */
    public getMemesMintStatsTotal(_options?: Configuration): Promise<ApiMemesMintStatsTotals> {
        const result = this.api.getMemesMintStatsTotal(_options);
        return result.toPromise();
    }

    /**
     * Get yearly aggregated memes mint stats
     */
    public getMemesMintStatsYearlyWithHttpInfo(_options?: Configuration): Promise<HttpInfo<Array<ApiMemesMintStatsYearly>>> {
        const result = this.api.getMemesMintStatsYearlyWithHttpInfo(_options);
        return result.toPromise();
    }

    /**
     * Get yearly aggregated memes mint stats
     */
    public getMemesMintStatsYearly(_options?: Configuration): Promise<Array<ApiMemesMintStatsYearly>> {
        const result = this.api.getMemesMintStatsYearly(_options);
        return result.toPromise();
    }


}



import { ObservableNFTLinkApi } from './ObservableAPI';

import { NFTLinkApiRequestFactory, NFTLinkApiResponseProcessor} from "../apis/NFTLinkApi";
export class PromiseNFTLinkApi {
    private api: ObservableNFTLinkApi

    public constructor(
        configuration: Configuration,
        requestFactory?: NFTLinkApiRequestFactory,
        responseProcessor?: NFTLinkApiResponseProcessor
    ) {
        this.api = new ObservableNFTLinkApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get marketplace data about NFT link
     * @param url
     */
    public getNftLinkDataWithHttpInfo(url: string, _options?: Configuration): Promise<HttpInfo<Array<ApiNftLinkResponse>>> {
        const result = this.api.getNftLinkDataWithHttpInfo(url, _options);
        return result.toPromise();
    }

    /**
     * Get marketplace data about NFT link
     * @param url
     */
    public getNftLinkData(url: string, _options?: Configuration): Promise<Array<ApiNftLinkResponse>> {
        const result = this.api.getNftLinkData(url, _options);
        return result.toPromise();
    }


}



import { ObservableNFTOwnersApi } from './ObservableAPI';

import { NFTOwnersApiRequestFactory, NFTOwnersApiResponseProcessor} from "../apis/NFTOwnersApi";
export class PromiseNFTOwnersApi {
    private api: ObservableNFTOwnersApi

    public constructor(
        configuration: Configuration,
        requestFactory?: NFTOwnersApiRequestFactory,
        responseProcessor?: NFTOwnersApiResponseProcessor
    ) {
        this.api = new ObservableNFTOwnersApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get NFT owners
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [contract] Filter by contract address
     * @param [tokenId] Filter by token ID
     */
    public getNftOwnersWithHttpInfo(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', contract?: string, tokenId?: string, _options?: Configuration): Promise<HttpInfo<Array<ApiNftOwnerPage>>> {
        const result = this.api.getNftOwnersWithHttpInfo(pageSize, page, sortDirection, contract, tokenId, _options);
        return result.toPromise();
    }

    /**
     * Get NFT owners
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [contract] Filter by contract address
     * @param [tokenId] Filter by token ID
     */
    public getNftOwners(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', contract?: string, tokenId?: string, _options?: Configuration): Promise<Array<ApiNftOwnerPage>> {
        const result = this.api.getNftOwners(pageSize, page, sortDirection, contract, tokenId, _options);
        return result.toPromise();
    }

    /**
     * Get NFT owners by consolidation key
     * @param consolidationKey
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [contract] Filter by contract address
     * @param [tokenId] Filter by token ID
     */
    public getNftOwnersByConsolidationKeyWithHttpInfo(consolidationKey: string, pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', contract?: string, tokenId?: string, _options?: Configuration): Promise<HttpInfo<Array<ApiNftOwnerPage>>> {
        const result = this.api.getNftOwnersByConsolidationKeyWithHttpInfo(consolidationKey, pageSize, page, sortDirection, contract, tokenId, _options);
        return result.toPromise();
    }

    /**
     * Get NFT owners by consolidation key
     * @param consolidationKey
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [contract] Filter by contract address
     * @param [tokenId] Filter by token ID
     */
    public getNftOwnersByConsolidationKey(consolidationKey: string, pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', contract?: string, tokenId?: string, _options?: Configuration): Promise<Array<ApiNftOwnerPage>> {
        const result = this.api.getNftOwnersByConsolidationKey(consolidationKey, pageSize, page, sortDirection, contract, tokenId, _options);
        return result.toPromise();
    }


}



import { ObservableNFTsApi } from './ObservableAPI';

import { NFTsApiRequestFactory, NFTsApiResponseProcessor} from "../apis/NFTsApi";
export class PromiseNFTsApi {
    private api: ObservableNFTsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: NFTsApiRequestFactory,
        responseProcessor?: NFTsApiResponseProcessor
    ) {
        this.api = new ObservableNFTsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get NFT Media by Contract
     * @param contract The NFT contract address to filter the media by
     */
    public getNftMediaByContractWithHttpInfo(contract: string, _options?: Configuration): Promise<HttpInfo<Array<ApiNftMedia>>> {
        const result = this.api.getNftMediaByContractWithHttpInfo(contract, _options);
        return result.toPromise();
    }

    /**
     * Get NFT Media by Contract
     * @param contract The NFT contract address to filter the media by
     */
    public getNftMediaByContract(contract: string, _options?: Configuration): Promise<Array<ApiNftMedia>> {
        const result = this.api.getNftMediaByContract(contract, _options);
        return result.toPromise();
    }

    /**
     * Get NFTs
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [id] Filter by NFT ID
     * @param [contract] Filter by NFT ID
     */
    public getNftsWithHttpInfo(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', id?: string, contract?: string, _options?: Configuration): Promise<HttpInfo<Array<ApiNftsPage>>> {
        const result = this.api.getNftsWithHttpInfo(pageSize, page, sortDirection, id, contract, _options);
        return result.toPromise();
    }

    /**
     * Get NFTs
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [id] Filter by NFT ID
     * @param [contract] Filter by NFT ID
     */
    public getNfts(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', id?: string, contract?: string, _options?: Configuration): Promise<Array<ApiNftsPage>> {
        const result = this.api.getNfts(pageSize, page, sortDirection, id, contract, _options);
        return result.toPromise();
    }


}



import { ObservableNotificationsApi } from './ObservableAPI';

import { NotificationsApiRequestFactory, NotificationsApiResponseProcessor} from "../apis/NotificationsApi";
export class PromiseNotificationsApi {
    private api: ObservableNotificationsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: NotificationsApiRequestFactory,
        responseProcessor?: NotificationsApiResponseProcessor
    ) {
        this.api = new ObservableNotificationsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get notifications for authenticated user.
     * @param [limit] Default is 10
     * @param [idLessThan] Used to find older notifications
     * @param [cause] Comma-separated list of notification causes to include
     * @param [causeExclude] Comma-separated list of notification causes to exclude
     * @param [unreadOnly] Only return unread notifications
     */
    public getNotificationsWithHttpInfo(limit?: number, idLessThan?: number, cause?: string, causeExclude?: string, unreadOnly?: boolean, _options?: Configuration): Promise<HttpInfo<ApiNotificationsResponse>> {
        const result = this.api.getNotificationsWithHttpInfo(limit, idLessThan, cause, causeExclude, unreadOnly, _options);
        return result.toPromise();
    }

    /**
     * Get notifications for authenticated user.
     * @param [limit] Default is 10
     * @param [idLessThan] Used to find older notifications
     * @param [cause] Comma-separated list of notification causes to include
     * @param [causeExclude] Comma-separated list of notification causes to exclude
     * @param [unreadOnly] Only return unread notifications
     */
    public getNotifications(limit?: number, idLessThan?: number, cause?: string, causeExclude?: string, unreadOnly?: boolean, _options?: Configuration): Promise<ApiNotificationsResponse> {
        const result = this.api.getNotifications(limit, idLessThan, cause, causeExclude, unreadOnly, _options);
        return result.toPromise();
    }

    /**
     * Get wave subscription
     * @param waveId
     */
    public getWaveSubscriptionWithHttpInfo(waveId: string, _options?: Configuration): Promise<HttpInfo<GetWaveSubscription200Response>> {
        const result = this.api.getWaveSubscriptionWithHttpInfo(waveId, _options);
        return result.toPromise();
    }

    /**
     * Get wave subscription
     * @param waveId
     */
    public getWaveSubscription(waveId: string, _options?: Configuration): Promise<GetWaveSubscription200Response> {
        const result = this.api.getWaveSubscription(waveId, _options);
        return result.toPromise();
    }

    /**
     * Mark all notifications as read
     */
    public markAllNotificationsAsReadWithHttpInfo(_options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.markAllNotificationsAsReadWithHttpInfo(_options);
        return result.toPromise();
    }

    /**
     * Mark all notifications as read
     */
    public markAllNotificationsAsRead(_options?: Configuration): Promise<void> {
        const result = this.api.markAllNotificationsAsRead(_options);
        return result.toPromise();
    }

    /**
     * Mark notification as read
     * @param id Notification ID or string \&quot;all\&quot; to mark all notifications as read
     */
    public markNotificationAsReadWithHttpInfo(id: string, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.markNotificationAsReadWithHttpInfo(id, _options);
        return result.toPromise();
    }

    /**
     * Mark notification as read
     * @param id Notification ID or string \&quot;all\&quot; to mark all notifications as read
     */
    public markNotificationAsRead(id: string, _options?: Configuration): Promise<void> {
        const result = this.api.markNotificationAsRead(id, _options);
        return result.toPromise();
    }

    /**
     * Mark wave notifications as read
     * @param waveId
     */
    public markWaveNotificationsAsReadWithHttpInfo(waveId: string, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.markWaveNotificationsAsReadWithHttpInfo(waveId, _options);
        return result.toPromise();
    }

    /**
     * Mark wave notifications as read
     * @param waveId
     */
    public markWaveNotificationsAsRead(waveId: string, _options?: Configuration): Promise<void> {
        const result = this.api.markWaveNotificationsAsRead(waveId, _options);
        return result.toPromise();
    }

    /**
     * Subscribe to wave notifications
     * @param waveId
     */
    public subscribeToWaveNotificationsWithHttpInfo(waveId: string, _options?: Configuration): Promise<HttpInfo<GetWaveSubscription200Response>> {
        const result = this.api.subscribeToWaveNotificationsWithHttpInfo(waveId, _options);
        return result.toPromise();
    }

    /**
     * Subscribe to wave notifications
     * @param waveId
     */
    public subscribeToWaveNotifications(waveId: string, _options?: Configuration): Promise<GetWaveSubscription200Response> {
        const result = this.api.subscribeToWaveNotifications(waveId, _options);
        return result.toPromise();
    }

    /**
     * Unsubscribe from wave notifications
     * @param waveId
     */
    public unsubscribeFromWaveNotificationsWithHttpInfo(waveId: string, _options?: Configuration): Promise<HttpInfo<GetWaveSubscription200Response>> {
        const result = this.api.unsubscribeFromWaveNotificationsWithHttpInfo(waveId, _options);
        return result.toPromise();
    }

    /**
     * Unsubscribe from wave notifications
     * @param waveId
     */
    public unsubscribeFromWaveNotifications(waveId: string, _options?: Configuration): Promise<GetWaveSubscription200Response> {
        const result = this.api.unsubscribeFromWaveNotifications(waveId, _options);
        return result.toPromise();
    }


}



import { ObservableOtherApi } from './ObservableAPI';

import { OtherApiRequestFactory, OtherApiResponseProcessor} from "../apis/OtherApi";
export class PromiseOtherApi {
    private api: ObservableOtherApi

    public constructor(
        configuration: Configuration,
        requestFactory?: OtherApiRequestFactory,
        responseProcessor?: OtherApiResponseProcessor
    ) {
        this.api = new ObservableOtherApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get blocks and related timestamps
     * @param [page]
     * @param [pageSize]
     */
    public getBlocksWithHttpInfo(page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiBlocksPage>> {
        const result = this.api.getBlocksWithHttpInfo(page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get blocks and related timestamps
     * @param [page]
     * @param [pageSize]
     */
    public getBlocks(page?: number, pageSize?: number, _options?: Configuration): Promise<ApiBlocksPage> {
        const result = this.api.getBlocks(page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get consolidated TDH snapshots links
     * @param [page]
     * @param [pageSize]
     * @param [block]
     * @param [date]
     */
    public getConsolidatedUploadsWithHttpInfo(page?: number, pageSize?: number, block?: number, date?: Date, _options?: Configuration): Promise<HttpInfo<ApiUploadsPage>> {
        const result = this.api.getConsolidatedUploadsWithHttpInfo(page, pageSize, block, date, _options);
        return result.toPromise();
    }

    /**
     * Get consolidated TDH snapshots links
     * @param [page]
     * @param [pageSize]
     * @param [block]
     * @param [date]
     */
    public getConsolidatedUploads(page?: number, pageSize?: number, block?: number, date?: Date, _options?: Configuration): Promise<ApiUploadsPage> {
        const result = this.api.getConsolidatedUploads(page, pageSize, block, date, _options);
        return result.toPromise();
    }

    /**
     * meme artists names
     */
    public getMemeArtistsNamesWithHttpInfo(_options?: Configuration): Promise<HttpInfo<Array<ApiArtistNameItem>>> {
        const result = this.api.getMemeArtistsNamesWithHttpInfo(_options);
        return result.toPromise();
    }

    /**
     * meme artists names
     */
    public getMemeArtistsNames(_options?: Configuration): Promise<Array<ApiArtistNameItem>> {
        const result = this.api.getMemeArtistsNames(_options);
        return result.toPromise();
    }

    /**
     * memelab artists names
     */
    public getMemelabArtistsNamesWithHttpInfo(_options?: Configuration): Promise<HttpInfo<Array<ApiArtistNameItem>>> {
        const result = this.api.getMemelabArtistsNamesWithHttpInfo(_options);
        return result.toPromise();
    }

    /**
     * memelab artists names
     */
    public getMemelabArtistsNames(_options?: Configuration): Promise<Array<ApiArtistNameItem>> {
        const result = this.api.getMemelabArtistsNames(_options);
        return result.toPromise();
    }

    /**
     * Seize settings
     */
    public getSettingsWithHttpInfo(_options?: Configuration): Promise<HttpInfo<ApiSeizeSettings>> {
        const result = this.api.getSettingsWithHttpInfo(_options);
        return result.toPromise();
    }

    /**
     * Seize settings
     */
    public getSettings(_options?: Configuration): Promise<ApiSeizeSettings> {
        const result = this.api.getSettings(_options);
        return result.toPromise();
    }

    /**
     * Get TDH snapshots links
     * @param [page]
     * @param [pageSize]
     * @param [block]
     * @param [date]
     */
    public getUploadsWithHttpInfo(page?: number, pageSize?: number, block?: number, date?: Date, _options?: Configuration): Promise<HttpInfo<ApiUploadsPage>> {
        const result = this.api.getUploadsWithHttpInfo(page, pageSize, block, date, _options);
        return result.toPromise();
    }

    /**
     * Get TDH snapshots links
     * @param [page]
     * @param [pageSize]
     * @param [block]
     * @param [date]
     */
    public getUploads(page?: number, pageSize?: number, block?: number, date?: Date, _options?: Configuration): Promise<ApiUploadsPage> {
        const result = this.api.getUploads(page, pageSize, block, date, _options);
        return result.toPromise();
    }


}



import { ObservableOwnersBalancesApi } from './ObservableAPI';

import { OwnersBalancesApiRequestFactory, OwnersBalancesApiResponseProcessor} from "../apis/OwnersBalancesApi";
export class PromiseOwnersBalancesApi {
    private api: ObservableOwnersBalancesApi

    public constructor(
        configuration: Configuration,
        requestFactory?: OwnersBalancesApiRequestFactory,
        responseProcessor?: OwnersBalancesApiResponseProcessor
    ) {
        this.api = new ObservableOwnersBalancesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get memes owner balance by consolidation key.
     * @param consolidationKey
     */
    public getMemesOwnerBalanceByConsolidationKeyWithHttpInfo(consolidationKey: string, _options?: Configuration): Promise<HttpInfo<Array<ApiOwnerBalanceMemes>>> {
        const result = this.api.getMemesOwnerBalanceByConsolidationKeyWithHttpInfo(consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get memes owner balance by consolidation key.
     * @param consolidationKey
     */
    public getMemesOwnerBalanceByConsolidationKey(consolidationKey: string, _options?: Configuration): Promise<Array<ApiOwnerBalanceMemes>> {
        const result = this.api.getMemesOwnerBalanceByConsolidationKey(consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get owner balance by consolidation key.
     * @param consolidationKey
     */
    public getOwnerBalanceByConsolidationKeyWithHttpInfo(consolidationKey: string, _options?: Configuration): Promise<HttpInfo<ApiOwnerBalance>> {
        const result = this.api.getOwnerBalanceByConsolidationKeyWithHttpInfo(consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get owner balance by consolidation key.
     * @param consolidationKey
     */
    public getOwnerBalanceByConsolidationKey(consolidationKey: string, _options?: Configuration): Promise<ApiOwnerBalance> {
        const result = this.api.getOwnerBalanceByConsolidationKey(consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get owner balances
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     */
    public getOwnerBalancesWithHttpInfo(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', _options?: Configuration): Promise<HttpInfo<Array<ApiOwnerBalancePage>>> {
        const result = this.api.getOwnerBalancesWithHttpInfo(pageSize, page, sortDirection, _options);
        return result.toPromise();
    }

    /**
     * Get owner balances
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     */
    public getOwnerBalances(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', _options?: Configuration): Promise<Array<ApiOwnerBalancePage>> {
        const result = this.api.getOwnerBalances(pageSize, page, sortDirection, _options);
        return result.toPromise();
    }


}



import { ObservableProfileCICApi } from './ObservableAPI';

import { ProfileCICApiRequestFactory, ProfileCICApiResponseProcessor} from "../apis/ProfileCICApi";
export class PromiseProfileCICApi {
    private api: ObservableProfileCICApi

    public constructor(
        configuration: Configuration,
        requestFactory?: ProfileCICApiRequestFactory,
        responseProcessor?: ProfileCICApiResponseProcessor
    ) {
        this.api = new ObservableProfileCICApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get profile CIC contributors
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileCicContributorsWithHttpInfo(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiCicContributorsPage>> {
        const result = this.api.getProfileCicContributorsWithHttpInfo(identity, direction, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get profile CIC contributors
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileCicContributors(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<ApiCicContributorsPage> {
        const result = this.api.getProfileCicContributors(identity, direction, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get profile CIC overview
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileCicOverviewWithHttpInfo(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiCicOverview>> {
        const result = this.api.getProfileCicOverviewWithHttpInfo(identity, direction, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get profile CIC overview
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileCicOverview(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<ApiCicOverview> {
        const result = this.api.getProfileCicOverview(identity, direction, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get profile CIC ratings by rater
     * @param identity
     * @param [given]
     * @param [page]
     * @param [pageSize]
     * @param [order]
     * @param [orderBy]
     */
    public getProfileCicRatingsByRaterWithHttpInfo(identity: string, given?: boolean, page?: number, pageSize?: number, order?: 'ASC' | 'DESC', orderBy?: 'last_modified' | 'rating', _options?: Configuration): Promise<HttpInfo<ApiRatingWithProfileInfoAndLevelPage>> {
        const result = this.api.getProfileCicRatingsByRaterWithHttpInfo(identity, given, page, pageSize, order, orderBy, _options);
        return result.toPromise();
    }

    /**
     * Get profile CIC ratings by rater
     * @param identity
     * @param [given]
     * @param [page]
     * @param [pageSize]
     * @param [order]
     * @param [orderBy]
     */
    public getProfileCicRatingsByRater(identity: string, given?: boolean, page?: number, pageSize?: number, order?: 'ASC' | 'DESC', orderBy?: 'last_modified' | 'rating', _options?: Configuration): Promise<ApiRatingWithProfileInfoAndLevelPage> {
        const result = this.api.getProfileCicRatingsByRater(identity, given, page, pageSize, order, orderBy, _options);
        return result.toPromise();
    }

    /**
     * Change profile CIC rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param identity
     * @param apiChangeProfileCicRating
     */
    public rateProfileCicWithHttpInfo(identity: string, apiChangeProfileCicRating: ApiChangeProfileCicRating, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.rateProfileCicWithHttpInfo(identity, apiChangeProfileCicRating, _options);
        return result.toPromise();
    }

    /**
     * Change profile CIC rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param identity
     * @param apiChangeProfileCicRating
     */
    public rateProfileCic(identity: string, apiChangeProfileCicRating: ApiChangeProfileCicRating, _options?: Configuration): Promise<void> {
        const result = this.api.rateProfileCic(identity, apiChangeProfileCicRating, _options);
        return result.toPromise();
    }


}



import { ObservableProfileREPApi } from './ObservableAPI';

import { ProfileREPApiRequestFactory, ProfileREPApiResponseProcessor} from "../apis/ProfileREPApi";
export class PromiseProfileREPApi {
    private api: ObservableProfileREPApi

    public constructor(
        configuration: Configuration,
        requestFactory?: ProfileREPApiRequestFactory,
        responseProcessor?: ProfileREPApiResponseProcessor
    ) {
        this.api = new ObservableProfileREPApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get profile REP categories
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     * @param [topContributorsLimit]
     */
    public getProfileRepCategoriesWithHttpInfo(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, topContributorsLimit?: number, _options?: Configuration): Promise<HttpInfo<ApiRepCategoriesPage>> {
        const result = this.api.getProfileRepCategoriesWithHttpInfo(identity, direction, page, pageSize, topContributorsLimit, _options);
        return result.toPromise();
    }

    /**
     * Get profile REP categories
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     * @param [topContributorsLimit]
     */
    public getProfileRepCategories(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, topContributorsLimit?: number, _options?: Configuration): Promise<ApiRepCategoriesPage> {
        const result = this.api.getProfileRepCategories(identity, direction, page, pageSize, topContributorsLimit, _options);
        return result.toPromise();
    }

    /**
     * Get profile REP contributors for category
     * @param identity
     * @param category
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileRepCategoryContributorsWithHttpInfo(identity: string, category: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiRepContributorsPage>> {
        const result = this.api.getProfileRepCategoryContributorsWithHttpInfo(identity, category, direction, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get profile REP contributors for category
     * @param identity
     * @param category
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileRepCategoryContributors(identity: string, category: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<ApiRepContributorsPage> {
        const result = this.api.getProfileRepCategoryContributors(identity, category, direction, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get profile REP overview
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileRepOverviewWithHttpInfo(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiRepOverview>> {
        const result = this.api.getProfileRepOverviewWithHttpInfo(identity, direction, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get profile REP overview
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileRepOverview(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<ApiRepOverview> {
        const result = this.api.getProfileRepOverview(identity, direction, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get profile REP rating
     * @param identity
     * @param [fromIdentity]
     * @param [category]
     */
    public getProfileRepRatingWithHttpInfo(identity: string, fromIdentity?: string, category?: string, _options?: Configuration): Promise<HttpInfo<ApiRepRating>> {
        const result = this.api.getProfileRepRatingWithHttpInfo(identity, fromIdentity, category, _options);
        return result.toPromise();
    }

    /**
     * Get profile REP rating
     * @param identity
     * @param [fromIdentity]
     * @param [category]
     */
    public getProfileRepRating(identity: string, fromIdentity?: string, category?: string, _options?: Configuration): Promise<ApiRepRating> {
        const result = this.api.getProfileRepRating(identity, fromIdentity, category, _options);
        return result.toPromise();
    }

    /**
     * Get profile REP ratings by rater
     * @param identity
     * @param [given]
     * @param [page]
     * @param [pageSize]
     * @param [order]
     * @param [orderBy]
     * @param [category]
     */
    public getProfileRepRatingsByRaterWithHttpInfo(identity: string, given?: boolean, page?: number, pageSize?: number, order?: 'ASC' | 'DESC', orderBy?: 'last_modified' | 'rating', category?: string, _options?: Configuration): Promise<HttpInfo<ApiRatingWithProfileInfoAndLevelPage>> {
        const result = this.api.getProfileRepRatingsByRaterWithHttpInfo(identity, given, page, pageSize, order, orderBy, category, _options);
        return result.toPromise();
    }

    /**
     * Get profile REP ratings by rater
     * @param identity
     * @param [given]
     * @param [page]
     * @param [pageSize]
     * @param [order]
     * @param [orderBy]
     * @param [category]
     */
    public getProfileRepRatingsByRater(identity: string, given?: boolean, page?: number, pageSize?: number, order?: 'ASC' | 'DESC', orderBy?: 'last_modified' | 'rating', category?: string, _options?: Configuration): Promise<ApiRatingWithProfileInfoAndLevelPage> {
        const result = this.api.getProfileRepRatingsByRater(identity, given, page, pageSize, order, orderBy, category, _options);
        return result.toPromise();
    }

    /**
     * Change profile REP rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param identity
     * @param apiChangeProfileRepRating
     */
    public rateProfileRepWithHttpInfo(identity: string, apiChangeProfileRepRating: ApiChangeProfileRepRating, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.rateProfileRepWithHttpInfo(identity, apiChangeProfileRepRating, _options);
        return result.toPromise();
    }

    /**
     * Change profile REP rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param identity
     * @param apiChangeProfileRepRating
     */
    public rateProfileRep(identity: string, apiChangeProfileRepRating: ApiChangeProfileRepRating, _options?: Configuration): Promise<void> {
        const result = this.api.rateProfileRep(identity, apiChangeProfileRepRating, _options);
        return result.toPromise();
    }


}



import { ObservableProfilesApi } from './ObservableAPI';

import { ProfilesApiRequestFactory, ProfilesApiResponseProcessor} from "../apis/ProfilesApi";
export class PromiseProfilesApi {
    private api: ObservableProfilesApi

    public constructor(
        configuration: Configuration,
        requestFactory?: ProfilesApiRequestFactory,
        responseProcessor?: ProfilesApiResponseProcessor
    ) {
        this.api = new ObservableProfilesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create or update a profile
     * @param apiCreateOrUpdateProfileRequest
     */
    public createOrUpdateProfileWithHttpInfo(apiCreateOrUpdateProfileRequest: ApiCreateOrUpdateProfileRequest, _options?: Configuration): Promise<HttpInfo<ApiIdentity>> {
        const result = this.api.createOrUpdateProfileWithHttpInfo(apiCreateOrUpdateProfileRequest, _options);
        return result.toPromise();
    }

    /**
     * Create or update a profile
     * @param apiCreateOrUpdateProfileRequest
     */
    public createOrUpdateProfile(apiCreateOrUpdateProfileRequest: ApiCreateOrUpdateProfileRequest, _options?: Configuration): Promise<ApiIdentity> {
        const result = this.api.createOrUpdateProfile(apiCreateOrUpdateProfileRequest, _options);
        return result.toPromise();
    }


}



import { ObservableProxiesApi } from './ObservableAPI';

import { ProxiesApiRequestFactory, ProxiesApiResponseProcessor} from "../apis/ProxiesApi";
export class PromiseProxiesApi {
    private api: ObservableProxiesApi

    public constructor(
        configuration: Configuration,
        requestFactory?: ProxiesApiRequestFactory,
        responseProcessor?: ProxiesApiResponseProcessor
    ) {
        this.api = new ObservableProxiesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Accept action
     * @param proxyId
     * @param actionId
     * @param acceptActionRequest
     */
    public acceptActionWithHttpInfo(proxyId: string, actionId: string, acceptActionRequest: AcceptActionRequest, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.acceptActionWithHttpInfo(proxyId, actionId, acceptActionRequest, _options);
        return result.toPromise();
    }

    /**
     * Accept action
     * @param proxyId
     * @param actionId
     * @param acceptActionRequest
     */
    public acceptAction(proxyId: string, actionId: string, acceptActionRequest: AcceptActionRequest, _options?: Configuration): Promise<void> {
        const result = this.api.acceptAction(proxyId, actionId, acceptActionRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Add action to proxy
     * @param proxyId
     * @param addActionToProxyRequest
     */
    public addActionToProxyWithHttpInfo(proxyId: string, addActionToProxyRequest: AddActionToProxyRequest, _options?: Configuration): Promise<HttpInfo<ApiProfileProxyAction>> {
        const result = this.api.addActionToProxyWithHttpInfo(proxyId, addActionToProxyRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Add action to proxy
     * @param proxyId
     * @param addActionToProxyRequest
     */
    public addActionToProxy(proxyId: string, addActionToProxyRequest: AddActionToProxyRequest, _options?: Configuration): Promise<ApiProfileProxyAction> {
        const result = this.api.addActionToProxy(proxyId, addActionToProxyRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create a new proxy
     * @param apiCreateNewProfileProxy
     */
    public createProxyWithHttpInfo(apiCreateNewProfileProxy: ApiCreateNewProfileProxy, _options?: Configuration): Promise<HttpInfo<ApiProfileProxy>> {
        const result = this.api.createProxyWithHttpInfo(apiCreateNewProfileProxy, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create a new proxy
     * @param apiCreateNewProfileProxy
     */
    public createProxy(apiCreateNewProfileProxy: ApiCreateNewProfileProxy, _options?: Configuration): Promise<ApiProfileProxy> {
        const result = this.api.createProxy(apiCreateNewProfileProxy, _options);
        return result.toPromise();
    }

    /**
     * Get profile proxies
     * @param identity
     */
    public getProfileProxiesWithHttpInfo(identity: string, _options?: Configuration): Promise<HttpInfo<Array<ApiProfileProxy>>> {
        const result = this.api.getProfileProxiesWithHttpInfo(identity, _options);
        return result.toPromise();
    }

    /**
     * Get profile proxies
     * @param identity
     */
    public getProfileProxies(identity: string, _options?: Configuration): Promise<Array<ApiProfileProxy>> {
        const result = this.api.getProfileProxies(identity, _options);
        return result.toPromise();
    }

    /**
     * Get proxies granted by a profile
     * @param identity
     */
    public getProxiesGrantedWithHttpInfo(identity: string, _options?: Configuration): Promise<HttpInfo<Array<ApiProfileProxy>>> {
        const result = this.api.getProxiesGrantedWithHttpInfo(identity, _options);
        return result.toPromise();
    }

    /**
     * Get proxies granted by a profile
     * @param identity
     */
    public getProxiesGranted(identity: string, _options?: Configuration): Promise<Array<ApiProfileProxy>> {
        const result = this.api.getProxiesGranted(identity, _options);
        return result.toPromise();
    }

    /**
     * Get proxies received by a profile
     * @param identity
     */
    public getProxiesReceivedWithHttpInfo(identity: string, _options?: Configuration): Promise<HttpInfo<Array<ApiProfileProxy>>> {
        const result = this.api.getProxiesReceivedWithHttpInfo(identity, _options);
        return result.toPromise();
    }

    /**
     * Get proxies received by a profile
     * @param identity
     */
    public getProxiesReceived(identity: string, _options?: Configuration): Promise<Array<ApiProfileProxy>> {
        const result = this.api.getProxiesReceived(identity, _options);
        return result.toPromise();
    }

    /**
     * Get proxy by ID
     * @param proxyId
     */
    public getProxyByIdWithHttpInfo(proxyId: string, _options?: Configuration): Promise<HttpInfo<ApiProfileProxy>> {
        const result = this.api.getProxyByIdWithHttpInfo(proxyId, _options);
        return result.toPromise();
    }

    /**
     * Get proxy by ID
     * @param proxyId
     */
    public getProxyById(proxyId: string, _options?: Configuration): Promise<ApiProfileProxy> {
        const result = this.api.getProxyById(proxyId, _options);
        return result.toPromise();
    }

    /**
     * Update action
     * @param proxyId
     * @param actionId
     * @param apiUpdateProxyActionRequest
     */
    public updateActionWithHttpInfo(proxyId: string, actionId: string, apiUpdateProxyActionRequest: ApiUpdateProxyActionRequest, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.updateActionWithHttpInfo(proxyId, actionId, apiUpdateProxyActionRequest, _options);
        return result.toPromise();
    }

    /**
     * Update action
     * @param proxyId
     * @param actionId
     * @param apiUpdateProxyActionRequest
     */
    public updateAction(proxyId: string, actionId: string, apiUpdateProxyActionRequest: ApiUpdateProxyActionRequest, _options?: Configuration): Promise<void> {
        const result = this.api.updateAction(proxyId, actionId, apiUpdateProxyActionRequest, _options);
        return result.toPromise();
    }


}



import { ObservablePushNotificationsApi } from './ObservableAPI';

import { PushNotificationsApiRequestFactory, PushNotificationsApiResponseProcessor} from "../apis/PushNotificationsApi";
export class PromisePushNotificationsApi {
    private api: ObservablePushNotificationsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: PushNotificationsApiRequestFactory,
        responseProcessor?: PushNotificationsApiResponseProcessor
    ) {
        this.api = new ObservablePushNotificationsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Delete a registered device
     * @param deviceId The device ID to delete
     */
    public deleteDeviceWithHttpInfo(deviceId: string, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.deleteDeviceWithHttpInfo(deviceId, _options);
        return result.toPromise();
    }

    /**
     * Delete a registered device
     * @param deviceId The device ID to delete
     */
    public deleteDevice(deviceId: string, _options?: Configuration): Promise<void> {
        const result = this.api.deleteDevice(deviceId, _options);
        return result.toPromise();
    }

    /**
     * Get all registered devices for the authenticated user
     */
    public getDevicesWithHttpInfo(_options?: Configuration): Promise<HttpInfo<Array<ApiPushNotificationDevice>>> {
        const result = this.api.getDevicesWithHttpInfo(_options);
        return result.toPromise();
    }

    /**
     * Get all registered devices for the authenticated user
     */
    public getDevices(_options?: Configuration): Promise<Array<ApiPushNotificationDevice>> {
        const result = this.api.getDevices(_options);
        return result.toPromise();
    }

    /**
     * Get push notification settings for a device
     * @param deviceId The device ID to get settings for
     */
    public getPushNotificationSettingsWithHttpInfo(deviceId: string, _options?: Configuration): Promise<HttpInfo<ApiPushNotificationSettings>> {
        const result = this.api.getPushNotificationSettingsWithHttpInfo(deviceId, _options);
        return result.toPromise();
    }

    /**
     * Get push notification settings for a device
     * @param deviceId The device ID to get settings for
     */
    public getPushNotificationSettings(deviceId: string, _options?: Configuration): Promise<ApiPushNotificationSettings> {
        const result = this.api.getPushNotificationSettings(deviceId, _options);
        return result.toPromise();
    }

    /**
     * Register a push notification token
     * @param apiRegisterPushNotificationTokenRequest
     */
    public registerPushNotificationTokenWithHttpInfo(apiRegisterPushNotificationTokenRequest: ApiRegisterPushNotificationTokenRequest, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.registerPushNotificationTokenWithHttpInfo(apiRegisterPushNotificationTokenRequest, _options);
        return result.toPromise();
    }

    /**
     * Register a push notification token
     * @param apiRegisterPushNotificationTokenRequest
     */
    public registerPushNotificationToken(apiRegisterPushNotificationTokenRequest: ApiRegisterPushNotificationTokenRequest, _options?: Configuration): Promise<void> {
        const result = this.api.registerPushNotificationToken(apiRegisterPushNotificationTokenRequest, _options);
        return result.toPromise();
    }

    /**
     * Update push notification settings for a device
     * @param deviceId The device ID to update settings for
     * @param apiPushNotificationSettingsUpdate
     */
    public updatePushNotificationSettingsWithHttpInfo(deviceId: string, apiPushNotificationSettingsUpdate: ApiPushNotificationSettingsUpdate, _options?: Configuration): Promise<HttpInfo<ApiPushNotificationSettings>> {
        const result = this.api.updatePushNotificationSettingsWithHttpInfo(deviceId, apiPushNotificationSettingsUpdate, _options);
        return result.toPromise();
    }

    /**
     * Update push notification settings for a device
     * @param deviceId The device ID to update settings for
     * @param apiPushNotificationSettingsUpdate
     */
    public updatePushNotificationSettings(deviceId: string, apiPushNotificationSettingsUpdate: ApiPushNotificationSettingsUpdate, _options?: Configuration): Promise<ApiPushNotificationSettings> {
        const result = this.api.updatePushNotificationSettings(deviceId, apiPushNotificationSettingsUpdate, _options);
        return result.toPromise();
    }


}



import { ObservableRatingsApi } from './ObservableAPI';

import { RatingsApiRequestFactory, RatingsApiResponseProcessor} from "../apis/RatingsApi";
export class PromiseRatingsApi {
    private api: ObservableRatingsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: RatingsApiRequestFactory,
        responseProcessor?: RatingsApiResponseProcessor
    ) {
        this.api = new ObservableRatingsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * This is deprecated. Use bulk-rep instead. Bulk rate. Supplied amount will be added to all target identities. If same identity is supplied multiple times, all the additions will be summed up. Targets must be represented as Ethereum wallet addresses. ENS names and profile handles are not supported.
     * @param apiBulkRateRequest
     */
    public bulkRateWithHttpInfo(apiBulkRateRequest: ApiBulkRateRequest, _options?: Configuration): Promise<HttpInfo<ApiBulkRateResponse>> {
        const result = this.api.bulkRateWithHttpInfo(apiBulkRateRequest, _options);
        return result.toPromise();
    }

    /**
     * This is deprecated. Use bulk-rep instead. Bulk rate. Supplied amount will be added to all target identities. If same identity is supplied multiple times, all the additions will be summed up. Targets must be represented as Ethereum wallet addresses. ENS names and profile handles are not supported.
     * @param apiBulkRateRequest
     */
    public bulkRate(apiBulkRateRequest: ApiBulkRateRequest, _options?: Configuration): Promise<ApiBulkRateResponse> {
        const result = this.api.bulkRate(apiBulkRateRequest, _options);
        return result.toPromise();
    }

    /**
     * Change REP rating of multiple targets and categories in one go. Targets  final REP value will be the value you supply here. If you supply multiple  addresses for one consolidation group then those amounts will be summed together.
     * @param apiBulkRepRequest
     */
    public bulkRepWithHttpInfo(apiBulkRepRequest: ApiBulkRepRequest, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.bulkRepWithHttpInfo(apiBulkRepRequest, _options);
        return result.toPromise();
    }

    /**
     * Change REP rating of multiple targets and categories in one go. Targets  final REP value will be the value you supply here. If you supply multiple  addresses for one consolidation group then those amounts will be summed together.
     * @param apiBulkRepRequest
     */
    public bulkRep(apiBulkRepRequest: ApiBulkRepRequest, _options?: Configuration): Promise<void> {
        const result = this.api.bulkRep(apiBulkRepRequest, _options);
        return result.toPromise();
    }

    /**
     * Get available credit for rating
     * @param rater
     * @param [raterRepresentative]
     */
    public getCreditLeftWithHttpInfo(rater: string, raterRepresentative?: string, _options?: Configuration): Promise<HttpInfo<ApiAvailableRatingCredit>> {
        const result = this.api.getCreditLeftWithHttpInfo(rater, raterRepresentative, _options);
        return result.toPromise();
    }

    /**
     * Get available credit for rating
     * @param rater
     * @param [raterRepresentative]
     */
    public getCreditLeft(rater: string, raterRepresentative?: string, _options?: Configuration): Promise<ApiAvailableRatingCredit> {
        const result = this.api.getCreditLeft(rater, raterRepresentative, _options);
        return result.toPromise();
    }


}



import { ObservableSubscriptionsApi } from './ObservableAPI';

import { SubscriptionsApiRequestFactory, SubscriptionsApiResponseProcessor} from "../apis/SubscriptionsApi";
export class PromiseSubscriptionsApi {
    private api: ObservableSubscriptionsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: SubscriptionsApiRequestFactory,
        responseProcessor?: SubscriptionsApiResponseProcessor
    ) {
        this.api = new ObservableSubscriptionsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get airdrop address for a consolidation
     * @param consolidationKey Consolidation key
     */
    public getAirdropAddressWithHttpInfo(consolidationKey: string, _options?: Configuration): Promise<HttpInfo<AirdropAddressResponse>> {
        const result = this.api.getAirdropAddressWithHttpInfo(consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get airdrop address for a consolidation
     * @param consolidationKey Consolidation key
     */
    public getAirdropAddress(consolidationKey: string, _options?: Configuration): Promise<AirdropAddressResponse> {
        const result = this.api.getAirdropAddress(consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get final subscription for a consolidation
     * @param consolidationKey Consolidation key
     * @param contract Contract address
     * @param tokenId Token ID
     */
    public getFinalSubscriptionWithHttpInfo(consolidationKey: string, contract: string, tokenId: number, _options?: Configuration): Promise<HttpInfo<NFTFinalSubscription>> {
        const result = this.api.getFinalSubscriptionWithHttpInfo(consolidationKey, contract, tokenId, _options);
        return result.toPromise();
    }

    /**
     * Get final subscription for a consolidation
     * @param consolidationKey Consolidation key
     * @param contract Contract address
     * @param tokenId Token ID
     */
    public getFinalSubscription(consolidationKey: string, contract: string, tokenId: number, _options?: Configuration): Promise<NFTFinalSubscription> {
        const result = this.api.getFinalSubscription(consolidationKey, contract, tokenId, _options);
        return result.toPromise();
    }

    /**
     * Get identities subscribed to target.
     * @param targetType
     * @param targetId
     * @param [pageSize]
     * @param [page]
     */
    public getIncomingSubscriptionsForTargetWithHttpInfo(targetType: 'IDENTITY' | 'WAVE' | 'DROP', targetId: string, pageSize?: number, page?: number, _options?: Configuration): Promise<HttpInfo<Array<ApiIncomingIdentitySubscriptionsPage>>> {
        const result = this.api.getIncomingSubscriptionsForTargetWithHttpInfo(targetType, targetId, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get identities subscribed to target.
     * @param targetType
     * @param targetId
     * @param [pageSize]
     * @param [page]
     */
    public getIncomingSubscriptionsForTarget(targetType: 'IDENTITY' | 'WAVE' | 'DROP', targetId: string, pageSize?: number, page?: number, _options?: Configuration): Promise<Array<ApiIncomingIdentitySubscriptionsPage>> {
        const result = this.api.getIncomingSubscriptionsForTarget(targetType, targetId, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get outgoing subscriptions for authenticated user.
     * @param targetType
     * @param [pageSize]
     * @param [page]
     */
    public getOutgoingSubscriptionsWithHttpInfo(targetType: 'IDENTITY' | 'WAVE' | 'DROP', pageSize?: number, page?: number, _options?: Configuration): Promise<HttpInfo<Array<ApiOutgoingIdentitySubscriptionsPage>>> {
        const result = this.api.getOutgoingSubscriptionsWithHttpInfo(targetType, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get outgoing subscriptions for authenticated user.
     * @param targetType
     * @param [pageSize]
     * @param [page]
     */
    public getOutgoingSubscriptions(targetType: 'IDENTITY' | 'WAVE' | 'DROP', pageSize?: number, page?: number, _options?: Configuration): Promise<Array<ApiOutgoingIdentitySubscriptionsPage>> {
        const result = this.api.getOutgoingSubscriptions(targetType, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get redeemed meme subscription counts
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getRedeemedMemeSubscriptionCountsWithHttpInfo(pageSize?: number, page?: number, _options?: Configuration): Promise<HttpInfo<RedeemedSubscriptionCountsPage>> {
        const result = this.api.getRedeemedMemeSubscriptionCountsWithHttpInfo(pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get redeemed meme subscription counts
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getRedeemedMemeSubscriptionCounts(pageSize?: number, page?: number, _options?: Configuration): Promise<RedeemedSubscriptionCountsPage> {
        const result = this.api.getRedeemedMemeSubscriptionCounts(pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get redeemed subscriptions for a consolidation
     * @param consolidationKey Consolidation key
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getRedeemedSubscriptionsWithHttpInfo(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Promise<HttpInfo<RedeemedSubscriptionPage>> {
        const result = this.api.getRedeemedSubscriptionsWithHttpInfo(consolidationKey, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get redeemed subscriptions for a consolidation
     * @param consolidationKey Consolidation key
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getRedeemedSubscriptions(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Promise<RedeemedSubscriptionPage> {
        const result = this.api.getRedeemedSubscriptions(consolidationKey, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get subscription details for a consolidation
     * @param consolidationKey Consolidation key
     */
    public getSubscriptionDetailsWithHttpInfo(consolidationKey: string, _options?: Configuration): Promise<HttpInfo<SubscriptionDetails>> {
        const result = this.api.getSubscriptionDetailsWithHttpInfo(consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get subscription details for a consolidation
     * @param consolidationKey Consolidation key
     */
    public getSubscriptionDetails(consolidationKey: string, _options?: Configuration): Promise<SubscriptionDetails> {
        const result = this.api.getSubscriptionDetails(consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get subscription logs for a consolidation
     * @param consolidationKey Consolidation key
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getSubscriptionLogsWithHttpInfo(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Promise<HttpInfo<SubscriptionLogPage>> {
        const result = this.api.getSubscriptionLogsWithHttpInfo(consolidationKey, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get subscription logs for a consolidation
     * @param consolidationKey Consolidation key
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getSubscriptionLogs(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Promise<SubscriptionLogPage> {
        const result = this.api.getSubscriptionLogs(consolidationKey, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get top-ups for a consolidation
     * @param consolidationKey Consolidation key
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getSubscriptionTopUpsWithHttpInfo(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Promise<HttpInfo<SubscriptionTopUpPage>> {
        const result = this.api.getSubscriptionTopUpsWithHttpInfo(consolidationKey, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get top-ups for a consolidation
     * @param consolidationKey Consolidation key
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getSubscriptionTopUps(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Promise<SubscriptionTopUpPage> {
        const result = this.api.getSubscriptionTopUps(consolidationKey, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get subscription uploads
     * @param contract Contract address (required)
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getSubscriptionUploadsWithHttpInfo(contract: string, pageSize?: number, page?: number, _options?: Configuration): Promise<HttpInfo<NFTFinalSubscriptionUploadPage>> {
        const result = this.api.getSubscriptionUploadsWithHttpInfo(contract, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get subscription uploads
     * @param contract Contract address (required)
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getSubscriptionUploads(contract: string, pageSize?: number, page?: number, _options?: Configuration): Promise<NFTFinalSubscriptionUploadPage> {
        const result = this.api.getSubscriptionUploads(contract, pageSize, page, _options);
        return result.toPromise();
    }

    /**
     * Get upcoming meme subscription counts
     * @param [cardCount] Number of upcoming cards to fetch. Default is 3
     */
    public getUpcomingMemeSubscriptionCountsWithHttpInfo(cardCount?: number, _options?: Configuration): Promise<HttpInfo<Array<SubscriptionCounts>>> {
        const result = this.api.getUpcomingMemeSubscriptionCountsWithHttpInfo(cardCount, _options);
        return result.toPromise();
    }

    /**
     * Get upcoming meme subscription counts
     * @param [cardCount] Number of upcoming cards to fetch. Default is 3
     */
    public getUpcomingMemeSubscriptionCounts(cardCount?: number, _options?: Configuration): Promise<Array<SubscriptionCounts>> {
        const result = this.api.getUpcomingMemeSubscriptionCounts(cardCount, _options);
        return result.toPromise();
    }

    /**
     * Get upcoming meme subscription status for a consolidation
     * @param memeId Meme token id
     * @param consolidationKey Consolidation key
     */
    public getUpcomingMemeSubscriptionStatusWithHttpInfo(memeId: number, consolidationKey: string, _options?: Configuration): Promise<HttpInfo<ApiUpcomingMemeSubscriptionStatus>> {
        const result = this.api.getUpcomingMemeSubscriptionStatusWithHttpInfo(memeId, consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get upcoming meme subscription status for a consolidation
     * @param memeId Meme token id
     * @param consolidationKey Consolidation key
     */
    public getUpcomingMemeSubscriptionStatus(memeId: number, consolidationKey: string, _options?: Configuration): Promise<ApiUpcomingMemeSubscriptionStatus> {
        const result = this.api.getUpcomingMemeSubscriptionStatus(memeId, consolidationKey, _options);
        return result.toPromise();
    }

    /**
     * Get upcoming meme subscriptions for a consolidation
     * @param consolidationKey Consolidation key
     * @param [cardCount] Number of upcoming cards to fetch. Default is 3
     */
    public getUpcomingMemeSubscriptionsWithHttpInfo(consolidationKey: string, cardCount?: number, _options?: Configuration): Promise<HttpInfo<Array<NFTSubscription>>> {
        const result = this.api.getUpcomingMemeSubscriptionsWithHttpInfo(consolidationKey, cardCount, _options);
        return result.toPromise();
    }

    /**
     * Get upcoming meme subscriptions for a consolidation
     * @param consolidationKey Consolidation key
     * @param [cardCount] Number of upcoming cards to fetch. Default is 3
     */
    public getUpcomingMemeSubscriptions(consolidationKey: string, cardCount?: number, _options?: Configuration): Promise<Array<NFTSubscription>> {
        const result = this.api.getUpcomingMemeSubscriptions(consolidationKey, cardCount, _options);
        return result.toPromise();
    }

    /**
     * Requires authentication. User can only change this setting for their own consolidation.
     * Toggle subscribe all editions preference
     * @param consolidationKey Consolidation key
     * @param updateSubscribeAllEditionsRequest
     */
    public updateSubscribeAllEditionsWithHttpInfo(consolidationKey: string, updateSubscribeAllEditionsRequest: UpdateSubscribeAllEditionsRequest, _options?: Configuration): Promise<HttpInfo<SubscribeAllEditionsResponse>> {
        const result = this.api.updateSubscribeAllEditionsWithHttpInfo(consolidationKey, updateSubscribeAllEditionsRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires authentication. User can only change this setting for their own consolidation.
     * Toggle subscribe all editions preference
     * @param consolidationKey Consolidation key
     * @param updateSubscribeAllEditionsRequest
     */
    public updateSubscribeAllEditions(consolidationKey: string, updateSubscribeAllEditionsRequest: UpdateSubscribeAllEditionsRequest, _options?: Configuration): Promise<SubscribeAllEditionsResponse> {
        const result = this.api.updateSubscribeAllEditions(consolidationKey, updateSubscribeAllEditionsRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription for a specific NFT
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionRequest
     */
    public updateSubscriptionWithHttpInfo(consolidationKey: string, updateSubscriptionRequest: UpdateSubscriptionRequest, _options?: Configuration): Promise<HttpInfo<SubscriptionResponse>> {
        const result = this.api.updateSubscriptionWithHttpInfo(consolidationKey, updateSubscriptionRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription for a specific NFT
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionRequest
     */
    public updateSubscription(consolidationKey: string, updateSubscriptionRequest: UpdateSubscriptionRequest, _options?: Configuration): Promise<SubscriptionResponse> {
        const result = this.api.updateSubscription(consolidationKey, updateSubscriptionRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription count for a specific NFT
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionCountRequest
     */
    public updateSubscriptionCountWithHttpInfo(consolidationKey: string, updateSubscriptionCountRequest: UpdateSubscriptionCountRequest, _options?: Configuration): Promise<HttpInfo<SubscriptionCountResponse>> {
        const result = this.api.updateSubscriptionCountWithHttpInfo(consolidationKey, updateSubscriptionCountRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription count for a specific NFT
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionCountRequest
     */
    public updateSubscriptionCount(consolidationKey: string, updateSubscriptionCountRequest: UpdateSubscriptionCountRequest, _options?: Configuration): Promise<SubscriptionCountResponse> {
        const result = this.api.updateSubscriptionCount(consolidationKey, updateSubscriptionCountRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires authentication. User can only change subscription mode for their own consolidation.
     * Update subscription mode
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionModeRequest
     */
    public updateSubscriptionModeWithHttpInfo(consolidationKey: string, updateSubscriptionModeRequest: UpdateSubscriptionModeRequest, _options?: Configuration): Promise<HttpInfo<SubscriptionModeResponse>> {
        const result = this.api.updateSubscriptionModeWithHttpInfo(consolidationKey, updateSubscriptionModeRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires authentication. User can only change subscription mode for their own consolidation.
     * Update subscription mode
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionModeRequest
     */
    public updateSubscriptionMode(consolidationKey: string, updateSubscriptionModeRequest: UpdateSubscriptionModeRequest, _options?: Configuration): Promise<SubscriptionModeResponse> {
        const result = this.api.updateSubscriptionMode(consolidationKey, updateSubscriptionModeRequest, _options);
        return result.toPromise();
    }


}



import { ObservableTDHApi } from './ObservableAPI';

import { TDHApiRequestFactory, TDHApiResponseProcessor} from "../apis/TDHApi";
export class PromiseTDHApi {
    private api: ObservableTDHApi

    public constructor(
        configuration: Configuration,
        requestFactory?: TDHApiRequestFactory,
        responseProcessor?: TDHApiResponseProcessor
    ) {
        this.api = new ObservableTDHApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Returns the consolidated TDH data for a given identity. The identity can be a profile handle, wallet address, ENS name, or consolidation key.
     * Get consolidated TDH for an identity
     * @param identity Profile handle, wallet address, ENS name, or consolidation key
     */
    public getConsolidatedTdhWithHttpInfo(identity: string, _options?: Configuration): Promise<HttpInfo<ApiConsolidatedTdh>> {
        const result = this.api.getConsolidatedTdhWithHttpInfo(identity, _options);
        return result.toPromise();
    }

    /**
     * Returns the consolidated TDH data for a given identity. The identity can be a profile handle, wallet address, ENS name, or consolidation key.
     * Get consolidated TDH for an identity
     * @param identity Profile handle, wallet address, ENS name, or consolidation key
     */
    public getConsolidatedTdh(identity: string, _options?: Configuration): Promise<ApiConsolidatedTdh> {
        const result = this.api.getConsolidatedTdh(identity, _options);
        return result.toPromise();
    }


}



import { ObservableTDHEditionsApi } from './ObservableAPI';

import { TDHEditionsApiRequestFactory, TDHEditionsApiResponseProcessor} from "../apis/TDHEditionsApi";
export class PromiseTDHEditionsApi {
    private api: ObservableTDHEditionsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: TDHEditionsApiRequestFactory,
        responseProcessor?: TDHEditionsApiResponseProcessor
    ) {
        this.api = new ObservableTDHEditionsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get TDH editions by consolidation key
     * @param consolidationKey
     * @param [contract]
     * @param [tokenId]
     * @param [editionId]
     * @param [sort]
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getTdhEditionsByConsolidationKeyWithHttpInfo(consolidationKey: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiTdhEditionsPage>> {
        const result = this.api.getTdhEditionsByConsolidationKeyWithHttpInfo(consolidationKey, contract, tokenId, editionId, sort, sortDirection, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get TDH editions by consolidation key
     * @param consolidationKey
     * @param [contract]
     * @param [tokenId]
     * @param [editionId]
     * @param [sort]
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getTdhEditionsByConsolidationKey(consolidationKey: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<ApiTdhEditionsPage> {
        const result = this.api.getTdhEditionsByConsolidationKey(consolidationKey, contract, tokenId, editionId, sort, sortDirection, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get TDH editions for an identity, wallet address, or ENS
     * @param identity Identity handle, profile id, wallet address, or ENS name
     * @param [contract]
     * @param [tokenId]
     * @param [editionId]
     * @param [sort]
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getTdhEditionsByIdentityWithHttpInfo(identity: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiTdhEditionsPage>> {
        const result = this.api.getTdhEditionsByIdentityWithHttpInfo(identity, contract, tokenId, editionId, sort, sortDirection, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get TDH editions for an identity, wallet address, or ENS
     * @param identity Identity handle, profile id, wallet address, or ENS name
     * @param [contract]
     * @param [tokenId]
     * @param [editionId]
     * @param [sort]
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getTdhEditionsByIdentity(identity: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<ApiTdhEditionsPage> {
        const result = this.api.getTdhEditionsByIdentity(identity, contract, tokenId, editionId, sort, sortDirection, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get TDH editions for a wallet
     * @param wallet
     * @param [contract]
     * @param [tokenId]
     * @param [editionId]
     * @param [sort]
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getTdhEditionsByWalletWithHttpInfo(wallet: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiTdhEditionsPage>> {
        const result = this.api.getTdhEditionsByWalletWithHttpInfo(wallet, contract, tokenId, editionId, sort, sortDirection, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get TDH editions for a wallet
     * @param wallet
     * @param [contract]
     * @param [tokenId]
     * @param [editionId]
     * @param [sort]
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getTdhEditionsByWallet(wallet: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Promise<ApiTdhEditionsPage> {
        const result = this.api.getTdhEditionsByWallet(wallet, contract, tokenId, editionId, sort, sortDirection, page, pageSize, _options);
        return result.toPromise();
    }


}



import { ObservableTransactionsApi } from './ObservableAPI';

import { TransactionsApiRequestFactory, TransactionsApiResponseProcessor} from "../apis/TransactionsApi";
export class PromiseTransactionsApi {
    private api: ObservableTransactionsApi

    public constructor(
        configuration: Configuration,
        requestFactory?: TransactionsApiRequestFactory,
        responseProcessor?: TransactionsApiResponseProcessor
    ) {
        this.api = new ObservableTransactionsApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get transactions
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [wallets] Filter by wallet address
     * @param [contract] Filter by contract address
     * @param [nfts] Filter by NFT ID
     * @param [filter] Filter by transaction type
     */
    public getTransactionsWithHttpInfo(pageSize?: number, page?: number, wallets?: string, contract?: string, nfts?: string, filter?: 'sales' | 'purchases' | 'transfers' | 'airdrops' | 'burns', _options?: Configuration): Promise<HttpInfo<Array<ApiTransactionPage>>> {
        const result = this.api.getTransactionsWithHttpInfo(pageSize, page, wallets, contract, nfts, filter, _options);
        return result.toPromise();
    }

    /**
     * Get transactions
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [wallets] Filter by wallet address
     * @param [contract] Filter by contract address
     * @param [nfts] Filter by NFT ID
     * @param [filter] Filter by transaction type
     */
    public getTransactions(pageSize?: number, page?: number, wallets?: string, contract?: string, nfts?: string, filter?: 'sales' | 'purchases' | 'transfers' | 'airdrops' | 'burns', _options?: Configuration): Promise<Array<ApiTransactionPage>> {
        const result = this.api.getTransactions(pageSize, page, wallets, contract, nfts, filter, _options);
        return result.toPromise();
    }


}



import { ObservableWavesApi } from './ObservableAPI';

import { WavesApiRequestFactory, WavesApiResponseProcessor} from "../apis/WavesApi";
export class PromiseWavesApi {
    private api: ObservableWavesApi

    public constructor(
        configuration: Configuration,
        requestFactory?: WavesApiRequestFactory,
        responseProcessor?: WavesApiResponseProcessor
    ) {
        this.api = new ObservableWavesApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create a direct message wave
     * @param createDirectMessageWaveRequest
     */
    public createDirectMessageWaveWithHttpInfo(createDirectMessageWaveRequest: CreateDirectMessageWaveRequest, _options?: Configuration): Promise<HttpInfo<ApiWave>> {
        const result = this.api.createDirectMessageWaveWithHttpInfo(createDirectMessageWaveRequest, _options);
        return result.toPromise();
    }

    /**
     * Create a direct message wave
     * @param createDirectMessageWaveRequest
     */
    public createDirectMessageWave(createDirectMessageWaveRequest: CreateDirectMessageWaveRequest, _options?: Configuration): Promise<ApiWave> {
        const result = this.api.createDirectMessageWave(createDirectMessageWaveRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create new wave
     * @param apiCreateNewWave
     */
    public createWaveWithHttpInfo(apiCreateNewWave: ApiCreateNewWave, _options?: Configuration): Promise<HttpInfo<ApiWave>> {
        const result = this.api.createWaveWithHttpInfo(apiCreateNewWave, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create new wave
     * @param apiCreateNewWave
     */
    public createWave(apiCreateNewWave: ApiCreateNewWave, _options?: Configuration): Promise<ApiWave> {
        const result = this.api.createWave(apiCreateNewWave, _options);
        return result.toPromise();
    }

    /**
     * Create curation group for wave
     * @param id
     * @param apiWaveCurationGroupRequest
     */
    public createWaveCurationGroupWithHttpInfo(id: string, apiWaveCurationGroupRequest: ApiWaveCurationGroupRequest, _options?: Configuration): Promise<HttpInfo<ApiWaveCurationGroup>> {
        const result = this.api.createWaveCurationGroupWithHttpInfo(id, apiWaveCurationGroupRequest, _options);
        return result.toPromise();
    }

    /**
     * Create curation group for wave
     * @param id
     * @param apiWaveCurationGroupRequest
     */
    public createWaveCurationGroup(id: string, apiWaveCurationGroupRequest: ApiWaveCurationGroupRequest, _options?: Configuration): Promise<ApiWaveCurationGroup> {
        const result = this.api.createWaveCurationGroup(id, apiWaveCurationGroupRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for wave PFP
     * @param apiCreateMediaUploadUrlRequest
     */
    public createWaveMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<HttpInfo<ApiCreateMediaUrlResponse>> {
        const result = this.api.createWaveMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest, _options);
        return result.toPromise();
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for wave PFP
     * @param apiCreateMediaUploadUrlRequest
     */
    public createWaveMediaUrl(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Promise<ApiCreateMediaUrlResponse> {
        const result = this.api.createWaveMediaUrl(apiCreateMediaUploadUrlRequest, _options);
        return result.toPromise();
    }

    /**
     * Delete wave by ID
     * @param id
     */
    public deleteWaveByIdWithHttpInfo(id: string, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.deleteWaveByIdWithHttpInfo(id, _options);
        return result.toPromise();
    }

    /**
     * Delete wave by ID
     * @param id
     */
    public deleteWaveById(id: string, _options?: Configuration): Promise<void> {
        const result = this.api.deleteWaveById(id, _options);
        return result.toPromise();
    }

    /**
     * Delete curation group from wave
     * @param id
     * @param curationGroupId
     */
    public deleteWaveCurationGroupWithHttpInfo(id: string, curationGroupId: string, _options?: Configuration): Promise<HttpInfo<void>> {
        const result = this.api.deleteWaveCurationGroupWithHttpInfo(id, curationGroupId, _options);
        return result.toPromise();
    }

    /**
     * Delete curation group from wave
     * @param id
     * @param curationGroupId
     */
    public deleteWaveCurationGroup(id: string, curationGroupId: string, _options?: Configuration): Promise<void> {
        const result = this.api.deleteWaveCurationGroup(id, curationGroupId, _options);
        return result.toPromise();
    }

    /**
     * Pause can only be deleted if no past decisions have already been skipped based on it.
     * Delete wave decision pause
     * @param waveId wave id
     * @param id pause id
     */
    public deleteWaveDecisionPauseWithHttpInfo(waveId: string, id: number, _options?: Configuration): Promise<HttpInfo<ApiWave>> {
        const result = this.api.deleteWaveDecisionPauseWithHttpInfo(waveId, id, _options);
        return result.toPromise();
    }

    /**
     * Pause can only be deleted if no past decisions have already been skipped based on it.
     * Delete wave decision pause
     * @param waveId wave id
     * @param id pause id
     */
    public deleteWaveDecisionPause(waveId: string, id: number, _options?: Configuration): Promise<ApiWave> {
        const result = this.api.deleteWaveDecisionPause(waveId, id, _options);
        return result.toPromise();
    }

    /**
     * Get drop logs
     * @param id Filter by wave ID
     * @param [logTypes] Filter by log type (comma separated)
     * @param [dropId] Filter by drop ID
     * @param [offset]
     * @param [limit]
     * @param [sortDirection] Default is DESC
     */
    public getDropLogsWithHttpInfo(id: string, logTypes?: string, dropId?: string, offset?: number, limit?: number, sortDirection?: 'ASC' | 'DESC', _options?: Configuration): Promise<HttpInfo<Array<ApiWaveLog>>> {
        const result = this.api.getDropLogsWithHttpInfo(id, logTypes, dropId, offset, limit, sortDirection, _options);
        return result.toPromise();
    }

    /**
     * Get drop logs
     * @param id Filter by wave ID
     * @param [logTypes] Filter by log type (comma separated)
     * @param [dropId] Filter by drop ID
     * @param [offset]
     * @param [limit]
     * @param [sortDirection] Default is DESC
     */
    public getDropLogs(id: string, logTypes?: string, dropId?: string, offset?: number, limit?: number, sortDirection?: 'ASC' | 'DESC', _options?: Configuration): Promise<Array<ApiWaveLog>> {
        const result = this.api.getDropLogs(id, logTypes, dropId, offset, limit, sortDirection, _options);
        return result.toPromise();
    }

    /**
     * Get drops related to wave or parent drop
     * @param id
     * @param [dropId]
     * @param [limit]
     * @param [serialNoLimit] Use instead of serial_no_less_than. If you use serial_no_less_than and this then serial_no_less_than is preferred (until future when it\&quot;s deleted)
     * @param [searchStrategy] Use in combination with serial_no_limit. If this not set then FIND_OLDER is used. If serial_no_less_than is set then this is ignored.
     * @param [serialNoLessThan]
     * @param [dropType] Filter by drop type
     */
    public getDropsOfWaveWithHttpInfo(id: string, dropId?: string, limit?: number, serialNoLimit?: number, searchStrategy?: ApiDropSearchStrategy, serialNoLessThan?: number, dropType?: ApiDropType, _options?: Configuration): Promise<HttpInfo<ApiWaveDropsFeed>> {
        const result = this.api.getDropsOfWaveWithHttpInfo(id, dropId, limit, serialNoLimit, searchStrategy, serialNoLessThan, dropType, _options);
        return result.toPromise();
    }

    /**
     * Get drops related to wave or parent drop
     * @param id
     * @param [dropId]
     * @param [limit]
     * @param [serialNoLimit] Use instead of serial_no_less_than. If you use serial_no_less_than and this then serial_no_less_than is preferred (until future when it\&quot;s deleted)
     * @param [searchStrategy] Use in combination with serial_no_limit. If this not set then FIND_OLDER is used. If serial_no_less_than is set then this is ignored.
     * @param [serialNoLessThan]
     * @param [dropType] Filter by drop type
     */
    public getDropsOfWave(id: string, dropId?: string, limit?: number, serialNoLimit?: number, searchStrategy?: ApiDropSearchStrategy, serialNoLessThan?: number, dropType?: ApiDropType, _options?: Configuration): Promise<ApiWaveDropsFeed> {
        const result = this.api.getDropsOfWave(id, dropId, limit, serialNoLimit, searchStrategy, serialNoLessThan, dropType, _options);
        return result.toPromise();
    }

    /**
     * Returns up to 25 public waves ranked by activity in the last 24 hours.
     * Get hot waves overview.
     */
    public getHotWavesOverviewWithHttpInfo(_options?: Configuration): Promise<HttpInfo<Array<ApiWave>>> {
        const result = this.api.getHotWavesOverviewWithHttpInfo(_options);
        return result.toPromise();
    }

    /**
     * Returns up to 25 public waves ranked by activity in the last 24 hours.
     * Get hot waves overview.
     */
    public getHotWavesOverview(_options?: Configuration): Promise<Array<ApiWave>> {
        const result = this.api.getHotWavesOverview(_options);
        return result.toPromise();
    }

    /**
     * Get wave by ID.
     * @param id
     */
    public getWaveByIdWithHttpInfo(id: string, _options?: Configuration): Promise<HttpInfo<ApiWave>> {
        const result = this.api.getWaveByIdWithHttpInfo(id, _options);
        return result.toPromise();
    }

    /**
     * Get wave by ID.
     * @param id
     */
    public getWaveById(id: string, _options?: Configuration): Promise<ApiWave> {
        const result = this.api.getWaveById(id, _options);
        return result.toPromise();
    }

    /**
     * Get already decided wave decision outcomes
     * @param id
     * @param [sortDirection]
     * @param [sort]
     * @param [page]
     * @param [pageSize]
     */
    public getWaveDecisionsWithHttpInfo(id: string, sortDirection?: 'ASC' | 'DESC', sort?: 'decision_time', page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiWaveDecisionsPage>> {
        const result = this.api.getWaveDecisionsWithHttpInfo(id, sortDirection, sort, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get already decided wave decision outcomes
     * @param id
     * @param [sortDirection]
     * @param [sort]
     * @param [page]
     * @param [pageSize]
     */
    public getWaveDecisions(id: string, sortDirection?: 'ASC' | 'DESC', sort?: 'decision_time', page?: number, pageSize?: number, _options?: Configuration): Promise<ApiWaveDecisionsPage> {
        const result = this.api.getWaveDecisions(id, sortDirection, sort, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get waves leaderboard
     * @param id
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is ASC
     * @param [sort] Default is rank
     * @param [priceCurrency] Optional currency used for min_price/max_price filtering and PRICE sorting
     * @param [minPrice] Optional minimum price filter applied to leaderboard results
     * @param [maxPrice] Optional maximum price filter applied to leaderboard results
     * @param [curatedByGroup]
     */
    public getWaveLeaderboardWithHttpInfo(id: string, pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'RANK' | 'REALTIME_VOTE' | 'MY_REALTIME_VOTE' | 'CREATED_AT' | 'PRICE' | 'RATING_PREDICTION' | 'TREND', priceCurrency?: string, minPrice?: number, maxPrice?: number, curatedByGroup?: string, _options?: Configuration): Promise<HttpInfo<ApiDropsLeaderboardPage>> {
        const result = this.api.getWaveLeaderboardWithHttpInfo(id, pageSize, page, sortDirection, sort, priceCurrency, minPrice, maxPrice, curatedByGroup, _options);
        return result.toPromise();
    }

    /**
     * Get waves leaderboard
     * @param id
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is ASC
     * @param [sort] Default is rank
     * @param [priceCurrency] Optional currency used for min_price/max_price filtering and PRICE sorting
     * @param [minPrice] Optional minimum price filter applied to leaderboard results
     * @param [maxPrice] Optional maximum price filter applied to leaderboard results
     * @param [curatedByGroup]
     */
    public getWaveLeaderboard(id: string, pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'RANK' | 'REALTIME_VOTE' | 'MY_REALTIME_VOTE' | 'CREATED_AT' | 'PRICE' | 'RATING_PREDICTION' | 'TREND', priceCurrency?: string, minPrice?: number, maxPrice?: number, curatedByGroup?: string, _options?: Configuration): Promise<ApiDropsLeaderboardPage> {
        const result = this.api.getWaveLeaderboard(id, pageSize, page, sortDirection, sort, priceCurrency, minPrice, maxPrice, curatedByGroup, _options);
        return result.toPromise();
    }

    /**
     * Get wave outcome distribution
     * @param waveId
     * @param outcomeIndex
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getWaveOutcomeDistributionWithHttpInfo(waveId: string, outcomeIndex: string, sortDirection?: 'ASC' | 'DESC', page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiWaveOutcomeDistributionItemsPage>> {
        const result = this.api.getWaveOutcomeDistributionWithHttpInfo(waveId, outcomeIndex, sortDirection, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get wave outcome distribution
     * @param waveId
     * @param outcomeIndex
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getWaveOutcomeDistribution(waveId: string, outcomeIndex: string, sortDirection?: 'ASC' | 'DESC', page?: number, pageSize?: number, _options?: Configuration): Promise<ApiWaveOutcomeDistributionItemsPage> {
        const result = this.api.getWaveOutcomeDistribution(waveId, outcomeIndex, sortDirection, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get wave outcomes
     * @param waveId
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getWaveOutcomesWithHttpInfo(waveId: string, sortDirection?: 'ASC' | 'DESC', page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiWaveOutcomesPage>> {
        const result = this.api.getWaveOutcomesWithHttpInfo(waveId, sortDirection, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get wave outcomes
     * @param waveId
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getWaveOutcomes(waveId: string, sortDirection?: 'ASC' | 'DESC', page?: number, pageSize?: number, _options?: Configuration): Promise<ApiWaveOutcomesPage> {
        const result = this.api.getWaveOutcomes(waveId, sortDirection, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get info about waves voters (top voters etc)
     * @param id
     * @param [dropId] If set then you\&quot;ll get stats for specific drop
     * @param [page]
     * @param [pageSize] Default is 20
     * @param [sortDirection] Default is ASC
     * @param [sort] Default is ABSOLUTE
     */
    public getWaveVotersInfoWithHttpInfo(id: string, dropId?: string, page?: number, pageSize?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'ABSOLUTE' | 'POSITIVE' | 'NEGATIVE', _options?: Configuration): Promise<HttpInfo<ApiWaveVotersPage>> {
        const result = this.api.getWaveVotersInfoWithHttpInfo(id, dropId, page, pageSize, sortDirection, sort, _options);
        return result.toPromise();
    }

    /**
     * Get info about waves voters (top voters etc)
     * @param id
     * @param [dropId] If set then you\&quot;ll get stats for specific drop
     * @param [page]
     * @param [pageSize] Default is 20
     * @param [sortDirection] Default is ASC
     * @param [sort] Default is ABSOLUTE
     */
    public getWaveVotersInfo(id: string, dropId?: string, page?: number, pageSize?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'ABSOLUTE' | 'POSITIVE' | 'NEGATIVE', _options?: Configuration): Promise<ApiWaveVotersPage> {
        const result = this.api.getWaveVotersInfo(id, dropId, page, pageSize, sortDirection, sort, _options);
        return result.toPromise();
    }

    /**
     * Get waves.
     * @param [name] Search by name or part of name
     * @param [author] Search by author identity
     * @param [limit] How many waves to return (10 by default)
     * @param [serialNoLessThan] Used to find older drops
     * @param [groupId] Waves by authors that fall into supplied group
     * @param [directMessage] Use true for DM waves, use false for non-DM waves, omit for all
     */
    public getWavesWithHttpInfo(name?: string, author?: string, limit?: number, serialNoLessThan?: number, groupId?: string, directMessage?: boolean, _options?: Configuration): Promise<HttpInfo<Array<ApiWave>>> {
        const result = this.api.getWavesWithHttpInfo(name, author, limit, serialNoLessThan, groupId, directMessage, _options);
        return result.toPromise();
    }

    /**
     * Get waves.
     * @param [name] Search by name or part of name
     * @param [author] Search by author identity
     * @param [limit] How many waves to return (10 by default)
     * @param [serialNoLessThan] Used to find older drops
     * @param [groupId] Waves by authors that fall into supplied group
     * @param [directMessage] Use true for DM waves, use false for non-DM waves, omit for all
     */
    public getWaves(name?: string, author?: string, limit?: number, serialNoLessThan?: number, groupId?: string, directMessage?: boolean, _options?: Configuration): Promise<Array<ApiWave>> {
        const result = this.api.getWaves(name, author, limit, serialNoLessThan, groupId, directMessage, _options);
        return result.toPromise();
    }

    /**
     * Get overview of waves by different criteria.
     * @param type Type of overview
     * @param [limit] How many waves to return (10 by default)
     * @param [offset] Used to find next waves
     * @param [pinned] Filter only PINNED or UNPINNED waves
     * @param [onlyWavesFollowedByAuthenticatedUser] If true then result only includes waves what authenticated user follows
     * @param [directMessage] Use true for DM waves, use false for non-DM waves, omit for all
     */
    public getWavesOverviewWithHttpInfo(type: ApiWavesOverviewType, limit?: number, offset?: number, pinned?: ApiWavesPinFilter, onlyWavesFollowedByAuthenticatedUser?: boolean, directMessage?: boolean, _options?: Configuration): Promise<HttpInfo<Array<ApiWave>>> {
        const result = this.api.getWavesOverviewWithHttpInfo(type, limit, offset, pinned, onlyWavesFollowedByAuthenticatedUser, directMessage, _options);
        return result.toPromise();
    }

    /**
     * Get overview of waves by different criteria.
     * @param type Type of overview
     * @param [limit] How many waves to return (10 by default)
     * @param [offset] Used to find next waves
     * @param [pinned] Filter only PINNED or UNPINNED waves
     * @param [onlyWavesFollowedByAuthenticatedUser] If true then result only includes waves what authenticated user follows
     * @param [directMessage] Use true for DM waves, use false for non-DM waves, omit for all
     */
    public getWavesOverview(type: ApiWavesOverviewType, limit?: number, offset?: number, pinned?: ApiWavesPinFilter, onlyWavesFollowedByAuthenticatedUser?: boolean, directMessage?: boolean, _options?: Configuration): Promise<Array<ApiWave>> {
        const result = this.api.getWavesOverview(type, limit, offset, pinned, onlyWavesFollowedByAuthenticatedUser, directMessage, _options);
        return result.toPromise();
    }

    /**
     * List curation groups configured for wave
     * @param id
     */
    public listWaveCurationGroupsWithHttpInfo(id: string, _options?: Configuration): Promise<HttpInfo<Array<ApiWaveCurationGroup>>> {
        const result = this.api.listWaveCurationGroupsWithHttpInfo(id, _options);
        return result.toPromise();
    }

    /**
     * List curation groups configured for wave
     * @param id
     */
    public listWaveCurationGroups(id: string, _options?: Configuration): Promise<Array<ApiWaveCurationGroup>> {
        const result = this.api.listWaveCurationGroups(id, _options);
        return result.toPromise();
    }

    /**
     * Mute a wave
     * @param id
     */
    public muteWaveWithHttpInfo(id: string, _options?: Configuration): Promise<HttpInfo<any>> {
        const result = this.api.muteWaveWithHttpInfo(id, _options);
        return result.toPromise();
    }

    /**
     * Mute a wave
     * @param id
     */
    public muteWave(id: string, _options?: Configuration): Promise<any> {
        const result = this.api.muteWave(id, _options);
        return result.toPromise();
    }

    /**
     * Pin a wave
     * @param id
     */
    public pinWaveWithHttpInfo(id: string, _options?: Configuration): Promise<HttpInfo<any>> {
        const result = this.api.pinWaveWithHttpInfo(id, _options);
        return result.toPromise();
    }

    /**
     * Pin a wave
     * @param id
     */
    public pinWave(id: string, _options?: Configuration): Promise<any> {
        const result = this.api.pinWave(id, _options);
        return result.toPromise();
    }

    /**
     * Search for drops in wave by content
     * @param waveId
     * @param term
     * @param [page]
     * @param [size]
     */
    public searchDropsInWaveWithHttpInfo(waveId: string, term: string, page?: number, size?: number, _options?: Configuration): Promise<HttpInfo<ApiDropWithoutWavesPageWithoutCount>> {
        const result = this.api.searchDropsInWaveWithHttpInfo(waveId, term, page, size, _options);
        return result.toPromise();
    }

    /**
     * Search for drops in wave by content
     * @param waveId
     * @param term
     * @param [page]
     * @param [size]
     */
    public searchDropsInWave(waveId: string, term: string, page?: number, size?: number, _options?: Configuration): Promise<ApiDropWithoutWavesPageWithoutCount> {
        const result = this.api.searchDropsInWave(waveId, term, page, size, _options);
        return result.toPromise();
    }

    /**
     * Subscribe authenticated user to wave actions.
     * @param id
     * @param apiWaveSubscriptionActions
     */
    public subscribeToWaveActionsWithHttpInfo(id: string, apiWaveSubscriptionActions: ApiWaveSubscriptionActions, _options?: Configuration): Promise<HttpInfo<ApiWaveSubscriptionActions>> {
        const result = this.api.subscribeToWaveActionsWithHttpInfo(id, apiWaveSubscriptionActions, _options);
        return result.toPromise();
    }

    /**
     * Subscribe authenticated user to wave actions.
     * @param id
     * @param apiWaveSubscriptionActions
     */
    public subscribeToWaveActions(id: string, apiWaveSubscriptionActions: ApiWaveSubscriptionActions, _options?: Configuration): Promise<ApiWaveSubscriptionActions> {
        const result = this.api.subscribeToWaveActions(id, apiWaveSubscriptionActions, _options);
        return result.toPromise();
    }

    /**
     * Unpin a wave
     * @param id
     */
    public unPinWaveWithHttpInfo(id: string, _options?: Configuration): Promise<HttpInfo<any>> {
        const result = this.api.unPinWaveWithHttpInfo(id, _options);
        return result.toPromise();
    }

    /**
     * Unpin a wave
     * @param id
     */
    public unPinWave(id: string, _options?: Configuration): Promise<any> {
        const result = this.api.unPinWave(id, _options);
        return result.toPromise();
    }

    /**
     * Unmute a wave
     * @param id
     */
    public unmuteWaveWithHttpInfo(id: string, _options?: Configuration): Promise<HttpInfo<any>> {
        const result = this.api.unmuteWaveWithHttpInfo(id, _options);
        return result.toPromise();
    }

    /**
     * Unmute a wave
     * @param id
     */
    public unmuteWave(id: string, _options?: Configuration): Promise<any> {
        const result = this.api.unmuteWave(id, _options);
        return result.toPromise();
    }

    /**
     * Unsubscribe authenticated user from wave actions.
     * @param id
     * @param apiWaveSubscriptionActions
     */
    public unsubscribeFromWaveActionsWithHttpInfo(id: string, apiWaveSubscriptionActions: ApiWaveSubscriptionActions, _options?: Configuration): Promise<HttpInfo<ApiWaveSubscriptionActions>> {
        const result = this.api.unsubscribeFromWaveActionsWithHttpInfo(id, apiWaveSubscriptionActions, _options);
        return result.toPromise();
    }

    /**
     * Unsubscribe authenticated user from wave actions.
     * @param id
     * @param apiWaveSubscriptionActions
     */
    public unsubscribeFromWaveActions(id: string, apiWaveSubscriptionActions: ApiWaveSubscriptionActions, _options?: Configuration): Promise<ApiWaveSubscriptionActions> {
        const result = this.api.unsubscribeFromWaveActions(id, apiWaveSubscriptionActions, _options);
        return result.toPromise();
    }

    /**
     * Update wave by ID
     * @param id
     * @param apiUpdateWaveRequest
     */
    public updateWaveByIdWithHttpInfo(id: string, apiUpdateWaveRequest: ApiUpdateWaveRequest, _options?: Configuration): Promise<HttpInfo<ApiWave>> {
        const result = this.api.updateWaveByIdWithHttpInfo(id, apiUpdateWaveRequest, _options);
        return result.toPromise();
    }

    /**
     * Update wave by ID
     * @param id
     * @param apiUpdateWaveRequest
     */
    public updateWaveById(id: string, apiUpdateWaveRequest: ApiUpdateWaveRequest, _options?: Configuration): Promise<ApiWave> {
        const result = this.api.updateWaveById(id, apiUpdateWaveRequest, _options);
        return result.toPromise();
    }

    /**
     * Update curation group for wave
     * @param id
     * @param curationGroupId
     * @param apiWaveCurationGroupRequest
     */
    public updateWaveCurationGroupWithHttpInfo(id: string, curationGroupId: string, apiWaveCurationGroupRequest: ApiWaveCurationGroupRequest, _options?: Configuration): Promise<HttpInfo<ApiWaveCurationGroup>> {
        const result = this.api.updateWaveCurationGroupWithHttpInfo(id, curationGroupId, apiWaveCurationGroupRequest, _options);
        return result.toPromise();
    }

    /**
     * Update curation group for wave
     * @param id
     * @param curationGroupId
     * @param apiWaveCurationGroupRequest
     */
    public updateWaveCurationGroup(id: string, curationGroupId: string, apiWaveCurationGroupRequest: ApiWaveCurationGroupRequest, _options?: Configuration): Promise<ApiWaveCurationGroup> {
        const result = this.api.updateWaveCurationGroup(id, curationGroupId, apiWaveCurationGroupRequest, _options);
        return result.toPromise();
    }

    /**
     * Create or edit wave decision pause
     * @param id wave id
     * @param apiUpdateWaveDecisionPause
     */
    public updateWaveDecisionPauseWithHttpInfo(id: string, apiUpdateWaveDecisionPause: ApiUpdateWaveDecisionPause, _options?: Configuration): Promise<HttpInfo<ApiWave>> {
        const result = this.api.updateWaveDecisionPauseWithHttpInfo(id, apiUpdateWaveDecisionPause, _options);
        return result.toPromise();
    }

    /**
     * Create or edit wave decision pause
     * @param id wave id
     * @param apiUpdateWaveDecisionPause
     */
    public updateWaveDecisionPause(id: string, apiUpdateWaveDecisionPause: ApiUpdateWaveDecisionPause, _options?: Configuration): Promise<ApiWave> {
        const result = this.api.updateWaveDecisionPause(id, apiUpdateWaveDecisionPause, _options);
        return result.toPromise();
    }


}



import { ObservableXTDHApi } from './ObservableAPI';

import { XTDHApiRequestFactory, XTDHApiResponseProcessor} from "../apis/XTDHApi";
export class PromiseXTDHApi {
    private api: ObservableXTDHApi

    public constructor(
        configuration: Configuration,
        requestFactory?: XTDHApiRequestFactory,
        responseProcessor?: XTDHApiResponseProcessor
    ) {
        this.api = new ObservableXTDHApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get global xTDH stats
     */
    public getGlobalXTdhStatsWithHttpInfo(_options?: Configuration): Promise<HttpInfo<ApiXTdhGlobalStats>> {
        const result = this.api.getGlobalXTdhStatsWithHttpInfo(_options);
        return result.toPromise();
    }

    /**
     * Get global xTDH stats
     */
    public getGlobalXTdhStats(_options?: Configuration): Promise<ApiXTdhGlobalStats> {
        const result = this.api.getGlobalXTdhStats(_options);
        return result.toPromise();
    }

    /**
     * Get identities xTDH stats
     * @param identity
     */
    public getIdentitiesXTdhStatsWithHttpInfo(identity: string, _options?: Configuration): Promise<HttpInfo<ApiXTdhStats>> {
        const result = this.api.getIdentitiesXTdhStatsWithHttpInfo(identity, _options);
        return result.toPromise();
    }

    /**
     * Get identities xTDH stats
     * @param identity
     */
    public getIdentitiesXTdhStats(identity: string, _options?: Configuration): Promise<ApiXTdhStats> {
        const result = this.api.getIdentitiesXTdhStats(identity, _options);
        return result.toPromise();
    }

    /**
     * Get info about xTDH collections
     * @param [identity] Filter by receiving identity
     * @param [collectionName]
     * @param [page]
     * @param [pageSize] Default is 20
     * @param [sort] xtdh when omitted
     * @param [order] desc when omitted
     */
    public getInfoAboutXTdhCollectionsWithHttpInfo(identity?: string, collectionName?: string, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Promise<HttpInfo<ApiXTdhCollectionsPage>> {
        const result = this.api.getInfoAboutXTdhCollectionsWithHttpInfo(identity, collectionName, page, pageSize, sort, order, _options);
        return result.toPromise();
    }

    /**
     * Get info about xTDH collections
     * @param [identity] Filter by receiving identity
     * @param [collectionName]
     * @param [page]
     * @param [pageSize] Default is 20
     * @param [sort] xtdh when omitted
     * @param [order] desc when omitted
     */
    public getInfoAboutXTdhCollections(identity?: string, collectionName?: string, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Promise<ApiXTdhCollectionsPage> {
        const result = this.api.getInfoAboutXTdhCollections(identity, collectionName, page, pageSize, sort, order, _options);
        return result.toPromise();
    }

    /**
     * Get info about xTDH contributors
     * @param contract
     * @param token
     * @param [groupBy] Group by grant or grantor (grant when omitted)
     * @param [page]
     * @param [pageSize] Default is 20
     * @param [sort] xtdh when omitted
     * @param [order] desc when omitted
     */
    public getInfoAboutXTdhContributorsWithHttpInfo(contract: string, token: number, groupBy?: 'grant' | 'grantor', page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Promise<HttpInfo<ApiXTdhContributionsPage>> {
        const result = this.api.getInfoAboutXTdhContributorsWithHttpInfo(contract, token, groupBy, page, pageSize, sort, order, _options);
        return result.toPromise();
    }

    /**
     * Get info about xTDH contributors
     * @param contract
     * @param token
     * @param [groupBy] Group by grant or grantor (grant when omitted)
     * @param [page]
     * @param [pageSize] Default is 20
     * @param [sort] xtdh when omitted
     * @param [order] desc when omitted
     */
    public getInfoAboutXTdhContributors(contract: string, token: number, groupBy?: 'grant' | 'grantor', page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Promise<ApiXTdhContributionsPage> {
        const result = this.api.getInfoAboutXTdhContributors(contract, token, groupBy, page, pageSize, sort, order, _options);
        return result.toPromise();
    }

    /**
     * Get info about xTDH grantees
     * @param [contract]
     * @param [page]
     * @param [pageSize] Default is 20
     * @param [sort] xtdh when omitted
     * @param [order] desc when omitted
     */
    public getInfoAboutXTdhGranteesWithHttpInfo(contract?: string, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Promise<HttpInfo<ApiXTdhGranteesPage>> {
        const result = this.api.getInfoAboutXTdhGranteesWithHttpInfo(contract, page, pageSize, sort, order, _options);
        return result.toPromise();
    }

    /**
     * Get info about xTDH grantees
     * @param [contract]
     * @param [page]
     * @param [pageSize] Default is 20
     * @param [sort] xtdh when omitted
     * @param [order] desc when omitted
     */
    public getInfoAboutXTdhGrantees(contract?: string, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Promise<ApiXTdhGranteesPage> {
        const result = this.api.getInfoAboutXTdhGrantees(contract, page, pageSize, sort, order, _options);
        return result.toPromise();
    }

    /**
     * Get info about xTDH tokens
     * @param [identity] Filter by receiving identity
     * @param [contract] Filter by receiving contract
     * @param [token] Filter by token. Needs to be paired with contract to work
     * @param [page]
     * @param [pageSize] Default is 20
     * @param [sort] xtdh when omitted
     * @param [order] desc when omitted
     */
    public getInfoAboutXTdhTokensWithHttpInfo(identity?: string, contract?: string, token?: number, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Promise<HttpInfo<ApiXTdhTokensPage>> {
        const result = this.api.getInfoAboutXTdhTokensWithHttpInfo(identity, contract, token, page, pageSize, sort, order, _options);
        return result.toPromise();
    }

    /**
     * Get info about xTDH tokens
     * @param [identity] Filter by receiving identity
     * @param [contract] Filter by receiving contract
     * @param [token] Filter by token. Needs to be paired with contract to work
     * @param [page]
     * @param [pageSize] Default is 20
     * @param [sort] xtdh when omitted
     * @param [order] desc when omitted
     */
    public getInfoAboutXTdhTokens(identity?: string, contract?: string, token?: number, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Promise<ApiXTdhTokensPage> {
        const result = this.api.getInfoAboutXTdhTokens(identity, contract, token, page, pageSize, sort, order, _options);
        return result.toPromise();
    }

    /**
     * Get xTDH grant
     * @param id
     */
    public getXTdhGrantWithHttpInfo(id: string, _options?: Configuration): Promise<HttpInfo<ApiXTdhGrant>> {
        const result = this.api.getXTdhGrantWithHttpInfo(id, _options);
        return result.toPromise();
    }

    /**
     * Get xTDH grant
     * @param id
     */
    public getXTdhGrant(id: string, _options?: Configuration): Promise<ApiXTdhGrant> {
        const result = this.api.getXTdhGrant(id, _options);
        return result.toPromise();
    }

    /**
     * Get xTDH grant tokens
     * @param id
     * @param [sortDirection]
     * @param [sort]
     * @param [page]
     * @param [pageSize]
     */
    public getXTdhGrantTokensWithHttpInfo(id: string, sortDirection?: ApiPageSortDirection, sort?: 'token', page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiXTdhGrantTokensPage>> {
        const result = this.api.getXTdhGrantTokensWithHttpInfo(id, sortDirection, sort, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get xTDH grant tokens
     * @param id
     * @param [sortDirection]
     * @param [sort]
     * @param [page]
     * @param [pageSize]
     */
    public getXTdhGrantTokens(id: string, sortDirection?: ApiPageSortDirection, sort?: 'token', page?: number, pageSize?: number, _options?: Configuration): Promise<ApiXTdhGrantTokensPage> {
        const result = this.api.getXTdhGrantTokens(id, sortDirection, sort, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get xTDH grants
     * @param [grantor]
     * @param [targetContract]
     * @param [targetCollectionName]
     * @param [targetChain]
     * @param [validFromGt]
     * @param [validFromLt]
     * @param [validToGt]
     * @param [validToLt]
     * @param [status] One or more (comma separated) statuses you are interested in
     * @param [sortDirection]
     * @param [sort]
     * @param [page]
     * @param [pageSize]
     */
    public getXTdhGrantsWithHttpInfo(grantor?: string, targetContract?: string, targetCollectionName?: string, targetChain?: string, validFromGt?: number, validFromLt?: number, validToGt?: number, validToLt?: number, status?: string, sortDirection?: ApiPageSortDirection, sort?: 'created_at' | 'valid_from' | 'valid_to' | 'rate', page?: number, pageSize?: number, _options?: Configuration): Promise<HttpInfo<ApiXTdhGrantsPage>> {
        const result = this.api.getXTdhGrantsWithHttpInfo(grantor, targetContract, targetCollectionName, targetChain, validFromGt, validFromLt, validToGt, validToLt, status, sortDirection, sort, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Get xTDH grants
     * @param [grantor]
     * @param [targetContract]
     * @param [targetCollectionName]
     * @param [targetChain]
     * @param [validFromGt]
     * @param [validFromLt]
     * @param [validToGt]
     * @param [validToLt]
     * @param [status] One or more (comma separated) statuses you are interested in
     * @param [sortDirection]
     * @param [sort]
     * @param [page]
     * @param [pageSize]
     */
    public getXTdhGrants(grantor?: string, targetContract?: string, targetCollectionName?: string, targetChain?: string, validFromGt?: number, validFromLt?: number, validToGt?: number, validToLt?: number, status?: string, sortDirection?: ApiPageSortDirection, sort?: 'created_at' | 'valid_from' | 'valid_to' | 'rate', page?: number, pageSize?: number, _options?: Configuration): Promise<ApiXTdhGrantsPage> {
        const result = this.api.getXTdhGrants(grantor, targetContract, targetCollectionName, targetChain, validFromGt, validFromLt, validToGt, validToLt, status, sortDirection, sort, page, pageSize, _options);
        return result.toPromise();
    }

    /**
     * Create xTDH grant
     * @param apiXTdhCreateGrant
     */
    public grantXTdhWithHttpInfo(apiXTdhCreateGrant: ApiXTdhCreateGrant, _options?: Configuration): Promise<HttpInfo<ApiXTdhGrant>> {
        const result = this.api.grantXTdhWithHttpInfo(apiXTdhCreateGrant, _options);
        return result.toPromise();
    }

    /**
     * Create xTDH grant
     * @param apiXTdhCreateGrant
     */
    public grantXTdh(apiXTdhCreateGrant: ApiXTdhCreateGrant, _options?: Configuration): Promise<ApiXTdhGrant> {
        const result = this.api.grantXTdh(apiXTdhCreateGrant, _options);
        return result.toPromise();
    }

    /**
     * Update xTDH grant
     * @param id
     * @param apiXTdhGrantUpdateRequest
     */
    public updateXTdhGrantWithHttpInfo(id: string, apiXTdhGrantUpdateRequest: ApiXTdhGrantUpdateRequest, _options?: Configuration): Promise<HttpInfo<ApiXTdhGrant>> {
        const result = this.api.updateXTdhGrantWithHttpInfo(id, apiXTdhGrantUpdateRequest, _options);
        return result.toPromise();
    }

    /**
     * Update xTDH grant
     * @param id
     * @param apiXTdhGrantUpdateRequest
     */
    public updateXTdhGrant(id: string, apiXTdhGrantUpdateRequest: ApiXTdhGrantUpdateRequest, _options?: Configuration): Promise<ApiXTdhGrant> {
        const result = this.api.updateXTdhGrant(id, apiXTdhGrantUpdateRequest, _options);
        return result.toPromise();
    }


}



