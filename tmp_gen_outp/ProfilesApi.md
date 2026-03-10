# .ProfilesApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createOrUpdateProfile**](ProfilesApi.md#createOrUpdateProfile) | **POST** /profiles | Create or update a profile


# **createOrUpdateProfile**
> ApiIdentity createOrUpdateProfile(apiCreateOrUpdateProfileRequest)


### Example


```typescript
import { createConfiguration, ProfilesApi } from '';
import type { ProfilesApiCreateOrUpdateProfileRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProfilesApi(configuration);

const request: ProfilesApiCreateOrUpdateProfileRequest = {
  
  apiCreateOrUpdateProfileRequest: {
    handle: "handle_example",
    banner_1: "banner_1_example",
    banner_2: "banner_2_example",
    website: "website_example",
    classification: "GOVERNMENT_NAME",
    sub_classification: "sub_classification_example",
    pfp_url: "pfp_url_example",
  },
};

const data = await apiInstance.createOrUpdateProfile(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCreateOrUpdateProfileRequest** | **ApiCreateOrUpdateProfileRequest**|  |


### Return type

**ApiIdentity**

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


