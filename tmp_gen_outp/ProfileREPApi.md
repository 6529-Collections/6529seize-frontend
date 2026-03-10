# .ProfileREPApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getProfileRepCategories**](ProfileREPApi.md#getProfileRepCategories) | **GET** /profiles/{identity}/rep/categories | Get profile REP categories
[**getProfileRepCategoryContributors**](ProfileREPApi.md#getProfileRepCategoryContributors) | **GET** /profiles/{identity}/rep/categories/{category}/contributors | Get profile REP contributors for category
[**getProfileRepOverview**](ProfileREPApi.md#getProfileRepOverview) | **GET** /profiles/{identity}/rep/overview | Get profile REP overview
[**getProfileRepRating**](ProfileREPApi.md#getProfileRepRating) | **GET** /profiles/{identity}/rep/rating | Get profile REP rating
[**getProfileRepRatingsByRater**](ProfileREPApi.md#getProfileRepRatingsByRater) | **GET** /profiles/{identity}/rep/ratings/by-rater | Get profile REP ratings by rater
[**rateProfileRep**](ProfileREPApi.md#rateProfileRep) | **POST** /profiles/{identity}/rep/rating | Change profile REP rating. If you are authenticated as proxy, you will be rating on behalf of the profile you are proxying.


# **getProfileRepCategories**
> ApiRepCategoriesPage getProfileRepCategories()


### Example


```typescript
import { createConfiguration, ProfileREPApi } from '';
import type { ProfileREPApiGetProfileRepCategoriesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProfileREPApi(configuration);

const request: ProfileREPApiGetProfileRepCategoriesRequest = {
  
  identity: "identity_example",
  
  direction: "incoming",
  
  page: 1,
  
  pageSize: 1,
  
  topContributorsLimit: 1,
};

const data = await apiInstance.getProfileRepCategories(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] |  | defaults to undefined
 **direction** | **ApiRepDirection** |  | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to undefined
 **topContributorsLimit** | [**number**] |  | (optional) defaults to undefined


### Return type

**ApiRepCategoriesPage**

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

# **getProfileRepCategoryContributors**
> ApiRepContributorsPage getProfileRepCategoryContributors()


### Example


```typescript
import { createConfiguration, ProfileREPApi } from '';
import type { ProfileREPApiGetProfileRepCategoryContributorsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProfileREPApi(configuration);

const request: ProfileREPApiGetProfileRepCategoryContributorsRequest = {
  
  identity: "identity_example",
  
  category: "G",
  
  direction: "incoming",
  
  page: 1,
  
  pageSize: 1,
};

const data = await apiInstance.getProfileRepCategoryContributors(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] |  | defaults to undefined
 **category** | [**string**] |  | defaults to undefined
 **direction** | **ApiRepDirection** |  | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to undefined


### Return type

**ApiRepContributorsPage**

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

# **getProfileRepOverview**
> ApiRepOverview getProfileRepOverview()


### Example


```typescript
import { createConfiguration, ProfileREPApi } from '';
import type { ProfileREPApiGetProfileRepOverviewRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProfileREPApi(configuration);

const request: ProfileREPApiGetProfileRepOverviewRequest = {
  
  identity: "identity_example",
  
  direction: "incoming",
  
  page: 1,
  
  pageSize: 1,
};

const data = await apiInstance.getProfileRepOverview(request);
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

**ApiRepOverview**

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

# **getProfileRepRating**
> ApiRepRating getProfileRepRating()


### Example


```typescript
import { createConfiguration, ProfileREPApi } from '';
import type { ProfileREPApiGetProfileRepRatingRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProfileREPApi(configuration);

const request: ProfileREPApiGetProfileRepRatingRequest = {
  
  identity: "identity_example",
  
  fromIdentity: "from_identity_example",
  
  category: "category_example",
};

const data = await apiInstance.getProfileRepRating(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] |  | defaults to undefined
 **fromIdentity** | [**string**] |  | (optional) defaults to undefined
 **category** | [**string**] |  | (optional) defaults to undefined


### Return type

**ApiRepRating**

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

# **getProfileRepRatingsByRater**
> ApiRatingWithProfileInfoAndLevelPage getProfileRepRatingsByRater()


### Example


```typescript
import { createConfiguration, ProfileREPApi } from '';
import type { ProfileREPApiGetProfileRepRatingsByRaterRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProfileREPApi(configuration);

const request: ProfileREPApiGetProfileRepRatingsByRaterRequest = {
  
  identity: "identity_example",
  
  given: true,
  
  page: 1,
  
  pageSize: 1,
  
  order: "ASC",
  
  orderBy: "last_modified",
  
  category: "category_example",
};

const data = await apiInstance.getProfileRepRatingsByRater(request);
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
 **category** | [**string**] |  | (optional) defaults to undefined


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

# **rateProfileRep**
> void rateProfileRep(apiChangeProfileRepRating)


### Example


```typescript
import { createConfiguration, ProfileREPApi } from '';
import type { ProfileREPApiRateProfileRepRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProfileREPApi(configuration);

const request: ProfileREPApiRateProfileRepRequest = {
  
  identity: "identity_example",
  
  apiChangeProfileRepRating: {
    amount: 3.14,
    category: "G",
  },
};

const data = await apiInstance.rateProfileRep(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiChangeProfileRepRating** | **ApiChangeProfileRepRating**|  |
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


