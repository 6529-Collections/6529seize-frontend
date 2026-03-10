# .AggregatedActivityApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getAggregatedActivity**](AggregatedActivityApi.md#getAggregatedActivity) | **GET** /aggregated-activity | Get aggregated activity
[**getAggregatedActivityByConsolidationKey**](AggregatedActivityApi.md#getAggregatedActivityByConsolidationKey) | **GET** /aggregated-activity/consolidation/{consolidation_key} | Get aggregated activity by consolidation key.
[**getMemesAggregatedActivityByConsolidationKey**](AggregatedActivityApi.md#getMemesAggregatedActivityByConsolidationKey) | **GET** /aggregated-activity/consolidation/{consolidation_key}/memes | Get memes aggregated activity by consolidation key per season.


# **getAggregatedActivity**
> Array<ApiAggregatedActivityPage> getAggregatedActivity()


### Example


```typescript
import { createConfiguration, AggregatedActivityApi } from '';
import type { AggregatedActivityApiGetAggregatedActivityRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AggregatedActivityApi(configuration);

const request: AggregatedActivityApiGetAggregatedActivityRequest = {
    // Default is 50 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
    // Default is ASC; applied to id sort (optional)
  sortDirection: "ASC",
    // Default is primary_purchases_count (optional)
  sort: "primary_purchases_count",
    // Search by wallet address, profile handle or ENS (optional)
  search: "search_example",
    // Filter by content (optional)
  content: "Memes",
    // Filter by season (optional)
  season: 3.14,
    // Filter by collector type (optional)
  collector: "All",
};

const data = await apiInstance.getAggregatedActivity(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pageSize** | [**number**] | Default is 50 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** | Default is ASC; applied to id sort | (optional) defaults to undefined
 **sort** | [**&#39;primary_purchases_count&#39; | &#39;primary_purchases_value&#39; | &#39;secondary_purchases_count&#39; | &#39;secondary_purchases_value&#39; | &#39;sales_count&#39; | &#39;sales_value&#39; | &#39;transfers_in&#39; | &#39;transfers_out&#39; | &#39;airdrops&#39; | &#39;burns&#39;**]**Array<&#39;primary_purchases_count&#39; &#124; &#39;primary_purchases_value&#39; &#124; &#39;secondary_purchases_count&#39; &#124; &#39;secondary_purchases_value&#39; &#124; &#39;sales_count&#39; &#124; &#39;sales_value&#39; &#124; &#39;transfers_in&#39; &#124; &#39;transfers_out&#39; &#124; &#39;airdrops&#39; &#124; &#39;burns&#39;>** | Default is primary_purchases_count | (optional) defaults to undefined
 **search** | [**string**] | Search by wallet address, profile handle or ENS | (optional) defaults to undefined
 **content** | [**&#39;Memes&#39; | &#39;Gradient&#39; | &#39;MemeLab&#39; | &#39;NextGen&#39;**]**Array<&#39;Memes&#39; &#124; &#39;Gradient&#39; &#124; &#39;MemeLab&#39; &#124; &#39;NextGen&#39;>** | Filter by content | (optional) defaults to undefined
 **season** | [**number**] | Filter by season | (optional) defaults to undefined
 **collector** | [**&#39;All&#39; | &#39;Memes&#39; | &#39;Meme SZN Set&#39; | &#39;Genesis Set&#39; | &#39;Gradient&#39; | &#39;MemeLab&#39; | &#39;NextGen&#39;**]**Array<&#39;All&#39; &#124; &#39;Memes&#39; &#124; &#39;Meme SZN Set&#39; &#124; &#39;Genesis Set&#39; &#124; &#39;Gradient&#39; &#124; &#39;MemeLab&#39; &#124; &#39;NextGen&#39;>** | Filter by collector type | (optional) defaults to undefined


### Return type

**Array<ApiAggregatedActivityPage>**

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

# **getAggregatedActivityByConsolidationKey**
> ApiAggregatedActivity getAggregatedActivityByConsolidationKey()


### Example


```typescript
import { createConfiguration, AggregatedActivityApi } from '';
import type { AggregatedActivityApiGetAggregatedActivityByConsolidationKeyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AggregatedActivityApi(configuration);

const request: AggregatedActivityApiGetAggregatedActivityByConsolidationKeyRequest = {
  
  consolidationKey: "consolidation_key_example",
};

const data = await apiInstance.getAggregatedActivityByConsolidationKey(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] |  | defaults to undefined


### Return type

**ApiAggregatedActivity**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Aggregated Activity for consolidation key not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getMemesAggregatedActivityByConsolidationKey**
> Array<ApiAggregatedActivityMemes> getMemesAggregatedActivityByConsolidationKey()


### Example


```typescript
import { createConfiguration, AggregatedActivityApi } from '';
import type { AggregatedActivityApiGetMemesAggregatedActivityByConsolidationKeyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AggregatedActivityApi(configuration);

const request: AggregatedActivityApiGetMemesAggregatedActivityByConsolidationKeyRequest = {
  
  consolidationKey: "consolidation_key_example",
};

const data = await apiInstance.getMemesAggregatedActivityByConsolidationKey(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] |  | defaults to undefined


### Return type

**Array<ApiAggregatedActivityMemes>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Memes Aggregated Activity for consolidation key not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


