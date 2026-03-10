# .IdentitiesApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getIdentityByKey**](IdentitiesApi.md#getIdentityByKey) | **GET** /identities/{identity_key} | Get identity by it\&quot;s key. Key can be id, wallet, handle, ENS name, etc...
[**getIdentityByWallet**](IdentitiesApi.md#getIdentityByWallet) | **GET** /identities/by-wallet/{wallet} | Get identity by wallet
[**getIdentitySubscriptions**](IdentitiesApi.md#getIdentitySubscriptions) | **GET** /identities/{id}/subscriptions | Get subscribed actions to identity for authenticated user.
[**searchIdentities**](IdentitiesApi.md#searchIdentities) | **GET** /identities | Search for identities
[**subscribeToIdentityActions**](IdentitiesApi.md#subscribeToIdentityActions) | **POST** /identities/{id}/subscriptions | Subscribe authenticated user to identities actions.
[**unsubscribeFromIdentityActions**](IdentitiesApi.md#unsubscribeFromIdentityActions) | **DELETE** /identities/{id}/subscriptions | Unsubscribe authenticated user from identity actions.


# **getIdentityByKey**
> ApiIdentity getIdentityByKey()


### Example


```typescript
import { createConfiguration, IdentitiesApi } from '';
import type { IdentitiesApiGetIdentityByKeyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new IdentitiesApi(configuration);

const request: IdentitiesApiGetIdentityByKeyRequest = {
  
  identityKey: "identity_key_example",
};

const data = await apiInstance.getIdentityByKey(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identityKey** | [**string**] |  | defaults to undefined


### Return type

**ApiIdentity**

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

# **getIdentityByWallet**
> ApiIdentity getIdentityByWallet()


### Example


```typescript
import { createConfiguration, IdentitiesApi } from '';
import type { IdentitiesApiGetIdentityByWalletRequest } from '';

const configuration = createConfiguration();
const apiInstance = new IdentitiesApi(configuration);

const request: IdentitiesApiGetIdentityByWalletRequest = {
  
  wallet: "wallet_example",
};

const data = await apiInstance.getIdentityByWallet(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wallet** | [**string**] |  | defaults to undefined


### Return type

**ApiIdentity**

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

# **getIdentitySubscriptions**
> ApiIdentitySubscriptionActions getIdentitySubscriptions()


### Example


```typescript
import { createConfiguration, IdentitiesApi } from '';
import type { IdentitiesApiGetIdentitySubscriptionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new IdentitiesApi(configuration);

const request: IdentitiesApiGetIdentitySubscriptionsRequest = {
  
  id: "id_example",
};

const data = await apiInstance.getIdentitySubscriptions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**ApiIdentitySubscriptionActions**

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

# **searchIdentities**
> Array<ApiIdentity> searchIdentities()


### Example


```typescript
import { createConfiguration, IdentitiesApi } from '';
import type { IdentitiesApiSearchIdentitiesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new IdentitiesApi(configuration);

const request: IdentitiesApiSearchIdentitiesRequest = {
    // At least 3 characters of a handle
  handle: "handle_example",
    // Search only users who can view given wave (optional)
  waveId: "wave_id_example",
    // Number of results (20 by default) (optional)
  limit: 1,
    // Search only users who can view given group (optional)
  groupId: "group_id_example",
    // Ignore authenticated user (optional)
  ignoreAuthenticatedUser: true,
};

const data = await apiInstance.searchIdentities(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **handle** | [**string**] | At least 3 characters of a handle | defaults to undefined
 **waveId** | [**string**] | Search only users who can view given wave | (optional) defaults to undefined
 **limit** | [**number**] | Number of results (20 by default) | (optional) defaults to undefined
 **groupId** | [**string**] | Search only users who can view given group | (optional) defaults to undefined
 **ignoreAuthenticatedUser** | [**boolean**] | Ignore authenticated user | (optional) defaults to undefined


### Return type

**Array<ApiIdentity>**

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

# **subscribeToIdentityActions**
> ApiIdentitySubscriptionActions subscribeToIdentityActions(apiIdentitySubscriptionActions)


### Example


```typescript
import { createConfiguration, IdentitiesApi } from '';
import type { IdentitiesApiSubscribeToIdentityActionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new IdentitiesApi(configuration);

const request: IdentitiesApiSubscribeToIdentityActionsRequest = {
  
  id: "id_example",
  
  apiIdentitySubscriptionActions: {
    actions: [
      "WAVE_CREATED",
    ],
  },
};

const data = await apiInstance.subscribeToIdentityActions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiIdentitySubscriptionActions** | **ApiIdentitySubscriptionActions**|  |
 **id** | [**string**] |  | defaults to undefined


### Return type

**ApiIdentitySubscriptionActions**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |
**404** | Identity not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **unsubscribeFromIdentityActions**
> ApiIdentitySubscriptionActions unsubscribeFromIdentityActions(apiIdentitySubscriptionActions)


### Example


```typescript
import { createConfiguration, IdentitiesApi } from '';
import type { IdentitiesApiUnsubscribeFromIdentityActionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new IdentitiesApi(configuration);

const request: IdentitiesApiUnsubscribeFromIdentityActionsRequest = {
  
  id: "id_example",
  
  apiIdentitySubscriptionActions: {
    actions: [
      "WAVE_CREATED",
    ],
  },
};

const data = await apiInstance.unsubscribeFromIdentityActions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiIdentitySubscriptionActions** | **ApiIdentitySubscriptionActions**|  |
 **id** | [**string**] |  | defaults to undefined


### Return type

**ApiIdentitySubscriptionActions**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


