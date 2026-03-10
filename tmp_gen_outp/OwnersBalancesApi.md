# .OwnersBalancesApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getMemesOwnerBalanceByConsolidationKey**](OwnersBalancesApi.md#getMemesOwnerBalanceByConsolidationKey) | **GET** /owners-balances/consolidation/{consolidation_key}/memes | Get memes owner balance by consolidation key.
[**getOwnerBalanceByConsolidationKey**](OwnersBalancesApi.md#getOwnerBalanceByConsolidationKey) | **GET** /owners-balances/consolidation/{consolidation_key} | Get owner balance by consolidation key.
[**getOwnerBalances**](OwnersBalancesApi.md#getOwnerBalances) | **GET** /owners-balances | Get owner balances


# **getMemesOwnerBalanceByConsolidationKey**
> Array<ApiOwnerBalanceMemes> getMemesOwnerBalanceByConsolidationKey()


### Example


```typescript
import { createConfiguration, OwnersBalancesApi } from '';
import type { OwnersBalancesApiGetMemesOwnerBalanceByConsolidationKeyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OwnersBalancesApi(configuration);

const request: OwnersBalancesApiGetMemesOwnerBalanceByConsolidationKeyRequest = {
  
  consolidationKey: "consolidation_key_example",
};

const data = await apiInstance.getMemesOwnerBalanceByConsolidationKey(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] |  | defaults to undefined


### Return type

**Array<ApiOwnerBalanceMemes>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Memes Owner Balance for consolidation key not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getOwnerBalanceByConsolidationKey**
> ApiOwnerBalance getOwnerBalanceByConsolidationKey()


### Example


```typescript
import { createConfiguration, OwnersBalancesApi } from '';
import type { OwnersBalancesApiGetOwnerBalanceByConsolidationKeyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OwnersBalancesApi(configuration);

const request: OwnersBalancesApiGetOwnerBalanceByConsolidationKeyRequest = {
  
  consolidationKey: "consolidation_key_example",
};

const data = await apiInstance.getOwnerBalanceByConsolidationKey(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] |  | defaults to undefined


### Return type

**ApiOwnerBalance**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Owner Balance for consolidation key not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getOwnerBalances**
> Array<ApiOwnerBalancePage> getOwnerBalances()


### Example


```typescript
import { createConfiguration, OwnersBalancesApi } from '';
import type { OwnersBalancesApiGetOwnerBalancesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OwnersBalancesApi(configuration);

const request: OwnersBalancesApiGetOwnerBalancesRequest = {
    // Default is 50 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
    // Default is DESC (optional)
  sortDirection: "ASC",
};

const data = await apiInstance.getOwnerBalances(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pageSize** | [**number**] | Default is 50 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** | Default is DESC | (optional) defaults to undefined


### Return type

**Array<ApiOwnerBalancePage>**

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


