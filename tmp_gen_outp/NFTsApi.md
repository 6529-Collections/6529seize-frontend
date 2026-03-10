# .NFTsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getNftMediaByContract**](NFTsApi.md#getNftMediaByContract) | **GET** /nfts/{contract}/media | Get NFT Media by Contract
[**getNfts**](NFTsApi.md#getNfts) | **GET** /nfts | Get NFTs


# **getNftMediaByContract**
> Array<ApiNftMedia> getNftMediaByContract()


### Example


```typescript
import { createConfiguration, NFTsApi } from '';
import type { NFTsApiGetNftMediaByContractRequest } from '';

const configuration = createConfiguration();
const apiInstance = new NFTsApi(configuration);

const request: NFTsApiGetNftMediaByContractRequest = {
    // The NFT contract address to filter the media by
  contract: "contract_example",
};

const data = await apiInstance.getNftMediaByContract(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contract** | [**string**] | The NFT contract address to filter the media by | defaults to undefined


### Return type

**Array<ApiNftMedia>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful operation, returns an array of NFT media |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getNfts**
> Array<ApiNftsPage> getNfts()


### Example


```typescript
import { createConfiguration, NFTsApi } from '';
import type { NFTsApiGetNftsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new NFTsApi(configuration);

const request: NFTsApiGetNftsRequest = {
    // Default is 50 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
    // Default is DESC (optional)
  sortDirection: "ASC",
    // Filter by NFT ID (optional)
  id: "id_example",
    // Filter by NFT ID (optional)
  contract: "contract_example",
};

const data = await apiInstance.getNfts(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pageSize** | [**number**] | Default is 50 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** | Default is DESC | (optional) defaults to undefined
 **id** | [**string**] | Filter by NFT ID | (optional) defaults to undefined
 **contract** | [**string**] | Filter by NFT ID | (optional) defaults to undefined


### Return type

**Array<ApiNftsPage>**

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


