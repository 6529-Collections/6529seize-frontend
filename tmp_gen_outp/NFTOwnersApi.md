# .NFTOwnersApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getNftOwners**](NFTOwnersApi.md#getNftOwners) | **GET** /nft-owners | Get NFT owners
[**getNftOwnersByConsolidationKey**](NFTOwnersApi.md#getNftOwnersByConsolidationKey) | **GET** /nft-owners/consolidation/{consolidation_key} | Get NFT owners by consolidation key


# **getNftOwners**
> Array<ApiNftOwnerPage> getNftOwners()


### Example


```typescript
import { createConfiguration, NFTOwnersApi } from '';
import type { NFTOwnersApiGetNftOwnersRequest } from '';

const configuration = createConfiguration();
const apiInstance = new NFTOwnersApi(configuration);

const request: NFTOwnersApiGetNftOwnersRequest = {
    // Default is 50 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
    // Default is DESC (optional)
  sortDirection: "ASC",
    // Filter by contract address (optional)
  contract: "contract_example",
    // Filter by token ID (optional)
  tokenId: "token_id_example",
};

const data = await apiInstance.getNftOwners(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pageSize** | [**number**] | Default is 50 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** | Default is DESC | (optional) defaults to undefined
 **contract** | [**string**] | Filter by contract address | (optional) defaults to undefined
 **tokenId** | [**string**] | Filter by token ID | (optional) defaults to undefined


### Return type

**Array<ApiNftOwnerPage>**

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

# **getNftOwnersByConsolidationKey**
> Array<ApiNftOwnerPage> getNftOwnersByConsolidationKey()


### Example


```typescript
import { createConfiguration, NFTOwnersApi } from '';
import type { NFTOwnersApiGetNftOwnersByConsolidationKeyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new NFTOwnersApi(configuration);

const request: NFTOwnersApiGetNftOwnersByConsolidationKeyRequest = {
  
  consolidationKey: "consolidation_key_example",
    // Default is 50 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
    // Default is DESC (optional)
  sortDirection: "ASC",
    // Filter by contract address (optional)
  contract: "contract_example",
    // Filter by token ID (optional)
  tokenId: "token_id_example",
};

const data = await apiInstance.getNftOwnersByConsolidationKey(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **consolidationKey** | [**string**] |  | defaults to undefined
 **pageSize** | [**number**] | Default is 50 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** | Default is DESC | (optional) defaults to undefined
 **contract** | [**string**] | Filter by contract address | (optional) defaults to undefined
 **tokenId** | [**string**] | Filter by token ID | (optional) defaults to undefined


### Return type

**Array<ApiNftOwnerPage>**

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


