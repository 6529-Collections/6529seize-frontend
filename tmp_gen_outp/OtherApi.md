# .OtherApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getBlocks**](OtherApi.md#getBlocks) | **GET** /blocks | Get blocks and related timestamps
[**getConsolidatedUploads**](OtherApi.md#getConsolidatedUploads) | **GET** /consolidated_uploads | Get consolidated TDH snapshots links
[**getMemeArtistsNames**](OtherApi.md#getMemeArtistsNames) | **GET** /memes/artists_names | meme artists names
[**getMemelabArtistsNames**](OtherApi.md#getMemelabArtistsNames) | **GET** /memelab/artists_names | memelab artists names
[**getSettings**](OtherApi.md#getSettings) | **GET** /settings | Seize settings
[**getUploads**](OtherApi.md#getUploads) | **GET** /uploads | Get TDH snapshots links


# **getBlocks**
> ApiBlocksPage getBlocks()


### Example


```typescript
import { createConfiguration, OtherApi } from '';
import type { OtherApiGetBlocksRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OtherApi(configuration);

const request: OtherApiGetBlocksRequest = {
  
  page: 1,
  
  pageSize: 1,
};

const data = await apiInstance.getBlocks(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to undefined


### Return type

**ApiBlocksPage**

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

# **getConsolidatedUploads**
> ApiUploadsPage getConsolidatedUploads()


### Example


```typescript
import { createConfiguration, OtherApi } from '';
import type { OtherApiGetConsolidatedUploadsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OtherApi(configuration);

const request: OtherApiGetConsolidatedUploadsRequest = {
  
  page: 1,
  
  pageSize: 1,
  
  block: 1,
  
  date: new Date('1970-01-01T00:00:00.00Z'),
};

const data = await apiInstance.getConsolidatedUploads(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to undefined
 **block** | [**number**] |  | (optional) defaults to undefined
 **date** | [**Date**] |  | (optional) defaults to undefined


### Return type

**ApiUploadsPage**

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

# **getMemeArtistsNames**
> Array<ApiArtistNameItem> getMemeArtistsNames()


### Example


```typescript
import { createConfiguration, OtherApi } from '';

const configuration = createConfiguration();
const apiInstance = new OtherApi(configuration);

const request = {};

const data = await apiInstance.getMemeArtistsNames(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Array<ApiArtistNameItem>**

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

# **getMemelabArtistsNames**
> Array<ApiArtistNameItem> getMemelabArtistsNames()


### Example


```typescript
import { createConfiguration, OtherApi } from '';

const configuration = createConfiguration();
const apiInstance = new OtherApi(configuration);

const request = {};

const data = await apiInstance.getMemelabArtistsNames(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Array<ApiArtistNameItem>**

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

# **getSettings**
> ApiSeizeSettings getSettings()


### Example


```typescript
import { createConfiguration, OtherApi } from '';

const configuration = createConfiguration();
const apiInstance = new OtherApi(configuration);

const request = {};

const data = await apiInstance.getSettings(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**ApiSeizeSettings**

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

# **getUploads**
> ApiUploadsPage getUploads()


### Example


```typescript
import { createConfiguration, OtherApi } from '';
import type { OtherApiGetUploadsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OtherApi(configuration);

const request: OtherApiGetUploadsRequest = {
  
  page: 1,
  
  pageSize: 1,
  
  block: 1,
  
  date: new Date('1970-01-01T00:00:00.00Z'),
};

const data = await apiInstance.getUploads(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to undefined
 **block** | [**number**] |  | (optional) defaults to undefined
 **date** | [**Date**] |  | (optional) defaults to undefined


### Return type

**ApiUploadsPage**

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


