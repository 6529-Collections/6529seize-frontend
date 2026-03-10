# .DistributionsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**completeDistributionPhotoMultipartUpload**](DistributionsApi.md#completeDistributionPhotoMultipartUpload) | **POST** /distribution_photos/{contract}/{nft_id}/multipart-upload/completion | Complete multipart upload for distribution photo
[**completeDistributionPhotosUpload**](DistributionsApi.md#completeDistributionPhotosUpload) | **POST** /distribution_photos/{contract}/{nft_id}/complete | Save uploaded distribution photos to database
[**createDistributionPhotoMultipartUpload**](DistributionsApi.md#createDistributionPhotoMultipartUpload) | **POST** /distribution_photos/{contract}/{nft_id}/multipart-upload | Start multipart upload for distribution photo
[**createDistributionPhotoUploadUrl**](DistributionsApi.md#createDistributionPhotoUploadUrl) | **POST** /distribution_photos/{contract}/{nft_id}/prep | Get presigned S3 URL for distribution photo upload
[**getDistributionOverview**](DistributionsApi.md#getDistributionOverview) | **GET** /distributions/{contract}/{id}/overview | Get distribution overview for a specific contract and card
[**getDistributionPhases**](DistributionsApi.md#getDistributionPhases) | **GET** /distribution_phases/{contract}/{nft_id} | Get distribution phases for a specific contract and NFT
[**getDistributionPhotos**](DistributionsApi.md#getDistributionPhotos) | **GET** /distribution_photos/{contract}/{nft_id} | Get distribution photos for a specific contract and NFT
[**getDistributions**](DistributionsApi.md#getDistributions) | **GET** /distributions | Get distributions
[**uploadPartOfDistributionPhotoMultipartUpload**](DistributionsApi.md#uploadPartOfDistributionPhotoMultipartUpload) | **POST** /distribution_photos/{contract}/{nft_id}/multipart-upload/part | Get presigned URL for multipart upload part


# **completeDistributionPhotoMultipartUpload**
> ApiCompleteMultipartUploadResponse completeDistributionPhotoMultipartUpload(apiCompleteMultipartUploadRequest)

Requires the user to be authenticated as a Subscription Admin

### Example


```typescript
import { createConfiguration, DistributionsApi } from '';
import type { DistributionsApiCompleteDistributionPhotoMultipartUploadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DistributionsApi(configuration);

const request: DistributionsApiCompleteDistributionPhotoMultipartUploadRequest = {
    // Contract address
  contract: "contract_example",
    // NFT ID
  nftId: 1,
  
  apiCompleteMultipartUploadRequest: null,
};

const data = await apiInstance.completeDistributionPhotoMultipartUpload(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCompleteMultipartUploadRequest** | **ApiCompleteMultipartUploadRequest**|  |
 **contract** | [**string**] | Contract address | defaults to undefined
 **nftId** | [**number**] | NFT ID | defaults to undefined


### Return type

**ApiCompleteMultipartUploadResponse**

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
**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **completeDistributionPhotosUpload**
> DistributionPhotoCompleteResponse completeDistributionPhotosUpload(distributionPhotoCompleteRequest)

Requires the user to be authenticated as a Subscription Admin. Replaces all existing photos for the card.

### Example


```typescript
import { createConfiguration, DistributionsApi } from '';
import type { DistributionsApiCompleteDistributionPhotosUploadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DistributionsApi(configuration);

const request: DistributionsApiCompleteDistributionPhotosUploadRequest = {
    // Contract address
  contract: "contract_example",
    // NFT ID
  nftId: 1,
  
  distributionPhotoCompleteRequest: {
    photos: [
      {
        media_url: "media_url_example",
      },
    ],
  },
};

const data = await apiInstance.completeDistributionPhotosUpload(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **distributionPhotoCompleteRequest** | **DistributionPhotoCompleteRequest**|  |
 **contract** | [**string**] | Contract address | defaults to undefined
 **nftId** | [**number**] | NFT ID | defaults to undefined


### Return type

**DistributionPhotoCompleteResponse**

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
**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **createDistributionPhotoMultipartUpload**
> ApiStartMultipartMediaUploadResponse createDistributionPhotoMultipartUpload(apiCreateMediaUploadUrlRequest)

Requires the user to be authenticated as a Subscription Admin

### Example


```typescript
import { createConfiguration, DistributionsApi } from '';
import type { DistributionsApiCreateDistributionPhotoMultipartUploadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DistributionsApi(configuration);

const request: DistributionsApiCreateDistributionPhotoMultipartUploadRequest = {
    // Contract address
  contract: "contract_example",
    // NFT ID
  nftId: 1,
  
  apiCreateMediaUploadUrlRequest: null,
};

const data = await apiInstance.createDistributionPhotoMultipartUpload(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCreateMediaUploadUrlRequest** | **ApiCreateMediaUploadUrlRequest**|  |
 **contract** | [**string**] | Contract address | defaults to undefined
 **nftId** | [**number**] | NFT ID | defaults to undefined


### Return type

**ApiStartMultipartMediaUploadResponse**

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
**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **createDistributionPhotoUploadUrl**
> ApiCreateMediaUrlResponse createDistributionPhotoUploadUrl(apiCreateMediaUploadUrlRequest)

Requires the user to be authenticated as a Subscription Admin

### Example


```typescript
import { createConfiguration, DistributionsApi } from '';
import type { DistributionsApiCreateDistributionPhotoUploadUrlRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DistributionsApi(configuration);

const request: DistributionsApiCreateDistributionPhotoUploadUrlRequest = {
    // Contract address
  contract: "contract_example",
    // NFT ID
  nftId: 1,
  
  apiCreateMediaUploadUrlRequest: null,
};

const data = await apiInstance.createDistributionPhotoUploadUrl(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCreateMediaUploadUrlRequest** | **ApiCreateMediaUploadUrlRequest**|  |
 **contract** | [**string**] | Contract address | defaults to undefined
 **nftId** | [**number**] | NFT ID | defaults to undefined


### Return type

**ApiCreateMediaUrlResponse**

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
**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getDistributionOverview**
> DistributionOverview getDistributionOverview()

Requires the user to be authenticated as a Subscription Admin

### Example


```typescript
import { createConfiguration, DistributionsApi } from '';
import type { DistributionsApiGetDistributionOverviewRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DistributionsApi(configuration);

const request: DistributionsApiGetDistributionOverviewRequest = {
    // Contract address
  contract: "contract_example",
    // Card ID
  id: 1,
};

const data = await apiInstance.getDistributionOverview(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contract** | [**string**] | Contract address | defaults to undefined
 **id** | [**number**] | Card ID | defaults to undefined


### Return type

**DistributionOverview**

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
**403** | Forbidden - not a Subscription Admin |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getDistributionPhases**
> DistributionPhasesPage getDistributionPhases()


### Example


```typescript
import { createConfiguration, DistributionsApi } from '';
import type { DistributionsApiGetDistributionPhasesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DistributionsApi(configuration);

const request: DistributionsApiGetDistributionPhasesRequest = {
    // Contract address
  contract: "contract_example",
    // NFT ID
  nftId: 1,
};

const data = await apiInstance.getDistributionPhases(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contract** | [**string**] | Contract address | defaults to undefined
 **nftId** | [**number**] | NFT ID | defaults to undefined


### Return type

**DistributionPhasesPage**

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

# **getDistributionPhotos**
> DistributionPhotosPage getDistributionPhotos()


### Example


```typescript
import { createConfiguration, DistributionsApi } from '';
import type { DistributionsApiGetDistributionPhotosRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DistributionsApi(configuration);

const request: DistributionsApiGetDistributionPhotosRequest = {
    // Contract address
  contract: "contract_example",
    // NFT ID
  nftId: 1,
    // Default is 50 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
};

const data = await apiInstance.getDistributionPhotos(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contract** | [**string**] | Contract address | defaults to undefined
 **nftId** | [**number**] | NFT ID | defaults to undefined
 **pageSize** | [**number**] | Default is 50 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined


### Return type

**DistributionPhotosPage**

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

# **getDistributions**
> DistributionNormalizedPage getDistributions()

At least one filter parameter (search, card_id, contract, or wallet) is required

### Example


```typescript
import { createConfiguration, DistributionsApi } from '';
import type { DistributionsApiGetDistributionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DistributionsApi(configuration);

const request: DistributionsApiGetDistributionsRequest = {
    // Default is 2000 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
    // Search by wallet address or display name (optional)
  search: "search_example",
    // Filter by card ID(s), comma-separated for multiple (optional)
  cardId: "card_id_example",
    // Filter by contract address(es), comma-separated for multiple (optional)
  contract: "contract_example",
    // Filter by wallet address(es), comma-separated for multiple (optional)
  wallet: "wallet_example",
};

const data = await apiInstance.getDistributions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pageSize** | [**number**] | Default is 2000 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined
 **search** | [**string**] | Search by wallet address or display name | (optional) defaults to undefined
 **cardId** | [**string**] | Filter by card ID(s), comma-separated for multiple | (optional) defaults to undefined
 **contract** | [**string**] | Filter by contract address(es), comma-separated for multiple | (optional) defaults to undefined
 **wallet** | [**string**] | Filter by wallet address(es), comma-separated for multiple | (optional) defaults to undefined


### Return type

**DistributionNormalizedPage**

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

# **uploadPartOfDistributionPhotoMultipartUpload**
> ApiUploadPartOfMultipartUploadResponse uploadPartOfDistributionPhotoMultipartUpload(apiUploadPartOfMultipartUploadRequest)

Requires the user to be authenticated as a Subscription Admin

### Example


```typescript
import { createConfiguration, DistributionsApi } from '';
import type { DistributionsApiUploadPartOfDistributionPhotoMultipartUploadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DistributionsApi(configuration);

const request: DistributionsApiUploadPartOfDistributionPhotoMultipartUploadRequest = {
    // Contract address
  contract: "contract_example",
    // NFT ID
  nftId: 1,
  
  apiUploadPartOfMultipartUploadRequest: null,
};

const data = await apiInstance.uploadPartOfDistributionPhotoMultipartUpload(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiUploadPartOfMultipartUploadRequest** | **ApiUploadPartOfMultipartUploadRequest**|  |
 **contract** | [**string**] | Contract address | defaults to undefined
 **nftId** | [**number**] | NFT ID | defaults to undefined


### Return type

**ApiUploadPartOfMultipartUploadResponse**

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
**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


