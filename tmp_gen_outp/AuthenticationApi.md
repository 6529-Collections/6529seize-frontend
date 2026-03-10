# .AuthenticationApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getAuthToken**](AuthenticationApi.md#getAuthToken) | **POST** /auth/login | Authenticate and get JWT token
[**getNonce**](AuthenticationApi.md#getNonce) | **GET** /auth/nonce | Get a message to sign with your web3 wallet
[**redeemRefreshToken**](AuthenticationApi.md#redeemRefreshToken) | **POST** /auth/redeem-refresh-token | Redeem refresh token


# **getAuthToken**
> ApiLoginResponse getAuthToken(apiLoginRequest)


### Example


```typescript
import { createConfiguration, AuthenticationApi } from '';
import type { AuthenticationApiGetAuthTokenRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AuthenticationApi(configuration);

const request: AuthenticationApiGetAuthTokenRequest = {
    // Your wallet address
  signerAddress: "signer_address_example",
  
  apiLoginRequest: {
    is_safe_wallet: true,
    client_address: "client_address_example",
    client_signature: "client_signature_example",
    server_signature: "server_signature_example",
    role: "role_example",
  },
};

const data = await apiInstance.getAuthToken(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiLoginRequest** | **ApiLoginRequest**|  |
 **signerAddress** | [**string**] | Your wallet address | defaults to undefined


### Return type

**ApiLoginResponse**

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

# **getNonce**
> ApiNonceResponse getNonce()


### Example


```typescript
import { createConfiguration, AuthenticationApi } from '';
import type { AuthenticationApiGetNonceRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AuthenticationApi(configuration);

const request: AuthenticationApiGetNonceRequest = {
    // Your wallet address
  signerAddress: "signer_address_example",
    // If true, the nonce will be shorter and easier to sign. Default is false. (optional)
  shortNonce: true,
};

const data = await apiInstance.getNonce(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **signerAddress** | [**string**] | Your wallet address | defaults to undefined
 **shortNonce** | [**boolean**] | If true, the nonce will be shorter and easier to sign. Default is false. | (optional) defaults to undefined


### Return type

**ApiNonceResponse**

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

# **redeemRefreshToken**
> ApiRedeemRefreshTokenResponse redeemRefreshToken(apiRedeemRefreshTokenRequest)


### Example


```typescript
import { createConfiguration, AuthenticationApi } from '';
import type { AuthenticationApiRedeemRefreshTokenRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AuthenticationApi(configuration);

const request: AuthenticationApiRedeemRefreshTokenRequest = {
  
  apiRedeemRefreshTokenRequest: {
    address: "address_example",
    token: "token_example",
    role: "role_example",
  },
};

const data = await apiInstance.redeemRefreshToken(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiRedeemRefreshTokenRequest** | **ApiRedeemRefreshTokenRequest**|  |


### Return type

**ApiRedeemRefreshTokenResponse**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**400** | Invalid request |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


