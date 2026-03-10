# .NFTLinkApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getNftLinkData**](NFTLinkApi.md#getNftLinkData) | **GET** /nft-link | Get marketplace data about NFT link


# **getNftLinkData**
> Array<ApiNftLinkResponse> getNftLinkData()


### Example


```typescript
import { createConfiguration, NFTLinkApi } from '';
import type { NFTLinkApiGetNftLinkDataRequest } from '';

const configuration = createConfiguration();
const apiInstance = new NFTLinkApi(configuration);

const request: NFTLinkApiGetNftLinkDataRequest = {
  
  url: "url_example",
};

const data = await apiInstance.getNftLinkData(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **url** | [**string**] |  | defaults to undefined


### Return type

**Array<ApiNftLinkResponse>**

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


