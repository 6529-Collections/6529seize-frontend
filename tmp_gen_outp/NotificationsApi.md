# .NotificationsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getNotifications**](NotificationsApi.md#getNotifications) | **GET** /notifications | Get notifications for authenticated user.
[**getWaveSubscription**](NotificationsApi.md#getWaveSubscription) | **GET** /notifications/wave-subscription/{wave_id} | Get wave subscription
[**markAllNotificationsAsRead**](NotificationsApi.md#markAllNotificationsAsRead) | **POST** /notifications/read | Mark all notifications as read
[**markNotificationAsRead**](NotificationsApi.md#markNotificationAsRead) | **POST** /notifications/{id}/read | Mark notification as read
[**markWaveNotificationsAsRead**](NotificationsApi.md#markWaveNotificationsAsRead) | **POST** /notifications/wave/{wave_id}/read | Mark wave notifications as read
[**subscribeToWaveNotifications**](NotificationsApi.md#subscribeToWaveNotifications) | **POST** /notifications/wave-subscription/{wave_id} | Subscribe to wave notifications
[**unsubscribeFromWaveNotifications**](NotificationsApi.md#unsubscribeFromWaveNotifications) | **DELETE** /notifications/wave-subscription/{wave_id} | Unsubscribe from wave notifications


# **getNotifications**
> ApiNotificationsResponse getNotifications()


### Example


```typescript
import { createConfiguration, NotificationsApi } from '';
import type { NotificationsApiGetNotificationsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new NotificationsApi(configuration);

const request: NotificationsApiGetNotificationsRequest = {
    // Default is 10 (optional)
  limit: 1,
    // Used to find older notifications (optional)
  idLessThan: 3.14,
    // Comma-separated list of notification causes to include (optional)
  cause: "cause_example",
    // Comma-separated list of notification causes to exclude (optional)
  causeExclude: "cause_exclude_example",
    // Only return unread notifications (optional)
  unreadOnly: true,
};

const data = await apiInstance.getNotifications(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | [**number**] | Default is 10 | (optional) defaults to undefined
 **idLessThan** | [**number**] | Used to find older notifications | (optional) defaults to undefined
 **cause** | [**string**] | Comma-separated list of notification causes to include | (optional) defaults to undefined
 **causeExclude** | [**string**] | Comma-separated list of notification causes to exclude | (optional) defaults to undefined
 **unreadOnly** | [**boolean**] | Only return unread notifications | (optional) defaults to undefined


### Return type

**ApiNotificationsResponse**

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

# **getWaveSubscription**
> GetWaveSubscription200Response getWaveSubscription()


### Example


```typescript
import { createConfiguration, NotificationsApi } from '';
import type { NotificationsApiGetWaveSubscriptionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new NotificationsApi(configuration);

const request: NotificationsApiGetWaveSubscriptionRequest = {
  
  waveId: "wave_id_example",
};

const data = await apiInstance.getWaveSubscription(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **waveId** | [**string**] |  | defaults to undefined


### Return type

**GetWaveSubscription200Response**

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

# **markAllNotificationsAsRead**
> void markAllNotificationsAsRead()


### Example


```typescript
import { createConfiguration, NotificationsApi } from '';

const configuration = createConfiguration();
const apiInstance = new NotificationsApi(configuration);

const request = {};

const data = await apiInstance.markAllNotificationsAsRead(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


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
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **markNotificationAsRead**
> void markNotificationAsRead()


### Example


```typescript
import { createConfiguration, NotificationsApi } from '';
import type { NotificationsApiMarkNotificationAsReadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new NotificationsApi(configuration);

const request: NotificationsApiMarkNotificationAsReadRequest = {
    // Notification ID or string \"all\" to mark all notifications as read
  id: "id_example",
};

const data = await apiInstance.markNotificationAsRead(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] | Notification ID or string \&quot;all\&quot; to mark all notifications as read | defaults to undefined


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

# **markWaveNotificationsAsRead**
> void markWaveNotificationsAsRead()


### Example


```typescript
import { createConfiguration, NotificationsApi } from '';
import type { NotificationsApiMarkWaveNotificationsAsReadRequest } from '';

const configuration = createConfiguration();
const apiInstance = new NotificationsApi(configuration);

const request: NotificationsApiMarkWaveNotificationsAsReadRequest = {
  
  waveId: "wave_id_example",
};

const data = await apiInstance.markWaveNotificationsAsRead(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **waveId** | [**string**] |  | defaults to undefined


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
**200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **subscribeToWaveNotifications**
> GetWaveSubscription200Response subscribeToWaveNotifications()


### Example


```typescript
import { createConfiguration, NotificationsApi } from '';
import type { NotificationsApiSubscribeToWaveNotificationsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new NotificationsApi(configuration);

const request: NotificationsApiSubscribeToWaveNotificationsRequest = {
  
  waveId: "wave_id_example",
};

const data = await apiInstance.subscribeToWaveNotifications(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **waveId** | [**string**] |  | defaults to undefined


### Return type

**GetWaveSubscription200Response**

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

# **unsubscribeFromWaveNotifications**
> GetWaveSubscription200Response unsubscribeFromWaveNotifications()


### Example


```typescript
import { createConfiguration, NotificationsApi } from '';
import type { NotificationsApiUnsubscribeFromWaveNotificationsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new NotificationsApi(configuration);

const request: NotificationsApiUnsubscribeFromWaveNotificationsRequest = {
  
  waveId: "wave_id_example",
};

const data = await apiInstance.unsubscribeFromWaveNotifications(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **waveId** | [**string**] |  | defaults to undefined


### Return type

**GetWaveSubscription200Response**

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


