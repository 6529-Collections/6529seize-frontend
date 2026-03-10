# .CommunityMetricsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getCommunityMetrics**](CommunityMetricsApi.md#getCommunityMetrics) | **GET** /community-metrics | Get community metrics.
[**getCommunityMetricsSeries**](CommunityMetricsApi.md#getCommunityMetricsSeries) | **GET** /community-metrics/series | Get community metrics series.
[**getCommunityMintMetrics**](CommunityMetricsApi.md#getCommunityMintMetrics) | **GET** /community-metrics/mints | Get community mint metrics.


# **getCommunityMetrics**
> ApiCommunityMetrics getCommunityMetrics()


### Example


```typescript
import { createConfiguration, CommunityMetricsApi } from '';
import type { CommunityMetricsApiGetCommunityMetricsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CommunityMetricsApi(configuration);

const request: CommunityMetricsApiGetCommunityMetricsRequest = {
    // Metrics interval
  interval: "DAY",
};

const data = await apiInstance.getCommunityMetrics(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **interval** | [**&#39;DAY&#39; | &#39;WEEK&#39;**]**Array<&#39;DAY&#39; &#124; &#39;WEEK&#39;>** | Metrics interval | defaults to undefined


### Return type

**ApiCommunityMetrics**

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

# **getCommunityMetricsSeries**
> ApiCommunityMetricsSeries getCommunityMetricsSeries()


### Example


```typescript
import { createConfiguration, CommunityMetricsApi } from '';
import type { CommunityMetricsApiGetCommunityMetricsSeriesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CommunityMetricsApi(configuration);

const request: CommunityMetricsApiGetCommunityMetricsSeriesRequest = {
    // Unix millis timestamp for start of series.
  since: 3.14,
    // Unix millis timestamp for end of series.
  to: 3.14,
};

const data = await apiInstance.getCommunityMetricsSeries(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **since** | [**number**] | Unix millis timestamp for start of series. | defaults to undefined
 **to** | [**number**] | Unix millis timestamp for end of series. | defaults to undefined


### Return type

**ApiCommunityMetricsSeries**

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

# **getCommunityMintMetrics**
> ApiMintMetricsPage getCommunityMintMetrics()


### Example


```typescript
import { createConfiguration, CommunityMetricsApi } from '';
import type { CommunityMetricsApiGetCommunityMintMetricsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CommunityMetricsApi(configuration);

const request: CommunityMetricsApiGetCommunityMintMetricsRequest = {
  
  pageSize: 3.14,
  
  page: 3.14,
  
  sortDirection: "ASC",
  
  sort: "mint_time",
};

const data = await apiInstance.getCommunityMintMetrics(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pageSize** | [**number**] |  | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **sortDirection** | **ApiPageSortDirection** |  | (optional) defaults to undefined
 **sort** | [**&#39;mint_time&#39;**]**Array<&#39;mint_time&#39;>** |  | (optional) defaults to undefined


### Return type

**ApiMintMetricsPage**

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


