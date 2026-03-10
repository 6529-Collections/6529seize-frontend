# .RatingsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**bulkRate**](RatingsApi.md#bulkRate) | **POST** /ratings | This is deprecated. Use bulk-rep instead. Bulk rate. Supplied amount will be added to all target identities. If same identity is supplied multiple times, all the additions will be summed up. Targets must be represented as Ethereum wallet addresses. ENS names and profile handles are not supported.
[**bulkRep**](RatingsApi.md#bulkRep) | **POST** /bulk-rep | Change REP rating of multiple targets and categories in one go. Targets  final REP value will be the value you supply here. If you supply multiple  addresses for one consolidation group then those amounts will be summed together.
[**getCreditLeft**](RatingsApi.md#getCreditLeft) | **GET** /ratings/credit | Get available credit for rating


# **bulkRate**
> ApiBulkRateResponse bulkRate(apiBulkRateRequest)


### Example


```typescript
import { createConfiguration, RatingsApi } from '';
import type { RatingsApiBulkRateRequest } from '';

const configuration = createConfiguration();
const apiInstance = new RatingsApi(configuration);

const request: RatingsApiBulkRateRequest = {
  
  apiBulkRateRequest: {
    matter: "REP",
    category: "C",
    amount_to_add: 1,
    target_wallet_addresses: [
      "0x62ECB020842930cc01FFCCfeEe150AC32DcAEc8a",
    ],
  },
};

const data = await apiInstance.bulkRate(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiBulkRateRequest** | **ApiBulkRateRequest**|  |


### Return type

**ApiBulkRateResponse**

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

# **bulkRep**
> void bulkRep(apiBulkRepRequest)


### Example


```typescript
import { createConfiguration, RatingsApi } from '';
import type { RatingsApiBulkRepRequest } from '';

const configuration = createConfiguration();
const apiInstance = new RatingsApi(configuration);

const request: RatingsApiBulkRepRequest = {
  
  apiBulkRepRequest: {
    targets: [
      {
        address: "0x62ECB020842930cc01FFCCfeEe150AC32DcAEc8a",
        category: "G",
        amount: 1,
      },
    ],
  },
};

const data = await apiInstance.bulkRep(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiBulkRepRequest** | **ApiBulkRepRequest**|  |


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

# **getCreditLeft**
> ApiAvailableRatingCredit getCreditLeft()


### Example


```typescript
import { createConfiguration, RatingsApi } from '';
import type { RatingsApiGetCreditLeftRequest } from '';

const configuration = createConfiguration();
const apiInstance = new RatingsApi(configuration);

const request: RatingsApiGetCreditLeftRequest = {
  
  rater: "rater_example",
  
  raterRepresentative: "rater_representative_example",
};

const data = await apiInstance.getCreditLeft(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **rater** | [**string**] |  | defaults to undefined
 **raterRepresentative** | [**string**] |  | (optional) defaults to undefined


### Return type

**ApiAvailableRatingCredit**

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


