# .DropsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**addDropCuration**](DropsApi.md#addDropCuration) | **POST** /drops/{dropId}/curations | Mark a drop as curated by authenticated user
[**bookmarkDrop**](DropsApi.md#bookmarkDrop) | **POST** /drops/{dropId}/bookmark | Bookmark a drop
[**boostDrop**](DropsApi.md#boostDrop) | **POST** /drops/{dropId}/boosts | Boost drop
[**completeDropMultipartUpload**](DropsApi.md#completeDropMultipartUpload) | **POST** /drop-media/multipart-upload/completion | Complete the multipart upload
[**completeWaveMultipartUpload**](DropsApi.md#completeWaveMultipartUpload) | **POST** /wave-media/multipart-upload/completion | Complete the multipart upload
[**createDrop**](DropsApi.md#createDrop) | **POST** /drops | Create a drop
[**createDropMediaUrl**](DropsApi.md#createDropMediaUrl) | **POST** /drop-media/prep | Create S3 URL for drop media upload
[**createMultipartDropMediaUrl**](DropsApi.md#createMultipartDropMediaUrl) | **POST** /drop-media/multipart-upload | Get upload ID and key for multipart upload
[**createMultipartWaveMediaUrl**](DropsApi.md#createMultipartWaveMediaUrl) | **POST** /wave-media/multipart-upload | Get upload ID and key for multipart upload
[**deleteDropBoost**](DropsApi.md#deleteDropBoost) | **DELETE** /drops/{dropId}/boosts | Delete drop boost
[**deleteDropById**](DropsApi.md#deleteDropById) | **DELETE** /drops/{dropId} | Delete drop by ID
[**getBookmarkedDrops**](DropsApi.md#getBookmarkedDrops) | **GET** /drops-bookmarked/ | Get bookmarked drops for authenticated user
[**getBoostedDrops**](DropsApi.md#getBoostedDrops) | **GET** /boosted-drops/ | Get boosted drops.
[**getDropBoostsById**](DropsApi.md#getDropBoostsById) | **GET** /drops/{dropId}/boosts | Get drop boosts by Drop ID.
[**getDropById**](DropsApi.md#getDropById) | **GET** /drops/{dropId} | Get drop by ID.
[**getDropCurators**](DropsApi.md#getDropCurators) | **GET** /drops/{dropId}/curations | Get identities who curated a drop
[**getDropIds**](DropsApi.md#getDropIds) | **GET** /drop-ids | Get drop IDs in wave by serial range.
[**getLatestDrops**](DropsApi.md#getLatestDrops) | **GET** /drops | Get latest drops.
[**getLightDrops**](DropsApi.md#getLightDrops) | **GET** /light-drops | Get light drops
[**markDropUnread**](DropsApi.md#markDropUnread) | **POST** /drops/{dropId}/mark-unread | Mark a drop and all subsequent drops in the wave as unread
[**rateDrop**](DropsApi.md#rateDrop) | **POST** /drops/{dropId}/ratings | Rate a drop
[**reactToDrop**](DropsApi.md#reactToDrop) | **POST** /drops/{dropId}/reactions | React to a drop
[**removeDropCuration**](DropsApi.md#removeDropCuration) | **DELETE** /drops/{dropId}/curations | Remove authenticated user\&quot;s curation from a drop
[**removeReactionFromDrop**](DropsApi.md#removeReactionFromDrop) | **DELETE** /drops/{dropId}/reactions | Remove reaction from a drop
[**subscribeToDropActions**](DropsApi.md#subscribeToDropActions) | **POST** /drops/{dropId}/subscriptions | Subscribe authenticated user to drop actions.
[**toggleHideLinkPreview**](DropsApi.md#toggleHideLinkPreview) | **POST** /drops/{dropId}/toggle-hide-link-preview | Toggle hide link preview for a drop
[**unbookmarkDrop**](DropsApi.md#unbookmarkDrop) | **DELETE** /drops/{dropId}/bookmark | Remove bookmark from drop
[**unsubscribeFromDropActions**](DropsApi.md#unsubscribeFromDropActions) | **DELETE** /drops/{dropId}/subscriptions | Unsubscribe authenticated user from drop actions.
[**updateDropById**](DropsApi.md#updateDropById) | **POST** /drops/{dropId} | Update drop by ID
[**uploadPartOfDropMultipartUpload**](DropsApi.md#uploadPartOfDropMultipartUpload) | **POST** /drop-media/multipart-upload/part | Upload a part of multipart upload
[**uploadPartOfWaveMultipartUpload**](DropsApi.md#uploadPartOfWaveMultipartUpload) | **POST** /wave-media/multipart-upload/part | Upload a part of multipart upload


# **addDropCuration**
> void addDropCuration()


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiAddDropCurationRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiAddDropCurationRequest = {
  
  dropId: "dropId_example",
};

const data = await apiInstance.addDropCuration(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**void**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **bookmarkDrop**
> ApiDrop bookmarkDrop()

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiBookmarkDropRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiBookmarkDropRequest = {
  
  dropId: "dropId_example",
};

const data = await apiInstance.bookmarkDrop(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**ApiDrop**

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
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **boostDrop**
> void boostDrop()


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiBoostDropRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiBoostDropRequest = {
  
  dropId: "dropId_example",
};

const data = await apiInstance.boostDrop(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**void**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**400** | Invalid request |  -  |
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **completeDropMultipartUpload**
> ApiCompleteMultipartUploadResponse completeDropMultipartUpload(apiCompleteMultipartUploadRequest)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiCompleteDropMultipartUploadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiCompleteDropMultipartUploadRequest = {
  
  apiCompleteMultipartUploadRequest: null,
};

const data = await apiInstance.completeDropMultipartUpload(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCompleteMultipartUploadRequest** | **ApiCompleteMultipartUploadRequest**|  |


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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **completeWaveMultipartUpload**
> ApiCompleteMultipartUploadResponse completeWaveMultipartUpload(apiCompleteMultipartUploadRequest)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiCompleteWaveMultipartUploadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiCompleteWaveMultipartUploadRequest = {
  
  apiCompleteMultipartUploadRequest: null,
};

const data = await apiInstance.completeWaveMultipartUpload(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCompleteMultipartUploadRequest** | **ApiCompleteMultipartUploadRequest**|  |


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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **createDrop**
> ApiDrop createDrop(apiCreateDropRequest)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiCreateDropRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiCreateDropRequest = {
  
  apiCreateDropRequest: ,
};

const data = await apiInstance.createDrop(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCreateDropRequest** | **ApiCreateDropRequest**|  |


### Return type

**ApiDrop**

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

# **createDropMediaUrl**
> ApiCreateMediaUrlResponse createDropMediaUrl(apiCreateMediaUploadUrlRequest)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiCreateDropMediaUrlRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiCreateDropMediaUrlRequest = {
  
  apiCreateMediaUploadUrlRequest: null,
};

const data = await apiInstance.createDropMediaUrl(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCreateMediaUploadUrlRequest** | **ApiCreateMediaUploadUrlRequest**|  |


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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **createMultipartDropMediaUrl**
> ApiStartMultipartMediaUploadResponse createMultipartDropMediaUrl(apiCreateMediaUploadUrlRequest)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiCreateMultipartDropMediaUrlRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiCreateMultipartDropMediaUrlRequest = {
  
  apiCreateMediaUploadUrlRequest: null,
};

const data = await apiInstance.createMultipartDropMediaUrl(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCreateMediaUploadUrlRequest** | **ApiCreateMediaUploadUrlRequest**|  |


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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **createMultipartWaveMediaUrl**
> ApiStartMultipartMediaUploadResponse createMultipartWaveMediaUrl(apiCreateMediaUploadUrlRequest)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiCreateMultipartWaveMediaUrlRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiCreateMultipartWaveMediaUrlRequest = {
  
  apiCreateMediaUploadUrlRequest: null,
};

const data = await apiInstance.createMultipartWaveMediaUrl(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCreateMediaUploadUrlRequest** | **ApiCreateMediaUploadUrlRequest**|  |


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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **deleteDropBoost**
> void deleteDropBoost()


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiDeleteDropBoostRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiDeleteDropBoostRequest = {
  
  dropId: "dropId_example",
};

const data = await apiInstance.deleteDropBoost(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**void**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **deleteDropById**
> void deleteDropById()


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiDeleteDropByIdRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiDeleteDropByIdRequest = {
  
  dropId: "dropId_example",
};

const data = await apiInstance.deleteDropById(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**void**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getBookmarkedDrops**
> ApiDropsPage getBookmarkedDrops()

Requires the user to be authenticated. Returns drops bookmarked by the current user, sorted by bookmark time.

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiGetBookmarkedDropsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiGetBookmarkedDropsRequest = {
    // Filter by wave (optional)
  waveId: "wave_id_example",
  
  page: 1,
  
  pageSize: 1,
    // Default is DESC (newest bookmarks first) (optional)
  sortDirection: "ASC",
};

const data = await apiInstance.getBookmarkedDrops(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **waveId** | [**string**] | Filter by wave | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to undefined
 **sortDirection** | **ApiPageSortDirection** | Default is DESC (newest bookmarks first) | (optional) defaults to undefined


### Return type

**ApiDropsPage**

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

# **getBoostedDrops**
> ApiDropsPage getBoostedDrops()


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiGetBoostedDropsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiGetBoostedDropsRequest = {
    // Drops by author (optional)
  author: "author_example",
    // Drops boosted by given identity (optional)
  booster: "booster_example",
    // Drops by wave (optional)
  waveId: "wave_id_example",
    // Must be boosted at least so many times (optional)
  minBoosts: 1,
  
  page: 1,
  
  pageSize: 1,
    // Default is DESC (optional)
  sortDirection: "ASC",
    // Default is last_boosted_at (optional)
  sort: "last_boosted_at",
    // Timestamp in millis (optional)
  countOnlyBoostsAfter: 1,
};

const data = await apiInstance.getBoostedDrops(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **author** | [**string**] | Drops by author | (optional) defaults to undefined
 **booster** | [**string**] | Drops boosted by given identity | (optional) defaults to undefined
 **waveId** | [**string**] | Drops by wave | (optional) defaults to undefined
 **minBoosts** | [**number**] | Must be boosted at least so many times | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to undefined
 **sortDirection** | **ApiPageSortDirection** | Default is DESC | (optional) defaults to undefined
 **sort** | [**&#39;last_boosted_at&#39; | &#39;first_boosted_at&#39; | &#39;drop_created_at&#39; | &#39;boosts&#39;**]**Array<&#39;last_boosted_at&#39; &#124; &#39;first_boosted_at&#39; &#124; &#39;drop_created_at&#39; &#124; &#39;boosts&#39;>** | Default is last_boosted_at | (optional) defaults to undefined
 **countOnlyBoostsAfter** | [**number**] | Timestamp in millis | (optional) defaults to undefined


### Return type

**ApiDropsPage**

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

# **getDropBoostsById**
> ApiDropBoostsPage getDropBoostsById()


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiGetDropBoostsByIdRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiGetDropBoostsByIdRequest = {
  
  dropId: "dropId_example",
  
  pageSize: 1,
  
  page: 1,
    // Default is DESC (optional)
  sortDirection: "ASC",
    // Default is boosted_at (optional)
  sort: "boosted_at",
};

const data = await apiInstance.getDropBoostsById(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **dropId** | [**string**] |  | defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **sortDirection** | **ApiPageSortDirection** | Default is DESC | (optional) defaults to undefined
 **sort** | [**&#39;boosted_at&#39;**]**Array<&#39;boosted_at&#39;>** | Default is boosted_at | (optional) defaults to undefined


### Return type

**ApiDropBoostsPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getDropById**
> ApiDrop getDropById()


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiGetDropByIdRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiGetDropByIdRequest = {
  
  dropId: "dropId_example",
};

const data = await apiInstance.getDropById(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**ApiDrop**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getDropCurators**
> ApiProfileMinsPage getDropCurators()


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiGetDropCuratorsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiGetDropCuratorsRequest = {
  
  dropId: "dropId_example",
  
  page: 1,
  
  pageSize: 1,
    // Default is DESC (optional)
  sortDirection: "ASC",
};

const data = await apiInstance.getDropCurators(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **dropId** | [**string**] |  | defaults to undefined
 **page** | [**number**] |  | (optional) defaults to undefined
 **pageSize** | [**number**] |  | (optional) defaults to undefined
 **sortDirection** | **ApiPageSortDirection** | Default is DESC | (optional) defaults to undefined


### Return type

**ApiProfileMinsPage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getDropIds**
> Array<ApiDropId> getDropIds()


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiGetDropIdsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiGetDropIdsRequest = {
    // Drops in wave with given ID
  waveId: "wave_id_example",
  
  minSerialNo: 1,
  
  maxSerialNo: 1,
    // How many IDs to return (100 by default) (optional)
  limit: 100,
};

const data = await apiInstance.getDropIds(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **waveId** | [**string**] | Drops in wave with given ID | defaults to undefined
 **minSerialNo** | [**number**] |  | defaults to undefined
 **maxSerialNo** | [**number**] |  | (optional) defaults to undefined
 **limit** | [**number**] | How many IDs to return (100 by default) | (optional) defaults to 100


### Return type

**Array<ApiDropId>**

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

# **getLatestDrops**
> Array<ApiDrop> getLatestDrops()


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiGetLatestDropsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiGetLatestDropsRequest = {
    // How many drops to return (10 by default) (optional)
  limit: 1,
    // Drops by author (optional)
  author: "author_example",
    // Drops by authors that fall into supplied group (optional)
  groupId: "group_id_example",
    // Drops in wave with given ID (optional)
  waveId: "wave_id_example",
    // Used to find older drops (optional)
  serialNoLessThan: 1,
    // If true then reply drops will be included in top level (false by default) (optional)
  includeReplies: true,
    // Filter by drop type (optional)
  dropType: "CHAT",
    // Comma-separated list of drop IDs to fetch (optional)
  ids: "ids_example",
    // If true then only drops that have at least one media attachment will be returned (false by default) (optional)
  containsMedia: true,
};

const data = await apiInstance.getLatestDrops(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | [**number**] | How many drops to return (10 by default) | (optional) defaults to undefined
 **author** | [**string**] | Drops by author | (optional) defaults to undefined
 **groupId** | [**string**] | Drops by authors that fall into supplied group | (optional) defaults to undefined
 **waveId** | [**string**] | Drops in wave with given ID | (optional) defaults to undefined
 **serialNoLessThan** | [**number**] | Used to find older drops | (optional) defaults to undefined
 **includeReplies** | [**boolean**] | If true then reply drops will be included in top level (false by default) | (optional) defaults to undefined
 **dropType** | **ApiDropType** | Filter by drop type | (optional) defaults to undefined
 **ids** | [**string**] | Comma-separated list of drop IDs to fetch | (optional) defaults to undefined
 **containsMedia** | [**boolean**] | If true then only drops that have at least one media attachment will be returned (false by default) | (optional) defaults to undefined


### Return type

**Array<ApiDrop>**

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

# **getLightDrops**
> Array<ApiLightDrop> getLightDrops()


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiGetLightDropsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiGetLightDropsRequest = {
  
  limit: 1,
    // Drops in wave with given ID
  waveId: "wave_id_example",
    // Latest message if null (optional)
  maxSerialNo: 1,
};

const data = await apiInstance.getLightDrops(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | [**number**] |  | defaults to undefined
 **waveId** | [**string**] | Drops in wave with given ID | defaults to undefined
 **maxSerialNo** | [**number**] | Latest message if null | (optional) defaults to undefined


### Return type

**Array<ApiLightDrop>**

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

# **markDropUnread**
> ApiMarkDropUnreadResponse markDropUnread()

Sets the user\"s latest_read_timestamp to just before this drop\"s created_at, making this drop and all newer drops unread.

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiMarkDropUnreadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiMarkDropUnreadRequest = {
  
  dropId: "dropId_example",
};

const data = await apiInstance.markDropUnread(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**ApiMarkDropUnreadResponse**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **rateDrop**
> ApiDrop rateDrop(apiDropRatingRequest)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiRateDropRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiRateDropRequest = {
  
  dropId: "dropId_example",
  
  apiDropRatingRequest: {
    rating: 3.14,
    category: "category_example",
  },
};

const data = await apiInstance.rateDrop(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiDropRatingRequest** | **ApiDropRatingRequest**|  |
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**ApiDrop**

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
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **reactToDrop**
> void reactToDrop(apiAddReactionToDropRequest)


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiReactToDropRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiReactToDropRequest = {
  
  dropId: "dropId_example",
  
  apiAddReactionToDropRequest: {
    reaction: "reaction_example",
  },
};

const data = await apiInstance.reactToDrop(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiAddReactionToDropRequest** | **ApiAddReactionToDropRequest**|  |
 **dropId** | [**string**] |  | defaults to undefined


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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **removeDropCuration**
> void removeDropCuration()


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiRemoveDropCurationRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiRemoveDropCurationRequest = {
  
  dropId: "dropId_example",
};

const data = await apiInstance.removeDropCuration(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**void**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **removeReactionFromDrop**
> void removeReactionFromDrop(apiAddReactionToDropRequest)


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiRemoveReactionFromDropRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiRemoveReactionFromDropRequest = {
  
  dropId: "dropId_example",
  
  apiAddReactionToDropRequest: {
    reaction: "reaction_example",
  },
};

const data = await apiInstance.removeReactionFromDrop(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiAddReactionToDropRequest** | **ApiAddReactionToDropRequest**|  |
 **dropId** | [**string**] |  | defaults to undefined


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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **subscribeToDropActions**
> ApiDropSubscriptionActions subscribeToDropActions(apiDropSubscriptionActions)


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiSubscribeToDropActionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiSubscribeToDropActionsRequest = {
  
  dropId: "dropId_example",
  
  apiDropSubscriptionActions: {
    actions: [
      "DROP_REPLIED",
    ],
  },
};

const data = await apiInstance.subscribeToDropActions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiDropSubscriptionActions** | **ApiDropSubscriptionActions**|  |
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**ApiDropSubscriptionActions**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**404** | Wave not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **toggleHideLinkPreview**
> ApiDrop toggleHideLinkPreview()

Toggles (flips) hide_link_preview for a drop. Only the author can call this endpoint.

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiToggleHideLinkPreviewRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiToggleHideLinkPreviewRequest = {
  
  dropId: "dropId_example",
};

const data = await apiInstance.toggleHideLinkPreview(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**ApiDrop**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**403** | Only the author can toggle hide link preview |  -  |
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **unbookmarkDrop**
> ApiDrop unbookmarkDrop()

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiUnbookmarkDropRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiUnbookmarkDropRequest = {
  
  dropId: "dropId_example",
};

const data = await apiInstance.unbookmarkDrop(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**ApiDrop**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **unsubscribeFromDropActions**
> ApiDropSubscriptionActions unsubscribeFromDropActions(apiDropSubscriptionActions)


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiUnsubscribeFromDropActionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiUnsubscribeFromDropActionsRequest = {
  
  dropId: "dropId_example",
  
  apiDropSubscriptionActions: {
    actions: [
      "DROP_REPLIED",
    ],
  },
};

const data = await apiInstance.unsubscribeFromDropActions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiDropSubscriptionActions** | **ApiDropSubscriptionActions**|  |
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**ApiDropSubscriptionActions**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**404** | Wave not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateDropById**
> ApiDrop updateDropById(apiUpdateDropRequest)


### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiUpdateDropByIdRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiUpdateDropByIdRequest = {
  
  dropId: "dropId_example",
  
  apiUpdateDropRequest: ,
};

const data = await apiInstance.updateDropById(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiUpdateDropRequest** | **ApiUpdateDropRequest**|  |
 **dropId** | [**string**] |  | defaults to undefined


### Return type

**ApiDrop**

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
**404** | Drop not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **uploadPartOfDropMultipartUpload**
> ApiUploadPartOfMultipartUploadResponse uploadPartOfDropMultipartUpload(apiUploadPartOfMultipartUploadRequest)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiUploadPartOfDropMultipartUploadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiUploadPartOfDropMultipartUploadRequest = {
  
  apiUploadPartOfMultipartUploadRequest: null,
};

const data = await apiInstance.uploadPartOfDropMultipartUpload(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiUploadPartOfMultipartUploadRequest** | **ApiUploadPartOfMultipartUploadRequest**|  |


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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **uploadPartOfWaveMultipartUpload**
> ApiUploadPartOfMultipartUploadResponse uploadPartOfWaveMultipartUpload(apiUploadPartOfMultipartUploadRequest)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, DropsApi } from '';
import type { DropsApiUploadPartOfWaveMultipartUploadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DropsApi(configuration);

const request: DropsApiUploadPartOfWaveMultipartUploadRequest = {
  
  apiUploadPartOfMultipartUploadRequest: null,
};

const data = await apiInstance.uploadPartOfWaveMultipartUpload(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiUploadPartOfMultipartUploadRequest** | **ApiUploadPartOfMultipartUploadRequest**|  |


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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


