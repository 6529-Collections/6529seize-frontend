# .CollectedStatsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getCollectedStats**](CollectedStatsApi.md#getCollectedStats) | **GET** /collected-stats/{identityKey} | Get consolidated collection stats for an identity


# **getCollectedStats**
> ApiCollectedStats getCollectedStats()


### Example


```typescript
import { createConfiguration, CollectedStatsApi } from '';
import type { CollectedStatsApiGetCollectedStatsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CollectedStatsApi(configuration);

const request: CollectedStatsApiGetCollectedStatsRequest = {
    // Profile handle, wallet address, or ENS name
  identityKey: "identityKey_example",
};

const data = await apiInstance.getCollectedStats(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identityKey** | [**string**] | Profile handle, wallet address, or ENS name | defaults to undefined


### Return type

**ApiCollectedStats**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Identity not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


