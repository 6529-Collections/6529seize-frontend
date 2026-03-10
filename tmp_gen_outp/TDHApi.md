# .TDHApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getConsolidatedTdh**](TDHApi.md#getConsolidatedTdh) | **GET** /tdh/consolidation/{identity} | Get consolidated TDH for an identity


# **getConsolidatedTdh**
> ApiConsolidatedTdh getConsolidatedTdh()

Returns the consolidated TDH data for a given identity. The identity can be a profile handle, wallet address, ENS name, or consolidation key.

### Example


```typescript
import { createConfiguration, TDHApi } from '';
import type { TDHApiGetConsolidatedTdhRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TDHApi(configuration);

const request: TDHApiGetConsolidatedTdhRequest = {
    // Profile handle, wallet address, ENS name, or consolidation key
  identity: "identity_example",
};

const data = await apiInstance.getConsolidatedTdh(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] | Profile handle, wallet address, ENS name, or consolidation key | defaults to undefined


### Return type

**ApiConsolidatedTdh**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Consolidated TDH not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


