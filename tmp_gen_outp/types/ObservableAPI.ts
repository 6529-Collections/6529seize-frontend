import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration} from '../configuration'
import { Observable, of, from } from '../rxjsStub';
import {mergeMap, map} from  '../rxjsStub';
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

import { AggregatedActivityApiRequestFactory, AggregatedActivityApiResponseProcessor} from "../apis/AggregatedActivityApi";
export class ObservableAggregatedActivityApi {
    private requestFactory: AggregatedActivityApiRequestFactory;
    private responseProcessor: AggregatedActivityApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: AggregatedActivityApiRequestFactory,
        responseProcessor?: AggregatedActivityApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new AggregatedActivityApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new AggregatedActivityApiResponseProcessor();
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
    public getAggregatedActivityWithHttpInfo(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'primary_purchases_count' | 'primary_purchases_value' | 'secondary_purchases_count' | 'secondary_purchases_value' | 'sales_count' | 'sales_value' | 'transfers_in' | 'transfers_out' | 'airdrops' | 'burns', search?: string, content?: 'Memes' | 'Gradient' | 'MemeLab' | 'NextGen', season?: number, collector?: 'All' | 'Memes' | 'Meme SZN Set' | 'Genesis Set' | 'Gradient' | 'MemeLab' | 'NextGen', _options?: Configuration): Observable<HttpInfo<Array<ApiAggregatedActivityPage>>> {
        const requestContextPromise = this.requestFactory.getAggregatedActivity(pageSize, page, sortDirection, sort, search, content, season, collector, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getAggregatedActivityWithHttpInfo(rsp)));
            }));
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
    public getAggregatedActivity(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'primary_purchases_count' | 'primary_purchases_value' | 'secondary_purchases_count' | 'secondary_purchases_value' | 'sales_count' | 'sales_value' | 'transfers_in' | 'transfers_out' | 'airdrops' | 'burns', search?: string, content?: 'Memes' | 'Gradient' | 'MemeLab' | 'NextGen', season?: number, collector?: 'All' | 'Memes' | 'Meme SZN Set' | 'Genesis Set' | 'Gradient' | 'MemeLab' | 'NextGen', _options?: Configuration): Observable<Array<ApiAggregatedActivityPage>> {
        return this.getAggregatedActivityWithHttpInfo(pageSize, page, sortDirection, sort, search, content, season, collector, _options).pipe(map((apiResponse: HttpInfo<Array<ApiAggregatedActivityPage>>) => apiResponse.data));
    }

    /**
     * Get aggregated activity by consolidation key.
     * @param consolidationKey
     */
    public getAggregatedActivityByConsolidationKeyWithHttpInfo(consolidationKey: string, _options?: Configuration): Observable<HttpInfo<ApiAggregatedActivity>> {
        const requestContextPromise = this.requestFactory.getAggregatedActivityByConsolidationKey(consolidationKey, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getAggregatedActivityByConsolidationKeyWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get aggregated activity by consolidation key.
     * @param consolidationKey
     */
    public getAggregatedActivityByConsolidationKey(consolidationKey: string, _options?: Configuration): Observable<ApiAggregatedActivity> {
        return this.getAggregatedActivityByConsolidationKeyWithHttpInfo(consolidationKey, _options).pipe(map((apiResponse: HttpInfo<ApiAggregatedActivity>) => apiResponse.data));
    }

    /**
     * Get memes aggregated activity by consolidation key per season.
     * @param consolidationKey
     */
    public getMemesAggregatedActivityByConsolidationKeyWithHttpInfo(consolidationKey: string, _options?: Configuration): Observable<HttpInfo<Array<ApiAggregatedActivityMemes>>> {
        const requestContextPromise = this.requestFactory.getMemesAggregatedActivityByConsolidationKey(consolidationKey, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getMemesAggregatedActivityByConsolidationKeyWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get memes aggregated activity by consolidation key per season.
     * @param consolidationKey
     */
    public getMemesAggregatedActivityByConsolidationKey(consolidationKey: string, _options?: Configuration): Observable<Array<ApiAggregatedActivityMemes>> {
        return this.getMemesAggregatedActivityByConsolidationKeyWithHttpInfo(consolidationKey, _options).pipe(map((apiResponse: HttpInfo<Array<ApiAggregatedActivityMemes>>) => apiResponse.data));
    }

}

import { AuthenticationApiRequestFactory, AuthenticationApiResponseProcessor} from "../apis/AuthenticationApi";
export class ObservableAuthenticationApi {
    private requestFactory: AuthenticationApiRequestFactory;
    private responseProcessor: AuthenticationApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: AuthenticationApiRequestFactory,
        responseProcessor?: AuthenticationApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new AuthenticationApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new AuthenticationApiResponseProcessor();
    }

    /**
     * Authenticate and get JWT token
     * @param signerAddress Your wallet address
     * @param apiLoginRequest
     */
    public getAuthTokenWithHttpInfo(signerAddress: string, apiLoginRequest: ApiLoginRequest, _options?: Configuration): Observable<HttpInfo<ApiLoginResponse>> {
        const requestContextPromise = this.requestFactory.getAuthToken(signerAddress, apiLoginRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getAuthTokenWithHttpInfo(rsp)));
            }));
    }

    /**
     * Authenticate and get JWT token
     * @param signerAddress Your wallet address
     * @param apiLoginRequest
     */
    public getAuthToken(signerAddress: string, apiLoginRequest: ApiLoginRequest, _options?: Configuration): Observable<ApiLoginResponse> {
        return this.getAuthTokenWithHttpInfo(signerAddress, apiLoginRequest, _options).pipe(map((apiResponse: HttpInfo<ApiLoginResponse>) => apiResponse.data));
    }

    /**
     * Get a message to sign with your web3 wallet
     * @param signerAddress Your wallet address
     * @param [shortNonce] If true, the nonce will be shorter and easier to sign. Default is false.
     */
    public getNonceWithHttpInfo(signerAddress: string, shortNonce?: boolean, _options?: Configuration): Observable<HttpInfo<ApiNonceResponse>> {
        const requestContextPromise = this.requestFactory.getNonce(signerAddress, shortNonce, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getNonceWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get a message to sign with your web3 wallet
     * @param signerAddress Your wallet address
     * @param [shortNonce] If true, the nonce will be shorter and easier to sign. Default is false.
     */
    public getNonce(signerAddress: string, shortNonce?: boolean, _options?: Configuration): Observable<ApiNonceResponse> {
        return this.getNonceWithHttpInfo(signerAddress, shortNonce, _options).pipe(map((apiResponse: HttpInfo<ApiNonceResponse>) => apiResponse.data));
    }

    /**
     * Redeem refresh token
     * @param apiRedeemRefreshTokenRequest
     */
    public redeemRefreshTokenWithHttpInfo(apiRedeemRefreshTokenRequest: ApiRedeemRefreshTokenRequest, _options?: Configuration): Observable<HttpInfo<ApiRedeemRefreshTokenResponse>> {
        const requestContextPromise = this.requestFactory.redeemRefreshToken(apiRedeemRefreshTokenRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.redeemRefreshTokenWithHttpInfo(rsp)));
            }));
    }

    /**
     * Redeem refresh token
     * @param apiRedeemRefreshTokenRequest
     */
    public redeemRefreshToken(apiRedeemRefreshTokenRequest: ApiRedeemRefreshTokenRequest, _options?: Configuration): Observable<ApiRedeemRefreshTokenResponse> {
        return this.redeemRefreshTokenWithHttpInfo(apiRedeemRefreshTokenRequest, _options).pipe(map((apiResponse: HttpInfo<ApiRedeemRefreshTokenResponse>) => apiResponse.data));
    }

}

import { CollectedStatsApiRequestFactory, CollectedStatsApiResponseProcessor} from "../apis/CollectedStatsApi";
export class ObservableCollectedStatsApi {
    private requestFactory: CollectedStatsApiRequestFactory;
    private responseProcessor: CollectedStatsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: CollectedStatsApiRequestFactory,
        responseProcessor?: CollectedStatsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new CollectedStatsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new CollectedStatsApiResponseProcessor();
    }

    /**
     * Get consolidated collection stats for an identity
     * @param identityKey Profile handle, wallet address, or ENS name
     */
    public getCollectedStatsWithHttpInfo(identityKey: string, _options?: Configuration): Observable<HttpInfo<ApiCollectedStats>> {
        const requestContextPromise = this.requestFactory.getCollectedStats(identityKey, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getCollectedStatsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get consolidated collection stats for an identity
     * @param identityKey Profile handle, wallet address, or ENS name
     */
    public getCollectedStats(identityKey: string, _options?: Configuration): Observable<ApiCollectedStats> {
        return this.getCollectedStatsWithHttpInfo(identityKey, _options).pipe(map((apiResponse: HttpInfo<ApiCollectedStats>) => apiResponse.data));
    }

}

import { CommunityMembersApiRequestFactory, CommunityMembersApiResponseProcessor} from "../apis/CommunityMembersApi";
export class ObservableCommunityMembersApi {
    private requestFactory: CommunityMembersApiRequestFactory;
    private responseProcessor: CommunityMembersApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: CommunityMembersApiRequestFactory,
        responseProcessor?: CommunityMembersApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new CommunityMembersApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new CommunityMembersApiResponseProcessor();
    }

    /**
     * Get community members.
     * @param [onlyProfileOwners] Return only profile owners?
     * @param [param] Search param
     */
    public getCommunityMembersWithHttpInfo(onlyProfileOwners?: boolean, param?: string, _options?: Configuration): Observable<HttpInfo<Array<ApiCommunityMemberMinimal>>> {
        const requestContextPromise = this.requestFactory.getCommunityMembers(onlyProfileOwners, param, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getCommunityMembersWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get community members.
     * @param [onlyProfileOwners] Return only profile owners?
     * @param [param] Search param
     */
    public getCommunityMembers(onlyProfileOwners?: boolean, param?: string, _options?: Configuration): Observable<Array<ApiCommunityMemberMinimal>> {
        return this.getCommunityMembersWithHttpInfo(onlyProfileOwners, param, _options).pipe(map((apiResponse: HttpInfo<Array<ApiCommunityMemberMinimal>>) => apiResponse.data));
    }

    /**
     * Get top community members with pagination and sorting.
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [sort] Default is level
     * @param [groupId] Filter by group ID
     */
    public getTopCommunityMembersWithHttpInfo(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: ApiCommunityMembersSortOption, groupId?: string, _options?: Configuration): Observable<HttpInfo<ApiCommunityMembersPage>> {
        const requestContextPromise = this.requestFactory.getTopCommunityMembers(pageSize, page, sortDirection, sort, groupId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getTopCommunityMembersWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get top community members with pagination and sorting.
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [sort] Default is level
     * @param [groupId] Filter by group ID
     */
    public getTopCommunityMembers(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: ApiCommunityMembersSortOption, groupId?: string, _options?: Configuration): Observable<ApiCommunityMembersPage> {
        return this.getTopCommunityMembersWithHttpInfo(pageSize, page, sortDirection, sort, groupId, _options).pipe(map((apiResponse: HttpInfo<ApiCommunityMembersPage>) => apiResponse.data));
    }

}

import { CommunityMetricsApiRequestFactory, CommunityMetricsApiResponseProcessor} from "../apis/CommunityMetricsApi";
export class ObservableCommunityMetricsApi {
    private requestFactory: CommunityMetricsApiRequestFactory;
    private responseProcessor: CommunityMetricsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: CommunityMetricsApiRequestFactory,
        responseProcessor?: CommunityMetricsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new CommunityMetricsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new CommunityMetricsApiResponseProcessor();
    }

    /**
     * Get community metrics.
     * @param interval Metrics interval
     */
    public getCommunityMetricsWithHttpInfo(interval: 'DAY' | 'WEEK', _options?: Configuration): Observable<HttpInfo<ApiCommunityMetrics>> {
        const requestContextPromise = this.requestFactory.getCommunityMetrics(interval, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getCommunityMetricsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get community metrics.
     * @param interval Metrics interval
     */
    public getCommunityMetrics(interval: 'DAY' | 'WEEK', _options?: Configuration): Observable<ApiCommunityMetrics> {
        return this.getCommunityMetricsWithHttpInfo(interval, _options).pipe(map((apiResponse: HttpInfo<ApiCommunityMetrics>) => apiResponse.data));
    }

    /**
     * Get community metrics series.
     * @param since Unix millis timestamp for start of series.
     * @param to Unix millis timestamp for end of series.
     */
    public getCommunityMetricsSeriesWithHttpInfo(since: number, to: number, _options?: Configuration): Observable<HttpInfo<ApiCommunityMetricsSeries>> {
        const requestContextPromise = this.requestFactory.getCommunityMetricsSeries(since, to, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getCommunityMetricsSeriesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get community metrics series.
     * @param since Unix millis timestamp for start of series.
     * @param to Unix millis timestamp for end of series.
     */
    public getCommunityMetricsSeries(since: number, to: number, _options?: Configuration): Observable<ApiCommunityMetricsSeries> {
        return this.getCommunityMetricsSeriesWithHttpInfo(since, to, _options).pipe(map((apiResponse: HttpInfo<ApiCommunityMetricsSeries>) => apiResponse.data));
    }

    /**
     * Get community mint metrics.
     * @param [pageSize]
     * @param [page]
     * @param [sortDirection]
     * @param [sort]
     */
    public getCommunityMintMetricsWithHttpInfo(pageSize?: number, page?: number, sortDirection?: ApiPageSortDirection, sort?: 'mint_time', _options?: Configuration): Observable<HttpInfo<ApiMintMetricsPage>> {
        const requestContextPromise = this.requestFactory.getCommunityMintMetrics(pageSize, page, sortDirection, sort, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getCommunityMintMetricsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get community mint metrics.
     * @param [pageSize]
     * @param [page]
     * @param [sortDirection]
     * @param [sort]
     */
    public getCommunityMintMetrics(pageSize?: number, page?: number, sortDirection?: ApiPageSortDirection, sort?: 'mint_time', _options?: Configuration): Observable<ApiMintMetricsPage> {
        return this.getCommunityMintMetricsWithHttpInfo(pageSize, page, sortDirection, sort, _options).pipe(map((apiResponse: HttpInfo<ApiMintMetricsPage>) => apiResponse.data));
    }

}

import { DistributionsApiRequestFactory, DistributionsApiResponseProcessor} from "../apis/DistributionsApi";
export class ObservableDistributionsApi {
    private requestFactory: DistributionsApiRequestFactory;
    private responseProcessor: DistributionsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: DistributionsApiRequestFactory,
        responseProcessor?: DistributionsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new DistributionsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new DistributionsApiResponseProcessor();
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Complete multipart upload for distribution photo
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCompleteMultipartUploadRequest
     */
    public completeDistributionPhotoMultipartUploadWithHttpInfo(contract: string, nftId: number, apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Observable<HttpInfo<ApiCompleteMultipartUploadResponse>> {
        const requestContextPromise = this.requestFactory.completeDistributionPhotoMultipartUpload(contract, nftId, apiCompleteMultipartUploadRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.completeDistributionPhotoMultipartUploadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Complete multipart upload for distribution photo
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCompleteMultipartUploadRequest
     */
    public completeDistributionPhotoMultipartUpload(contract: string, nftId: number, apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Observable<ApiCompleteMultipartUploadResponse> {
        return this.completeDistributionPhotoMultipartUploadWithHttpInfo(contract, nftId, apiCompleteMultipartUploadRequest, _options).pipe(map((apiResponse: HttpInfo<ApiCompleteMultipartUploadResponse>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin. Replaces all existing photos for the card.
     * Save uploaded distribution photos to database
     * @param contract Contract address
     * @param nftId NFT ID
     * @param distributionPhotoCompleteRequest
     */
    public completeDistributionPhotosUploadWithHttpInfo(contract: string, nftId: number, distributionPhotoCompleteRequest: DistributionPhotoCompleteRequest, _options?: Configuration): Observable<HttpInfo<DistributionPhotoCompleteResponse>> {
        const requestContextPromise = this.requestFactory.completeDistributionPhotosUpload(contract, nftId, distributionPhotoCompleteRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.completeDistributionPhotosUploadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin. Replaces all existing photos for the card.
     * Save uploaded distribution photos to database
     * @param contract Contract address
     * @param nftId NFT ID
     * @param distributionPhotoCompleteRequest
     */
    public completeDistributionPhotosUpload(contract: string, nftId: number, distributionPhotoCompleteRequest: DistributionPhotoCompleteRequest, _options?: Configuration): Observable<DistributionPhotoCompleteResponse> {
        return this.completeDistributionPhotosUploadWithHttpInfo(contract, nftId, distributionPhotoCompleteRequest, _options).pipe(map((apiResponse: HttpInfo<DistributionPhotoCompleteResponse>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Start multipart upload for distribution photo
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCreateMediaUploadUrlRequest
     */
    public createDistributionPhotoMultipartUploadWithHttpInfo(contract: string, nftId: number, apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Observable<HttpInfo<ApiStartMultipartMediaUploadResponse>> {
        const requestContextPromise = this.requestFactory.createDistributionPhotoMultipartUpload(contract, nftId, apiCreateMediaUploadUrlRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createDistributionPhotoMultipartUploadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Start multipart upload for distribution photo
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCreateMediaUploadUrlRequest
     */
    public createDistributionPhotoMultipartUpload(contract: string, nftId: number, apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Observable<ApiStartMultipartMediaUploadResponse> {
        return this.createDistributionPhotoMultipartUploadWithHttpInfo(contract, nftId, apiCreateMediaUploadUrlRequest, _options).pipe(map((apiResponse: HttpInfo<ApiStartMultipartMediaUploadResponse>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned S3 URL for distribution photo upload
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCreateMediaUploadUrlRequest
     */
    public createDistributionPhotoUploadUrlWithHttpInfo(contract: string, nftId: number, apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Observable<HttpInfo<ApiCreateMediaUrlResponse>> {
        const requestContextPromise = this.requestFactory.createDistributionPhotoUploadUrl(contract, nftId, apiCreateMediaUploadUrlRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createDistributionPhotoUploadUrlWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned S3 URL for distribution photo upload
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiCreateMediaUploadUrlRequest
     */
    public createDistributionPhotoUploadUrl(contract: string, nftId: number, apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Observable<ApiCreateMediaUrlResponse> {
        return this.createDistributionPhotoUploadUrlWithHttpInfo(contract, nftId, apiCreateMediaUploadUrlRequest, _options).pipe(map((apiResponse: HttpInfo<ApiCreateMediaUrlResponse>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get distribution overview for a specific contract and card
     * @param contract Contract address
     * @param id Card ID
     */
    public getDistributionOverviewWithHttpInfo(contract: string, id: number, _options?: Configuration): Observable<HttpInfo<DistributionOverview>> {
        const requestContextPromise = this.requestFactory.getDistributionOverview(contract, id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDistributionOverviewWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get distribution overview for a specific contract and card
     * @param contract Contract address
     * @param id Card ID
     */
    public getDistributionOverview(contract: string, id: number, _options?: Configuration): Observable<DistributionOverview> {
        return this.getDistributionOverviewWithHttpInfo(contract, id, _options).pipe(map((apiResponse: HttpInfo<DistributionOverview>) => apiResponse.data));
    }

    /**
     * Get distribution phases for a specific contract and NFT
     * @param contract Contract address
     * @param nftId NFT ID
     */
    public getDistributionPhasesWithHttpInfo(contract: string, nftId: number, _options?: Configuration): Observable<HttpInfo<DistributionPhasesPage>> {
        const requestContextPromise = this.requestFactory.getDistributionPhases(contract, nftId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDistributionPhasesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get distribution phases for a specific contract and NFT
     * @param contract Contract address
     * @param nftId NFT ID
     */
    public getDistributionPhases(contract: string, nftId: number, _options?: Configuration): Observable<DistributionPhasesPage> {
        return this.getDistributionPhasesWithHttpInfo(contract, nftId, _options).pipe(map((apiResponse: HttpInfo<DistributionPhasesPage>) => apiResponse.data));
    }

    /**
     * Get distribution photos for a specific contract and NFT
     * @param contract Contract address
     * @param nftId NFT ID
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     */
    public getDistributionPhotosWithHttpInfo(contract: string, nftId: number, pageSize?: number, page?: number, _options?: Configuration): Observable<HttpInfo<DistributionPhotosPage>> {
        const requestContextPromise = this.requestFactory.getDistributionPhotos(contract, nftId, pageSize, page, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDistributionPhotosWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get distribution photos for a specific contract and NFT
     * @param contract Contract address
     * @param nftId NFT ID
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     */
    public getDistributionPhotos(contract: string, nftId: number, pageSize?: number, page?: number, _options?: Configuration): Observable<DistributionPhotosPage> {
        return this.getDistributionPhotosWithHttpInfo(contract, nftId, pageSize, page, _options).pipe(map((apiResponse: HttpInfo<DistributionPhotosPage>) => apiResponse.data));
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
    public getDistributionsWithHttpInfo(pageSize?: number, page?: number, search?: string, cardId?: string, contract?: string, wallet?: string, _options?: Configuration): Observable<HttpInfo<DistributionNormalizedPage>> {
        const requestContextPromise = this.requestFactory.getDistributions(pageSize, page, search, cardId, contract, wallet, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDistributionsWithHttpInfo(rsp)));
            }));
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
    public getDistributions(pageSize?: number, page?: number, search?: string, cardId?: string, contract?: string, wallet?: string, _options?: Configuration): Observable<DistributionNormalizedPage> {
        return this.getDistributionsWithHttpInfo(pageSize, page, search, cardId, contract, wallet, _options).pipe(map((apiResponse: HttpInfo<DistributionNormalizedPage>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned URL for multipart upload part
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiUploadPartOfMultipartUploadRequest
     */
    public uploadPartOfDistributionPhotoMultipartUploadWithHttpInfo(contract: string, nftId: number, apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Observable<HttpInfo<ApiUploadPartOfMultipartUploadResponse>> {
        const requestContextPromise = this.requestFactory.uploadPartOfDistributionPhotoMultipartUpload(contract, nftId, apiUploadPartOfMultipartUploadRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.uploadPartOfDistributionPhotoMultipartUploadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated as a Subscription Admin
     * Get presigned URL for multipart upload part
     * @param contract Contract address
     * @param nftId NFT ID
     * @param apiUploadPartOfMultipartUploadRequest
     */
    public uploadPartOfDistributionPhotoMultipartUpload(contract: string, nftId: number, apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Observable<ApiUploadPartOfMultipartUploadResponse> {
        return this.uploadPartOfDistributionPhotoMultipartUploadWithHttpInfo(contract, nftId, apiUploadPartOfMultipartUploadRequest, _options).pipe(map((apiResponse: HttpInfo<ApiUploadPartOfMultipartUploadResponse>) => apiResponse.data));
    }

}

import { DropsApiRequestFactory, DropsApiResponseProcessor} from "../apis/DropsApi";
export class ObservableDropsApi {
    private requestFactory: DropsApiRequestFactory;
    private responseProcessor: DropsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: DropsApiRequestFactory,
        responseProcessor?: DropsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new DropsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new DropsApiResponseProcessor();
    }

    /**
     * Mark a drop as curated by authenticated user
     * @param dropId
     */
    public addDropCurationWithHttpInfo(dropId: string, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.addDropCuration(dropId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.addDropCurationWithHttpInfo(rsp)));
            }));
    }

    /**
     * Mark a drop as curated by authenticated user
     * @param dropId
     */
    public addDropCuration(dropId: string, _options?: Configuration): Observable<void> {
        return this.addDropCurationWithHttpInfo(dropId, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Bookmark a drop
     * @param dropId
     */
    public bookmarkDropWithHttpInfo(dropId: string, _options?: Configuration): Observable<HttpInfo<ApiDrop>> {
        const requestContextPromise = this.requestFactory.bookmarkDrop(dropId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.bookmarkDropWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Bookmark a drop
     * @param dropId
     */
    public bookmarkDrop(dropId: string, _options?: Configuration): Observable<ApiDrop> {
        return this.bookmarkDropWithHttpInfo(dropId, _options).pipe(map((apiResponse: HttpInfo<ApiDrop>) => apiResponse.data));
    }

    /**
     * Boost drop
     * @param dropId
     */
    public boostDropWithHttpInfo(dropId: string, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.boostDrop(dropId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.boostDropWithHttpInfo(rsp)));
            }));
    }

    /**
     * Boost drop
     * @param dropId
     */
    public boostDrop(dropId: string, _options?: Configuration): Observable<void> {
        return this.boostDropWithHttpInfo(dropId, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param apiCompleteMultipartUploadRequest
     */
    public completeDropMultipartUploadWithHttpInfo(apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Observable<HttpInfo<ApiCompleteMultipartUploadResponse>> {
        const requestContextPromise = this.requestFactory.completeDropMultipartUpload(apiCompleteMultipartUploadRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.completeDropMultipartUploadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param apiCompleteMultipartUploadRequest
     */
    public completeDropMultipartUpload(apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Observable<ApiCompleteMultipartUploadResponse> {
        return this.completeDropMultipartUploadWithHttpInfo(apiCompleteMultipartUploadRequest, _options).pipe(map((apiResponse: HttpInfo<ApiCompleteMultipartUploadResponse>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param apiCompleteMultipartUploadRequest
     */
    public completeWaveMultipartUploadWithHttpInfo(apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Observable<HttpInfo<ApiCompleteMultipartUploadResponse>> {
        const requestContextPromise = this.requestFactory.completeWaveMultipartUpload(apiCompleteMultipartUploadRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.completeWaveMultipartUploadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Complete the multipart upload
     * @param apiCompleteMultipartUploadRequest
     */
    public completeWaveMultipartUpload(apiCompleteMultipartUploadRequest: ApiCompleteMultipartUploadRequest, _options?: Configuration): Observable<ApiCompleteMultipartUploadResponse> {
        return this.completeWaveMultipartUploadWithHttpInfo(apiCompleteMultipartUploadRequest, _options).pipe(map((apiResponse: HttpInfo<ApiCompleteMultipartUploadResponse>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Create a drop
     * @param apiCreateDropRequest
     */
    public createDropWithHttpInfo(apiCreateDropRequest: ApiCreateDropRequest, _options?: Configuration): Observable<HttpInfo<ApiDrop>> {
        const requestContextPromise = this.requestFactory.createDrop(apiCreateDropRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createDropWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Create a drop
     * @param apiCreateDropRequest
     */
    public createDrop(apiCreateDropRequest: ApiCreateDropRequest, _options?: Configuration): Observable<ApiDrop> {
        return this.createDropWithHttpInfo(apiCreateDropRequest, _options).pipe(map((apiResponse: HttpInfo<ApiDrop>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for drop media upload
     * @param apiCreateMediaUploadUrlRequest
     */
    public createDropMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Observable<HttpInfo<ApiCreateMediaUrlResponse>> {
        const requestContextPromise = this.requestFactory.createDropMediaUrl(apiCreateMediaUploadUrlRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createDropMediaUrlWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for drop media upload
     * @param apiCreateMediaUploadUrlRequest
     */
    public createDropMediaUrl(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Observable<ApiCreateMediaUrlResponse> {
        return this.createDropMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest, _options).pipe(map((apiResponse: HttpInfo<ApiCreateMediaUrlResponse>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param apiCreateMediaUploadUrlRequest
     */
    public createMultipartDropMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Observable<HttpInfo<ApiStartMultipartMediaUploadResponse>> {
        const requestContextPromise = this.requestFactory.createMultipartDropMediaUrl(apiCreateMediaUploadUrlRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createMultipartDropMediaUrlWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param apiCreateMediaUploadUrlRequest
     */
    public createMultipartDropMediaUrl(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Observable<ApiStartMultipartMediaUploadResponse> {
        return this.createMultipartDropMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest, _options).pipe(map((apiResponse: HttpInfo<ApiStartMultipartMediaUploadResponse>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param apiCreateMediaUploadUrlRequest
     */
    public createMultipartWaveMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Observable<HttpInfo<ApiStartMultipartMediaUploadResponse>> {
        const requestContextPromise = this.requestFactory.createMultipartWaveMediaUrl(apiCreateMediaUploadUrlRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createMultipartWaveMediaUrlWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Get upload ID and key for multipart upload
     * @param apiCreateMediaUploadUrlRequest
     */
    public createMultipartWaveMediaUrl(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Observable<ApiStartMultipartMediaUploadResponse> {
        return this.createMultipartWaveMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest, _options).pipe(map((apiResponse: HttpInfo<ApiStartMultipartMediaUploadResponse>) => apiResponse.data));
    }

    /**
     * Delete drop boost
     * @param dropId
     */
    public deleteDropBoostWithHttpInfo(dropId: string, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.deleteDropBoost(dropId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteDropBoostWithHttpInfo(rsp)));
            }));
    }

    /**
     * Delete drop boost
     * @param dropId
     */
    public deleteDropBoost(dropId: string, _options?: Configuration): Observable<void> {
        return this.deleteDropBoostWithHttpInfo(dropId, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Delete drop by ID
     * @param dropId
     */
    public deleteDropByIdWithHttpInfo(dropId: string, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.deleteDropById(dropId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteDropByIdWithHttpInfo(rsp)));
            }));
    }

    /**
     * Delete drop by ID
     * @param dropId
     */
    public deleteDropById(dropId: string, _options?: Configuration): Observable<void> {
        return this.deleteDropByIdWithHttpInfo(dropId, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated. Returns drops bookmarked by the current user, sorted by bookmark time.
     * Get bookmarked drops for authenticated user
     * @param [waveId] Filter by wave
     * @param [page]
     * @param [pageSize]
     * @param [sortDirection] Default is DESC (newest bookmarks first)
     */
    public getBookmarkedDropsWithHttpInfo(waveId?: string, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, _options?: Configuration): Observable<HttpInfo<ApiDropsPage>> {
        const requestContextPromise = this.requestFactory.getBookmarkedDrops(waveId, page, pageSize, sortDirection, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getBookmarkedDropsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated. Returns drops bookmarked by the current user, sorted by bookmark time.
     * Get bookmarked drops for authenticated user
     * @param [waveId] Filter by wave
     * @param [page]
     * @param [pageSize]
     * @param [sortDirection] Default is DESC (newest bookmarks first)
     */
    public getBookmarkedDrops(waveId?: string, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, _options?: Configuration): Observable<ApiDropsPage> {
        return this.getBookmarkedDropsWithHttpInfo(waveId, page, pageSize, sortDirection, _options).pipe(map((apiResponse: HttpInfo<ApiDropsPage>) => apiResponse.data));
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
    public getBoostedDropsWithHttpInfo(author?: string, booster?: string, waveId?: string, minBoosts?: number, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, sort?: 'last_boosted_at' | 'first_boosted_at' | 'drop_created_at' | 'boosts', countOnlyBoostsAfter?: number, _options?: Configuration): Observable<HttpInfo<ApiDropsPage>> {
        const requestContextPromise = this.requestFactory.getBoostedDrops(author, booster, waveId, minBoosts, page, pageSize, sortDirection, sort, countOnlyBoostsAfter, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getBoostedDropsWithHttpInfo(rsp)));
            }));
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
    public getBoostedDrops(author?: string, booster?: string, waveId?: string, minBoosts?: number, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, sort?: 'last_boosted_at' | 'first_boosted_at' | 'drop_created_at' | 'boosts', countOnlyBoostsAfter?: number, _options?: Configuration): Observable<ApiDropsPage> {
        return this.getBoostedDropsWithHttpInfo(author, booster, waveId, minBoosts, page, pageSize, sortDirection, sort, countOnlyBoostsAfter, _options).pipe(map((apiResponse: HttpInfo<ApiDropsPage>) => apiResponse.data));
    }

    /**
     * Get drop boosts by Drop ID.
     * @param dropId
     * @param [pageSize]
     * @param [page]
     * @param [sortDirection] Default is DESC
     * @param [sort] Default is boosted_at
     */
    public getDropBoostsByIdWithHttpInfo(dropId: string, pageSize?: number, page?: number, sortDirection?: ApiPageSortDirection, sort?: 'boosted_at', _options?: Configuration): Observable<HttpInfo<ApiDropBoostsPage>> {
        const requestContextPromise = this.requestFactory.getDropBoostsById(dropId, pageSize, page, sortDirection, sort, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDropBoostsByIdWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get drop boosts by Drop ID.
     * @param dropId
     * @param [pageSize]
     * @param [page]
     * @param [sortDirection] Default is DESC
     * @param [sort] Default is boosted_at
     */
    public getDropBoostsById(dropId: string, pageSize?: number, page?: number, sortDirection?: ApiPageSortDirection, sort?: 'boosted_at', _options?: Configuration): Observable<ApiDropBoostsPage> {
        return this.getDropBoostsByIdWithHttpInfo(dropId, pageSize, page, sortDirection, sort, _options).pipe(map((apiResponse: HttpInfo<ApiDropBoostsPage>) => apiResponse.data));
    }

    /**
     * Get drop by ID.
     * @param dropId
     */
    public getDropByIdWithHttpInfo(dropId: string, _options?: Configuration): Observable<HttpInfo<ApiDrop>> {
        const requestContextPromise = this.requestFactory.getDropById(dropId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDropByIdWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get drop by ID.
     * @param dropId
     */
    public getDropById(dropId: string, _options?: Configuration): Observable<ApiDrop> {
        return this.getDropByIdWithHttpInfo(dropId, _options).pipe(map((apiResponse: HttpInfo<ApiDrop>) => apiResponse.data));
    }

    /**
     * Get identities who curated a drop
     * @param dropId
     * @param [page]
     * @param [pageSize]
     * @param [sortDirection] Default is DESC
     */
    public getDropCuratorsWithHttpInfo(dropId: string, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, _options?: Configuration): Observable<HttpInfo<ApiProfileMinsPage>> {
        const requestContextPromise = this.requestFactory.getDropCurators(dropId, page, pageSize, sortDirection, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDropCuratorsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get identities who curated a drop
     * @param dropId
     * @param [page]
     * @param [pageSize]
     * @param [sortDirection] Default is DESC
     */
    public getDropCurators(dropId: string, page?: number, pageSize?: number, sortDirection?: ApiPageSortDirection, _options?: Configuration): Observable<ApiProfileMinsPage> {
        return this.getDropCuratorsWithHttpInfo(dropId, page, pageSize, sortDirection, _options).pipe(map((apiResponse: HttpInfo<ApiProfileMinsPage>) => apiResponse.data));
    }

    /**
     * Get drop IDs in wave by serial range.
     * @param waveId Drops in wave with given ID
     * @param minSerialNo
     * @param [maxSerialNo]
     * @param [limit] How many IDs to return (100 by default)
     */
    public getDropIdsWithHttpInfo(waveId: string, minSerialNo: number, maxSerialNo?: number, limit?: number, _options?: Configuration): Observable<HttpInfo<Array<ApiDropId>>> {
        const requestContextPromise = this.requestFactory.getDropIds(waveId, minSerialNo, maxSerialNo, limit, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDropIdsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get drop IDs in wave by serial range.
     * @param waveId Drops in wave with given ID
     * @param minSerialNo
     * @param [maxSerialNo]
     * @param [limit] How many IDs to return (100 by default)
     */
    public getDropIds(waveId: string, minSerialNo: number, maxSerialNo?: number, limit?: number, _options?: Configuration): Observable<Array<ApiDropId>> {
        return this.getDropIdsWithHttpInfo(waveId, minSerialNo, maxSerialNo, limit, _options).pipe(map((apiResponse: HttpInfo<Array<ApiDropId>>) => apiResponse.data));
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
    public getLatestDropsWithHttpInfo(limit?: number, author?: string, groupId?: string, waveId?: string, serialNoLessThan?: number, includeReplies?: boolean, dropType?: ApiDropType, ids?: string, containsMedia?: boolean, _options?: Configuration): Observable<HttpInfo<Array<ApiDrop>>> {
        const requestContextPromise = this.requestFactory.getLatestDrops(limit, author, groupId, waveId, serialNoLessThan, includeReplies, dropType, ids, containsMedia, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getLatestDropsWithHttpInfo(rsp)));
            }));
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
    public getLatestDrops(limit?: number, author?: string, groupId?: string, waveId?: string, serialNoLessThan?: number, includeReplies?: boolean, dropType?: ApiDropType, ids?: string, containsMedia?: boolean, _options?: Configuration): Observable<Array<ApiDrop>> {
        return this.getLatestDropsWithHttpInfo(limit, author, groupId, waveId, serialNoLessThan, includeReplies, dropType, ids, containsMedia, _options).pipe(map((apiResponse: HttpInfo<Array<ApiDrop>>) => apiResponse.data));
    }

    /**
     * Get light drops
     * @param limit
     * @param waveId Drops in wave with given ID
     * @param [maxSerialNo] Latest message if null
     */
    public getLightDropsWithHttpInfo(limit: number, waveId: string, maxSerialNo?: number, _options?: Configuration): Observable<HttpInfo<Array<ApiLightDrop>>> {
        const requestContextPromise = this.requestFactory.getLightDrops(limit, waveId, maxSerialNo, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getLightDropsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get light drops
     * @param limit
     * @param waveId Drops in wave with given ID
     * @param [maxSerialNo] Latest message if null
     */
    public getLightDrops(limit: number, waveId: string, maxSerialNo?: number, _options?: Configuration): Observable<Array<ApiLightDrop>> {
        return this.getLightDropsWithHttpInfo(limit, waveId, maxSerialNo, _options).pipe(map((apiResponse: HttpInfo<Array<ApiLightDrop>>) => apiResponse.data));
    }

    /**
     * Sets the user\"s latest_read_timestamp to just before this drop\"s created_at, making this drop and all newer drops unread.
     * Mark a drop and all subsequent drops in the wave as unread
     * @param dropId
     */
    public markDropUnreadWithHttpInfo(dropId: string, _options?: Configuration): Observable<HttpInfo<ApiMarkDropUnreadResponse>> {
        const requestContextPromise = this.requestFactory.markDropUnread(dropId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.markDropUnreadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Sets the user\"s latest_read_timestamp to just before this drop\"s created_at, making this drop and all newer drops unread.
     * Mark a drop and all subsequent drops in the wave as unread
     * @param dropId
     */
    public markDropUnread(dropId: string, _options?: Configuration): Observable<ApiMarkDropUnreadResponse> {
        return this.markDropUnreadWithHttpInfo(dropId, _options).pipe(map((apiResponse: HttpInfo<ApiMarkDropUnreadResponse>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Rate a drop
     * @param dropId
     * @param apiDropRatingRequest
     */
    public rateDropWithHttpInfo(dropId: string, apiDropRatingRequest: ApiDropRatingRequest, _options?: Configuration): Observable<HttpInfo<ApiDrop>> {
        const requestContextPromise = this.requestFactory.rateDrop(dropId, apiDropRatingRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.rateDropWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Rate a drop
     * @param dropId
     * @param apiDropRatingRequest
     */
    public rateDrop(dropId: string, apiDropRatingRequest: ApiDropRatingRequest, _options?: Configuration): Observable<ApiDrop> {
        return this.rateDropWithHttpInfo(dropId, apiDropRatingRequest, _options).pipe(map((apiResponse: HttpInfo<ApiDrop>) => apiResponse.data));
    }

    /**
     * React to a drop
     * @param dropId
     * @param apiAddReactionToDropRequest
     */
    public reactToDropWithHttpInfo(dropId: string, apiAddReactionToDropRequest: ApiAddReactionToDropRequest, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.reactToDrop(dropId, apiAddReactionToDropRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.reactToDropWithHttpInfo(rsp)));
            }));
    }

    /**
     * React to a drop
     * @param dropId
     * @param apiAddReactionToDropRequest
     */
    public reactToDrop(dropId: string, apiAddReactionToDropRequest: ApiAddReactionToDropRequest, _options?: Configuration): Observable<void> {
        return this.reactToDropWithHttpInfo(dropId, apiAddReactionToDropRequest, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Remove authenticated user\"s curation from a drop
     * @param dropId
     */
    public removeDropCurationWithHttpInfo(dropId: string, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.removeDropCuration(dropId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.removeDropCurationWithHttpInfo(rsp)));
            }));
    }

    /**
     * Remove authenticated user\"s curation from a drop
     * @param dropId
     */
    public removeDropCuration(dropId: string, _options?: Configuration): Observable<void> {
        return this.removeDropCurationWithHttpInfo(dropId, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Remove reaction from a drop
     * @param dropId
     * @param apiAddReactionToDropRequest
     */
    public removeReactionFromDropWithHttpInfo(dropId: string, apiAddReactionToDropRequest: ApiAddReactionToDropRequest, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.removeReactionFromDrop(dropId, apiAddReactionToDropRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.removeReactionFromDropWithHttpInfo(rsp)));
            }));
    }

    /**
     * Remove reaction from a drop
     * @param dropId
     * @param apiAddReactionToDropRequest
     */
    public removeReactionFromDrop(dropId: string, apiAddReactionToDropRequest: ApiAddReactionToDropRequest, _options?: Configuration): Observable<void> {
        return this.removeReactionFromDropWithHttpInfo(dropId, apiAddReactionToDropRequest, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Subscribe authenticated user to drop actions.
     * @param dropId
     * @param apiDropSubscriptionActions
     */
    public subscribeToDropActionsWithHttpInfo(dropId: string, apiDropSubscriptionActions: ApiDropSubscriptionActions, _options?: Configuration): Observable<HttpInfo<ApiDropSubscriptionActions>> {
        const requestContextPromise = this.requestFactory.subscribeToDropActions(dropId, apiDropSubscriptionActions, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.subscribeToDropActionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Subscribe authenticated user to drop actions.
     * @param dropId
     * @param apiDropSubscriptionActions
     */
    public subscribeToDropActions(dropId: string, apiDropSubscriptionActions: ApiDropSubscriptionActions, _options?: Configuration): Observable<ApiDropSubscriptionActions> {
        return this.subscribeToDropActionsWithHttpInfo(dropId, apiDropSubscriptionActions, _options).pipe(map((apiResponse: HttpInfo<ApiDropSubscriptionActions>) => apiResponse.data));
    }

    /**
     * Toggles (flips) hide_link_preview for a drop. Only the author can call this endpoint.
     * Toggle hide link preview for a drop
     * @param dropId
     */
    public toggleHideLinkPreviewWithHttpInfo(dropId: string, _options?: Configuration): Observable<HttpInfo<ApiDrop>> {
        const requestContextPromise = this.requestFactory.toggleHideLinkPreview(dropId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.toggleHideLinkPreviewWithHttpInfo(rsp)));
            }));
    }

    /**
     * Toggles (flips) hide_link_preview for a drop. Only the author can call this endpoint.
     * Toggle hide link preview for a drop
     * @param dropId
     */
    public toggleHideLinkPreview(dropId: string, _options?: Configuration): Observable<ApiDrop> {
        return this.toggleHideLinkPreviewWithHttpInfo(dropId, _options).pipe(map((apiResponse: HttpInfo<ApiDrop>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Remove bookmark from drop
     * @param dropId
     */
    public unbookmarkDropWithHttpInfo(dropId: string, _options?: Configuration): Observable<HttpInfo<ApiDrop>> {
        const requestContextPromise = this.requestFactory.unbookmarkDrop(dropId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.unbookmarkDropWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Remove bookmark from drop
     * @param dropId
     */
    public unbookmarkDrop(dropId: string, _options?: Configuration): Observable<ApiDrop> {
        return this.unbookmarkDropWithHttpInfo(dropId, _options).pipe(map((apiResponse: HttpInfo<ApiDrop>) => apiResponse.data));
    }

    /**
     * Unsubscribe authenticated user from drop actions.
     * @param dropId
     * @param apiDropSubscriptionActions
     */
    public unsubscribeFromDropActionsWithHttpInfo(dropId: string, apiDropSubscriptionActions: ApiDropSubscriptionActions, _options?: Configuration): Observable<HttpInfo<ApiDropSubscriptionActions>> {
        const requestContextPromise = this.requestFactory.unsubscribeFromDropActions(dropId, apiDropSubscriptionActions, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.unsubscribeFromDropActionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Unsubscribe authenticated user from drop actions.
     * @param dropId
     * @param apiDropSubscriptionActions
     */
    public unsubscribeFromDropActions(dropId: string, apiDropSubscriptionActions: ApiDropSubscriptionActions, _options?: Configuration): Observable<ApiDropSubscriptionActions> {
        return this.unsubscribeFromDropActionsWithHttpInfo(dropId, apiDropSubscriptionActions, _options).pipe(map((apiResponse: HttpInfo<ApiDropSubscriptionActions>) => apiResponse.data));
    }

    /**
     * Update drop by ID
     * @param dropId
     * @param apiUpdateDropRequest
     */
    public updateDropByIdWithHttpInfo(dropId: string, apiUpdateDropRequest: ApiUpdateDropRequest, _options?: Configuration): Observable<HttpInfo<ApiDrop>> {
        const requestContextPromise = this.requestFactory.updateDropById(dropId, apiUpdateDropRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateDropByIdWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update drop by ID
     * @param dropId
     * @param apiUpdateDropRequest
     */
    public updateDropById(dropId: string, apiUpdateDropRequest: ApiUpdateDropRequest, _options?: Configuration): Observable<ApiDrop> {
        return this.updateDropByIdWithHttpInfo(dropId, apiUpdateDropRequest, _options).pipe(map((apiResponse: HttpInfo<ApiDrop>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param apiUploadPartOfMultipartUploadRequest
     */
    public uploadPartOfDropMultipartUploadWithHttpInfo(apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Observable<HttpInfo<ApiUploadPartOfMultipartUploadResponse>> {
        const requestContextPromise = this.requestFactory.uploadPartOfDropMultipartUpload(apiUploadPartOfMultipartUploadRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.uploadPartOfDropMultipartUploadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param apiUploadPartOfMultipartUploadRequest
     */
    public uploadPartOfDropMultipartUpload(apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Observable<ApiUploadPartOfMultipartUploadResponse> {
        return this.uploadPartOfDropMultipartUploadWithHttpInfo(apiUploadPartOfMultipartUploadRequest, _options).pipe(map((apiResponse: HttpInfo<ApiUploadPartOfMultipartUploadResponse>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param apiUploadPartOfMultipartUploadRequest
     */
    public uploadPartOfWaveMultipartUploadWithHttpInfo(apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Observable<HttpInfo<ApiUploadPartOfMultipartUploadResponse>> {
        const requestContextPromise = this.requestFactory.uploadPartOfWaveMultipartUpload(apiUploadPartOfMultipartUploadRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.uploadPartOfWaveMultipartUploadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Upload a part of multipart upload
     * @param apiUploadPartOfMultipartUploadRequest
     */
    public uploadPartOfWaveMultipartUpload(apiUploadPartOfMultipartUploadRequest: ApiUploadPartOfMultipartUploadRequest, _options?: Configuration): Observable<ApiUploadPartOfMultipartUploadResponse> {
        return this.uploadPartOfWaveMultipartUploadWithHttpInfo(apiUploadPartOfMultipartUploadRequest, _options).pipe(map((apiResponse: HttpInfo<ApiUploadPartOfMultipartUploadResponse>) => apiResponse.data));
    }

}

import { FeedApiRequestFactory, FeedApiResponseProcessor} from "../apis/FeedApi";
export class ObservableFeedApi {
    private requestFactory: FeedApiRequestFactory;
    private responseProcessor: FeedApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: FeedApiRequestFactory,
        responseProcessor?: FeedApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new FeedApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new FeedApiResponseProcessor();
    }

    /**
     * Get feed
     * @param [serialNoLessThan] Used to find older items
     */
    public getFeedWithHttpInfo(serialNoLessThan?: number, _options?: Configuration): Observable<HttpInfo<Array<ApiFeedItem>>> {
        const requestContextPromise = this.requestFactory.getFeed(serialNoLessThan, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getFeedWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get feed
     * @param [serialNoLessThan] Used to find older items
     */
    public getFeed(serialNoLessThan?: number, _options?: Configuration): Observable<Array<ApiFeedItem>> {
        return this.getFeedWithHttpInfo(serialNoLessThan, _options).pipe(map((apiResponse: HttpInfo<Array<ApiFeedItem>>) => apiResponse.data));
    }

}

import { GroupsApiRequestFactory, GroupsApiResponseProcessor} from "../apis/GroupsApi";
export class ObservableGroupsApi {
    private requestFactory: GroupsApiRequestFactory;
    private responseProcessor: GroupsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: GroupsApiRequestFactory,
        responseProcessor?: GroupsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new GroupsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new GroupsApiResponseProcessor();
    }

    /**
     * Change group visibility
     * @param id
     * @param apiChangeGroupVisibility
     */
    public changeGroupVisibilityWithHttpInfo(id: string, apiChangeGroupVisibility: ApiChangeGroupVisibility, _options?: Configuration): Observable<HttpInfo<ApiGroupFull>> {
        const requestContextPromise = this.requestFactory.changeGroupVisibility(id, apiChangeGroupVisibility, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.changeGroupVisibilityWithHttpInfo(rsp)));
            }));
    }

    /**
     * Change group visibility
     * @param id
     * @param apiChangeGroupVisibility
     */
    public changeGroupVisibility(id: string, apiChangeGroupVisibility: ApiChangeGroupVisibility, _options?: Configuration): Observable<ApiGroupFull> {
        return this.changeGroupVisibilityWithHttpInfo(id, apiChangeGroupVisibility, _options).pipe(map((apiResponse: HttpInfo<ApiGroupFull>) => apiResponse.data));
    }

    /**
     * Create a group
     * @param apiCreateGroup
     */
    public createGroupWithHttpInfo(apiCreateGroup: ApiCreateGroup, _options?: Configuration): Observable<HttpInfo<ApiGroupFull>> {
        const requestContextPromise = this.requestFactory.createGroup(apiCreateGroup, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createGroupWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create a group
     * @param apiCreateGroup
     */
    public createGroup(apiCreateGroup: ApiCreateGroup, _options?: Configuration): Observable<ApiGroupFull> {
        return this.createGroupWithHttpInfo(apiCreateGroup, _options).pipe(map((apiResponse: HttpInfo<ApiGroupFull>) => apiResponse.data));
    }

    /**
     * Get identity groups identities. Identities are represented as primary wallet addresses
     * @param id
     * @param identityGroupId
     */
    public getIdentityGroupIdentitiesWithHttpInfo(id: string, identityGroupId: string, _options?: Configuration): Observable<HttpInfo<Array<string>>> {
        const requestContextPromise = this.requestFactory.getIdentityGroupIdentities(id, identityGroupId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getIdentityGroupIdentitiesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get identity groups identities. Identities are represented as primary wallet addresses
     * @param id
     * @param identityGroupId
     */
    public getIdentityGroupIdentities(id: string, identityGroupId: string, _options?: Configuration): Observable<Array<string>> {
        return this.getIdentityGroupIdentitiesWithHttpInfo(id, identityGroupId, _options).pipe(map((apiResponse: HttpInfo<Array<string>>) => apiResponse.data));
    }

    /**
     * Search for user groups
     * @param [groupName] Partial or full name
     * @param [authorIdentity] Group author identity
     * @param [createdAtLessThan] created at date less than
     */
    public searchUserGroupsWithHttpInfo(groupName?: string, authorIdentity?: string, createdAtLessThan?: number, _options?: Configuration): Observable<HttpInfo<Array<ApiGroupFull>>> {
        const requestContextPromise = this.requestFactory.searchUserGroups(groupName, authorIdentity, createdAtLessThan, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.searchUserGroupsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Search for user groups
     * @param [groupName] Partial or full name
     * @param [authorIdentity] Group author identity
     * @param [createdAtLessThan] created at date less than
     */
    public searchUserGroups(groupName?: string, authorIdentity?: string, createdAtLessThan?: number, _options?: Configuration): Observable<Array<ApiGroupFull>> {
        return this.searchUserGroupsWithHttpInfo(groupName, authorIdentity, createdAtLessThan, _options).pipe(map((apiResponse: HttpInfo<Array<ApiGroupFull>>) => apiResponse.data));
    }

}

import { IdentitiesApiRequestFactory, IdentitiesApiResponseProcessor} from "../apis/IdentitiesApi";
export class ObservableIdentitiesApi {
    private requestFactory: IdentitiesApiRequestFactory;
    private responseProcessor: IdentitiesApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: IdentitiesApiRequestFactory,
        responseProcessor?: IdentitiesApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new IdentitiesApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new IdentitiesApiResponseProcessor();
    }

    /**
     * Get identity by it\"s key. Key can be id, wallet, handle, ENS name, etc...
     * @param identityKey
     */
    public getIdentityByKeyWithHttpInfo(identityKey: string, _options?: Configuration): Observable<HttpInfo<ApiIdentity>> {
        const requestContextPromise = this.requestFactory.getIdentityByKey(identityKey, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getIdentityByKeyWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get identity by it\"s key. Key can be id, wallet, handle, ENS name, etc...
     * @param identityKey
     */
    public getIdentityByKey(identityKey: string, _options?: Configuration): Observable<ApiIdentity> {
        return this.getIdentityByKeyWithHttpInfo(identityKey, _options).pipe(map((apiResponse: HttpInfo<ApiIdentity>) => apiResponse.data));
    }

    /**
     * Get identity by wallet
     * @param wallet
     */
    public getIdentityByWalletWithHttpInfo(wallet: string, _options?: Configuration): Observable<HttpInfo<ApiIdentity>> {
        const requestContextPromise = this.requestFactory.getIdentityByWallet(wallet, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getIdentityByWalletWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get identity by wallet
     * @param wallet
     */
    public getIdentityByWallet(wallet: string, _options?: Configuration): Observable<ApiIdentity> {
        return this.getIdentityByWalletWithHttpInfo(wallet, _options).pipe(map((apiResponse: HttpInfo<ApiIdentity>) => apiResponse.data));
    }

    /**
     * Get subscribed actions to identity for authenticated user.
     * @param id
     */
    public getIdentitySubscriptionsWithHttpInfo(id: string, _options?: Configuration): Observable<HttpInfo<ApiIdentitySubscriptionActions>> {
        const requestContextPromise = this.requestFactory.getIdentitySubscriptions(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getIdentitySubscriptionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get subscribed actions to identity for authenticated user.
     * @param id
     */
    public getIdentitySubscriptions(id: string, _options?: Configuration): Observable<ApiIdentitySubscriptionActions> {
        return this.getIdentitySubscriptionsWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<ApiIdentitySubscriptionActions>) => apiResponse.data));
    }

    /**
     * Search for identities
     * @param handle At least 3 characters of a handle
     * @param [waveId] Search only users who can view given wave
     * @param [limit] Number of results (20 by default)
     * @param [groupId] Search only users who can view given group
     * @param [ignoreAuthenticatedUser] Ignore authenticated user
     */
    public searchIdentitiesWithHttpInfo(handle: string, waveId?: string, limit?: number, groupId?: string, ignoreAuthenticatedUser?: boolean, _options?: Configuration): Observable<HttpInfo<Array<ApiIdentity>>> {
        const requestContextPromise = this.requestFactory.searchIdentities(handle, waveId, limit, groupId, ignoreAuthenticatedUser, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.searchIdentitiesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Search for identities
     * @param handle At least 3 characters of a handle
     * @param [waveId] Search only users who can view given wave
     * @param [limit] Number of results (20 by default)
     * @param [groupId] Search only users who can view given group
     * @param [ignoreAuthenticatedUser] Ignore authenticated user
     */
    public searchIdentities(handle: string, waveId?: string, limit?: number, groupId?: string, ignoreAuthenticatedUser?: boolean, _options?: Configuration): Observable<Array<ApiIdentity>> {
        return this.searchIdentitiesWithHttpInfo(handle, waveId, limit, groupId, ignoreAuthenticatedUser, _options).pipe(map((apiResponse: HttpInfo<Array<ApiIdentity>>) => apiResponse.data));
    }

    /**
     * Subscribe authenticated user to identities actions.
     * @param id
     * @param apiIdentitySubscriptionActions
     */
    public subscribeToIdentityActionsWithHttpInfo(id: string, apiIdentitySubscriptionActions: ApiIdentitySubscriptionActions, _options?: Configuration): Observable<HttpInfo<ApiIdentitySubscriptionActions>> {
        const requestContextPromise = this.requestFactory.subscribeToIdentityActions(id, apiIdentitySubscriptionActions, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.subscribeToIdentityActionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Subscribe authenticated user to identities actions.
     * @param id
     * @param apiIdentitySubscriptionActions
     */
    public subscribeToIdentityActions(id: string, apiIdentitySubscriptionActions: ApiIdentitySubscriptionActions, _options?: Configuration): Observable<ApiIdentitySubscriptionActions> {
        return this.subscribeToIdentityActionsWithHttpInfo(id, apiIdentitySubscriptionActions, _options).pipe(map((apiResponse: HttpInfo<ApiIdentitySubscriptionActions>) => apiResponse.data));
    }

    /**
     * Unsubscribe authenticated user from identity actions.
     * @param id
     * @param apiIdentitySubscriptionActions
     */
    public unsubscribeFromIdentityActionsWithHttpInfo(id: string, apiIdentitySubscriptionActions: ApiIdentitySubscriptionActions, _options?: Configuration): Observable<HttpInfo<ApiIdentitySubscriptionActions>> {
        const requestContextPromise = this.requestFactory.unsubscribeFromIdentityActions(id, apiIdentitySubscriptionActions, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.unsubscribeFromIdentityActionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Unsubscribe authenticated user from identity actions.
     * @param id
     * @param apiIdentitySubscriptionActions
     */
    public unsubscribeFromIdentityActions(id: string, apiIdentitySubscriptionActions: ApiIdentitySubscriptionActions, _options?: Configuration): Observable<ApiIdentitySubscriptionActions> {
        return this.unsubscribeFromIdentityActionsWithHttpInfo(id, apiIdentitySubscriptionActions, _options).pipe(map((apiResponse: HttpInfo<ApiIdentitySubscriptionActions>) => apiResponse.data));
    }

}

import { MemesMintStatsApiRequestFactory, MemesMintStatsApiResponseProcessor} from "../apis/MemesMintStatsApi";
export class ObservableMemesMintStatsApi {
    private requestFactory: MemesMintStatsApiRequestFactory;
    private responseProcessor: MemesMintStatsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: MemesMintStatsApiRequestFactory,
        responseProcessor?: MemesMintStatsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new MemesMintStatsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new MemesMintStatsApiResponseProcessor();
    }

    /**
     * Get paginated memes mint stats
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is ASC
     */
    public getMemesMintStatsWithHttpInfo(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', _options?: Configuration): Observable<HttpInfo<ApiMemesMintStatsPage>> {
        const requestContextPromise = this.requestFactory.getMemesMintStats(pageSize, page, sortDirection, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getMemesMintStatsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get paginated memes mint stats
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is ASC
     */
    public getMemesMintStats(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', _options?: Configuration): Observable<ApiMemesMintStatsPage> {
        return this.getMemesMintStatsWithHttpInfo(pageSize, page, sortDirection, _options).pipe(map((apiResponse: HttpInfo<ApiMemesMintStatsPage>) => apiResponse.data));
    }

    /**
     * Get memes mint stats for one meme id
     * @param id
     */
    public getMemesMintStatsByIdWithHttpInfo(id: number, _options?: Configuration): Observable<HttpInfo<ApiMemesMintStat>> {
        const requestContextPromise = this.requestFactory.getMemesMintStatsById(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getMemesMintStatsByIdWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get memes mint stats for one meme id
     * @param id
     */
    public getMemesMintStatsById(id: number, _options?: Configuration): Observable<ApiMemesMintStat> {
        return this.getMemesMintStatsByIdWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<ApiMemesMintStat>) => apiResponse.data));
    }

    /**
     * Get total memes mint stats
     */
    public getMemesMintStatsTotalWithHttpInfo(_options?: Configuration): Observable<HttpInfo<ApiMemesMintStatsTotals>> {
        const requestContextPromise = this.requestFactory.getMemesMintStatsTotal(_options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getMemesMintStatsTotalWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get total memes mint stats
     */
    public getMemesMintStatsTotal(_options?: Configuration): Observable<ApiMemesMintStatsTotals> {
        return this.getMemesMintStatsTotalWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<ApiMemesMintStatsTotals>) => apiResponse.data));
    }

    /**
     * Get yearly aggregated memes mint stats
     */
    public getMemesMintStatsYearlyWithHttpInfo(_options?: Configuration): Observable<HttpInfo<Array<ApiMemesMintStatsYearly>>> {
        const requestContextPromise = this.requestFactory.getMemesMintStatsYearly(_options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getMemesMintStatsYearlyWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get yearly aggregated memes mint stats
     */
    public getMemesMintStatsYearly(_options?: Configuration): Observable<Array<ApiMemesMintStatsYearly>> {
        return this.getMemesMintStatsYearlyWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Array<ApiMemesMintStatsYearly>>) => apiResponse.data));
    }

}

import { NFTLinkApiRequestFactory, NFTLinkApiResponseProcessor} from "../apis/NFTLinkApi";
export class ObservableNFTLinkApi {
    private requestFactory: NFTLinkApiRequestFactory;
    private responseProcessor: NFTLinkApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: NFTLinkApiRequestFactory,
        responseProcessor?: NFTLinkApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new NFTLinkApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new NFTLinkApiResponseProcessor();
    }

    /**
     * Get marketplace data about NFT link
     * @param url
     */
    public getNftLinkDataWithHttpInfo(url: string, _options?: Configuration): Observable<HttpInfo<Array<ApiNftLinkResponse>>> {
        const requestContextPromise = this.requestFactory.getNftLinkData(url, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getNftLinkDataWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get marketplace data about NFT link
     * @param url
     */
    public getNftLinkData(url: string, _options?: Configuration): Observable<Array<ApiNftLinkResponse>> {
        return this.getNftLinkDataWithHttpInfo(url, _options).pipe(map((apiResponse: HttpInfo<Array<ApiNftLinkResponse>>) => apiResponse.data));
    }

}

import { NFTOwnersApiRequestFactory, NFTOwnersApiResponseProcessor} from "../apis/NFTOwnersApi";
export class ObservableNFTOwnersApi {
    private requestFactory: NFTOwnersApiRequestFactory;
    private responseProcessor: NFTOwnersApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: NFTOwnersApiRequestFactory,
        responseProcessor?: NFTOwnersApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new NFTOwnersApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new NFTOwnersApiResponseProcessor();
    }

    /**
     * Get NFT owners
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [contract] Filter by contract address
     * @param [tokenId] Filter by token ID
     */
    public getNftOwnersWithHttpInfo(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', contract?: string, tokenId?: string, _options?: Configuration): Observable<HttpInfo<Array<ApiNftOwnerPage>>> {
        const requestContextPromise = this.requestFactory.getNftOwners(pageSize, page, sortDirection, contract, tokenId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getNftOwnersWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get NFT owners
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [contract] Filter by contract address
     * @param [tokenId] Filter by token ID
     */
    public getNftOwners(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', contract?: string, tokenId?: string, _options?: Configuration): Observable<Array<ApiNftOwnerPage>> {
        return this.getNftOwnersWithHttpInfo(pageSize, page, sortDirection, contract, tokenId, _options).pipe(map((apiResponse: HttpInfo<Array<ApiNftOwnerPage>>) => apiResponse.data));
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
    public getNftOwnersByConsolidationKeyWithHttpInfo(consolidationKey: string, pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', contract?: string, tokenId?: string, _options?: Configuration): Observable<HttpInfo<Array<ApiNftOwnerPage>>> {
        const requestContextPromise = this.requestFactory.getNftOwnersByConsolidationKey(consolidationKey, pageSize, page, sortDirection, contract, tokenId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getNftOwnersByConsolidationKeyWithHttpInfo(rsp)));
            }));
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
    public getNftOwnersByConsolidationKey(consolidationKey: string, pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', contract?: string, tokenId?: string, _options?: Configuration): Observable<Array<ApiNftOwnerPage>> {
        return this.getNftOwnersByConsolidationKeyWithHttpInfo(consolidationKey, pageSize, page, sortDirection, contract, tokenId, _options).pipe(map((apiResponse: HttpInfo<Array<ApiNftOwnerPage>>) => apiResponse.data));
    }

}

import { NFTsApiRequestFactory, NFTsApiResponseProcessor} from "../apis/NFTsApi";
export class ObservableNFTsApi {
    private requestFactory: NFTsApiRequestFactory;
    private responseProcessor: NFTsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: NFTsApiRequestFactory,
        responseProcessor?: NFTsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new NFTsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new NFTsApiResponseProcessor();
    }

    /**
     * Get NFT Media by Contract
     * @param contract The NFT contract address to filter the media by
     */
    public getNftMediaByContractWithHttpInfo(contract: string, _options?: Configuration): Observable<HttpInfo<Array<ApiNftMedia>>> {
        const requestContextPromise = this.requestFactory.getNftMediaByContract(contract, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getNftMediaByContractWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get NFT Media by Contract
     * @param contract The NFT contract address to filter the media by
     */
    public getNftMediaByContract(contract: string, _options?: Configuration): Observable<Array<ApiNftMedia>> {
        return this.getNftMediaByContractWithHttpInfo(contract, _options).pipe(map((apiResponse: HttpInfo<Array<ApiNftMedia>>) => apiResponse.data));
    }

    /**
     * Get NFTs
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [id] Filter by NFT ID
     * @param [contract] Filter by NFT ID
     */
    public getNftsWithHttpInfo(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', id?: string, contract?: string, _options?: Configuration): Observable<HttpInfo<Array<ApiNftsPage>>> {
        const requestContextPromise = this.requestFactory.getNfts(pageSize, page, sortDirection, id, contract, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getNftsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get NFTs
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     * @param [id] Filter by NFT ID
     * @param [contract] Filter by NFT ID
     */
    public getNfts(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', id?: string, contract?: string, _options?: Configuration): Observable<Array<ApiNftsPage>> {
        return this.getNftsWithHttpInfo(pageSize, page, sortDirection, id, contract, _options).pipe(map((apiResponse: HttpInfo<Array<ApiNftsPage>>) => apiResponse.data));
    }

}

import { NotificationsApiRequestFactory, NotificationsApiResponseProcessor} from "../apis/NotificationsApi";
export class ObservableNotificationsApi {
    private requestFactory: NotificationsApiRequestFactory;
    private responseProcessor: NotificationsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: NotificationsApiRequestFactory,
        responseProcessor?: NotificationsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new NotificationsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new NotificationsApiResponseProcessor();
    }

    /**
     * Get notifications for authenticated user.
     * @param [limit] Default is 10
     * @param [idLessThan] Used to find older notifications
     * @param [cause] Comma-separated list of notification causes to include
     * @param [causeExclude] Comma-separated list of notification causes to exclude
     * @param [unreadOnly] Only return unread notifications
     */
    public getNotificationsWithHttpInfo(limit?: number, idLessThan?: number, cause?: string, causeExclude?: string, unreadOnly?: boolean, _options?: Configuration): Observable<HttpInfo<ApiNotificationsResponse>> {
        const requestContextPromise = this.requestFactory.getNotifications(limit, idLessThan, cause, causeExclude, unreadOnly, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getNotificationsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get notifications for authenticated user.
     * @param [limit] Default is 10
     * @param [idLessThan] Used to find older notifications
     * @param [cause] Comma-separated list of notification causes to include
     * @param [causeExclude] Comma-separated list of notification causes to exclude
     * @param [unreadOnly] Only return unread notifications
     */
    public getNotifications(limit?: number, idLessThan?: number, cause?: string, causeExclude?: string, unreadOnly?: boolean, _options?: Configuration): Observable<ApiNotificationsResponse> {
        return this.getNotificationsWithHttpInfo(limit, idLessThan, cause, causeExclude, unreadOnly, _options).pipe(map((apiResponse: HttpInfo<ApiNotificationsResponse>) => apiResponse.data));
    }

    /**
     * Get wave subscription
     * @param waveId
     */
    public getWaveSubscriptionWithHttpInfo(waveId: string, _options?: Configuration): Observable<HttpInfo<GetWaveSubscription200Response>> {
        const requestContextPromise = this.requestFactory.getWaveSubscription(waveId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getWaveSubscriptionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get wave subscription
     * @param waveId
     */
    public getWaveSubscription(waveId: string, _options?: Configuration): Observable<GetWaveSubscription200Response> {
        return this.getWaveSubscriptionWithHttpInfo(waveId, _options).pipe(map((apiResponse: HttpInfo<GetWaveSubscription200Response>) => apiResponse.data));
    }

    /**
     * Mark all notifications as read
     */
    public markAllNotificationsAsReadWithHttpInfo(_options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.markAllNotificationsAsRead(_options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.markAllNotificationsAsReadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Mark all notifications as read
     */
    public markAllNotificationsAsRead(_options?: Configuration): Observable<void> {
        return this.markAllNotificationsAsReadWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Mark notification as read
     * @param id Notification ID or string \&quot;all\&quot; to mark all notifications as read
     */
    public markNotificationAsReadWithHttpInfo(id: string, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.markNotificationAsRead(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.markNotificationAsReadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Mark notification as read
     * @param id Notification ID or string \&quot;all\&quot; to mark all notifications as read
     */
    public markNotificationAsRead(id: string, _options?: Configuration): Observable<void> {
        return this.markNotificationAsReadWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Mark wave notifications as read
     * @param waveId
     */
    public markWaveNotificationsAsReadWithHttpInfo(waveId: string, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.markWaveNotificationsAsRead(waveId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.markWaveNotificationsAsReadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Mark wave notifications as read
     * @param waveId
     */
    public markWaveNotificationsAsRead(waveId: string, _options?: Configuration): Observable<void> {
        return this.markWaveNotificationsAsReadWithHttpInfo(waveId, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Subscribe to wave notifications
     * @param waveId
     */
    public subscribeToWaveNotificationsWithHttpInfo(waveId: string, _options?: Configuration): Observable<HttpInfo<GetWaveSubscription200Response>> {
        const requestContextPromise = this.requestFactory.subscribeToWaveNotifications(waveId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.subscribeToWaveNotificationsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Subscribe to wave notifications
     * @param waveId
     */
    public subscribeToWaveNotifications(waveId: string, _options?: Configuration): Observable<GetWaveSubscription200Response> {
        return this.subscribeToWaveNotificationsWithHttpInfo(waveId, _options).pipe(map((apiResponse: HttpInfo<GetWaveSubscription200Response>) => apiResponse.data));
    }

    /**
     * Unsubscribe from wave notifications
     * @param waveId
     */
    public unsubscribeFromWaveNotificationsWithHttpInfo(waveId: string, _options?: Configuration): Observable<HttpInfo<GetWaveSubscription200Response>> {
        const requestContextPromise = this.requestFactory.unsubscribeFromWaveNotifications(waveId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.unsubscribeFromWaveNotificationsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Unsubscribe from wave notifications
     * @param waveId
     */
    public unsubscribeFromWaveNotifications(waveId: string, _options?: Configuration): Observable<GetWaveSubscription200Response> {
        return this.unsubscribeFromWaveNotificationsWithHttpInfo(waveId, _options).pipe(map((apiResponse: HttpInfo<GetWaveSubscription200Response>) => apiResponse.data));
    }

}

import { OtherApiRequestFactory, OtherApiResponseProcessor} from "../apis/OtherApi";
export class ObservableOtherApi {
    private requestFactory: OtherApiRequestFactory;
    private responseProcessor: OtherApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: OtherApiRequestFactory,
        responseProcessor?: OtherApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new OtherApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new OtherApiResponseProcessor();
    }

    /**
     * Get blocks and related timestamps
     * @param [page]
     * @param [pageSize]
     */
    public getBlocksWithHttpInfo(page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiBlocksPage>> {
        const requestContextPromise = this.requestFactory.getBlocks(page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getBlocksWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get blocks and related timestamps
     * @param [page]
     * @param [pageSize]
     */
    public getBlocks(page?: number, pageSize?: number, _options?: Configuration): Observable<ApiBlocksPage> {
        return this.getBlocksWithHttpInfo(page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiBlocksPage>) => apiResponse.data));
    }

    /**
     * Get consolidated TDH snapshots links
     * @param [page]
     * @param [pageSize]
     * @param [block]
     * @param [date]
     */
    public getConsolidatedUploadsWithHttpInfo(page?: number, pageSize?: number, block?: number, date?: Date, _options?: Configuration): Observable<HttpInfo<ApiUploadsPage>> {
        const requestContextPromise = this.requestFactory.getConsolidatedUploads(page, pageSize, block, date, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getConsolidatedUploadsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get consolidated TDH snapshots links
     * @param [page]
     * @param [pageSize]
     * @param [block]
     * @param [date]
     */
    public getConsolidatedUploads(page?: number, pageSize?: number, block?: number, date?: Date, _options?: Configuration): Observable<ApiUploadsPage> {
        return this.getConsolidatedUploadsWithHttpInfo(page, pageSize, block, date, _options).pipe(map((apiResponse: HttpInfo<ApiUploadsPage>) => apiResponse.data));
    }

    /**
     * meme artists names
     */
    public getMemeArtistsNamesWithHttpInfo(_options?: Configuration): Observable<HttpInfo<Array<ApiArtistNameItem>>> {
        const requestContextPromise = this.requestFactory.getMemeArtistsNames(_options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getMemeArtistsNamesWithHttpInfo(rsp)));
            }));
    }

    /**
     * meme artists names
     */
    public getMemeArtistsNames(_options?: Configuration): Observable<Array<ApiArtistNameItem>> {
        return this.getMemeArtistsNamesWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Array<ApiArtistNameItem>>) => apiResponse.data));
    }

    /**
     * memelab artists names
     */
    public getMemelabArtistsNamesWithHttpInfo(_options?: Configuration): Observable<HttpInfo<Array<ApiArtistNameItem>>> {
        const requestContextPromise = this.requestFactory.getMemelabArtistsNames(_options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getMemelabArtistsNamesWithHttpInfo(rsp)));
            }));
    }

    /**
     * memelab artists names
     */
    public getMemelabArtistsNames(_options?: Configuration): Observable<Array<ApiArtistNameItem>> {
        return this.getMemelabArtistsNamesWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Array<ApiArtistNameItem>>) => apiResponse.data));
    }

    /**
     * Seize settings
     */
    public getSettingsWithHttpInfo(_options?: Configuration): Observable<HttpInfo<ApiSeizeSettings>> {
        const requestContextPromise = this.requestFactory.getSettings(_options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getSettingsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Seize settings
     */
    public getSettings(_options?: Configuration): Observable<ApiSeizeSettings> {
        return this.getSettingsWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<ApiSeizeSettings>) => apiResponse.data));
    }

    /**
     * Get TDH snapshots links
     * @param [page]
     * @param [pageSize]
     * @param [block]
     * @param [date]
     */
    public getUploadsWithHttpInfo(page?: number, pageSize?: number, block?: number, date?: Date, _options?: Configuration): Observable<HttpInfo<ApiUploadsPage>> {
        const requestContextPromise = this.requestFactory.getUploads(page, pageSize, block, date, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getUploadsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get TDH snapshots links
     * @param [page]
     * @param [pageSize]
     * @param [block]
     * @param [date]
     */
    public getUploads(page?: number, pageSize?: number, block?: number, date?: Date, _options?: Configuration): Observable<ApiUploadsPage> {
        return this.getUploadsWithHttpInfo(page, pageSize, block, date, _options).pipe(map((apiResponse: HttpInfo<ApiUploadsPage>) => apiResponse.data));
    }

}

import { OwnersBalancesApiRequestFactory, OwnersBalancesApiResponseProcessor} from "../apis/OwnersBalancesApi";
export class ObservableOwnersBalancesApi {
    private requestFactory: OwnersBalancesApiRequestFactory;
    private responseProcessor: OwnersBalancesApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: OwnersBalancesApiRequestFactory,
        responseProcessor?: OwnersBalancesApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new OwnersBalancesApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new OwnersBalancesApiResponseProcessor();
    }

    /**
     * Get memes owner balance by consolidation key.
     * @param consolidationKey
     */
    public getMemesOwnerBalanceByConsolidationKeyWithHttpInfo(consolidationKey: string, _options?: Configuration): Observable<HttpInfo<Array<ApiOwnerBalanceMemes>>> {
        const requestContextPromise = this.requestFactory.getMemesOwnerBalanceByConsolidationKey(consolidationKey, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getMemesOwnerBalanceByConsolidationKeyWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get memes owner balance by consolidation key.
     * @param consolidationKey
     */
    public getMemesOwnerBalanceByConsolidationKey(consolidationKey: string, _options?: Configuration): Observable<Array<ApiOwnerBalanceMemes>> {
        return this.getMemesOwnerBalanceByConsolidationKeyWithHttpInfo(consolidationKey, _options).pipe(map((apiResponse: HttpInfo<Array<ApiOwnerBalanceMemes>>) => apiResponse.data));
    }

    /**
     * Get owner balance by consolidation key.
     * @param consolidationKey
     */
    public getOwnerBalanceByConsolidationKeyWithHttpInfo(consolidationKey: string, _options?: Configuration): Observable<HttpInfo<ApiOwnerBalance>> {
        const requestContextPromise = this.requestFactory.getOwnerBalanceByConsolidationKey(consolidationKey, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getOwnerBalanceByConsolidationKeyWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get owner balance by consolidation key.
     * @param consolidationKey
     */
    public getOwnerBalanceByConsolidationKey(consolidationKey: string, _options?: Configuration): Observable<ApiOwnerBalance> {
        return this.getOwnerBalanceByConsolidationKeyWithHttpInfo(consolidationKey, _options).pipe(map((apiResponse: HttpInfo<ApiOwnerBalance>) => apiResponse.data));
    }

    /**
     * Get owner balances
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     */
    public getOwnerBalancesWithHttpInfo(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', _options?: Configuration): Observable<HttpInfo<Array<ApiOwnerBalancePage>>> {
        const requestContextPromise = this.requestFactory.getOwnerBalances(pageSize, page, sortDirection, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getOwnerBalancesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get owner balances
     * @param [pageSize] Default is 50
     * @param [page] Default is 1
     * @param [sortDirection] Default is DESC
     */
    public getOwnerBalances(pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', _options?: Configuration): Observable<Array<ApiOwnerBalancePage>> {
        return this.getOwnerBalancesWithHttpInfo(pageSize, page, sortDirection, _options).pipe(map((apiResponse: HttpInfo<Array<ApiOwnerBalancePage>>) => apiResponse.data));
    }

}

import { ProfileCICApiRequestFactory, ProfileCICApiResponseProcessor} from "../apis/ProfileCICApi";
export class ObservableProfileCICApi {
    private requestFactory: ProfileCICApiRequestFactory;
    private responseProcessor: ProfileCICApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: ProfileCICApiRequestFactory,
        responseProcessor?: ProfileCICApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new ProfileCICApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new ProfileCICApiResponseProcessor();
    }

    /**
     * Get profile CIC contributors
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileCicContributorsWithHttpInfo(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiCicContributorsPage>> {
        const requestContextPromise = this.requestFactory.getProfileCicContributors(identity, direction, page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProfileCicContributorsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get profile CIC contributors
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileCicContributors(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<ApiCicContributorsPage> {
        return this.getProfileCicContributorsWithHttpInfo(identity, direction, page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiCicContributorsPage>) => apiResponse.data));
    }

    /**
     * Get profile CIC overview
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileCicOverviewWithHttpInfo(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiCicOverview>> {
        const requestContextPromise = this.requestFactory.getProfileCicOverview(identity, direction, page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProfileCicOverviewWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get profile CIC overview
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileCicOverview(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<ApiCicOverview> {
        return this.getProfileCicOverviewWithHttpInfo(identity, direction, page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiCicOverview>) => apiResponse.data));
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
    public getProfileCicRatingsByRaterWithHttpInfo(identity: string, given?: boolean, page?: number, pageSize?: number, order?: 'ASC' | 'DESC', orderBy?: 'last_modified' | 'rating', _options?: Configuration): Observable<HttpInfo<ApiRatingWithProfileInfoAndLevelPage>> {
        const requestContextPromise = this.requestFactory.getProfileCicRatingsByRater(identity, given, page, pageSize, order, orderBy, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProfileCicRatingsByRaterWithHttpInfo(rsp)));
            }));
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
    public getProfileCicRatingsByRater(identity: string, given?: boolean, page?: number, pageSize?: number, order?: 'ASC' | 'DESC', orderBy?: 'last_modified' | 'rating', _options?: Configuration): Observable<ApiRatingWithProfileInfoAndLevelPage> {
        return this.getProfileCicRatingsByRaterWithHttpInfo(identity, given, page, pageSize, order, orderBy, _options).pipe(map((apiResponse: HttpInfo<ApiRatingWithProfileInfoAndLevelPage>) => apiResponse.data));
    }

    /**
     * Change profile CIC rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param identity
     * @param apiChangeProfileCicRating
     */
    public rateProfileCicWithHttpInfo(identity: string, apiChangeProfileCicRating: ApiChangeProfileCicRating, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.rateProfileCic(identity, apiChangeProfileCicRating, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.rateProfileCicWithHttpInfo(rsp)));
            }));
    }

    /**
     * Change profile CIC rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param identity
     * @param apiChangeProfileCicRating
     */
    public rateProfileCic(identity: string, apiChangeProfileCicRating: ApiChangeProfileCicRating, _options?: Configuration): Observable<void> {
        return this.rateProfileCicWithHttpInfo(identity, apiChangeProfileCicRating, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

}

import { ProfileREPApiRequestFactory, ProfileREPApiResponseProcessor} from "../apis/ProfileREPApi";
export class ObservableProfileREPApi {
    private requestFactory: ProfileREPApiRequestFactory;
    private responseProcessor: ProfileREPApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: ProfileREPApiRequestFactory,
        responseProcessor?: ProfileREPApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new ProfileREPApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new ProfileREPApiResponseProcessor();
    }

    /**
     * Get profile REP categories
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     * @param [topContributorsLimit]
     */
    public getProfileRepCategoriesWithHttpInfo(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, topContributorsLimit?: number, _options?: Configuration): Observable<HttpInfo<ApiRepCategoriesPage>> {
        const requestContextPromise = this.requestFactory.getProfileRepCategories(identity, direction, page, pageSize, topContributorsLimit, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProfileRepCategoriesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get profile REP categories
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     * @param [topContributorsLimit]
     */
    public getProfileRepCategories(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, topContributorsLimit?: number, _options?: Configuration): Observable<ApiRepCategoriesPage> {
        return this.getProfileRepCategoriesWithHttpInfo(identity, direction, page, pageSize, topContributorsLimit, _options).pipe(map((apiResponse: HttpInfo<ApiRepCategoriesPage>) => apiResponse.data));
    }

    /**
     * Get profile REP contributors for category
     * @param identity
     * @param category
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileRepCategoryContributorsWithHttpInfo(identity: string, category: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiRepContributorsPage>> {
        const requestContextPromise = this.requestFactory.getProfileRepCategoryContributors(identity, category, direction, page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProfileRepCategoryContributorsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get profile REP contributors for category
     * @param identity
     * @param category
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileRepCategoryContributors(identity: string, category: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<ApiRepContributorsPage> {
        return this.getProfileRepCategoryContributorsWithHttpInfo(identity, category, direction, page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiRepContributorsPage>) => apiResponse.data));
    }

    /**
     * Get profile REP overview
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileRepOverviewWithHttpInfo(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiRepOverview>> {
        const requestContextPromise = this.requestFactory.getProfileRepOverview(identity, direction, page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProfileRepOverviewWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get profile REP overview
     * @param identity
     * @param [direction]
     * @param [page]
     * @param [pageSize]
     */
    public getProfileRepOverview(identity: string, direction?: ApiRepDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<ApiRepOverview> {
        return this.getProfileRepOverviewWithHttpInfo(identity, direction, page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiRepOverview>) => apiResponse.data));
    }

    /**
     * Get profile REP rating
     * @param identity
     * @param [fromIdentity]
     * @param [category]
     */
    public getProfileRepRatingWithHttpInfo(identity: string, fromIdentity?: string, category?: string, _options?: Configuration): Observable<HttpInfo<ApiRepRating>> {
        const requestContextPromise = this.requestFactory.getProfileRepRating(identity, fromIdentity, category, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProfileRepRatingWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get profile REP rating
     * @param identity
     * @param [fromIdentity]
     * @param [category]
     */
    public getProfileRepRating(identity: string, fromIdentity?: string, category?: string, _options?: Configuration): Observable<ApiRepRating> {
        return this.getProfileRepRatingWithHttpInfo(identity, fromIdentity, category, _options).pipe(map((apiResponse: HttpInfo<ApiRepRating>) => apiResponse.data));
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
    public getProfileRepRatingsByRaterWithHttpInfo(identity: string, given?: boolean, page?: number, pageSize?: number, order?: 'ASC' | 'DESC', orderBy?: 'last_modified' | 'rating', category?: string, _options?: Configuration): Observable<HttpInfo<ApiRatingWithProfileInfoAndLevelPage>> {
        const requestContextPromise = this.requestFactory.getProfileRepRatingsByRater(identity, given, page, pageSize, order, orderBy, category, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProfileRepRatingsByRaterWithHttpInfo(rsp)));
            }));
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
    public getProfileRepRatingsByRater(identity: string, given?: boolean, page?: number, pageSize?: number, order?: 'ASC' | 'DESC', orderBy?: 'last_modified' | 'rating', category?: string, _options?: Configuration): Observable<ApiRatingWithProfileInfoAndLevelPage> {
        return this.getProfileRepRatingsByRaterWithHttpInfo(identity, given, page, pageSize, order, orderBy, category, _options).pipe(map((apiResponse: HttpInfo<ApiRatingWithProfileInfoAndLevelPage>) => apiResponse.data));
    }

    /**
     * Change profile REP rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param identity
     * @param apiChangeProfileRepRating
     */
    public rateProfileRepWithHttpInfo(identity: string, apiChangeProfileRepRating: ApiChangeProfileRepRating, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.rateProfileRep(identity, apiChangeProfileRepRating, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.rateProfileRepWithHttpInfo(rsp)));
            }));
    }

    /**
     * Change profile REP rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.
     * @param identity
     * @param apiChangeProfileRepRating
     */
    public rateProfileRep(identity: string, apiChangeProfileRepRating: ApiChangeProfileRepRating, _options?: Configuration): Observable<void> {
        return this.rateProfileRepWithHttpInfo(identity, apiChangeProfileRepRating, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

}

import { ProfilesApiRequestFactory, ProfilesApiResponseProcessor} from "../apis/ProfilesApi";
export class ObservableProfilesApi {
    private requestFactory: ProfilesApiRequestFactory;
    private responseProcessor: ProfilesApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: ProfilesApiRequestFactory,
        responseProcessor?: ProfilesApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new ProfilesApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new ProfilesApiResponseProcessor();
    }

    /**
     * Create or update a profile
     * @param apiCreateOrUpdateProfileRequest
     */
    public createOrUpdateProfileWithHttpInfo(apiCreateOrUpdateProfileRequest: ApiCreateOrUpdateProfileRequest, _options?: Configuration): Observable<HttpInfo<ApiIdentity>> {
        const requestContextPromise = this.requestFactory.createOrUpdateProfile(apiCreateOrUpdateProfileRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createOrUpdateProfileWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create or update a profile
     * @param apiCreateOrUpdateProfileRequest
     */
    public createOrUpdateProfile(apiCreateOrUpdateProfileRequest: ApiCreateOrUpdateProfileRequest, _options?: Configuration): Observable<ApiIdentity> {
        return this.createOrUpdateProfileWithHttpInfo(apiCreateOrUpdateProfileRequest, _options).pipe(map((apiResponse: HttpInfo<ApiIdentity>) => apiResponse.data));
    }

}

import { ProxiesApiRequestFactory, ProxiesApiResponseProcessor} from "../apis/ProxiesApi";
export class ObservableProxiesApi {
    private requestFactory: ProxiesApiRequestFactory;
    private responseProcessor: ProxiesApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: ProxiesApiRequestFactory,
        responseProcessor?: ProxiesApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new ProxiesApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new ProxiesApiResponseProcessor();
    }

    /**
     * Accept action
     * @param proxyId
     * @param actionId
     * @param acceptActionRequest
     */
    public acceptActionWithHttpInfo(proxyId: string, actionId: string, acceptActionRequest: AcceptActionRequest, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.acceptAction(proxyId, actionId, acceptActionRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.acceptActionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Accept action
     * @param proxyId
     * @param actionId
     * @param acceptActionRequest
     */
    public acceptAction(proxyId: string, actionId: string, acceptActionRequest: AcceptActionRequest, _options?: Configuration): Observable<void> {
        return this.acceptActionWithHttpInfo(proxyId, actionId, acceptActionRequest, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Add action to proxy
     * @param proxyId
     * @param addActionToProxyRequest
     */
    public addActionToProxyWithHttpInfo(proxyId: string, addActionToProxyRequest: AddActionToProxyRequest, _options?: Configuration): Observable<HttpInfo<ApiProfileProxyAction>> {
        const requestContextPromise = this.requestFactory.addActionToProxy(proxyId, addActionToProxyRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.addActionToProxyWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Add action to proxy
     * @param proxyId
     * @param addActionToProxyRequest
     */
    public addActionToProxy(proxyId: string, addActionToProxyRequest: AddActionToProxyRequest, _options?: Configuration): Observable<ApiProfileProxyAction> {
        return this.addActionToProxyWithHttpInfo(proxyId, addActionToProxyRequest, _options).pipe(map((apiResponse: HttpInfo<ApiProfileProxyAction>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Create a new proxy
     * @param apiCreateNewProfileProxy
     */
    public createProxyWithHttpInfo(apiCreateNewProfileProxy: ApiCreateNewProfileProxy, _options?: Configuration): Observable<HttpInfo<ApiProfileProxy>> {
        const requestContextPromise = this.requestFactory.createProxy(apiCreateNewProfileProxy, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createProxyWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Create a new proxy
     * @param apiCreateNewProfileProxy
     */
    public createProxy(apiCreateNewProfileProxy: ApiCreateNewProfileProxy, _options?: Configuration): Observable<ApiProfileProxy> {
        return this.createProxyWithHttpInfo(apiCreateNewProfileProxy, _options).pipe(map((apiResponse: HttpInfo<ApiProfileProxy>) => apiResponse.data));
    }

    /**
     * Get profile proxies
     * @param identity
     */
    public getProfileProxiesWithHttpInfo(identity: string, _options?: Configuration): Observable<HttpInfo<Array<ApiProfileProxy>>> {
        const requestContextPromise = this.requestFactory.getProfileProxies(identity, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProfileProxiesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get profile proxies
     * @param identity
     */
    public getProfileProxies(identity: string, _options?: Configuration): Observable<Array<ApiProfileProxy>> {
        return this.getProfileProxiesWithHttpInfo(identity, _options).pipe(map((apiResponse: HttpInfo<Array<ApiProfileProxy>>) => apiResponse.data));
    }

    /**
     * Get proxies granted by a profile
     * @param identity
     */
    public getProxiesGrantedWithHttpInfo(identity: string, _options?: Configuration): Observable<HttpInfo<Array<ApiProfileProxy>>> {
        const requestContextPromise = this.requestFactory.getProxiesGranted(identity, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProxiesGrantedWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get proxies granted by a profile
     * @param identity
     */
    public getProxiesGranted(identity: string, _options?: Configuration): Observable<Array<ApiProfileProxy>> {
        return this.getProxiesGrantedWithHttpInfo(identity, _options).pipe(map((apiResponse: HttpInfo<Array<ApiProfileProxy>>) => apiResponse.data));
    }

    /**
     * Get proxies received by a profile
     * @param identity
     */
    public getProxiesReceivedWithHttpInfo(identity: string, _options?: Configuration): Observable<HttpInfo<Array<ApiProfileProxy>>> {
        const requestContextPromise = this.requestFactory.getProxiesReceived(identity, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProxiesReceivedWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get proxies received by a profile
     * @param identity
     */
    public getProxiesReceived(identity: string, _options?: Configuration): Observable<Array<ApiProfileProxy>> {
        return this.getProxiesReceivedWithHttpInfo(identity, _options).pipe(map((apiResponse: HttpInfo<Array<ApiProfileProxy>>) => apiResponse.data));
    }

    /**
     * Get proxy by ID
     * @param proxyId
     */
    public getProxyByIdWithHttpInfo(proxyId: string, _options?: Configuration): Observable<HttpInfo<ApiProfileProxy>> {
        const requestContextPromise = this.requestFactory.getProxyById(proxyId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProxyByIdWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get proxy by ID
     * @param proxyId
     */
    public getProxyById(proxyId: string, _options?: Configuration): Observable<ApiProfileProxy> {
        return this.getProxyByIdWithHttpInfo(proxyId, _options).pipe(map((apiResponse: HttpInfo<ApiProfileProxy>) => apiResponse.data));
    }

    /**
     * Update action
     * @param proxyId
     * @param actionId
     * @param apiUpdateProxyActionRequest
     */
    public updateActionWithHttpInfo(proxyId: string, actionId: string, apiUpdateProxyActionRequest: ApiUpdateProxyActionRequest, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.updateAction(proxyId, actionId, apiUpdateProxyActionRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateActionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update action
     * @param proxyId
     * @param actionId
     * @param apiUpdateProxyActionRequest
     */
    public updateAction(proxyId: string, actionId: string, apiUpdateProxyActionRequest: ApiUpdateProxyActionRequest, _options?: Configuration): Observable<void> {
        return this.updateActionWithHttpInfo(proxyId, actionId, apiUpdateProxyActionRequest, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

}

import { PushNotificationsApiRequestFactory, PushNotificationsApiResponseProcessor} from "../apis/PushNotificationsApi";
export class ObservablePushNotificationsApi {
    private requestFactory: PushNotificationsApiRequestFactory;
    private responseProcessor: PushNotificationsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: PushNotificationsApiRequestFactory,
        responseProcessor?: PushNotificationsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new PushNotificationsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new PushNotificationsApiResponseProcessor();
    }

    /**
     * Delete a registered device
     * @param deviceId The device ID to delete
     */
    public deleteDeviceWithHttpInfo(deviceId: string, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.deleteDevice(deviceId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteDeviceWithHttpInfo(rsp)));
            }));
    }

    /**
     * Delete a registered device
     * @param deviceId The device ID to delete
     */
    public deleteDevice(deviceId: string, _options?: Configuration): Observable<void> {
        return this.deleteDeviceWithHttpInfo(deviceId, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Get all registered devices for the authenticated user
     */
    public getDevicesWithHttpInfo(_options?: Configuration): Observable<HttpInfo<Array<ApiPushNotificationDevice>>> {
        const requestContextPromise = this.requestFactory.getDevices(_options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDevicesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get all registered devices for the authenticated user
     */
    public getDevices(_options?: Configuration): Observable<Array<ApiPushNotificationDevice>> {
        return this.getDevicesWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Array<ApiPushNotificationDevice>>) => apiResponse.data));
    }

    /**
     * Get push notification settings for a device
     * @param deviceId The device ID to get settings for
     */
    public getPushNotificationSettingsWithHttpInfo(deviceId: string, _options?: Configuration): Observable<HttpInfo<ApiPushNotificationSettings>> {
        const requestContextPromise = this.requestFactory.getPushNotificationSettings(deviceId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getPushNotificationSettingsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get push notification settings for a device
     * @param deviceId The device ID to get settings for
     */
    public getPushNotificationSettings(deviceId: string, _options?: Configuration): Observable<ApiPushNotificationSettings> {
        return this.getPushNotificationSettingsWithHttpInfo(deviceId, _options).pipe(map((apiResponse: HttpInfo<ApiPushNotificationSettings>) => apiResponse.data));
    }

    /**
     * Register a push notification token
     * @param apiRegisterPushNotificationTokenRequest
     */
    public registerPushNotificationTokenWithHttpInfo(apiRegisterPushNotificationTokenRequest: ApiRegisterPushNotificationTokenRequest, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.registerPushNotificationToken(apiRegisterPushNotificationTokenRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.registerPushNotificationTokenWithHttpInfo(rsp)));
            }));
    }

    /**
     * Register a push notification token
     * @param apiRegisterPushNotificationTokenRequest
     */
    public registerPushNotificationToken(apiRegisterPushNotificationTokenRequest: ApiRegisterPushNotificationTokenRequest, _options?: Configuration): Observable<void> {
        return this.registerPushNotificationTokenWithHttpInfo(apiRegisterPushNotificationTokenRequest, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Update push notification settings for a device
     * @param deviceId The device ID to update settings for
     * @param apiPushNotificationSettingsUpdate
     */
    public updatePushNotificationSettingsWithHttpInfo(deviceId: string, apiPushNotificationSettingsUpdate: ApiPushNotificationSettingsUpdate, _options?: Configuration): Observable<HttpInfo<ApiPushNotificationSettings>> {
        const requestContextPromise = this.requestFactory.updatePushNotificationSettings(deviceId, apiPushNotificationSettingsUpdate, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updatePushNotificationSettingsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update push notification settings for a device
     * @param deviceId The device ID to update settings for
     * @param apiPushNotificationSettingsUpdate
     */
    public updatePushNotificationSettings(deviceId: string, apiPushNotificationSettingsUpdate: ApiPushNotificationSettingsUpdate, _options?: Configuration): Observable<ApiPushNotificationSettings> {
        return this.updatePushNotificationSettingsWithHttpInfo(deviceId, apiPushNotificationSettingsUpdate, _options).pipe(map((apiResponse: HttpInfo<ApiPushNotificationSettings>) => apiResponse.data));
    }

}

import { RatingsApiRequestFactory, RatingsApiResponseProcessor} from "../apis/RatingsApi";
export class ObservableRatingsApi {
    private requestFactory: RatingsApiRequestFactory;
    private responseProcessor: RatingsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: RatingsApiRequestFactory,
        responseProcessor?: RatingsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new RatingsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new RatingsApiResponseProcessor();
    }

    /**
     * This is deprecated. Use bulk-rep instead. Bulk rate. Supplied amount will be added to all target identities. If same identity is supplied multiple times, all the additions will be summed up. Targets must be represented as Ethereum wallet addresses. ENS names and profile handles are not supported.
     * @param apiBulkRateRequest
     */
    public bulkRateWithHttpInfo(apiBulkRateRequest: ApiBulkRateRequest, _options?: Configuration): Observable<HttpInfo<ApiBulkRateResponse>> {
        const requestContextPromise = this.requestFactory.bulkRate(apiBulkRateRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.bulkRateWithHttpInfo(rsp)));
            }));
    }

    /**
     * This is deprecated. Use bulk-rep instead. Bulk rate. Supplied amount will be added to all target identities. If same identity is supplied multiple times, all the additions will be summed up. Targets must be represented as Ethereum wallet addresses. ENS names and profile handles are not supported.
     * @param apiBulkRateRequest
     */
    public bulkRate(apiBulkRateRequest: ApiBulkRateRequest, _options?: Configuration): Observable<ApiBulkRateResponse> {
        return this.bulkRateWithHttpInfo(apiBulkRateRequest, _options).pipe(map((apiResponse: HttpInfo<ApiBulkRateResponse>) => apiResponse.data));
    }

    /**
     * Change REP rating of multiple targets and categories in one go. Targets  final REP value will be the value you supply here. If you supply multiple  addresses for one consolidation group then those amounts will be summed together.
     * @param apiBulkRepRequest
     */
    public bulkRepWithHttpInfo(apiBulkRepRequest: ApiBulkRepRequest, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.bulkRep(apiBulkRepRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.bulkRepWithHttpInfo(rsp)));
            }));
    }

    /**
     * Change REP rating of multiple targets and categories in one go. Targets  final REP value will be the value you supply here. If you supply multiple  addresses for one consolidation group then those amounts will be summed together.
     * @param apiBulkRepRequest
     */
    public bulkRep(apiBulkRepRequest: ApiBulkRepRequest, _options?: Configuration): Observable<void> {
        return this.bulkRepWithHttpInfo(apiBulkRepRequest, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Get available credit for rating
     * @param rater
     * @param [raterRepresentative]
     */
    public getCreditLeftWithHttpInfo(rater: string, raterRepresentative?: string, _options?: Configuration): Observable<HttpInfo<ApiAvailableRatingCredit>> {
        const requestContextPromise = this.requestFactory.getCreditLeft(rater, raterRepresentative, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getCreditLeftWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get available credit for rating
     * @param rater
     * @param [raterRepresentative]
     */
    public getCreditLeft(rater: string, raterRepresentative?: string, _options?: Configuration): Observable<ApiAvailableRatingCredit> {
        return this.getCreditLeftWithHttpInfo(rater, raterRepresentative, _options).pipe(map((apiResponse: HttpInfo<ApiAvailableRatingCredit>) => apiResponse.data));
    }

}

import { SubscriptionsApiRequestFactory, SubscriptionsApiResponseProcessor} from "../apis/SubscriptionsApi";
export class ObservableSubscriptionsApi {
    private requestFactory: SubscriptionsApiRequestFactory;
    private responseProcessor: SubscriptionsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: SubscriptionsApiRequestFactory,
        responseProcessor?: SubscriptionsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new SubscriptionsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new SubscriptionsApiResponseProcessor();
    }

    /**
     * Get airdrop address for a consolidation
     * @param consolidationKey Consolidation key
     */
    public getAirdropAddressWithHttpInfo(consolidationKey: string, _options?: Configuration): Observable<HttpInfo<AirdropAddressResponse>> {
        const requestContextPromise = this.requestFactory.getAirdropAddress(consolidationKey, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getAirdropAddressWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get airdrop address for a consolidation
     * @param consolidationKey Consolidation key
     */
    public getAirdropAddress(consolidationKey: string, _options?: Configuration): Observable<AirdropAddressResponse> {
        return this.getAirdropAddressWithHttpInfo(consolidationKey, _options).pipe(map((apiResponse: HttpInfo<AirdropAddressResponse>) => apiResponse.data));
    }

    /**
     * Get final subscription for a consolidation
     * @param consolidationKey Consolidation key
     * @param contract Contract address
     * @param tokenId Token ID
     */
    public getFinalSubscriptionWithHttpInfo(consolidationKey: string, contract: string, tokenId: number, _options?: Configuration): Observable<HttpInfo<NFTFinalSubscription>> {
        const requestContextPromise = this.requestFactory.getFinalSubscription(consolidationKey, contract, tokenId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getFinalSubscriptionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get final subscription for a consolidation
     * @param consolidationKey Consolidation key
     * @param contract Contract address
     * @param tokenId Token ID
     */
    public getFinalSubscription(consolidationKey: string, contract: string, tokenId: number, _options?: Configuration): Observable<NFTFinalSubscription> {
        return this.getFinalSubscriptionWithHttpInfo(consolidationKey, contract, tokenId, _options).pipe(map((apiResponse: HttpInfo<NFTFinalSubscription>) => apiResponse.data));
    }

    /**
     * Get identities subscribed to target.
     * @param targetType
     * @param targetId
     * @param [pageSize]
     * @param [page]
     */
    public getIncomingSubscriptionsForTargetWithHttpInfo(targetType: 'IDENTITY' | 'WAVE' | 'DROP', targetId: string, pageSize?: number, page?: number, _options?: Configuration): Observable<HttpInfo<Array<ApiIncomingIdentitySubscriptionsPage>>> {
        const requestContextPromise = this.requestFactory.getIncomingSubscriptionsForTarget(targetType, targetId, pageSize, page, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getIncomingSubscriptionsForTargetWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get identities subscribed to target.
     * @param targetType
     * @param targetId
     * @param [pageSize]
     * @param [page]
     */
    public getIncomingSubscriptionsForTarget(targetType: 'IDENTITY' | 'WAVE' | 'DROP', targetId: string, pageSize?: number, page?: number, _options?: Configuration): Observable<Array<ApiIncomingIdentitySubscriptionsPage>> {
        return this.getIncomingSubscriptionsForTargetWithHttpInfo(targetType, targetId, pageSize, page, _options).pipe(map((apiResponse: HttpInfo<Array<ApiIncomingIdentitySubscriptionsPage>>) => apiResponse.data));
    }

    /**
     * Get outgoing subscriptions for authenticated user.
     * @param targetType
     * @param [pageSize]
     * @param [page]
     */
    public getOutgoingSubscriptionsWithHttpInfo(targetType: 'IDENTITY' | 'WAVE' | 'DROP', pageSize?: number, page?: number, _options?: Configuration): Observable<HttpInfo<Array<ApiOutgoingIdentitySubscriptionsPage>>> {
        const requestContextPromise = this.requestFactory.getOutgoingSubscriptions(targetType, pageSize, page, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getOutgoingSubscriptionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get outgoing subscriptions for authenticated user.
     * @param targetType
     * @param [pageSize]
     * @param [page]
     */
    public getOutgoingSubscriptions(targetType: 'IDENTITY' | 'WAVE' | 'DROP', pageSize?: number, page?: number, _options?: Configuration): Observable<Array<ApiOutgoingIdentitySubscriptionsPage>> {
        return this.getOutgoingSubscriptionsWithHttpInfo(targetType, pageSize, page, _options).pipe(map((apiResponse: HttpInfo<Array<ApiOutgoingIdentitySubscriptionsPage>>) => apiResponse.data));
    }

    /**
     * Get redeemed meme subscription counts
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getRedeemedMemeSubscriptionCountsWithHttpInfo(pageSize?: number, page?: number, _options?: Configuration): Observable<HttpInfo<RedeemedSubscriptionCountsPage>> {
        const requestContextPromise = this.requestFactory.getRedeemedMemeSubscriptionCounts(pageSize, page, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getRedeemedMemeSubscriptionCountsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get redeemed meme subscription counts
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getRedeemedMemeSubscriptionCounts(pageSize?: number, page?: number, _options?: Configuration): Observable<RedeemedSubscriptionCountsPage> {
        return this.getRedeemedMemeSubscriptionCountsWithHttpInfo(pageSize, page, _options).pipe(map((apiResponse: HttpInfo<RedeemedSubscriptionCountsPage>) => apiResponse.data));
    }

    /**
     * Get redeemed subscriptions for a consolidation
     * @param consolidationKey Consolidation key
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getRedeemedSubscriptionsWithHttpInfo(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Observable<HttpInfo<RedeemedSubscriptionPage>> {
        const requestContextPromise = this.requestFactory.getRedeemedSubscriptions(consolidationKey, pageSize, page, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getRedeemedSubscriptionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get redeemed subscriptions for a consolidation
     * @param consolidationKey Consolidation key
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getRedeemedSubscriptions(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Observable<RedeemedSubscriptionPage> {
        return this.getRedeemedSubscriptionsWithHttpInfo(consolidationKey, pageSize, page, _options).pipe(map((apiResponse: HttpInfo<RedeemedSubscriptionPage>) => apiResponse.data));
    }

    /**
     * Get subscription details for a consolidation
     * @param consolidationKey Consolidation key
     */
    public getSubscriptionDetailsWithHttpInfo(consolidationKey: string, _options?: Configuration): Observable<HttpInfo<SubscriptionDetails>> {
        const requestContextPromise = this.requestFactory.getSubscriptionDetails(consolidationKey, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getSubscriptionDetailsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get subscription details for a consolidation
     * @param consolidationKey Consolidation key
     */
    public getSubscriptionDetails(consolidationKey: string, _options?: Configuration): Observable<SubscriptionDetails> {
        return this.getSubscriptionDetailsWithHttpInfo(consolidationKey, _options).pipe(map((apiResponse: HttpInfo<SubscriptionDetails>) => apiResponse.data));
    }

    /**
     * Get subscription logs for a consolidation
     * @param consolidationKey Consolidation key
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getSubscriptionLogsWithHttpInfo(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Observable<HttpInfo<SubscriptionLogPage>> {
        const requestContextPromise = this.requestFactory.getSubscriptionLogs(consolidationKey, pageSize, page, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getSubscriptionLogsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get subscription logs for a consolidation
     * @param consolidationKey Consolidation key
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getSubscriptionLogs(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Observable<SubscriptionLogPage> {
        return this.getSubscriptionLogsWithHttpInfo(consolidationKey, pageSize, page, _options).pipe(map((apiResponse: HttpInfo<SubscriptionLogPage>) => apiResponse.data));
    }

    /**
     * Get top-ups for a consolidation
     * @param consolidationKey Consolidation key
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getSubscriptionTopUpsWithHttpInfo(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Observable<HttpInfo<SubscriptionTopUpPage>> {
        const requestContextPromise = this.requestFactory.getSubscriptionTopUps(consolidationKey, pageSize, page, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getSubscriptionTopUpsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get top-ups for a consolidation
     * @param consolidationKey Consolidation key
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getSubscriptionTopUps(consolidationKey: string, pageSize?: number, page?: number, _options?: Configuration): Observable<SubscriptionTopUpPage> {
        return this.getSubscriptionTopUpsWithHttpInfo(consolidationKey, pageSize, page, _options).pipe(map((apiResponse: HttpInfo<SubscriptionTopUpPage>) => apiResponse.data));
    }

    /**
     * Get subscription uploads
     * @param contract Contract address (required)
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getSubscriptionUploadsWithHttpInfo(contract: string, pageSize?: number, page?: number, _options?: Configuration): Observable<HttpInfo<NFTFinalSubscriptionUploadPage>> {
        const requestContextPromise = this.requestFactory.getSubscriptionUploads(contract, pageSize, page, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getSubscriptionUploadsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get subscription uploads
     * @param contract Contract address (required)
     * @param [pageSize] Default is 20
     * @param [page] Default is 1
     */
    public getSubscriptionUploads(contract: string, pageSize?: number, page?: number, _options?: Configuration): Observable<NFTFinalSubscriptionUploadPage> {
        return this.getSubscriptionUploadsWithHttpInfo(contract, pageSize, page, _options).pipe(map((apiResponse: HttpInfo<NFTFinalSubscriptionUploadPage>) => apiResponse.data));
    }

    /**
     * Get upcoming meme subscription counts
     * @param [cardCount] Number of upcoming cards to fetch. Default is 3
     */
    public getUpcomingMemeSubscriptionCountsWithHttpInfo(cardCount?: number, _options?: Configuration): Observable<HttpInfo<Array<SubscriptionCounts>>> {
        const requestContextPromise = this.requestFactory.getUpcomingMemeSubscriptionCounts(cardCount, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getUpcomingMemeSubscriptionCountsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get upcoming meme subscription counts
     * @param [cardCount] Number of upcoming cards to fetch. Default is 3
     */
    public getUpcomingMemeSubscriptionCounts(cardCount?: number, _options?: Configuration): Observable<Array<SubscriptionCounts>> {
        return this.getUpcomingMemeSubscriptionCountsWithHttpInfo(cardCount, _options).pipe(map((apiResponse: HttpInfo<Array<SubscriptionCounts>>) => apiResponse.data));
    }

    /**
     * Get upcoming meme subscription status for a consolidation
     * @param memeId Meme token id
     * @param consolidationKey Consolidation key
     */
    public getUpcomingMemeSubscriptionStatusWithHttpInfo(memeId: number, consolidationKey: string, _options?: Configuration): Observable<HttpInfo<ApiUpcomingMemeSubscriptionStatus>> {
        const requestContextPromise = this.requestFactory.getUpcomingMemeSubscriptionStatus(memeId, consolidationKey, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getUpcomingMemeSubscriptionStatusWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get upcoming meme subscription status for a consolidation
     * @param memeId Meme token id
     * @param consolidationKey Consolidation key
     */
    public getUpcomingMemeSubscriptionStatus(memeId: number, consolidationKey: string, _options?: Configuration): Observable<ApiUpcomingMemeSubscriptionStatus> {
        return this.getUpcomingMemeSubscriptionStatusWithHttpInfo(memeId, consolidationKey, _options).pipe(map((apiResponse: HttpInfo<ApiUpcomingMemeSubscriptionStatus>) => apiResponse.data));
    }

    /**
     * Get upcoming meme subscriptions for a consolidation
     * @param consolidationKey Consolidation key
     * @param [cardCount] Number of upcoming cards to fetch. Default is 3
     */
    public getUpcomingMemeSubscriptionsWithHttpInfo(consolidationKey: string, cardCount?: number, _options?: Configuration): Observable<HttpInfo<Array<NFTSubscription>>> {
        const requestContextPromise = this.requestFactory.getUpcomingMemeSubscriptions(consolidationKey, cardCount, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getUpcomingMemeSubscriptionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get upcoming meme subscriptions for a consolidation
     * @param consolidationKey Consolidation key
     * @param [cardCount] Number of upcoming cards to fetch. Default is 3
     */
    public getUpcomingMemeSubscriptions(consolidationKey: string, cardCount?: number, _options?: Configuration): Observable<Array<NFTSubscription>> {
        return this.getUpcomingMemeSubscriptionsWithHttpInfo(consolidationKey, cardCount, _options).pipe(map((apiResponse: HttpInfo<Array<NFTSubscription>>) => apiResponse.data));
    }

    /**
     * Requires authentication. User can only change this setting for their own consolidation.
     * Toggle subscribe all editions preference
     * @param consolidationKey Consolidation key
     * @param updateSubscribeAllEditionsRequest
     */
    public updateSubscribeAllEditionsWithHttpInfo(consolidationKey: string, updateSubscribeAllEditionsRequest: UpdateSubscribeAllEditionsRequest, _options?: Configuration): Observable<HttpInfo<SubscribeAllEditionsResponse>> {
        const requestContextPromise = this.requestFactory.updateSubscribeAllEditions(consolidationKey, updateSubscribeAllEditionsRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateSubscribeAllEditionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires authentication. User can only change this setting for their own consolidation.
     * Toggle subscribe all editions preference
     * @param consolidationKey Consolidation key
     * @param updateSubscribeAllEditionsRequest
     */
    public updateSubscribeAllEditions(consolidationKey: string, updateSubscribeAllEditionsRequest: UpdateSubscribeAllEditionsRequest, _options?: Configuration): Observable<SubscribeAllEditionsResponse> {
        return this.updateSubscribeAllEditionsWithHttpInfo(consolidationKey, updateSubscribeAllEditionsRequest, _options).pipe(map((apiResponse: HttpInfo<SubscribeAllEditionsResponse>) => apiResponse.data));
    }

    /**
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription for a specific NFT
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionRequest
     */
    public updateSubscriptionWithHttpInfo(consolidationKey: string, updateSubscriptionRequest: UpdateSubscriptionRequest, _options?: Configuration): Observable<HttpInfo<SubscriptionResponse>> {
        const requestContextPromise = this.requestFactory.updateSubscription(consolidationKey, updateSubscriptionRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateSubscriptionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription for a specific NFT
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionRequest
     */
    public updateSubscription(consolidationKey: string, updateSubscriptionRequest: UpdateSubscriptionRequest, _options?: Configuration): Observable<SubscriptionResponse> {
        return this.updateSubscriptionWithHttpInfo(consolidationKey, updateSubscriptionRequest, _options).pipe(map((apiResponse: HttpInfo<SubscriptionResponse>) => apiResponse.data));
    }

    /**
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription count for a specific NFT
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionCountRequest
     */
    public updateSubscriptionCountWithHttpInfo(consolidationKey: string, updateSubscriptionCountRequest: UpdateSubscriptionCountRequest, _options?: Configuration): Observable<HttpInfo<SubscriptionCountResponse>> {
        const requestContextPromise = this.requestFactory.updateSubscriptionCount(consolidationKey, updateSubscriptionCountRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateSubscriptionCountWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires authentication. User can only change subscriptions for their own consolidation.
     * Update subscription count for a specific NFT
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionCountRequest
     */
    public updateSubscriptionCount(consolidationKey: string, updateSubscriptionCountRequest: UpdateSubscriptionCountRequest, _options?: Configuration): Observable<SubscriptionCountResponse> {
        return this.updateSubscriptionCountWithHttpInfo(consolidationKey, updateSubscriptionCountRequest, _options).pipe(map((apiResponse: HttpInfo<SubscriptionCountResponse>) => apiResponse.data));
    }

    /**
     * Requires authentication. User can only change subscription mode for their own consolidation.
     * Update subscription mode
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionModeRequest
     */
    public updateSubscriptionModeWithHttpInfo(consolidationKey: string, updateSubscriptionModeRequest: UpdateSubscriptionModeRequest, _options?: Configuration): Observable<HttpInfo<SubscriptionModeResponse>> {
        const requestContextPromise = this.requestFactory.updateSubscriptionMode(consolidationKey, updateSubscriptionModeRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateSubscriptionModeWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires authentication. User can only change subscription mode for their own consolidation.
     * Update subscription mode
     * @param consolidationKey Consolidation key
     * @param updateSubscriptionModeRequest
     */
    public updateSubscriptionMode(consolidationKey: string, updateSubscriptionModeRequest: UpdateSubscriptionModeRequest, _options?: Configuration): Observable<SubscriptionModeResponse> {
        return this.updateSubscriptionModeWithHttpInfo(consolidationKey, updateSubscriptionModeRequest, _options).pipe(map((apiResponse: HttpInfo<SubscriptionModeResponse>) => apiResponse.data));
    }

}

import { TDHApiRequestFactory, TDHApiResponseProcessor} from "../apis/TDHApi";
export class ObservableTDHApi {
    private requestFactory: TDHApiRequestFactory;
    private responseProcessor: TDHApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: TDHApiRequestFactory,
        responseProcessor?: TDHApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new TDHApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new TDHApiResponseProcessor();
    }

    /**
     * Returns the consolidated TDH data for a given identity. The identity can be a profile handle, wallet address, ENS name, or consolidation key.
     * Get consolidated TDH for an identity
     * @param identity Profile handle, wallet address, ENS name, or consolidation key
     */
    public getConsolidatedTdhWithHttpInfo(identity: string, _options?: Configuration): Observable<HttpInfo<ApiConsolidatedTdh>> {
        const requestContextPromise = this.requestFactory.getConsolidatedTdh(identity, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getConsolidatedTdhWithHttpInfo(rsp)));
            }));
    }

    /**
     * Returns the consolidated TDH data for a given identity. The identity can be a profile handle, wallet address, ENS name, or consolidation key.
     * Get consolidated TDH for an identity
     * @param identity Profile handle, wallet address, ENS name, or consolidation key
     */
    public getConsolidatedTdh(identity: string, _options?: Configuration): Observable<ApiConsolidatedTdh> {
        return this.getConsolidatedTdhWithHttpInfo(identity, _options).pipe(map((apiResponse: HttpInfo<ApiConsolidatedTdh>) => apiResponse.data));
    }

}

import { TDHEditionsApiRequestFactory, TDHEditionsApiResponseProcessor} from "../apis/TDHEditionsApi";
export class ObservableTDHEditionsApi {
    private requestFactory: TDHEditionsApiRequestFactory;
    private responseProcessor: TDHEditionsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: TDHEditionsApiRequestFactory,
        responseProcessor?: TDHEditionsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new TDHEditionsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new TDHEditionsApiResponseProcessor();
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
    public getTdhEditionsByConsolidationKeyWithHttpInfo(consolidationKey: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiTdhEditionsPage>> {
        const requestContextPromise = this.requestFactory.getTdhEditionsByConsolidationKey(consolidationKey, contract, tokenId, editionId, sort, sortDirection, page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getTdhEditionsByConsolidationKeyWithHttpInfo(rsp)));
            }));
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
    public getTdhEditionsByConsolidationKey(consolidationKey: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<ApiTdhEditionsPage> {
        return this.getTdhEditionsByConsolidationKeyWithHttpInfo(consolidationKey, contract, tokenId, editionId, sort, sortDirection, page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiTdhEditionsPage>) => apiResponse.data));
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
    public getTdhEditionsByIdentityWithHttpInfo(identity: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiTdhEditionsPage>> {
        const requestContextPromise = this.requestFactory.getTdhEditionsByIdentity(identity, contract, tokenId, editionId, sort, sortDirection, page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getTdhEditionsByIdentityWithHttpInfo(rsp)));
            }));
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
    public getTdhEditionsByIdentity(identity: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<ApiTdhEditionsPage> {
        return this.getTdhEditionsByIdentityWithHttpInfo(identity, contract, tokenId, editionId, sort, sortDirection, page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiTdhEditionsPage>) => apiResponse.data));
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
    public getTdhEditionsByWalletWithHttpInfo(wallet: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiTdhEditionsPage>> {
        const requestContextPromise = this.requestFactory.getTdhEditionsByWallet(wallet, contract, tokenId, editionId, sort, sortDirection, page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getTdhEditionsByWalletWithHttpInfo(rsp)));
            }));
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
    public getTdhEditionsByWallet(wallet: string, contract?: string, tokenId?: number, editionId?: number, sort?: 'id' | 'hodl_rate' | 'days_held' | 'balance' | 'edition_id' | 'contract', sortDirection?: ApiPageSortDirection, page?: number, pageSize?: number, _options?: Configuration): Observable<ApiTdhEditionsPage> {
        return this.getTdhEditionsByWalletWithHttpInfo(wallet, contract, tokenId, editionId, sort, sortDirection, page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiTdhEditionsPage>) => apiResponse.data));
    }

}

import { TransactionsApiRequestFactory, TransactionsApiResponseProcessor} from "../apis/TransactionsApi";
export class ObservableTransactionsApi {
    private requestFactory: TransactionsApiRequestFactory;
    private responseProcessor: TransactionsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: TransactionsApiRequestFactory,
        responseProcessor?: TransactionsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new TransactionsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new TransactionsApiResponseProcessor();
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
    public getTransactionsWithHttpInfo(pageSize?: number, page?: number, wallets?: string, contract?: string, nfts?: string, filter?: 'sales' | 'purchases' | 'transfers' | 'airdrops' | 'burns', _options?: Configuration): Observable<HttpInfo<Array<ApiTransactionPage>>> {
        const requestContextPromise = this.requestFactory.getTransactions(pageSize, page, wallets, contract, nfts, filter, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getTransactionsWithHttpInfo(rsp)));
            }));
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
    public getTransactions(pageSize?: number, page?: number, wallets?: string, contract?: string, nfts?: string, filter?: 'sales' | 'purchases' | 'transfers' | 'airdrops' | 'burns', _options?: Configuration): Observable<Array<ApiTransactionPage>> {
        return this.getTransactionsWithHttpInfo(pageSize, page, wallets, contract, nfts, filter, _options).pipe(map((apiResponse: HttpInfo<Array<ApiTransactionPage>>) => apiResponse.data));
    }

}

import { WavesApiRequestFactory, WavesApiResponseProcessor} from "../apis/WavesApi";
export class ObservableWavesApi {
    private requestFactory: WavesApiRequestFactory;
    private responseProcessor: WavesApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: WavesApiRequestFactory,
        responseProcessor?: WavesApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new WavesApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new WavesApiResponseProcessor();
    }

    /**
     * Create a direct message wave
     * @param createDirectMessageWaveRequest
     */
    public createDirectMessageWaveWithHttpInfo(createDirectMessageWaveRequest: CreateDirectMessageWaveRequest, _options?: Configuration): Observable<HttpInfo<ApiWave>> {
        const requestContextPromise = this.requestFactory.createDirectMessageWave(createDirectMessageWaveRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createDirectMessageWaveWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create a direct message wave
     * @param createDirectMessageWaveRequest
     */
    public createDirectMessageWave(createDirectMessageWaveRequest: CreateDirectMessageWaveRequest, _options?: Configuration): Observable<ApiWave> {
        return this.createDirectMessageWaveWithHttpInfo(createDirectMessageWaveRequest, _options).pipe(map((apiResponse: HttpInfo<ApiWave>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Create new wave
     * @param apiCreateNewWave
     */
    public createWaveWithHttpInfo(apiCreateNewWave: ApiCreateNewWave, _options?: Configuration): Observable<HttpInfo<ApiWave>> {
        const requestContextPromise = this.requestFactory.createWave(apiCreateNewWave, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createWaveWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Create new wave
     * @param apiCreateNewWave
     */
    public createWave(apiCreateNewWave: ApiCreateNewWave, _options?: Configuration): Observable<ApiWave> {
        return this.createWaveWithHttpInfo(apiCreateNewWave, _options).pipe(map((apiResponse: HttpInfo<ApiWave>) => apiResponse.data));
    }

    /**
     * Create curation group for wave
     * @param id
     * @param apiWaveCurationGroupRequest
     */
    public createWaveCurationGroupWithHttpInfo(id: string, apiWaveCurationGroupRequest: ApiWaveCurationGroupRequest, _options?: Configuration): Observable<HttpInfo<ApiWaveCurationGroup>> {
        const requestContextPromise = this.requestFactory.createWaveCurationGroup(id, apiWaveCurationGroupRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createWaveCurationGroupWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create curation group for wave
     * @param id
     * @param apiWaveCurationGroupRequest
     */
    public createWaveCurationGroup(id: string, apiWaveCurationGroupRequest: ApiWaveCurationGroupRequest, _options?: Configuration): Observable<ApiWaveCurationGroup> {
        return this.createWaveCurationGroupWithHttpInfo(id, apiWaveCurationGroupRequest, _options).pipe(map((apiResponse: HttpInfo<ApiWaveCurationGroup>) => apiResponse.data));
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for wave PFP
     * @param apiCreateMediaUploadUrlRequest
     */
    public createWaveMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Observable<HttpInfo<ApiCreateMediaUrlResponse>> {
        const requestContextPromise = this.requestFactory.createWaveMediaUrl(apiCreateMediaUploadUrlRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createWaveMediaUrlWithHttpInfo(rsp)));
            }));
    }

    /**
     * Requires the user to be authenticated
     * Create S3 URL for wave PFP
     * @param apiCreateMediaUploadUrlRequest
     */
    public createWaveMediaUrl(apiCreateMediaUploadUrlRequest: ApiCreateMediaUploadUrlRequest, _options?: Configuration): Observable<ApiCreateMediaUrlResponse> {
        return this.createWaveMediaUrlWithHttpInfo(apiCreateMediaUploadUrlRequest, _options).pipe(map((apiResponse: HttpInfo<ApiCreateMediaUrlResponse>) => apiResponse.data));
    }

    /**
     * Delete wave by ID
     * @param id
     */
    public deleteWaveByIdWithHttpInfo(id: string, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.deleteWaveById(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteWaveByIdWithHttpInfo(rsp)));
            }));
    }

    /**
     * Delete wave by ID
     * @param id
     */
    public deleteWaveById(id: string, _options?: Configuration): Observable<void> {
        return this.deleteWaveByIdWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Delete curation group from wave
     * @param id
     * @param curationGroupId
     */
    public deleteWaveCurationGroupWithHttpInfo(id: string, curationGroupId: string, _options?: Configuration): Observable<HttpInfo<void>> {
        const requestContextPromise = this.requestFactory.deleteWaveCurationGroup(id, curationGroupId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteWaveCurationGroupWithHttpInfo(rsp)));
            }));
    }

    /**
     * Delete curation group from wave
     * @param id
     * @param curationGroupId
     */
    public deleteWaveCurationGroup(id: string, curationGroupId: string, _options?: Configuration): Observable<void> {
        return this.deleteWaveCurationGroupWithHttpInfo(id, curationGroupId, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Pause can only be deleted if no past decisions have already been skipped based on it.
     * Delete wave decision pause
     * @param waveId wave id
     * @param id pause id
     */
    public deleteWaveDecisionPauseWithHttpInfo(waveId: string, id: number, _options?: Configuration): Observable<HttpInfo<ApiWave>> {
        const requestContextPromise = this.requestFactory.deleteWaveDecisionPause(waveId, id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteWaveDecisionPauseWithHttpInfo(rsp)));
            }));
    }

    /**
     * Pause can only be deleted if no past decisions have already been skipped based on it.
     * Delete wave decision pause
     * @param waveId wave id
     * @param id pause id
     */
    public deleteWaveDecisionPause(waveId: string, id: number, _options?: Configuration): Observable<ApiWave> {
        return this.deleteWaveDecisionPauseWithHttpInfo(waveId, id, _options).pipe(map((apiResponse: HttpInfo<ApiWave>) => apiResponse.data));
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
    public getDropLogsWithHttpInfo(id: string, logTypes?: string, dropId?: string, offset?: number, limit?: number, sortDirection?: 'ASC' | 'DESC', _options?: Configuration): Observable<HttpInfo<Array<ApiWaveLog>>> {
        const requestContextPromise = this.requestFactory.getDropLogs(id, logTypes, dropId, offset, limit, sortDirection, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDropLogsWithHttpInfo(rsp)));
            }));
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
    public getDropLogs(id: string, logTypes?: string, dropId?: string, offset?: number, limit?: number, sortDirection?: 'ASC' | 'DESC', _options?: Configuration): Observable<Array<ApiWaveLog>> {
        return this.getDropLogsWithHttpInfo(id, logTypes, dropId, offset, limit, sortDirection, _options).pipe(map((apiResponse: HttpInfo<Array<ApiWaveLog>>) => apiResponse.data));
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
    public getDropsOfWaveWithHttpInfo(id: string, dropId?: string, limit?: number, serialNoLimit?: number, searchStrategy?: ApiDropSearchStrategy, serialNoLessThan?: number, dropType?: ApiDropType, _options?: Configuration): Observable<HttpInfo<ApiWaveDropsFeed>> {
        const requestContextPromise = this.requestFactory.getDropsOfWave(id, dropId, limit, serialNoLimit, searchStrategy, serialNoLessThan, dropType, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDropsOfWaveWithHttpInfo(rsp)));
            }));
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
    public getDropsOfWave(id: string, dropId?: string, limit?: number, serialNoLimit?: number, searchStrategy?: ApiDropSearchStrategy, serialNoLessThan?: number, dropType?: ApiDropType, _options?: Configuration): Observable<ApiWaveDropsFeed> {
        return this.getDropsOfWaveWithHttpInfo(id, dropId, limit, serialNoLimit, searchStrategy, serialNoLessThan, dropType, _options).pipe(map((apiResponse: HttpInfo<ApiWaveDropsFeed>) => apiResponse.data));
    }

    /**
     * Returns up to 25 public waves ranked by activity in the last 24 hours.
     * Get hot waves overview.
     */
    public getHotWavesOverviewWithHttpInfo(_options?: Configuration): Observable<HttpInfo<Array<ApiWave>>> {
        const requestContextPromise = this.requestFactory.getHotWavesOverview(_options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getHotWavesOverviewWithHttpInfo(rsp)));
            }));
    }

    /**
     * Returns up to 25 public waves ranked by activity in the last 24 hours.
     * Get hot waves overview.
     */
    public getHotWavesOverview(_options?: Configuration): Observable<Array<ApiWave>> {
        return this.getHotWavesOverviewWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Array<ApiWave>>) => apiResponse.data));
    }

    /**
     * Get wave by ID.
     * @param id
     */
    public getWaveByIdWithHttpInfo(id: string, _options?: Configuration): Observable<HttpInfo<ApiWave>> {
        const requestContextPromise = this.requestFactory.getWaveById(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getWaveByIdWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get wave by ID.
     * @param id
     */
    public getWaveById(id: string, _options?: Configuration): Observable<ApiWave> {
        return this.getWaveByIdWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<ApiWave>) => apiResponse.data));
    }

    /**
     * Get already decided wave decision outcomes
     * @param id
     * @param [sortDirection]
     * @param [sort]
     * @param [page]
     * @param [pageSize]
     */
    public getWaveDecisionsWithHttpInfo(id: string, sortDirection?: 'ASC' | 'DESC', sort?: 'decision_time', page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiWaveDecisionsPage>> {
        const requestContextPromise = this.requestFactory.getWaveDecisions(id, sortDirection, sort, page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getWaveDecisionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get already decided wave decision outcomes
     * @param id
     * @param [sortDirection]
     * @param [sort]
     * @param [page]
     * @param [pageSize]
     */
    public getWaveDecisions(id: string, sortDirection?: 'ASC' | 'DESC', sort?: 'decision_time', page?: number, pageSize?: number, _options?: Configuration): Observable<ApiWaveDecisionsPage> {
        return this.getWaveDecisionsWithHttpInfo(id, sortDirection, sort, page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiWaveDecisionsPage>) => apiResponse.data));
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
    public getWaveLeaderboardWithHttpInfo(id: string, pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'RANK' | 'REALTIME_VOTE' | 'MY_REALTIME_VOTE' | 'CREATED_AT' | 'PRICE' | 'RATING_PREDICTION' | 'TREND', priceCurrency?: string, minPrice?: number, maxPrice?: number, curatedByGroup?: string, _options?: Configuration): Observable<HttpInfo<ApiDropsLeaderboardPage>> {
        const requestContextPromise = this.requestFactory.getWaveLeaderboard(id, pageSize, page, sortDirection, sort, priceCurrency, minPrice, maxPrice, curatedByGroup, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getWaveLeaderboardWithHttpInfo(rsp)));
            }));
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
    public getWaveLeaderboard(id: string, pageSize?: number, page?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'RANK' | 'REALTIME_VOTE' | 'MY_REALTIME_VOTE' | 'CREATED_AT' | 'PRICE' | 'RATING_PREDICTION' | 'TREND', priceCurrency?: string, minPrice?: number, maxPrice?: number, curatedByGroup?: string, _options?: Configuration): Observable<ApiDropsLeaderboardPage> {
        return this.getWaveLeaderboardWithHttpInfo(id, pageSize, page, sortDirection, sort, priceCurrency, minPrice, maxPrice, curatedByGroup, _options).pipe(map((apiResponse: HttpInfo<ApiDropsLeaderboardPage>) => apiResponse.data));
    }

    /**
     * Get wave outcome distribution
     * @param waveId
     * @param outcomeIndex
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getWaveOutcomeDistributionWithHttpInfo(waveId: string, outcomeIndex: string, sortDirection?: 'ASC' | 'DESC', page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiWaveOutcomeDistributionItemsPage>> {
        const requestContextPromise = this.requestFactory.getWaveOutcomeDistribution(waveId, outcomeIndex, sortDirection, page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getWaveOutcomeDistributionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get wave outcome distribution
     * @param waveId
     * @param outcomeIndex
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getWaveOutcomeDistribution(waveId: string, outcomeIndex: string, sortDirection?: 'ASC' | 'DESC', page?: number, pageSize?: number, _options?: Configuration): Observable<ApiWaveOutcomeDistributionItemsPage> {
        return this.getWaveOutcomeDistributionWithHttpInfo(waveId, outcomeIndex, sortDirection, page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiWaveOutcomeDistributionItemsPage>) => apiResponse.data));
    }

    /**
     * Get wave outcomes
     * @param waveId
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getWaveOutcomesWithHttpInfo(waveId: string, sortDirection?: 'ASC' | 'DESC', page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiWaveOutcomesPage>> {
        const requestContextPromise = this.requestFactory.getWaveOutcomes(waveId, sortDirection, page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getWaveOutcomesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get wave outcomes
     * @param waveId
     * @param [sortDirection]
     * @param [page]
     * @param [pageSize]
     */
    public getWaveOutcomes(waveId: string, sortDirection?: 'ASC' | 'DESC', page?: number, pageSize?: number, _options?: Configuration): Observable<ApiWaveOutcomesPage> {
        return this.getWaveOutcomesWithHttpInfo(waveId, sortDirection, page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiWaveOutcomesPage>) => apiResponse.data));
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
    public getWaveVotersInfoWithHttpInfo(id: string, dropId?: string, page?: number, pageSize?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'ABSOLUTE' | 'POSITIVE' | 'NEGATIVE', _options?: Configuration): Observable<HttpInfo<ApiWaveVotersPage>> {
        const requestContextPromise = this.requestFactory.getWaveVotersInfo(id, dropId, page, pageSize, sortDirection, sort, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getWaveVotersInfoWithHttpInfo(rsp)));
            }));
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
    public getWaveVotersInfo(id: string, dropId?: string, page?: number, pageSize?: number, sortDirection?: 'ASC' | 'DESC', sort?: 'ABSOLUTE' | 'POSITIVE' | 'NEGATIVE', _options?: Configuration): Observable<ApiWaveVotersPage> {
        return this.getWaveVotersInfoWithHttpInfo(id, dropId, page, pageSize, sortDirection, sort, _options).pipe(map((apiResponse: HttpInfo<ApiWaveVotersPage>) => apiResponse.data));
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
    public getWavesWithHttpInfo(name?: string, author?: string, limit?: number, serialNoLessThan?: number, groupId?: string, directMessage?: boolean, _options?: Configuration): Observable<HttpInfo<Array<ApiWave>>> {
        const requestContextPromise = this.requestFactory.getWaves(name, author, limit, serialNoLessThan, groupId, directMessage, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getWavesWithHttpInfo(rsp)));
            }));
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
    public getWaves(name?: string, author?: string, limit?: number, serialNoLessThan?: number, groupId?: string, directMessage?: boolean, _options?: Configuration): Observable<Array<ApiWave>> {
        return this.getWavesWithHttpInfo(name, author, limit, serialNoLessThan, groupId, directMessage, _options).pipe(map((apiResponse: HttpInfo<Array<ApiWave>>) => apiResponse.data));
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
    public getWavesOverviewWithHttpInfo(type: ApiWavesOverviewType, limit?: number, offset?: number, pinned?: ApiWavesPinFilter, onlyWavesFollowedByAuthenticatedUser?: boolean, directMessage?: boolean, _options?: Configuration): Observable<HttpInfo<Array<ApiWave>>> {
        const requestContextPromise = this.requestFactory.getWavesOverview(type, limit, offset, pinned, onlyWavesFollowedByAuthenticatedUser, directMessage, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getWavesOverviewWithHttpInfo(rsp)));
            }));
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
    public getWavesOverview(type: ApiWavesOverviewType, limit?: number, offset?: number, pinned?: ApiWavesPinFilter, onlyWavesFollowedByAuthenticatedUser?: boolean, directMessage?: boolean, _options?: Configuration): Observable<Array<ApiWave>> {
        return this.getWavesOverviewWithHttpInfo(type, limit, offset, pinned, onlyWavesFollowedByAuthenticatedUser, directMessage, _options).pipe(map((apiResponse: HttpInfo<Array<ApiWave>>) => apiResponse.data));
    }

    /**
     * List curation groups configured for wave
     * @param id
     */
    public listWaveCurationGroupsWithHttpInfo(id: string, _options?: Configuration): Observable<HttpInfo<Array<ApiWaveCurationGroup>>> {
        const requestContextPromise = this.requestFactory.listWaveCurationGroups(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listWaveCurationGroupsWithHttpInfo(rsp)));
            }));
    }

    /**
     * List curation groups configured for wave
     * @param id
     */
    public listWaveCurationGroups(id: string, _options?: Configuration): Observable<Array<ApiWaveCurationGroup>> {
        return this.listWaveCurationGroupsWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<Array<ApiWaveCurationGroup>>) => apiResponse.data));
    }

    /**
     * Mute a wave
     * @param id
     */
    public muteWaveWithHttpInfo(id: string, _options?: Configuration): Observable<HttpInfo<any>> {
        const requestContextPromise = this.requestFactory.muteWave(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.muteWaveWithHttpInfo(rsp)));
            }));
    }

    /**
     * Mute a wave
     * @param id
     */
    public muteWave(id: string, _options?: Configuration): Observable<any> {
        return this.muteWaveWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * Pin a wave
     * @param id
     */
    public pinWaveWithHttpInfo(id: string, _options?: Configuration): Observable<HttpInfo<any>> {
        const requestContextPromise = this.requestFactory.pinWave(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.pinWaveWithHttpInfo(rsp)));
            }));
    }

    /**
     * Pin a wave
     * @param id
     */
    public pinWave(id: string, _options?: Configuration): Observable<any> {
        return this.pinWaveWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * Search for drops in wave by content
     * @param waveId
     * @param term
     * @param [page]
     * @param [size]
     */
    public searchDropsInWaveWithHttpInfo(waveId: string, term: string, page?: number, size?: number, _options?: Configuration): Observable<HttpInfo<ApiDropWithoutWavesPageWithoutCount>> {
        const requestContextPromise = this.requestFactory.searchDropsInWave(waveId, term, page, size, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.searchDropsInWaveWithHttpInfo(rsp)));
            }));
    }

    /**
     * Search for drops in wave by content
     * @param waveId
     * @param term
     * @param [page]
     * @param [size]
     */
    public searchDropsInWave(waveId: string, term: string, page?: number, size?: number, _options?: Configuration): Observable<ApiDropWithoutWavesPageWithoutCount> {
        return this.searchDropsInWaveWithHttpInfo(waveId, term, page, size, _options).pipe(map((apiResponse: HttpInfo<ApiDropWithoutWavesPageWithoutCount>) => apiResponse.data));
    }

    /**
     * Subscribe authenticated user to wave actions.
     * @param id
     * @param apiWaveSubscriptionActions
     */
    public subscribeToWaveActionsWithHttpInfo(id: string, apiWaveSubscriptionActions: ApiWaveSubscriptionActions, _options?: Configuration): Observable<HttpInfo<ApiWaveSubscriptionActions>> {
        const requestContextPromise = this.requestFactory.subscribeToWaveActions(id, apiWaveSubscriptionActions, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.subscribeToWaveActionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Subscribe authenticated user to wave actions.
     * @param id
     * @param apiWaveSubscriptionActions
     */
    public subscribeToWaveActions(id: string, apiWaveSubscriptionActions: ApiWaveSubscriptionActions, _options?: Configuration): Observable<ApiWaveSubscriptionActions> {
        return this.subscribeToWaveActionsWithHttpInfo(id, apiWaveSubscriptionActions, _options).pipe(map((apiResponse: HttpInfo<ApiWaveSubscriptionActions>) => apiResponse.data));
    }

    /**
     * Unpin a wave
     * @param id
     */
    public unPinWaveWithHttpInfo(id: string, _options?: Configuration): Observable<HttpInfo<any>> {
        const requestContextPromise = this.requestFactory.unPinWave(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.unPinWaveWithHttpInfo(rsp)));
            }));
    }

    /**
     * Unpin a wave
     * @param id
     */
    public unPinWave(id: string, _options?: Configuration): Observable<any> {
        return this.unPinWaveWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * Unmute a wave
     * @param id
     */
    public unmuteWaveWithHttpInfo(id: string, _options?: Configuration): Observable<HttpInfo<any>> {
        const requestContextPromise = this.requestFactory.unmuteWave(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.unmuteWaveWithHttpInfo(rsp)));
            }));
    }

    /**
     * Unmute a wave
     * @param id
     */
    public unmuteWave(id: string, _options?: Configuration): Observable<any> {
        return this.unmuteWaveWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * Unsubscribe authenticated user from wave actions.
     * @param id
     * @param apiWaveSubscriptionActions
     */
    public unsubscribeFromWaveActionsWithHttpInfo(id: string, apiWaveSubscriptionActions: ApiWaveSubscriptionActions, _options?: Configuration): Observable<HttpInfo<ApiWaveSubscriptionActions>> {
        const requestContextPromise = this.requestFactory.unsubscribeFromWaveActions(id, apiWaveSubscriptionActions, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.unsubscribeFromWaveActionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Unsubscribe authenticated user from wave actions.
     * @param id
     * @param apiWaveSubscriptionActions
     */
    public unsubscribeFromWaveActions(id: string, apiWaveSubscriptionActions: ApiWaveSubscriptionActions, _options?: Configuration): Observable<ApiWaveSubscriptionActions> {
        return this.unsubscribeFromWaveActionsWithHttpInfo(id, apiWaveSubscriptionActions, _options).pipe(map((apiResponse: HttpInfo<ApiWaveSubscriptionActions>) => apiResponse.data));
    }

    /**
     * Update wave by ID
     * @param id
     * @param apiUpdateWaveRequest
     */
    public updateWaveByIdWithHttpInfo(id: string, apiUpdateWaveRequest: ApiUpdateWaveRequest, _options?: Configuration): Observable<HttpInfo<ApiWave>> {
        const requestContextPromise = this.requestFactory.updateWaveById(id, apiUpdateWaveRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateWaveByIdWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update wave by ID
     * @param id
     * @param apiUpdateWaveRequest
     */
    public updateWaveById(id: string, apiUpdateWaveRequest: ApiUpdateWaveRequest, _options?: Configuration): Observable<ApiWave> {
        return this.updateWaveByIdWithHttpInfo(id, apiUpdateWaveRequest, _options).pipe(map((apiResponse: HttpInfo<ApiWave>) => apiResponse.data));
    }

    /**
     * Update curation group for wave
     * @param id
     * @param curationGroupId
     * @param apiWaveCurationGroupRequest
     */
    public updateWaveCurationGroupWithHttpInfo(id: string, curationGroupId: string, apiWaveCurationGroupRequest: ApiWaveCurationGroupRequest, _options?: Configuration): Observable<HttpInfo<ApiWaveCurationGroup>> {
        const requestContextPromise = this.requestFactory.updateWaveCurationGroup(id, curationGroupId, apiWaveCurationGroupRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateWaveCurationGroupWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update curation group for wave
     * @param id
     * @param curationGroupId
     * @param apiWaveCurationGroupRequest
     */
    public updateWaveCurationGroup(id: string, curationGroupId: string, apiWaveCurationGroupRequest: ApiWaveCurationGroupRequest, _options?: Configuration): Observable<ApiWaveCurationGroup> {
        return this.updateWaveCurationGroupWithHttpInfo(id, curationGroupId, apiWaveCurationGroupRequest, _options).pipe(map((apiResponse: HttpInfo<ApiWaveCurationGroup>) => apiResponse.data));
    }

    /**
     * Create or edit wave decision pause
     * @param id wave id
     * @param apiUpdateWaveDecisionPause
     */
    public updateWaveDecisionPauseWithHttpInfo(id: string, apiUpdateWaveDecisionPause: ApiUpdateWaveDecisionPause, _options?: Configuration): Observable<HttpInfo<ApiWave>> {
        const requestContextPromise = this.requestFactory.updateWaveDecisionPause(id, apiUpdateWaveDecisionPause, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateWaveDecisionPauseWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create or edit wave decision pause
     * @param id wave id
     * @param apiUpdateWaveDecisionPause
     */
    public updateWaveDecisionPause(id: string, apiUpdateWaveDecisionPause: ApiUpdateWaveDecisionPause, _options?: Configuration): Observable<ApiWave> {
        return this.updateWaveDecisionPauseWithHttpInfo(id, apiUpdateWaveDecisionPause, _options).pipe(map((apiResponse: HttpInfo<ApiWave>) => apiResponse.data));
    }

}

import { XTDHApiRequestFactory, XTDHApiResponseProcessor} from "../apis/XTDHApi";
export class ObservableXTDHApi {
    private requestFactory: XTDHApiRequestFactory;
    private responseProcessor: XTDHApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: XTDHApiRequestFactory,
        responseProcessor?: XTDHApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new XTDHApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new XTDHApiResponseProcessor();
    }

    /**
     * Get global xTDH stats
     */
    public getGlobalXTdhStatsWithHttpInfo(_options?: Configuration): Observable<HttpInfo<ApiXTdhGlobalStats>> {
        const requestContextPromise = this.requestFactory.getGlobalXTdhStats(_options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getGlobalXTdhStatsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get global xTDH stats
     */
    public getGlobalXTdhStats(_options?: Configuration): Observable<ApiXTdhGlobalStats> {
        return this.getGlobalXTdhStatsWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<ApiXTdhGlobalStats>) => apiResponse.data));
    }

    /**
     * Get identities xTDH stats
     * @param identity
     */
    public getIdentitiesXTdhStatsWithHttpInfo(identity: string, _options?: Configuration): Observable<HttpInfo<ApiXTdhStats>> {
        const requestContextPromise = this.requestFactory.getIdentitiesXTdhStats(identity, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getIdentitiesXTdhStatsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get identities xTDH stats
     * @param identity
     */
    public getIdentitiesXTdhStats(identity: string, _options?: Configuration): Observable<ApiXTdhStats> {
        return this.getIdentitiesXTdhStatsWithHttpInfo(identity, _options).pipe(map((apiResponse: HttpInfo<ApiXTdhStats>) => apiResponse.data));
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
    public getInfoAboutXTdhCollectionsWithHttpInfo(identity?: string, collectionName?: string, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Observable<HttpInfo<ApiXTdhCollectionsPage>> {
        const requestContextPromise = this.requestFactory.getInfoAboutXTdhCollections(identity, collectionName, page, pageSize, sort, order, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getInfoAboutXTdhCollectionsWithHttpInfo(rsp)));
            }));
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
    public getInfoAboutXTdhCollections(identity?: string, collectionName?: string, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Observable<ApiXTdhCollectionsPage> {
        return this.getInfoAboutXTdhCollectionsWithHttpInfo(identity, collectionName, page, pageSize, sort, order, _options).pipe(map((apiResponse: HttpInfo<ApiXTdhCollectionsPage>) => apiResponse.data));
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
    public getInfoAboutXTdhContributorsWithHttpInfo(contract: string, token: number, groupBy?: 'grant' | 'grantor', page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Observable<HttpInfo<ApiXTdhContributionsPage>> {
        const requestContextPromise = this.requestFactory.getInfoAboutXTdhContributors(contract, token, groupBy, page, pageSize, sort, order, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getInfoAboutXTdhContributorsWithHttpInfo(rsp)));
            }));
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
    public getInfoAboutXTdhContributors(contract: string, token: number, groupBy?: 'grant' | 'grantor', page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Observable<ApiXTdhContributionsPage> {
        return this.getInfoAboutXTdhContributorsWithHttpInfo(contract, token, groupBy, page, pageSize, sort, order, _options).pipe(map((apiResponse: HttpInfo<ApiXTdhContributionsPage>) => apiResponse.data));
    }

    /**
     * Get info about xTDH grantees
     * @param [contract]
     * @param [page]
     * @param [pageSize] Default is 20
     * @param [sort] xtdh when omitted
     * @param [order] desc when omitted
     */
    public getInfoAboutXTdhGranteesWithHttpInfo(contract?: string, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Observable<HttpInfo<ApiXTdhGranteesPage>> {
        const requestContextPromise = this.requestFactory.getInfoAboutXTdhGrantees(contract, page, pageSize, sort, order, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getInfoAboutXTdhGranteesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get info about xTDH grantees
     * @param [contract]
     * @param [page]
     * @param [pageSize] Default is 20
     * @param [sort] xtdh when omitted
     * @param [order] desc when omitted
     */
    public getInfoAboutXTdhGrantees(contract?: string, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Observable<ApiXTdhGranteesPage> {
        return this.getInfoAboutXTdhGranteesWithHttpInfo(contract, page, pageSize, sort, order, _options).pipe(map((apiResponse: HttpInfo<ApiXTdhGranteesPage>) => apiResponse.data));
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
    public getInfoAboutXTdhTokensWithHttpInfo(identity?: string, contract?: string, token?: number, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Observable<HttpInfo<ApiXTdhTokensPage>> {
        const requestContextPromise = this.requestFactory.getInfoAboutXTdhTokens(identity, contract, token, page, pageSize, sort, order, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getInfoAboutXTdhTokensWithHttpInfo(rsp)));
            }));
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
    public getInfoAboutXTdhTokens(identity?: string, contract?: string, token?: number, page?: number, pageSize?: number, sort?: 'xtdh' | 'xtdh_rate', order?: 'asc' | 'desc', _options?: Configuration): Observable<ApiXTdhTokensPage> {
        return this.getInfoAboutXTdhTokensWithHttpInfo(identity, contract, token, page, pageSize, sort, order, _options).pipe(map((apiResponse: HttpInfo<ApiXTdhTokensPage>) => apiResponse.data));
    }

    /**
     * Get xTDH grant
     * @param id
     */
    public getXTdhGrantWithHttpInfo(id: string, _options?: Configuration): Observable<HttpInfo<ApiXTdhGrant>> {
        const requestContextPromise = this.requestFactory.getXTdhGrant(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getXTdhGrantWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get xTDH grant
     * @param id
     */
    public getXTdhGrant(id: string, _options?: Configuration): Observable<ApiXTdhGrant> {
        return this.getXTdhGrantWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<ApiXTdhGrant>) => apiResponse.data));
    }

    /**
     * Get xTDH grant tokens
     * @param id
     * @param [sortDirection]
     * @param [sort]
     * @param [page]
     * @param [pageSize]
     */
    public getXTdhGrantTokensWithHttpInfo(id: string, sortDirection?: ApiPageSortDirection, sort?: 'token', page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiXTdhGrantTokensPage>> {
        const requestContextPromise = this.requestFactory.getXTdhGrantTokens(id, sortDirection, sort, page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getXTdhGrantTokensWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get xTDH grant tokens
     * @param id
     * @param [sortDirection]
     * @param [sort]
     * @param [page]
     * @param [pageSize]
     */
    public getXTdhGrantTokens(id: string, sortDirection?: ApiPageSortDirection, sort?: 'token', page?: number, pageSize?: number, _options?: Configuration): Observable<ApiXTdhGrantTokensPage> {
        return this.getXTdhGrantTokensWithHttpInfo(id, sortDirection, sort, page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiXTdhGrantTokensPage>) => apiResponse.data));
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
    public getXTdhGrantsWithHttpInfo(grantor?: string, targetContract?: string, targetCollectionName?: string, targetChain?: string, validFromGt?: number, validFromLt?: number, validToGt?: number, validToLt?: number, status?: string, sortDirection?: ApiPageSortDirection, sort?: 'created_at' | 'valid_from' | 'valid_to' | 'rate', page?: number, pageSize?: number, _options?: Configuration): Observable<HttpInfo<ApiXTdhGrantsPage>> {
        const requestContextPromise = this.requestFactory.getXTdhGrants(grantor, targetContract, targetCollectionName, targetChain, validFromGt, validFromLt, validToGt, validToLt, status, sortDirection, sort, page, pageSize, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getXTdhGrantsWithHttpInfo(rsp)));
            }));
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
    public getXTdhGrants(grantor?: string, targetContract?: string, targetCollectionName?: string, targetChain?: string, validFromGt?: number, validFromLt?: number, validToGt?: number, validToLt?: number, status?: string, sortDirection?: ApiPageSortDirection, sort?: 'created_at' | 'valid_from' | 'valid_to' | 'rate', page?: number, pageSize?: number, _options?: Configuration): Observable<ApiXTdhGrantsPage> {
        return this.getXTdhGrantsWithHttpInfo(grantor, targetContract, targetCollectionName, targetChain, validFromGt, validFromLt, validToGt, validToLt, status, sortDirection, sort, page, pageSize, _options).pipe(map((apiResponse: HttpInfo<ApiXTdhGrantsPage>) => apiResponse.data));
    }

    /**
     * Create xTDH grant
     * @param apiXTdhCreateGrant
     */
    public grantXTdhWithHttpInfo(apiXTdhCreateGrant: ApiXTdhCreateGrant, _options?: Configuration): Observable<HttpInfo<ApiXTdhGrant>> {
        const requestContextPromise = this.requestFactory.grantXTdh(apiXTdhCreateGrant, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.grantXTdhWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create xTDH grant
     * @param apiXTdhCreateGrant
     */
    public grantXTdh(apiXTdhCreateGrant: ApiXTdhCreateGrant, _options?: Configuration): Observable<ApiXTdhGrant> {
        return this.grantXTdhWithHttpInfo(apiXTdhCreateGrant, _options).pipe(map((apiResponse: HttpInfo<ApiXTdhGrant>) => apiResponse.data));
    }

    /**
     * Update xTDH grant
     * @param id
     * @param apiXTdhGrantUpdateRequest
     */
    public updateXTdhGrantWithHttpInfo(id: string, apiXTdhGrantUpdateRequest: ApiXTdhGrantUpdateRequest, _options?: Configuration): Observable<HttpInfo<ApiXTdhGrant>> {
        const requestContextPromise = this.requestFactory.updateXTdhGrant(id, apiXTdhGrantUpdateRequest, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateXTdhGrantWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update xTDH grant
     * @param id
     * @param apiXTdhGrantUpdateRequest
     */
    public updateXTdhGrant(id: string, apiXTdhGrantUpdateRequest: ApiXTdhGrantUpdateRequest, _options?: Configuration): Observable<ApiXTdhGrant> {
        return this.updateXTdhGrantWithHttpInfo(id, apiXTdhGrantUpdateRequest, _options).pipe(map((apiResponse: HttpInfo<ApiXTdhGrant>) => apiResponse.data));
    }

}
