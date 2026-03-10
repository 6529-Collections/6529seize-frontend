# .WavesApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createDirectMessageWave**](WavesApi.md#createDirectMessageWave) | **POST** /waves/direct-message/new | Create a direct message wave
[**createWave**](WavesApi.md#createWave) | **POST** /waves | Create new wave
[**createWaveCurationGroup**](WavesApi.md#createWaveCurationGroup) | **POST** /waves/{id}/curation-groups | Create curation group for wave
[**createWaveMediaUrl**](WavesApi.md#createWaveMediaUrl) | **POST** /wave-media/prep | Create S3 URL for wave PFP
[**deleteWaveById**](WavesApi.md#deleteWaveById) | **DELETE** /waves/{id} | Delete wave by ID
[**deleteWaveCurationGroup**](WavesApi.md#deleteWaveCurationGroup) | **DELETE** /waves/{id}/curation-groups/{curationGroupId} | Delete curation group from wave
[**deleteWaveDecisionPause**](WavesApi.md#deleteWaveDecisionPause) | **DELETE** /waves/{waveId}/pauses/{id} | Delete wave decision pause
[**getDropLogs**](WavesApi.md#getDropLogs) | **GET** /waves/{id}/logs | Get drop logs
[**getDropsOfWave**](WavesApi.md#getDropsOfWave) | **GET** /waves/{id}/drops | Get drops related to wave or parent drop
[**getHotWavesOverview**](WavesApi.md#getHotWavesOverview) | **GET** /waves-overview/hot | Get hot waves overview.
[**getWaveById**](WavesApi.md#getWaveById) | **GET** /waves/{id} | Get wave by ID.
[**getWaveDecisions**](WavesApi.md#getWaveDecisions) | **GET** /waves/{id}/decisions | Get already decided wave decision outcomes
[**getWaveLeaderboard**](WavesApi.md#getWaveLeaderboard) | **GET** /waves/{id}/leaderboard | Get waves leaderboard
[**getWaveOutcomeDistribution**](WavesApi.md#getWaveOutcomeDistribution) | **GET** /waves/{waveId}/outcomes/{outcomeIndex}/distribution | Get wave outcome distribution
[**getWaveOutcomes**](WavesApi.md#getWaveOutcomes) | **GET** /waves/{waveId}/outcomes | Get wave outcomes
[**getWaveVotersInfo**](WavesApi.md#getWaveVotersInfo) | **GET** /waves/{id}/voters | Get info about waves voters (top voters etc)
[**getWaves**](WavesApi.md#getWaves) | **GET** /waves | Get waves.
[**getWavesOverview**](WavesApi.md#getWavesOverview) | **GET** /waves-overview | Get overview of waves by different criteria.
[**listWaveCurationGroups**](WavesApi.md#listWaveCurationGroups) | **GET** /waves/{id}/curation-groups | List curation groups configured for wave
[**muteWave**](WavesApi.md#muteWave) | **POST** /waves/{id}/mute | Mute a wave
[**pinWave**](WavesApi.md#pinWave) | **POST** /waves/{id}/pins | Pin a wave
[**searchDropsInWave**](WavesApi.md#searchDropsInWave) | **GET** /waves/{waveId}/search | Search for drops in wave by content
[**subscribeToWaveActions**](WavesApi.md#subscribeToWaveActions) | **POST** /waves/{id}/subscriptions | Subscribe authenticated user to wave actions.
[**unPinWave**](WavesApi.md#unPinWave) | **DELETE** /waves/{id}/pins | Unpin a wave
[**unmuteWave**](WavesApi.md#unmuteWave) | **DELETE** /waves/{id}/mute | Unmute a wave
[**unsubscribeFromWaveActions**](WavesApi.md#unsubscribeFromWaveActions) | **DELETE** /waves/{id}/subscriptions | Unsubscribe authenticated user from wave actions.
[**updateWaveById**](WavesApi.md#updateWaveById) | **POST** /waves/{id} | Update wave by ID
[**updateWaveCurationGroup**](WavesApi.md#updateWaveCurationGroup) | **POST** /waves/{id}/curation-groups/{curationGroupId} | Update curation group for wave
[**updateWaveDecisionPause**](WavesApi.md#updateWaveDecisionPause) | **POST** /waves/{id}/pauses | Create or edit wave decision pause


# **createDirectMessageWave**
> ApiWave createDirectMessageWave(createDirectMessageWaveRequest)


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiCreateDirectMessageWaveRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiCreateDirectMessageWaveRequest = {
  
  createDirectMessageWaveRequest: {
    identity_addresses: [
      "identity_addresses_example",
    ],
  },
};

const data = await apiInstance.createDirectMessageWave(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createDirectMessageWaveRequest** | **CreateDirectMessageWaveRequest**|  |


### Return type

**ApiWave**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **createWave**
> ApiWave createWave(apiCreateNewWave)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiCreateWaveRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiCreateWaveRequest = {
  
  apiCreateNewWave: {
    name: "name_example",
    picture: "https://example.com/picture.jpg",
    description_drop: {
      title: "title_example",
      parts: [
        {
          content: "content_example",
          quoted_drop: {
            drop_id: "drop_id_example",
            drop_part_id: 3.14,
          },
          media: [
            {
              url: "url_example",
              mime_type: "mime_type_example",
            },
          ],
        },
      ],
      referenced_nfts: [
        {
          contract: "contract_example",
          token: "token_example",
          name: "name_example",
        },
      ],
      mentioned_users: [
        {
          mentioned_profile_id: "mentioned_profile_id_example",
          handle_in_content: "handle_in_content_example",
          current_handle: "current_handle_example",
        },
      ],
      mentioned_waves: [
        {
          wave_name_in_content: "wave_name_in_content_example",
          wave_id: "wave_id_example",
        },
      ],
      metadata: [
        {
          data_key: "data_key_example",
          data_value: "data_value_example",
        },
      ],
      signature: "signature_example",
      is_safe_signature: true,
      signer_address: "signer_address_example",
    },
    voting: {
      scope: {
        group_id: "group_id_example",
      },
      credit_type: "TDH",
      credit_scope: "WAVE",
      credit_category: "credit_category_example",
      creditor_id: "creditor_id_example",
      signature_required: true,
      period: {
        min: 3.14,
        max: 3.14,
      },
      forbid_negative_votes: true,
    },
    visibility: {
      scope: {
        group_id: "group_id_example",
      },
    },
    participation: {
      scope: {
        group_id: "group_id_example",
      },
      no_of_applications_allowed_per_participant: 1,
      required_media: [
        "IMAGE",
      ],
      required_metadata: [
        {
          name: "name_example",
          type: "STRING",
        },
      ],
      signature_required: true,
      terms: "terms_example",
      period: {
        min: 3.14,
        max: 3.14,
      },
    },
    chat: {
      scope: {
        group_id: "group_id_example",
      },
      enabled: true,
    },
    wave: {
      type: "APPROVE",
      winning_thresholds: {
        min: 3.14,
        max: 3.14,
      },
      max_winners: 1,
      time_lock_ms: 1,
      admin_group: {
        group_id: "group_id_example",
      },
      decisions_strategy: {
        first_decision_time: 3.14,
        subsequent_decisions: [
          1,
        ],
        is_rolling: true,
      },
      admin_drop_deletion_enabled: true,
    },
    outcomes: [
      {
        type: "AUTOMATIC",
        subtype: "CREDIT_DISTRIBUTION",
        description: "description_example",
        credit: "REP",
        rep_category: "rep_category_example",
        amount: 3.14,
        distribution: [
          {
            amount: 3.14,
            description: "description_example",
          },
        ],
      },
    ],
  },
};

const data = await apiInstance.createWave(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCreateNewWave** | **ApiCreateNewWave**|  |


### Return type

**ApiWave**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **createWaveCurationGroup**
> ApiWaveCurationGroup createWaveCurationGroup(apiWaveCurationGroupRequest)


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiCreateWaveCurationGroupRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiCreateWaveCurationGroupRequest = {
  
  id: "id_example",
  
  apiWaveCurationGroupRequest: {
    name: "name_example",
    group_id: "group_id_example",
  },
};

const data = await apiInstance.createWaveCurationGroup(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiWaveCurationGroupRequest** | **ApiWaveCurationGroupRequest**|  |
 **id** | [**string**] |  | defaults to undefined


### Return type

**ApiWaveCurationGroup**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **createWaveMediaUrl**
> ApiCreateMediaUrlResponse createWaveMediaUrl(apiCreateMediaUploadUrlRequest)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiCreateWaveMediaUrlRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiCreateWaveMediaUrlRequest = {
  
  apiCreateMediaUploadUrlRequest: null,
};

const data = await apiInstance.createWaveMediaUrl(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCreateMediaUploadUrlRequest** | **ApiCreateMediaUploadUrlRequest**|  |


### Return type

**ApiCreateMediaUrlResponse**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **deleteWaveById**
> void deleteWaveById()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiDeleteWaveByIdRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiDeleteWaveByIdRequest = {
  
  id: "id_example",
};

const data = await apiInstance.deleteWaveById(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**void**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**404** | Wave not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **deleteWaveCurationGroup**
> void deleteWaveCurationGroup()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiDeleteWaveCurationGroupRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiDeleteWaveCurationGroupRequest = {
  
  id: "id_example",
  
  curationGroupId: "curationGroupId_example",
};

const data = await apiInstance.deleteWaveCurationGroup(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined
 **curationGroupId** | [**string**] |  | defaults to undefined


### Return type

**void**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **deleteWaveDecisionPause**
> ApiWave deleteWaveDecisionPause()

Pause can only be deleted if no past decisions have already been skipped based on it.

### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiDeleteWaveDecisionPauseRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiDeleteWaveDecisionPauseRequest = {
    // wave id
  waveId: "waveId_example",
    // pause id
  id: 1,
};

const data = await apiInstance.deleteWaveDecisionPause(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **waveId** | [**string**] | wave id | defaults to undefined
 **id** | [**number**] | pause id | defaults to undefined


### Return type

**ApiWave**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**404** | Wave or pause not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getDropLogs**
> Array<ApiWaveLog> getDropLogs()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiGetDropLogsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiGetDropLogsRequest = {
    // Filter by wave ID
  id: "id_example",
    // Filter by log type (comma separated) (optional)
  logTypes: "log_types_example",
    // Filter by drop ID (optional)
  dropId: "drop_id_example",
  
  offset: 0,
  
  limit: 20,
    // Default is DESC (optional)
  sortDirection: "ASC",
};

const data = await apiInstance.getDropLogs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] | Filter by wave ID | defaults to undefined
 **logTypes** | [**string**] | Filter by log type (comma separated) | (optional) defaults to undefined
 **dropId** | [**string**] | Filter by drop ID | (optional) defaults to undefined
 **offset** | [**number**] |  | (optional) defaults to undefined
 **limit** | [**number**] |  | (optional) defaults to 20
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** | Default is DESC | (optional) defaults to undefined


### Return type

**Array<ApiWaveLog>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Wave not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getDropsOfWave**
> ApiWaveDropsFeed getDropsOfWave()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiGetDropsOfWaveRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiGetDropsOfWaveRequest = {
  
  id: "id_example",
  
  dropId: "drop_id_example",
  
  limit: 20,
    // Use instead of serial_no_less_than. If you use serial_no_less_than and this then serial_no_less_than is preferred (until future when it\"s deleted) (optional)
  serialNoLimit: 1,
    // Use in combination with serial_no_limit. If this not set then FIND_OLDER is used. If serial_no_less_than is set then this is ignored. (optional)
  searchStrategy: "FIND_OLDER",
  
  serialNoLessThan: 1,
    // Filter by drop type (optional)
  dropType: "CHAT",
};

const data = await apiInstance.getDropsOfWave(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined
 **dropId** | [**string**] |  | (optional) defaults to undefined
 **limit** | [**number**] |  | (optional) defaults to 20
 **serialNoLimit** | [**number**] | Use instead of serial_no_less_than. If you use serial_no_less_than and this then serial_no_less_than is preferred (until future when it\&quot;s deleted) | (optional) defaults to undefined
 **searchStrategy** | **ApiDropSearchStrategy** | Use in combination with serial_no_limit. If this not set then FIND_OLDER is used. If serial_no_less_than is set then this is ignored. | (optional) defaults to undefined
 **serialNoLessThan** | [**number**] |  | (optional) defaults to undefined
 **dropType** | **ApiDropType** | Filter by drop type | (optional) defaults to undefined


### Return type

**ApiWaveDropsFeed**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getHotWavesOverview**
> Array<ApiWave> getHotWavesOverview()

Returns up to 25 public waves ranked by activity in the last 24 hours.

### Example


```typescript
import { createConfiguration, WavesApi } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request = {};

const data = await apiInstance.getHotWavesOverview(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Array<ApiWave>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getWaveById**
> ApiWave getWaveById()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiGetWaveByIdRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiGetWaveByIdRequest = {
  
  id: "id_example",
};

const data = await apiInstance.getWaveById(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**ApiWave**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Wave not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getWaveDecisions**
> ApiWaveDecisionsPage getWaveDecisions()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiGetWaveDecisionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiGetWaveDecisionsRequest = {
  
  id: "id_example",
  
  sortDirection: "DESC",
  
  sort: "decision_time",
  
  page: 1,
  
  pageSize: 100,
};

const data = await apiInstance.getWaveDecisions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** |  | (optional) defaults to 'DESC'
 **sort** | [**&#39;decision_time&#39;**]**Array<&#39;decision_time&#39;>** |  | (optional) defaults to 'decision_time'
 **page** | [**number**] |  | (optional) defaults to 1
 **pageSize** | [**number**] |  | (optional) defaults to 100


### Return type

**ApiWaveDecisionsPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Wave not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getWaveLeaderboard**
> ApiDropsLeaderboardPage getWaveLeaderboard()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiGetWaveLeaderboardRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiGetWaveLeaderboardRequest = {
  
  id: "id_example",
    // Default is 50 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
    // Default is ASC (optional)
  sortDirection: "ASC",
    // Default is rank (optional)
  sort: "RANK",
    // Optional currency used for min_price/max_price filtering and PRICE sorting (optional)
  priceCurrency: "price_currency_example",
    // Optional minimum price filter applied to leaderboard results (optional)
  minPrice: 0,
    // Optional maximum price filter applied to leaderboard results (optional)
  maxPrice: 0,
  
  curatedByGroup: "curated_by_group_example",
};

const data = await apiInstance.getWaveLeaderboard(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined
 **pageSize** | [**number**] | Default is 50 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** | Default is ASC | (optional) defaults to undefined
 **sort** | [**&#39;RANK&#39; | &#39;REALTIME_VOTE&#39; | &#39;MY_REALTIME_VOTE&#39; | &#39;CREATED_AT&#39; | &#39;PRICE&#39; | &#39;RATING_PREDICTION&#39; | &#39;TREND&#39;**]**Array<&#39;RANK&#39; &#124; &#39;REALTIME_VOTE&#39; &#124; &#39;MY_REALTIME_VOTE&#39; &#124; &#39;CREATED_AT&#39; &#124; &#39;PRICE&#39; &#124; &#39;RATING_PREDICTION&#39; &#124; &#39;TREND&#39;>** | Default is rank | (optional) defaults to undefined
 **priceCurrency** | [**string**] | Optional currency used for min_price/max_price filtering and PRICE sorting | (optional) defaults to undefined
 **minPrice** | [**number**] | Optional minimum price filter applied to leaderboard results | (optional) defaults to undefined
 **maxPrice** | [**number**] | Optional maximum price filter applied to leaderboard results | (optional) defaults to undefined
 **curatedByGroup** | [**string**] |  | (optional) defaults to undefined


### Return type

**ApiDropsLeaderboardPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getWaveOutcomeDistribution**
> ApiWaveOutcomeDistributionItemsPage getWaveOutcomeDistribution()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiGetWaveOutcomeDistributionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiGetWaveOutcomeDistributionRequest = {
  
  waveId: "waveId_example",
  
  outcomeIndex: "outcomeIndex_example",
  
  sortDirection: "DESC",
  
  page: 1,
  
  pageSize: 100,
};

const data = await apiInstance.getWaveOutcomeDistribution(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **waveId** | [**string**] |  | defaults to undefined
 **outcomeIndex** | [**string**] |  | defaults to undefined
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** |  | (optional) defaults to 'DESC'
 **page** | [**number**] |  | (optional) defaults to 1
 **pageSize** | [**number**] |  | (optional) defaults to 100


### Return type

**ApiWaveOutcomeDistributionItemsPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Wave not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getWaveOutcomes**
> ApiWaveOutcomesPage getWaveOutcomes()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiGetWaveOutcomesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiGetWaveOutcomesRequest = {
  
  waveId: "waveId_example",
  
  sortDirection: "DESC",
  
  page: 1,
  
  pageSize: 100,
};

const data = await apiInstance.getWaveOutcomes(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **waveId** | [**string**] |  | defaults to undefined
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** |  | (optional) defaults to 'DESC'
 **page** | [**number**] |  | (optional) defaults to 1
 **pageSize** | [**number**] |  | (optional) defaults to 100


### Return type

**ApiWaveOutcomesPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Wave not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getWaveVotersInfo**
> ApiWaveVotersPage getWaveVotersInfo()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiGetWaveVotersInfoRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiGetWaveVotersInfoRequest = {
  
  id: "id_example",
    // If set then you\"ll get stats for specific drop (optional)
  dropId: "drop_id_example",
  
  page: 0,
    // Default is 20 (optional)
  pageSize: 1,
    // Default is ASC (optional)
  sortDirection: "ASC",
    // Default is ABSOLUTE (optional)
  sort: "ABSOLUTE",
};

const data = await apiInstance.getWaveVotersInfo(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined
 **dropId** | [**string**] | If set then you\&quot;ll get stats for specific drop | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] | Default is 20 | (optional) defaults to undefined
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** | Default is ASC | (optional) defaults to undefined
 **sort** | [**&#39;ABSOLUTE&#39; | &#39;POSITIVE&#39; | &#39;NEGATIVE&#39;**]**Array<&#39;ABSOLUTE&#39; &#124; &#39;POSITIVE&#39; &#124; &#39;NEGATIVE&#39;>** | Default is ABSOLUTE | (optional) defaults to undefined


### Return type

**ApiWaveVotersPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getWaves**
> Array<ApiWave> getWaves()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiGetWavesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiGetWavesRequest = {
    // Search by name or part of name (optional)
  name: "name_example",
    // Search by author identity (optional)
  author: "author_example",
    // How many waves to return (10 by default) (optional)
  limit: 1,
    // Used to find older drops (optional)
  serialNoLessThan: 1,
    // Waves by authors that fall into supplied group (optional)
  groupId: "group_id_example",
    // Use true for DM waves, use false for non-DM waves, omit for all (optional)
  directMessage: true,
};

const data = await apiInstance.getWaves(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **name** | [**string**] | Search by name or part of name | (optional) defaults to undefined
 **author** | [**string**] | Search by author identity | (optional) defaults to undefined
 **limit** | [**number**] | How many waves to return (10 by default) | (optional) defaults to undefined
 **serialNoLessThan** | [**number**] | Used to find older drops | (optional) defaults to undefined
 **groupId** | [**string**] | Waves by authors that fall into supplied group | (optional) defaults to undefined
 **directMessage** | [**boolean**] | Use true for DM waves, use false for non-DM waves, omit for all | (optional) defaults to undefined


### Return type

**Array<ApiWave>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getWavesOverview**
> Array<ApiWave> getWavesOverview()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiGetWavesOverviewRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiGetWavesOverviewRequest = {
    // Type of overview
  type: "MOST_SUBSCRIBED",
    // How many waves to return (10 by default) (optional)
  limit: 10,
    // Used to find next waves (optional)
  offset: 0,
    // Filter only PINNED or UNPINNED waves (optional)
  pinned: "PINNED",
    // If true then result only includes waves what authenticated user follows (optional)
  onlyWavesFollowedByAuthenticatedUser: true,
    // Use true for DM waves, use false for non-DM waves, omit for all (optional)
  directMessage: true,
};

const data = await apiInstance.getWavesOverview(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **type** | **ApiWavesOverviewType** | Type of overview | defaults to undefined
 **limit** | [**number**] | How many waves to return (10 by default) | (optional) defaults to 10
 **offset** | [**number**] | Used to find next waves | (optional) defaults to undefined
 **pinned** | **ApiWavesPinFilter** | Filter only PINNED or UNPINNED waves | (optional) defaults to undefined
 **onlyWavesFollowedByAuthenticatedUser** | [**boolean**] | If true then result only includes waves what authenticated user follows | (optional) defaults to undefined
 **directMessage** | [**boolean**] | Use true for DM waves, use false for non-DM waves, omit for all | (optional) defaults to undefined


### Return type

**Array<ApiWave>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listWaveCurationGroups**
> Array<ApiWaveCurationGroup> listWaveCurationGroups()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiListWaveCurationGroupsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiListWaveCurationGroupsRequest = {
  
  id: "id_example",
};

const data = await apiInstance.listWaveCurationGroups(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**Array<ApiWaveCurationGroup>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **muteWave**
> any muteWave()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiMuteWaveRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiMuteWaveRequest = {
  
  id: "id_example",
};

const data = await apiInstance.muteWave(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**any**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **pinWave**
> any pinWave()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiPinWaveRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiPinWaveRequest = {
  
  id: "id_example",
};

const data = await apiInstance.pinWave(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**any**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **searchDropsInWave**
> ApiDropWithoutWavesPageWithoutCount searchDropsInWave()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiSearchDropsInWaveRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiSearchDropsInWaveRequest = {
  
  waveId: "waveId_example",
  
  term: "term_example",
  
  page: 1,
  
  size: 20,
};

const data = await apiInstance.searchDropsInWave(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **waveId** | [**string**] |  | defaults to undefined
 **term** | [**string**] |  | defaults to undefined
 **page** | [**number**] |  | (optional) defaults to 1
 **size** | [**number**] |  | (optional) defaults to 20


### Return type

**ApiDropWithoutWavesPageWithoutCount**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Wave not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **subscribeToWaveActions**
> ApiWaveSubscriptionActions subscribeToWaveActions(apiWaveSubscriptionActions)


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiSubscribeToWaveActionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiSubscribeToWaveActionsRequest = {
  
  id: "id_example",
  
  apiWaveSubscriptionActions: {
    actions: [
      "DROP_CREATED",
    ],
  },
};

const data = await apiInstance.subscribeToWaveActions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiWaveSubscriptionActions** | **ApiWaveSubscriptionActions**|  |
 **id** | [**string**] |  | defaults to undefined


### Return type

**ApiWaveSubscriptionActions**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**404** | Wave not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **unPinWave**
> any unPinWave()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiUnPinWaveRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiUnPinWaveRequest = {
  
  id: "id_example",
};

const data = await apiInstance.unPinWave(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**any**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **unmuteWave**
> any unmuteWave()


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiUnmuteWaveRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiUnmuteWaveRequest = {
  
  id: "id_example",
};

const data = await apiInstance.unmuteWave(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**any**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **unsubscribeFromWaveActions**
> ApiWaveSubscriptionActions unsubscribeFromWaveActions(apiWaveSubscriptionActions)


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiUnsubscribeFromWaveActionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiUnsubscribeFromWaveActionsRequest = {
  
  id: "id_example",
  
  apiWaveSubscriptionActions: {
    actions: [
      "DROP_CREATED",
    ],
  },
};

const data = await apiInstance.unsubscribeFromWaveActions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiWaveSubscriptionActions** | **ApiWaveSubscriptionActions**|  |
 **id** | [**string**] |  | defaults to undefined


### Return type

**ApiWaveSubscriptionActions**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**404** | Wave not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateWaveById**
> ApiWave updateWaveById(apiUpdateWaveRequest)


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiUpdateWaveByIdRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiUpdateWaveByIdRequest = {
  
  id: "id_example",
  
  apiUpdateWaveRequest: {
    name: "name_example",
    picture: "https://example.com/picture.jpg",
    voting: {
      scope: {
        group_id: "group_id_example",
      },
      credit_type: "TDH",
      credit_scope: "WAVE",
      credit_category: "credit_category_example",
      creditor_id: "creditor_id_example",
      signature_required: true,
      period: {
        min: 3.14,
        max: 3.14,
      },
      forbid_negative_votes: true,
    },
    visibility: {
      scope: {
        group_id: "group_id_example",
      },
    },
    participation: {
      scope: {
        group_id: "group_id_example",
      },
      no_of_applications_allowed_per_participant: 1,
      required_media: [
        "IMAGE",
      ],
      required_metadata: [
        {
          name: "name_example",
          type: "STRING",
        },
      ],
      signature_required: true,
      terms: "terms_example",
      period: {
        min: 3.14,
        max: 3.14,
      },
    },
    chat: {
      scope: {
        group_id: "group_id_example",
      },
      enabled: true,
    },
    wave: {
      type: "APPROVE",
      winning_thresholds: {
        min: 3.14,
        max: 3.14,
      },
      max_winners: 1,
      time_lock_ms: 1,
      admin_group: {
        group_id: "group_id_example",
      },
      decisions_strategy: {
        first_decision_time: 3.14,
        subsequent_decisions: [
          1,
        ],
        is_rolling: true,
      },
      admin_drop_deletion_enabled: true,
    },
  },
};

const data = await apiInstance.updateWaveById(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiUpdateWaveRequest** | **ApiUpdateWaveRequest**|  |
 **id** | [**string**] |  | defaults to undefined


### Return type

**ApiWave**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**400** | Invalid request |  -  |
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateWaveCurationGroup**
> ApiWaveCurationGroup updateWaveCurationGroup(apiWaveCurationGroupRequest)


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiUpdateWaveCurationGroupRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiUpdateWaveCurationGroupRequest = {
  
  id: "id_example",
  
  curationGroupId: "curationGroupId_example",
  
  apiWaveCurationGroupRequest: {
    name: "name_example",
    group_id: "group_id_example",
  },
};

const data = await apiInstance.updateWaveCurationGroup(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiWaveCurationGroupRequest** | **ApiWaveCurationGroupRequest**|  |
 **id** | [**string**] |  | defaults to undefined
 **curationGroupId** | [**string**] |  | defaults to undefined


### Return type

**ApiWaveCurationGroup**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateWaveDecisionPause**
> ApiWave updateWaveDecisionPause(apiUpdateWaveDecisionPause)


### Example


```typescript
import { createConfiguration, WavesApi } from '';
import type { WavesApiUpdateWaveDecisionPauseRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WavesApi(configuration);

const request: WavesApiUpdateWaveDecisionPauseRequest = {
    // wave id
  id: "id_example",
  
  apiUpdateWaveDecisionPause: null,
};

const data = await apiInstance.updateWaveDecisionPause(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiUpdateWaveDecisionPause** | **ApiUpdateWaveDecisionPause**|  |
 **id** | [**string**] | wave id | defaults to undefined


### Return type

**ApiWave**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**404** | Wave not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


