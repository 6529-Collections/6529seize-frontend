# .TDHEditionsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getTdhEditionsByConsolidationKey**](TDHEditionsApi.md#getTdhEditionsByConsolidationKey) | **GET** /tdh-editions/consolidation/{consolidation_key} | Get TDH editions by consolidation key
[**getTdhEditionsByIdentity**](TDHEditionsApi.md#getTdhEditionsByIdentity) | **GET** /tdh-editions/identity/{identity} | Get TDH editions for an identity, wallet address, or ENS
[**getTdhEditionsByWallet**](TDHEditionsApi.md#getTdhEditionsByWallet) | **GET** /tdh-editions/wallet/{wallet} | Get TDH editions for a wallet


# **getTdhEditionsByConsolidationKey**
> ApiTdhEditionsPage getTdhEditionsByConsolidationKey()


### Example


```typescript
import { createConfiguration, TDHEditionsApi } from '';
import type { TDHEditionsApiGetTdhEditionsByConsolidationKeyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TDHEditionsApi(configuration);

const request: TDHEditionsApiGetTdhEditionsByConsolidationKeyRequest = {
  
  consolidationKey: "consolidation_key_example",
  
  contract: "contract_example",
  
  tokenId: 1,
  
  editionId: 1,
  
  sort: "id",
  
  sortDirection: "ASC",
  
  page: 1,
  
  pageSize: 50,
};

const data = await apiInstance.getTdhEditionsByConsolidationKey(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] |  | defaults to undefined
 **contract** | [**string**] |  | (optional) defaults to undefined
 **tokenId** | [**number**] |  | (optional) defaults to undefined
 **editionId** | [**number**] |  | (optional) defaults to undefined
 **sort** | [**&#39;id&#39; | &#39;hodl_rate&#39; | &#39;days_held&#39; | &#39;balance&#39; | &#39;edition_id&#39; | &#39;contract&#39;**]**Array<&#39;id&#39; &#124; &#39;hodl_rate&#39; &#124; &#39;days_held&#39; &#124; &#39;balance&#39; &#124; &#39;edition_id&#39; &#124; &#39;contract&#39;>** |  | (optional) defaults to 'id'
 **sortDirection** | **ApiPageSortDirection** |  | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to 1
 **pageSize** | [**number**] |  | (optional) defaults to 50


### Return type

**ApiTdhEditionsPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Consolidation key not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getTdhEditionsByIdentity**
> ApiTdhEditionsPage getTdhEditionsByIdentity()


### Example


```typescript
import { createConfiguration, TDHEditionsApi } from '';
import type { TDHEditionsApiGetTdhEditionsByIdentityRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TDHEditionsApi(configuration);

const request: TDHEditionsApiGetTdhEditionsByIdentityRequest = {
    // Identity handle, profile id, wallet address, or ENS name
  identity: "identity_example",
  
  contract: "contract_example",
  
  tokenId: 1,
  
  editionId: 1,
  
  sort: "id",
  
  sortDirection: "ASC",
  
  page: 1,
  
  pageSize: 50,
};

const data = await apiInstance.getTdhEditionsByIdentity(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] | Identity handle, profile id, wallet address, or ENS name | defaults to undefined
 **contract** | [**string**] |  | (optional) defaults to undefined
 **tokenId** | [**number**] |  | (optional) defaults to undefined
 **editionId** | [**number**] |  | (optional) defaults to undefined
 **sort** | [**&#39;id&#39; | &#39;hodl_rate&#39; | &#39;days_held&#39; | &#39;balance&#39; | &#39;edition_id&#39; | &#39;contract&#39;**]**Array<&#39;id&#39; &#124; &#39;hodl_rate&#39; &#124; &#39;days_held&#39; &#124; &#39;balance&#39; &#124; &#39;edition_id&#39; &#124; &#39;contract&#39;>** |  | (optional) defaults to 'id'
 **sortDirection** | **ApiPageSortDirection** |  | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to 1
 **pageSize** | [**number**] |  | (optional) defaults to 50


### Return type

**ApiTdhEditionsPage**

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

# **getTdhEditionsByWallet**
> ApiTdhEditionsPage getTdhEditionsByWallet()


### Example


```typescript
import { createConfiguration, TDHEditionsApi } from '';
import type { TDHEditionsApiGetTdhEditionsByWalletRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TDHEditionsApi(configuration);

const request: TDHEditionsApiGetTdhEditionsByWalletRequest = {
  
  wallet: "wallet_example",
  
  contract: "contract_example",
  
  tokenId: 1,
  
  editionId: 1,
  
  sort: "id",
  
  sortDirection: "ASC",
  
  page: 1,
  
  pageSize: 50,
};

const data = await apiInstance.getTdhEditionsByWallet(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wallet** | [**string**] |  | defaults to undefined
 **contract** | [**string**] |  | (optional) defaults to undefined
 **tokenId** | [**number**] |  | (optional) defaults to undefined
 **editionId** | [**number**] |  | (optional) defaults to undefined
 **sort** | [**&#39;id&#39; | &#39;hodl_rate&#39; | &#39;days_held&#39; | &#39;balance&#39; | &#39;edition_id&#39; | &#39;contract&#39;**]**Array<&#39;id&#39; &#124; &#39;hodl_rate&#39; &#124; &#39;days_held&#39; &#124; &#39;balance&#39; &#124; &#39;edition_id&#39; &#124; &#39;contract&#39;>** |  | (optional) defaults to 'id'
 **sortDirection** | **ApiPageSortDirection** |  | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to 1
 **pageSize** | [**number**] |  | (optional) defaults to 50


### Return type

**ApiTdhEditionsPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**400** | Invalid wallet |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


