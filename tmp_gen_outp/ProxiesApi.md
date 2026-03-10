# .ProxiesApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**acceptAction**](ProxiesApi.md#acceptAction) | **POST** /proxies/{proxyId}/actions/{actionId}/acceptance | Accept action
[**addActionToProxy**](ProxiesApi.md#addActionToProxy) | **POST** /proxies/{proxyId}/actions | Add action to proxy
[**createProxy**](ProxiesApi.md#createProxy) | **POST** /proxies | Create a new proxy
[**getProfileProxies**](ProxiesApi.md#getProfileProxies) | **GET** /profiles/{identity}/proxies | Get profile proxies
[**getProxiesGranted**](ProxiesApi.md#getProxiesGranted) | **GET** /profiles/{identity}/proxies/granted | Get proxies granted by a profile
[**getProxiesReceived**](ProxiesApi.md#getProxiesReceived) | **GET** /profiles/{identity}/proxies/received | Get proxies received by a profile
[**getProxyById**](ProxiesApi.md#getProxyById) | **GET** /proxies/{proxyId} | Get proxy by ID
[**updateAction**](ProxiesApi.md#updateAction) | **PUT** /proxies/{proxyId}/actions/{actionId} | Update action


# **acceptAction**
> void acceptAction(acceptActionRequest)


### Example


```typescript
import { createConfiguration, ProxiesApi } from '';
import type { ProxiesApiAcceptActionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProxiesApi(configuration);

const request: ProxiesApiAcceptActionRequest = {
  
  proxyId: "proxyId_example",
  
  actionId: "actionId_example",
  
  acceptActionRequest: {
    action: "ACCEPT",
  },
};

const data = await apiInstance.acceptAction(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **acceptActionRequest** | **AcceptActionRequest**|  |
 **proxyId** | [**string**] |  | defaults to undefined
 **actionId** | [**string**] |  | defaults to undefined


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
**404** | Proxy or action not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **addActionToProxy**
> ApiProfileProxyAction addActionToProxy(addActionToProxyRequest)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, ProxiesApi } from '';
import type { ProxiesApiAddActionToProxyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProxiesApi(configuration);

const request: ProxiesApiAddActionToProxyRequest = {
  
  proxyId: "proxyId_example",
  
  addActionToProxyRequest: null,
};

const data = await apiInstance.addActionToProxy(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **addActionToProxyRequest** | **AddActionToProxyRequest**|  |
 **proxyId** | [**string**] |  | defaults to undefined


### Return type

**ApiProfileProxyAction**

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
**404** | Proxy not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **createProxy**
> ApiProfileProxy createProxy(apiCreateNewProfileProxy)

Requires the user to be authenticated

### Example


```typescript
import { createConfiguration, ProxiesApi } from '';
import type { ProxiesApiCreateProxyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProxiesApi(configuration);

const request: ProxiesApiCreateProxyRequest = {
  
  apiCreateNewProfileProxy: {
    target_id: "target_id_example",
  },
};

const data = await apiInstance.createProxy(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCreateNewProfileProxy** | **ApiCreateNewProfileProxy**|  |


### Return type

**ApiProfileProxy**

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

# **getProfileProxies**
> Array<ApiProfileProxy> getProfileProxies()


### Example


```typescript
import { createConfiguration, ProxiesApi } from '';
import type { ProxiesApiGetProfileProxiesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProxiesApi(configuration);

const request: ProxiesApiGetProfileProxiesRequest = {
  
  identity: "identity_example",
};

const data = await apiInstance.getProfileProxies(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] |  | defaults to undefined


### Return type

**Array<ApiProfileProxy>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Profile not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getProxiesGranted**
> Array<ApiProfileProxy> getProxiesGranted()


### Example


```typescript
import { createConfiguration, ProxiesApi } from '';
import type { ProxiesApiGetProxiesGrantedRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProxiesApi(configuration);

const request: ProxiesApiGetProxiesGrantedRequest = {
  
  identity: "identity_example",
};

const data = await apiInstance.getProxiesGranted(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] |  | defaults to undefined


### Return type

**Array<ApiProfileProxy>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Profile not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getProxiesReceived**
> Array<ApiProfileProxy> getProxiesReceived()


### Example


```typescript
import { createConfiguration, ProxiesApi } from '';
import type { ProxiesApiGetProxiesReceivedRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProxiesApi(configuration);

const request: ProxiesApiGetProxiesReceivedRequest = {
  
  identity: "identity_example",
};

const data = await apiInstance.getProxiesReceived(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identity** | [**string**] |  | defaults to undefined


### Return type

**Array<ApiProfileProxy>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Profile not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getProxyById**
> ApiProfileProxy getProxyById()


### Example


```typescript
import { createConfiguration, ProxiesApi } from '';
import type { ProxiesApiGetProxyByIdRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProxiesApi(configuration);

const request: ProxiesApiGetProxyByIdRequest = {
  
  proxyId: "proxyId_example",
};

const data = await apiInstance.getProxyById(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **proxyId** | [**string**] |  | defaults to undefined


### Return type

**ApiProfileProxy**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Proxy not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateAction**
> void updateAction(apiUpdateProxyActionRequest)


### Example


```typescript
import { createConfiguration, ProxiesApi } from '';
import type { ProxiesApiUpdateActionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ProxiesApi(configuration);

const request: ProxiesApiUpdateActionRequest = {
  
  proxyId: "proxyId_example",
  
  actionId: "actionId_example",
  
  apiUpdateProxyActionRequest: {
    credit_amount: 1000,
    end_time: 1719850339996,
  },
};

const data = await apiInstance.updateAction(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiUpdateProxyActionRequest** | **ApiUpdateProxyActionRequest**|  |
 **proxyId** | [**string**] |  | defaults to undefined
 **actionId** | [**string**] |  | defaults to undefined


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
**404** | Proxy or action not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


