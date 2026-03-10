# .GroupsApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**changeGroupVisibility**](GroupsApi.md#changeGroupVisibility) | **POST** /groups/{id}/visible | Change group visibility
[**createGroup**](GroupsApi.md#createGroup) | **POST** /groups | Create a group
[**getIdentityGroupIdentities**](GroupsApi.md#getIdentityGroupIdentities) | **GET** /groups/{id}/identity_groups/{identity_group_id} | Get identity groups identities. Identities are represented as primary wallet addresses
[**searchUserGroups**](GroupsApi.md#searchUserGroups) | **GET** /groups | Search for user groups


# **changeGroupVisibility**
> ApiGroupFull changeGroupVisibility(apiChangeGroupVisibility)


### Example


```typescript
import { createConfiguration, GroupsApi } from '';
import type { GroupsApiChangeGroupVisibilityRequest } from '';

const configuration = createConfiguration();
const apiInstance = new GroupsApi(configuration);

const request: GroupsApiChangeGroupVisibilityRequest = {
  
  id: "id_example",
  
  apiChangeGroupVisibility: {
    visible: true,
    old_version_id: "old_version_id_example",
  },
};

const data = await apiInstance.changeGroupVisibility(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiChangeGroupVisibility** | **ApiChangeGroupVisibility**|  |
 **id** | [**string**] |  | defaults to undefined


### Return type

**ApiGroupFull**

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
**404** | Group not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **createGroup**
> ApiGroupFull createGroup(apiCreateGroup)


### Example


```typescript
import { createConfiguration, GroupsApi } from '';
import type { GroupsApiCreateGroupRequest } from '';

const configuration = createConfiguration();
const apiInstance = new GroupsApi(configuration);

const request: GroupsApiCreateGroupRequest = {
  
  apiCreateGroup: {
    name: "name_example",
    group: {
      tdh: {
        min: 0,
        max: 0,
        inclusion_strategy: "TDH",
      },
      rep: {
        min: 3.14,
        max: 3.14,
        category: "category_example",
        user_identity: "user_identity_example",
        direction: "RECEIVED",
      },
      cic: {
        min: 3.14,
        max: 3.14,
        user_identity: "user_identity_example",
        direction: "RECEIVED",
      },
      level: {
        min: 3.14,
        max: 3.14,
      },
      owns_nfts: [
        {
          name: "MEMES",
          tokens: [
            "tokens_example",
          ],
        },
      ],
      identity_addresses: [
        "identity_addresses_example",
      ],
      excluded_identity_addresses: [
        "excluded_identity_addresses_example",
      ],
      is_beneficiary_of_grant_id: "is_beneficiary_of_grant_id_example",
    },
    is_private: true,
  },
};

const data = await apiInstance.createGroup(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **apiCreateGroup** | **ApiCreateGroup**|  |


### Return type

**ApiGroupFull**

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

# **getIdentityGroupIdentities**
> Array<string> getIdentityGroupIdentities()


### Example


```typescript
import { createConfiguration, GroupsApi } from '';
import type { GroupsApiGetIdentityGroupIdentitiesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new GroupsApi(configuration);

const request: GroupsApiGetIdentityGroupIdentitiesRequest = {
  
  id: "id_example",
  
  identityGroupId: "identity_group_id_example",
};

const data = await apiInstance.getIdentityGroupIdentities(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined
 **identityGroupId** | [**string**] |  | defaults to undefined


### Return type

**Array<string>**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | successful operation |  -  |
**404** | Group not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **searchUserGroups**
> Array<ApiGroupFull> searchUserGroups()


### Example


```typescript
import { createConfiguration, GroupsApi } from '';
import type { GroupsApiSearchUserGroupsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new GroupsApi(configuration);

const request: GroupsApiSearchUserGroupsRequest = {
    // Partial or full name (optional)
  groupName: "group_name_example",
    // Group author identity (optional)
  authorIdentity: "author_identity_example",
    // created at date less than (optional)
  createdAtLessThan: 3.14,
};

const data = await apiInstance.searchUserGroups(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **groupName** | [**string**] | Partial or full name | (optional) defaults to undefined
 **authorIdentity** | [**string**] | Group author identity | (optional) defaults to undefined
 **createdAtLessThan** | [**number**] | created at date less than | (optional) defaults to undefined


### Return type

**Array<ApiGroupFull>**

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


