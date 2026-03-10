# .SubscriptionsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getAirdropAddress**](SubscriptionsApi.md#getAirdropAddress) | **GET** /subscriptions/consolidation/{consolidation_key}/airdrop-address | Get airdrop address for a consolidation
[**getFinalSubscription**](SubscriptionsApi.md#getFinalSubscription) | **GET** /subscriptions/consolidation/final/{consolidation_key}/{contract}/{token_id} | Get final subscription for a consolidation
[**getIncomingSubscriptionsForTarget**](SubscriptionsApi.md#getIncomingSubscriptionsForTarget) | **GET** /identity-subscriptions/incoming/{target_type}/{target_id} | Get identities subscribed to target.
[**getOutgoingSubscriptions**](SubscriptionsApi.md#getOutgoingSubscriptions) | **GET** /identity-subscriptions/outgoing/{target_type} | Get outgoing subscriptions for authenticated user.
[**getRedeemedMemeSubscriptionCounts**](SubscriptionsApi.md#getRedeemedMemeSubscriptionCounts) | **GET** /subscriptions/redeemed-memes-counts | Get redeemed meme subscription counts
[**getRedeemedSubscriptions**](SubscriptionsApi.md#getRedeemedSubscriptions) | **GET** /subscriptions/consolidation/redeemed/{consolidation_key} | Get redeemed subscriptions for a consolidation
[**getSubscriptionDetails**](SubscriptionsApi.md#getSubscriptionDetails) | **GET** /subscriptions/consolidation/details/{consolidation_key} | Get subscription details for a consolidation
[**getSubscriptionLogs**](SubscriptionsApi.md#getSubscriptionLogs) | **GET** /subscriptions/consolidation/logs/{consolidation_key} | Get subscription logs for a consolidation
[**getSubscriptionTopUps**](SubscriptionsApi.md#getSubscriptionTopUps) | **GET** /subscriptions/consolidation/top-up/{consolidation_key} | Get top-ups for a consolidation
[**getSubscriptionUploads**](SubscriptionsApi.md#getSubscriptionUploads) | **GET** /subscriptions/uploads | Get subscription uploads
[**getUpcomingMemeSubscriptionCounts**](SubscriptionsApi.md#getUpcomingMemeSubscriptionCounts) | **GET** /subscriptions/upcoming-memes-counts | Get upcoming meme subscription counts
[**getUpcomingMemeSubscriptionStatus**](SubscriptionsApi.md#getUpcomingMemeSubscriptionStatus) | **GET** /subscriptions/consolidation/upcoming-memes/{meme_id}/{consolidation_key} | Get upcoming meme subscription status for a consolidation
[**getUpcomingMemeSubscriptions**](SubscriptionsApi.md#getUpcomingMemeSubscriptions) | **GET** /subscriptions/consolidation/upcoming-memes/{consolidation_key} | Get upcoming meme subscriptions for a consolidation
[**updateSubscribeAllEditions**](SubscriptionsApi.md#updateSubscribeAllEditions) | **POST** /subscriptions/{consolidation_key}/subscribe-all-editions | Toggle subscribe all editions preference
[**updateSubscription**](SubscriptionsApi.md#updateSubscription) | **POST** /subscriptions/{consolidation_key}/subscription | Update subscription for a specific NFT
[**updateSubscriptionCount**](SubscriptionsApi.md#updateSubscriptionCount) | **POST** /subscriptions/{consolidation_key}/subscription-count | Update subscription count for a specific NFT
[**updateSubscriptionMode**](SubscriptionsApi.md#updateSubscriptionMode) | **POST** /subscriptions/{consolidation_key}/subscription-mode | Update subscription mode


# **getAirdropAddress**
> AirdropAddressResponse getAirdropAddress()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetAirdropAddressRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetAirdropAddressRequest = {
    // Consolidation key
  consolidationKey: "consolidation_key_example",
};

const data = await apiInstance.getAirdropAddress(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] | Consolidation key | defaults to undefined


### Return type

**AirdropAddressResponse**

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

# **getFinalSubscription**
> NFTFinalSubscription getFinalSubscription()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetFinalSubscriptionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetFinalSubscriptionRequest = {
    // Consolidation key
  consolidationKey: "consolidation_key_example",
    // Contract address
  contract: "contract_example",
    // Token ID
  tokenId: 1,
};

const data = await apiInstance.getFinalSubscription(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] | Consolidation key | defaults to undefined
 **contract** | [**string**] | Contract address | defaults to undefined
 **tokenId** | [**number**] | Token ID | defaults to undefined


### Return type

**NFTFinalSubscription**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**400** | Invalid token ID |  -  |
**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getIncomingSubscriptionsForTarget**
> Array<ApiIncomingIdentitySubscriptionsPage> getIncomingSubscriptionsForTarget()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetIncomingSubscriptionsForTargetRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetIncomingSubscriptionsForTargetRequest = {
  
  targetType: "IDENTITY",
  
  targetId: "target_id_example",
  
  pageSize: 10,
  
  page: 1,
};

const data = await apiInstance.getIncomingSubscriptionsForTarget(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **targetType** | [**&#39;IDENTITY&#39; | &#39;WAVE&#39; | &#39;DROP&#39;**]**Array<&#39;IDENTITY&#39; &#124; &#39;WAVE&#39; &#124; &#39;DROP&#39;>** |  | defaults to undefined
 **targetId** | [**string**] |  | defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to 10
 **page** | [**number**] |  | (optional) defaults to 1


### Return type

**Array<ApiIncomingIdentitySubscriptionsPage>**

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

# **getOutgoingSubscriptions**
> Array<ApiOutgoingIdentitySubscriptionsPage> getOutgoingSubscriptions()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetOutgoingSubscriptionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetOutgoingSubscriptionsRequest = {
  
  targetType: "IDENTITY",
  
  pageSize: 10,
  
  page: 1,
};

const data = await apiInstance.getOutgoingSubscriptions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **targetType** | [**&#39;IDENTITY&#39; | &#39;WAVE&#39; | &#39;DROP&#39;**]**Array<&#39;IDENTITY&#39; &#124; &#39;WAVE&#39; &#124; &#39;DROP&#39;>** |  | defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to 10
 **page** | [**number**] |  | (optional) defaults to 1


### Return type

**Array<ApiOutgoingIdentitySubscriptionsPage>**

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

# **getRedeemedMemeSubscriptionCounts**
> RedeemedSubscriptionCountsPage getRedeemedMemeSubscriptionCounts()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetRedeemedMemeSubscriptionCountsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetRedeemedMemeSubscriptionCountsRequest = {
    // Default is 20 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
};

const data = await apiInstance.getRedeemedMemeSubscriptionCounts(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pageSize** | [**number**] | Default is 20 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined


### Return type

**RedeemedSubscriptionCountsPage**

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

# **getRedeemedSubscriptions**
> RedeemedSubscriptionPage getRedeemedSubscriptions()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetRedeemedSubscriptionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetRedeemedSubscriptionsRequest = {
    // Consolidation key
  consolidationKey: "consolidation_key_example",
    // Default is 20 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
};

const data = await apiInstance.getRedeemedSubscriptions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] | Consolidation key | defaults to undefined
 **pageSize** | [**number**] | Default is 20 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined


### Return type

**RedeemedSubscriptionPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getSubscriptionDetails**
> SubscriptionDetails getSubscriptionDetails()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetSubscriptionDetailsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetSubscriptionDetailsRequest = {
    // Consolidation key
  consolidationKey: "consolidation_key_example",
};

const data = await apiInstance.getSubscriptionDetails(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] | Consolidation key | defaults to undefined


### Return type

**SubscriptionDetails**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getSubscriptionLogs**
> SubscriptionLogPage getSubscriptionLogs()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetSubscriptionLogsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetSubscriptionLogsRequest = {
    // Consolidation key
  consolidationKey: "consolidation_key_example",
    // Default is 20 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
};

const data = await apiInstance.getSubscriptionLogs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] | Consolidation key | defaults to undefined
 **pageSize** | [**number**] | Default is 20 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined


### Return type

**SubscriptionLogPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getSubscriptionTopUps**
> SubscriptionTopUpPage getSubscriptionTopUps()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetSubscriptionTopUpsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetSubscriptionTopUpsRequest = {
    // Consolidation key
  consolidationKey: "consolidation_key_example",
    // Default is 20 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
};

const data = await apiInstance.getSubscriptionTopUps(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] | Consolidation key | defaults to undefined
 **pageSize** | [**number**] | Default is 20 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined


### Return type

**SubscriptionTopUpPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getSubscriptionUploads**
> NFTFinalSubscriptionUploadPage getSubscriptionUploads()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetSubscriptionUploadsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetSubscriptionUploadsRequest = {
    // Contract address (required)
  contract: "contract_example",
    // Default is 20 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
};

const data = await apiInstance.getSubscriptionUploads(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contract** | [**string**] | Contract address (required) | defaults to undefined
 **pageSize** | [**number**] | Default is 20 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined


### Return type

**NFTFinalSubscriptionUploadPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**400** | Contract is required |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getUpcomingMemeSubscriptionCounts**
> Array<SubscriptionCounts> getUpcomingMemeSubscriptionCounts()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetUpcomingMemeSubscriptionCountsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetUpcomingMemeSubscriptionCountsRequest = {
    // Number of upcoming cards to fetch. Default is 3 (optional)
  cardCount: 1,
};

const data = await apiInstance.getUpcomingMemeSubscriptionCounts(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **cardCount** | [**number**] | Number of upcoming cards to fetch. Default is 3 | (optional) defaults to undefined


### Return type

**Array<SubscriptionCounts>**

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

# **getUpcomingMemeSubscriptionStatus**
> ApiUpcomingMemeSubscriptionStatus getUpcomingMemeSubscriptionStatus()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetUpcomingMemeSubscriptionStatusRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetUpcomingMemeSubscriptionStatusRequest = {
    // Meme token id
  memeId: 1,
    // Consolidation key
  consolidationKey: "consolidation_key_example",
};

const data = await apiInstance.getUpcomingMemeSubscriptionStatus(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **memeId** | [**number**] | Meme token id | defaults to undefined
 **consolidationKey** | [**string**] | Consolidation key | defaults to undefined


### Return type

**ApiUpcomingMemeSubscriptionStatus**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**400** | Meme already dropped |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getUpcomingMemeSubscriptions**
> Array<NFTSubscription> getUpcomingMemeSubscriptions()


### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiGetUpcomingMemeSubscriptionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiGetUpcomingMemeSubscriptionsRequest = {
    // Consolidation key
  consolidationKey: "consolidation_key_example",
    // Number of upcoming cards to fetch. Default is 3 (optional)
  cardCount: 1,
};

const data = await apiInstance.getUpcomingMemeSubscriptions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] | Consolidation key | defaults to undefined
 **cardCount** | [**number**] | Number of upcoming cards to fetch. Default is 3 | (optional) defaults to undefined


### Return type

**Array<NFTSubscription>**

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

# **updateSubscribeAllEditions**
> SubscribeAllEditionsResponse updateSubscribeAllEditions(updateSubscribeAllEditionsRequest)

Requires authentication. User can only change this setting for their own consolidation.

### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiUpdateSubscribeAllEditionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiUpdateSubscribeAllEditionsRequest = {
    // Consolidation key
  consolidationKey: "consolidation_key_example",
  
  updateSubscribeAllEditionsRequest: {
    subscribe_all_editions: true,
  },
};

const data = await apiInstance.updateSubscribeAllEditions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateSubscribeAllEditionsRequest** | **UpdateSubscribeAllEditionsRequest**|  |
 **consolidationKey** | [**string**] | Consolidation key | defaults to undefined


### Return type

**SubscribeAllEditionsResponse**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**403** | User can only change subscription mode for their own consolidation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateSubscription**
> SubscriptionResponse updateSubscription(updateSubscriptionRequest)

Requires authentication. User can only change subscriptions for their own consolidation.

### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiUpdateSubscriptionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiUpdateSubscriptionRequest = {
    // Consolidation key
  consolidationKey: "consolidation_key_example",
  
  updateSubscriptionRequest: {
    contract: "contract_example",
    token_id: 1,
    subscribed: true,
  },
};

const data = await apiInstance.updateSubscription(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateSubscriptionRequest** | **UpdateSubscriptionRequest**|  |
 **consolidationKey** | [**string**] | Consolidation key | defaults to undefined


### Return type

**SubscriptionResponse**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**400** | Not enough balance or NFT already released |  -  |
**403** | User can only change subscription mode for their own consolidation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateSubscriptionCount**
> SubscriptionCountResponse updateSubscriptionCount(updateSubscriptionCountRequest)

Requires authentication. User can only change subscriptions for their own consolidation.

### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiUpdateSubscriptionCountRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiUpdateSubscriptionCountRequest = {
    // Consolidation key
  consolidationKey: "consolidation_key_example",
  
  updateSubscriptionCountRequest: {
    contract: "contract_example",
    token_id: 1,
    count: 1,
  },
};

const data = await apiInstance.updateSubscriptionCount(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateSubscriptionCountRequest** | **UpdateSubscriptionCountRequest**|  |
 **consolidationKey** | [**string**] | Consolidation key | defaults to undefined


### Return type

**SubscriptionCountResponse**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**400** | Not enough balance, NFT already released, or exceeds eligibility |  -  |
**403** | User can only change subscription mode for their own consolidation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateSubscriptionMode**
> SubscriptionModeResponse updateSubscriptionMode(updateSubscriptionModeRequest)

Requires authentication. User can only change subscription mode for their own consolidation.

### Example


```typescript
import { createConfiguration, SubscriptionsApi } from '';
import type { SubscriptionsApiUpdateSubscriptionModeRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SubscriptionsApi(configuration);

const request: SubscriptionsApiUpdateSubscriptionModeRequest = {
    // Consolidation key
  consolidationKey: "consolidation_key_example",
  
  updateSubscriptionModeRequest: {
    automatic: true,
  },
};

const data = await apiInstance.updateSubscriptionMode(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateSubscriptionModeRequest** | **UpdateSubscriptionModeRequest**|  |
 **consolidationKey** | [**string**] | Consolidation key | defaults to undefined


### Return type

**SubscriptionModeResponse**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**400** | Not enough balance |  -  |
**403** | User can only change subscription mode for their own consolidation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


