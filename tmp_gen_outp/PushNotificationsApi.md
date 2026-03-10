# .PushNotificationsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deleteDevice**](PushNotificationsApi.md#deleteDevice) | **DELETE** /push-notifications/devices/{device_id} | Delete a registered device
[**getDevices**](PushNotificationsApi.md#getDevices) | **GET** /push-notifications/devices | Get all registered devices for the authenticated user
[**getPushNotificationSettings**](PushNotificationsApi.md#getPushNotificationSettings) | **GET** /push-notifications/settings/{device_id} | Get push notification settings for a device
[**registerPushNotificationToken**](PushNotificationsApi.md#registerPushNotificationToken) | **POST** /push-notifications/register | Register a push notification token
[**updatePushNotificationSettings**](PushNotificationsApi.md#updatePushNotificationSettings) | **PUT** /push-notifications/settings/{device_id} | Update push notification settings for a device


# **deleteDevice**
> void deleteDevice()


### Example


```typescript
import { createConfiguration, PushNotificationsApi } from '';
import type { PushNotificationsApiDeleteDeviceRequest } from '';

const configuration = createConfiguration();
const apiInstance = new PushNotificationsApi(configuration);

const request: PushNotificationsApiDeleteDeviceRequest = {
    // The device ID to delete
  deviceId: "device_id_example",
};

const data = await apiInstance.deleteDevice(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **deviceId** | [**string**] | The device ID to delete | defaults to undefined


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
**204** | Device deleted successfully |  -  |
**401** | Unauthorized |  -  |
**403** | Forbidden - profile required |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getDevices**
> Array<ApiPushNotificationDevice> getDevices()


### Example


```typescript
import { createConfiguration, PushNotificationsApi } from '';

const configuration = createConfiguration();
const apiInstance = new PushNotificationsApi(configuration);

const request = {};

const data = await apiInstance.getDevices(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Array<ApiPushNotificationDevice>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | List of registered devices |  -  |
**401** | Unauthorized |  -  |
**403** | Forbidden - profile required |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getPushNotificationSettings**
> ApiPushNotificationSettings getPushNotificationSettings()


### Example


```typescript
import { createConfiguration, PushNotificationsApi } from '';
import type { PushNotificationsApiGetPushNotificationSettingsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new PushNotificationsApi(configuration);

const request: PushNotificationsApiGetPushNotificationSettingsRequest = {
    // The device ID to get settings for
  deviceId: "device_id_example",
};

const data = await apiInstance.getPushNotificationSettings(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **deviceId** | [**string**] | The device ID to get settings for | defaults to undefined


### Return type

**ApiPushNotificationSettings**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Push notification settings |  -  |
**401** | Unauthorized |  -  |
**403** | Forbidden - profile required |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **registerPushNotificationToken**
> void registerPushNotificationToken(apiRegisterPushNotificationTokenRequest)


### Example


```typescript
import { createConfiguration, PushNotificationsApi } from '';
import type { PushNotificationsApiRegisterPushNotificationTokenRequest } from '';

const configuration = createConfiguration();
const apiInstance = new PushNotificationsApi(configuration);

const request: PushNotificationsApiRegisterPushNotificationTokenRequest = {
  
  apiRegisterPushNotificationTokenRequest: {
    device_id: "device_id_example",
    token: "token_example",
    profile_id: "profile_id_example",
    platform: "platform_example",
  },
};

const data = await apiInstance.registerPushNotificationToken(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiRegisterPushNotificationTokenRequest** | **ApiRegisterPushNotificationTokenRequest**|  |


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
**201** | Push notification token registered successfully |  -  |
**400** | Invalid request |  -  |
**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updatePushNotificationSettings**
> ApiPushNotificationSettings updatePushNotificationSettings(apiPushNotificationSettingsUpdate)


### Example


```typescript
import { createConfiguration, PushNotificationsApi } from '';
import type { PushNotificationsApiUpdatePushNotificationSettingsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new PushNotificationsApi(configuration);

const request: PushNotificationsApiUpdatePushNotificationSettingsRequest = {
    // The device ID to update settings for
  deviceId: "device_id_example",
  
  apiPushNotificationSettingsUpdate: {
    identity_subscribed: true,
    identity_mentioned: true,
    identity_rep: true,
    identity_nic: true,
    drop_quoted: true,
    drop_replied: true,
    drop_voted: true,
    drop_reacted: true,
    drop_boosted: true,
    wave_created: true,
  },
};

const data = await apiInstance.updatePushNotificationSettings(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiPushNotificationSettingsUpdate** | **ApiPushNotificationSettingsUpdate**|  |
 **deviceId** | [**string**] | The device ID to update settings for | defaults to undefined


### Return type

**ApiPushNotificationSettings**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Updated push notification settings |  -  |
**400** | Invalid request |  -  |
**401** | Unauthorized |  -  |
**403** | Forbidden - profile required |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


