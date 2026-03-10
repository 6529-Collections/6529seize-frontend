# .TransactionsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getTransactions**](TransactionsApi.md#getTransactions) | **GET** /transactions | Get transactions


# **getTransactions**
> Array<ApiTransactionPage> getTransactions()


### Example


```typescript
import { createConfiguration, TransactionsApi } from '';
import type { TransactionsApiGetTransactionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new TransactionsApi(configuration);

const request: TransactionsApiGetTransactionsRequest = {
    // Default is 50 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
    // Filter by wallet address (optional)
  wallets: "wallets_example",
    // Filter by contract address (optional)
  contract: "contract_example",
    // Filter by NFT ID (optional)
  nfts: "nfts_example",
    // Filter by transaction type (optional)
  filter: "sales",
};

const data = await apiInstance.getTransactions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pageSize** | [**number**] | Default is 50 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined
 **wallets** | [**string**] | Filter by wallet address | (optional) defaults to undefined
 **contract** | [**string**] | Filter by contract address | (optional) defaults to undefined
 **nfts** | [**string**] | Filter by NFT ID | (optional) defaults to undefined
 **filter** | [**&#39;sales&#39; | &#39;purchases&#39; | &#39;transfers&#39; | &#39;airdrops&#39; | &#39;burns&#39;**]**Array<&#39;sales&#39; &#124; &#39;purchases&#39; &#124; &#39;transfers&#39; &#124; &#39;airdrops&#39; &#124; &#39;burns&#39;>** | Filter by transaction type | (optional) defaults to undefined


### Return type

**Array<ApiTransactionPage>**

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


