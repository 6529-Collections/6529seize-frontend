# .FeedApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getFeed**](FeedApi.md#getFeed) | **GET** /feed | Get feed


# **getFeed**
> Array<ApiFeedItem> getFeed()


### Example


```typescript
import { createConfiguration, FeedApi } from '';
import type { FeedApiGetFeedRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FeedApi(configuration);

const request: FeedApiGetFeedRequest = {
    // Used to find older items (optional)
  serialNoLessThan: 1,
};

const data = await apiInstance.getFeed(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **serialNoLessThan** | [**number**] | Used to find older items | (optional) defaults to undefined


### Return type

**Array<ApiFeedItem>**

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


