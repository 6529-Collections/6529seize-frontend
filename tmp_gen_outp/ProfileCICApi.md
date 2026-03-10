# .ProfileCICApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getProfileCicContributors**](ProfileCICApi.md#getProfileCicContributors) | **GET** /profiles/{identity}/cic/contributors | Get profile CIC contributors
[**getProfileCicOverview**](ProfileCICApi.md#getProfileCicOverview) | **GET** /profiles/{identity}/cic/overview | Get profile CIC overview
[**getProfileCicRatingsByRater**](ProfileCICApi.md#getProfileCicRatingsByRater) | **GET** /profiles/{identity}/cic/ratings/by-rater | Get profile CIC ratings by rater
[**rateProfileCic**](ProfileCICApi.md#rateProfileCic) | **POST** /profiles/{identity}/cic/rating | Change profile CIC rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.


# **getProfileCicContributors**
> ApiCicContributorsPage getProfileCicContributors()


### Example


```typescript
import { createConfiguration, ProfileCICApi } from '';
import type { ProfileCICApiGetProfileCicContributorsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProfileCICApi(configuration);

const request: ProfileCICApiGetProfileCicContributorsRequest = {
  
  identity: "identity_example",
  
  direction: "incoming",
  
  page: 1,
  
  pageSize: 1,
};

const data = await apiInstance.getProfileCicContributors(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] |  | defaults to undefined
 **direction** | **ApiRepDirection** |  | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to undefined


### Return type

**ApiCicContributorsPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Profile not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getProfileCicOverview**
> ApiCicOverview getProfileCicOverview()


### Example


```typescript
import { createConfiguration, ProfileCICApi } from '';
import type { ProfileCICApiGetProfileCicOverviewRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProfileCICApi(configuration);

const request: ProfileCICApiGetProfileCicOverviewRequest = {
  
  identity: "identity_example",
  
  direction: "incoming",
  
  page: 1,
  
  pageSize: 1,
};

const data = await apiInstance.getProfileCicOverview(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] |  | defaults to undefined
 **direction** | **ApiRepDirection** |  | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to undefined


### Return type

**ApiCicOverview**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Profile not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getProfileCicRatingsByRater**
> ApiRatingWithProfileInfoAndLevelPage getProfileCicRatingsByRater()


### Example


```typescript
import { createConfiguration, ProfileCICApi } from '';
import type { ProfileCICApiGetProfileCicRatingsByRaterRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProfileCICApi(configuration);

const request: ProfileCICApiGetProfileCicRatingsByRaterRequest = {
  
  identity: "identity_example",
  
  given: true,
  
  page: 1,
  
  pageSize: 1,
  
  order: "ASC",
  
  orderBy: "last_modified",
};

const data = await apiInstance.getProfileCicRatingsByRater(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] |  | defaults to undefined
 **given** | [**boolean**] |  | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to undefined
 **order** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** |  | (optional) defaults to undefined
 **orderBy** | [**&#39;last_modified&#39; | &#39;rating&#39;**]**Array<&#39;last_modified&#39; &#124; &#39;rating&#39;>** |  | (optional) defaults to undefined


### Return type

**ApiRatingWithProfileInfoAndLevelPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Profile not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **rateProfileCic**
> void rateProfileCic(apiChangeProfileCicRating)


### Example


```typescript
import { createConfiguration, ProfileCICApi } from '';
import type { ProfileCICApiRateProfileCicRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProfileCICApi(configuration);

const request: ProfileCICApiRateProfileCicRequest = {
  
  identity: "identity_example",
  
  apiChangeProfileCicRating: {
    amount: 3.14,
  },
};

const data = await apiInstance.rateProfileCic(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiChangeProfileCicRating** | **ApiChangeProfileCicRating**|  |
 **identity** | [**string**] |  | defaults to undefined


### Return type

**void**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


