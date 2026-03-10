# .XTDHApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getGlobalXTdhStats**](XTDHApi.md#getGlobalXTdhStats) | **GET** /xtdh/stats | Get global xTDH stats
[**getIdentitiesXTdhStats**](XTDHApi.md#getIdentitiesXTdhStats) | **GET** /xtdh/stats/{identity} | Get identities xTDH stats
[**getInfoAboutXTdhCollections**](XTDHApi.md#getInfoAboutXTdhCollections) | **GET** /xtdh/collections | Get info about xTDH collections
[**getInfoAboutXTdhContributors**](XTDHApi.md#getInfoAboutXTdhContributors) | **GET** /xtdh/tokens/{contract}/{token}/contributors | Get info about xTDH contributors
[**getInfoAboutXTdhGrantees**](XTDHApi.md#getInfoAboutXTdhGrantees) | **GET** /xtdh/grantees | Get info about xTDH grantees
[**getInfoAboutXTdhTokens**](XTDHApi.md#getInfoAboutXTdhTokens) | **GET** /xtdh/tokens | Get info about xTDH tokens
[**getXTdhGrant**](XTDHApi.md#getXTdhGrant) | **GET** /xtdh/grants/{id} | Get xTDH grant
[**getXTdhGrantTokens**](XTDHApi.md#getXTdhGrantTokens) | **GET** /xtdh/grants/{id}/tokens | Get xTDH grant tokens
[**getXTdhGrants**](XTDHApi.md#getXTdhGrants) | **GET** /xtdh/grants | Get xTDH grants
[**grantXTdh**](XTDHApi.md#grantXTdh) | **POST** /xtdh/grants | Create xTDH grant
[**updateXTdhGrant**](XTDHApi.md#updateXTdhGrant) | **POST** /xtdh/grants/{id} | Update xTDH grant


# **getGlobalXTdhStats**
> ApiXTdhGlobalStats getGlobalXTdhStats()


### Example


```typescript
import { createConfiguration, XTDHApi } from '';

const configuration = createConfiguration();
const apiInstance = new XTDHApi(configuration);

const request = {};

const data = await apiInstance.getGlobalXTdhStats(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**ApiXTdhGlobalStats**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getIdentitiesXTdhStats**
> ApiXTdhStats getIdentitiesXTdhStats()


### Example


```typescript
import { createConfiguration, XTDHApi } from '';
import type { XTDHApiGetIdentitiesXTdhStatsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new XTDHApi(configuration);

const request: XTDHApiGetIdentitiesXTdhStatsRequest = {
  
  identity: "identity_example",
};

const data = await apiInstance.getIdentitiesXTdhStats(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] |  | defaults to undefined


### Return type

**ApiXTdhStats**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getInfoAboutXTdhCollections**
> ApiXTdhCollectionsPage getInfoAboutXTdhCollections()


### Example


```typescript
import { createConfiguration, XTDHApi } from '';
import type { XTDHApiGetInfoAboutXTdhCollectionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new XTDHApi(configuration);

const request: XTDHApiGetInfoAboutXTdhCollectionsRequest = {
    // Filter by receiving identity (optional)
  identity: "identity_example",
  
  collectionName: "collection_name_example",
  
  page: 0,
    // Default is 20 (optional)
  pageSize: 1,
    // xtdh when omitted (optional)
  sort: "xtdh",
    // desc when omitted (optional)
  order: "asc",
};

const data = await apiInstance.getInfoAboutXTdhCollections(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] | Filter by receiving identity | (optional) defaults to undefined
 **collectionName** | [**string**] |  | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] | Default is 20 | (optional) defaults to undefined
 **sort** | [**&#39;xtdh&#39; | &#39;xtdh_rate&#39;**]**Array<&#39;xtdh&#39; &#124; &#39;xtdh_rate&#39;>** | xtdh when omitted | (optional) defaults to undefined
 **order** | [**&#39;asc&#39; | &#39;desc&#39;**]**Array<&#39;asc&#39; &#124; &#39;desc&#39;>** | desc when omitted | (optional) defaults to undefined


### Return type

**ApiXTdhCollectionsPage**

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

# **getInfoAboutXTdhContributors**
> ApiXTdhContributionsPage getInfoAboutXTdhContributors()


### Example


```typescript
import { createConfiguration, XTDHApi } from '';
import type { XTDHApiGetInfoAboutXTdhContributorsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new XTDHApi(configuration);

const request: XTDHApiGetInfoAboutXTdhContributorsRequest = {
  
  contract: "contract_example",
  
  token: 3.14,
    // Group by grant or grantor (grant when omitted) (optional)
  groupBy: "grant",
  
  page: 0,
    // Default is 20 (optional)
  pageSize: 1,
    // xtdh when omitted (optional)
  sort: "xtdh",
    // desc when omitted (optional)
  order: "asc",
};

const data = await apiInstance.getInfoAboutXTdhContributors(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contract** | [**string**] |  | defaults to undefined
 **token** | [**number**] |  | defaults to undefined
 **groupBy** | [**&#39;grant&#39; | &#39;grantor&#39;**]**Array<&#39;grant&#39; &#124; &#39;grantor&#39;>** | Group by grant or grantor (grant when omitted) | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] | Default is 20 | (optional) defaults to undefined
 **sort** | [**&#39;xtdh&#39; | &#39;xtdh_rate&#39;**]**Array<&#39;xtdh&#39; &#124; &#39;xtdh_rate&#39;>** | xtdh when omitted | (optional) defaults to undefined
 **order** | [**&#39;asc&#39; | &#39;desc&#39;**]**Array<&#39;asc&#39; &#124; &#39;desc&#39;>** | desc when omitted | (optional) defaults to undefined


### Return type

**ApiXTdhContributionsPage**

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

# **getInfoAboutXTdhGrantees**
> ApiXTdhGranteesPage getInfoAboutXTdhGrantees()


### Example


```typescript
import { createConfiguration, XTDHApi } from '';
import type { XTDHApiGetInfoAboutXTdhGranteesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new XTDHApi(configuration);

const request: XTDHApiGetInfoAboutXTdhGranteesRequest = {
  
  contract: "contract_example",
  
  page: 0,
    // Default is 20 (optional)
  pageSize: 1,
    // xtdh when omitted (optional)
  sort: "xtdh",
    // desc when omitted (optional)
  order: "asc",
};

const data = await apiInstance.getInfoAboutXTdhGrantees(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contract** | [**string**] |  | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] | Default is 20 | (optional) defaults to undefined
 **sort** | [**&#39;xtdh&#39; | &#39;xtdh_rate&#39;**]**Array<&#39;xtdh&#39; &#124; &#39;xtdh_rate&#39;>** | xtdh when omitted | (optional) defaults to undefined
 **order** | [**&#39;asc&#39; | &#39;desc&#39;**]**Array<&#39;asc&#39; &#124; &#39;desc&#39;>** | desc when omitted | (optional) defaults to undefined


### Return type

**ApiXTdhGranteesPage**

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

# **getInfoAboutXTdhTokens**
> ApiXTdhTokensPage getInfoAboutXTdhTokens()


### Example


```typescript
import { createConfiguration, XTDHApi } from '';
import type { XTDHApiGetInfoAboutXTdhTokensRequest } from '';

const configuration = createConfiguration();
const apiInstance = new XTDHApi(configuration);

const request: XTDHApiGetInfoAboutXTdhTokensRequest = {
    // Filter by receiving identity (optional)
  identity: "identity_example",
    // Filter by receiving contract (optional)
  contract: "contract_example",
    // Filter by token. Needs to be paired with contract to work (optional)
  token: 3.14,
  
  page: 0,
    // Default is 20 (optional)
  pageSize: 1,
    // xtdh when omitted (optional)
  sort: "xtdh",
    // desc when omitted (optional)
  order: "asc",
};

const data = await apiInstance.getInfoAboutXTdhTokens(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] | Filter by receiving identity | (optional) defaults to undefined
 **contract** | [**string**] | Filter by receiving contract | (optional) defaults to undefined
 **token** | [**number**] | Filter by token. Needs to be paired with contract to work | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] | Default is 20 | (optional) defaults to undefined
 **sort** | [**&#39;xtdh&#39; | &#39;xtdh_rate&#39;**]**Array<&#39;xtdh&#39; &#124; &#39;xtdh_rate&#39;>** | xtdh when omitted | (optional) defaults to undefined
 **order** | [**&#39;asc&#39; | &#39;desc&#39;**]**Array<&#39;asc&#39; &#124; &#39;desc&#39;>** | desc when omitted | (optional) defaults to undefined


### Return type

**ApiXTdhTokensPage**

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

# **getXTdhGrant**
> ApiXTdhGrant getXTdhGrant()


### Example


```typescript
import { createConfiguration, XTDHApi } from '';
import type { XTDHApiGetXTdhGrantRequest } from '';

const configuration = createConfiguration();
const apiInstance = new XTDHApi(configuration);

const request: XTDHApiGetXTdhGrantRequest = {
  
  id: "id_example",
};

const data = await apiInstance.getXTdhGrant(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**ApiXTdhGrant**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getXTdhGrantTokens**
> ApiXTdhGrantTokensPage getXTdhGrantTokens()


### Example


```typescript
import { createConfiguration, XTDHApi } from '';
import type { XTDHApiGetXTdhGrantTokensRequest } from '';

const configuration = createConfiguration();
const apiInstance = new XTDHApi(configuration);

const request: XTDHApiGetXTdhGrantTokensRequest = {
  
  id: "id_example",
  
  sortDirection: "ASC",
  
  sort: "token",
  
  page: 1,
  
  pageSize: 100,
};

const data = await apiInstance.getXTdhGrantTokens(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined
 **sortDirection** | **ApiPageSortDirection** |  | (optional) defaults to undefined
 **sort** | [**&#39;token&#39;**]**Array<&#39;token&#39;>** |  | (optional) defaults to 'token'
 **page** | [**number**] |  | (optional) defaults to 1
 **pageSize** | [**number**] |  | (optional) defaults to 100


### Return type

**ApiXTdhGrantTokensPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getXTdhGrants**
> ApiXTdhGrantsPage getXTdhGrants()


### Example


```typescript
import { createConfiguration, XTDHApi } from '';
import type { XTDHApiGetXTdhGrantsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new XTDHApi(configuration);

const request: XTDHApiGetXTdhGrantsRequest = {
  
  grantor: "grantor_example",
  
  targetContract: "target_contract_example",
  
  targetCollectionName: "target_collection_name_example",
  
  targetChain: "target_chain_example",
  
  validFromGt: 3.14,
  
  validFromLt: 3.14,
  
  validToGt: 3.14,
  
  validToLt: 3.14,
    // One or more (comma separated) statuses you are interested in (optional)
  status: "status_example",
  
  sortDirection: "ASC",
  
  sort: "created_at",
  
  page: 1,
  
  pageSize: 100,
};

const data = await apiInstance.getXTdhGrants(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **grantor** | [**string**] |  | (optional) defaults to undefined
 **targetContract** | [**string**] |  | (optional) defaults to undefined
 **targetCollectionName** | [**string**] |  | (optional) defaults to undefined
 **targetChain** | [**string**] |  | (optional) defaults to undefined
 **validFromGt** | [**number**] |  | (optional) defaults to undefined
 **validFromLt** | [**number**] |  | (optional) defaults to undefined
 **validToGt** | [**number**] |  | (optional) defaults to undefined
 **validToLt** | [**number**] |  | (optional) defaults to undefined
 **status** | [**string**] | One or more (comma separated) statuses you are interested in | (optional) defaults to undefined
 **sortDirection** | **ApiPageSortDirection** |  | (optional) defaults to undefined
 **sort** | [**&#39;created_at&#39; | &#39;valid_from&#39; | &#39;valid_to&#39; | &#39;rate&#39;**]**Array<&#39;created_at&#39; &#124; &#39;valid_from&#39; &#124; &#39;valid_to&#39; &#124; &#39;rate&#39;>** |  | (optional) defaults to 'created_at'
 **page** | [**number**] |  | (optional) defaults to 1
 **pageSize** | [**number**] |  | (optional) defaults to 100


### Return type

**ApiXTdhGrantsPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **grantXTdh**
> ApiXTdhGrant grantXTdh(apiXTdhCreateGrant)


### Example


```typescript
import { createConfiguration, XTDHApi } from '';
import type { XTDHApiGrantXTdhRequest } from '';

const configuration = createConfiguration();
const apiInstance = new XTDHApi(configuration);

const request: XTDHApiGrantXTdhRequest = {
  
  apiXTdhCreateGrant: {
    target_chain: "ETHEREUM_MAINNET",
    target_contract: "target_contract_example",
    target_tokens: [
      "target_tokens_example",
    ],
    valid_to: 3.14,
    rate: 3.14,
    is_irrevocable: true,
  },
};

const data = await apiInstance.grantXTdh(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiXTdhCreateGrant** | **ApiXTdhCreateGrant**|  |


### Return type

**ApiXTdhGrant**

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

# **updateXTdhGrant**
> ApiXTdhGrant updateXTdhGrant(apiXTdhGrantUpdateRequest)


### Example


```typescript
import { createConfiguration, XTDHApi } from '';
import type { XTDHApiUpdateXTdhGrantRequest } from '';

const configuration = createConfiguration();
const apiInstance = new XTDHApi(configuration);

const request: XTDHApiUpdateXTdhGrantRequest = {
  
  id: "id_example",
  
  apiXTdhGrantUpdateRequest: {
    valid_to: 3.14,
  },
};

const data = await apiInstance.updateXTdhGrant(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiXTdhGrantUpdateRequest** | **ApiXTdhGrantUpdateRequest**|  |
 **id** | [**string**] |  | defaults to undefined


### Return type

**ApiXTdhGrant**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**403** | Invalid input |  -  |
**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


