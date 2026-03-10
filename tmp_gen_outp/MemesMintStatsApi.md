# .MemesMintStatsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getMemesMintStats**](MemesMintStatsApi.md#getMemesMintStats) | **GET** /memes-mint-stats | Get paginated memes mint stats
[**getMemesMintStatsById**](MemesMintStatsApi.md#getMemesMintStatsById) | **GET** /memes-mint-stats/{id} | Get memes mint stats for one meme id
[**getMemesMintStatsTotal**](MemesMintStatsApi.md#getMemesMintStatsTotal) | **GET** /memes-mint-stats/total | Get total memes mint stats
[**getMemesMintStatsYearly**](MemesMintStatsApi.md#getMemesMintStatsYearly) | **GET** /memes-mint-stats/yearly | Get yearly aggregated memes mint stats


# **getMemesMintStats**
> ApiMemesMintStatsPage getMemesMintStats()


### Example


```typescript
import { createConfiguration, MemesMintStatsApi } from '';
import type { MemesMintStatsApiGetMemesMintStatsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new MemesMintStatsApi(configuration);

const request: MemesMintStatsApiGetMemesMintStatsRequest = {
    // Default is 50 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
    // Default is ASC (optional)
  sortDirection: "ASC",
};

const data = await apiInstance.getMemesMintStats(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pageSize** | [**number**] | Default is 50 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** | Default is ASC | (optional) defaults to undefined


### Return type

**ApiMemesMintStatsPage**

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

# **getMemesMintStatsById**
> ApiMemesMintStat getMemesMintStatsById()


### Example


```typescript
import { createConfiguration, MemesMintStatsApi } from '';
import type { MemesMintStatsApiGetMemesMintStatsByIdRequest } from '';

const configuration = createConfiguration();
const apiInstance = new MemesMintStatsApi(configuration);

const request: MemesMintStatsApiGetMemesMintStatsByIdRequest = {
  
  id: 1,
};

const data = await apiInstance.getMemesMintStatsById(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**number**] |  | defaults to undefined


### Return type

**ApiMemesMintStat**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Memes mint stats for id not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getMemesMintStatsTotal**
> ApiMemesMintStatsTotals getMemesMintStatsTotal()


### Example


```typescript
import { createConfiguration, MemesMintStatsApi } from '';

const configuration = createConfiguration();
const apiInstance = new MemesMintStatsApi(configuration);

const request = {};

const data = await apiInstance.getMemesMintStatsTotal(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**ApiMemesMintStatsTotals**

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

# **getMemesMintStatsYearly**
> Array<ApiMemesMintStatsYearly> getMemesMintStatsYearly()


### Example


```typescript
import { createConfiguration, MemesMintStatsApi } from '';

const configuration = createConfiguration();
const apiInstance = new MemesMintStatsApi(configuration);

const request = {};

const data = await apiInstance.getMemesMintStatsYearly(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Array<ApiMemesMintStatsYearly>**

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


