# .CommunityMembersApi

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getCommunityMembers**](CommunityMembersApi.md#getCommunityMembers) | **GET** /community-members | Get community members.
[**getTopCommunityMembers**](CommunityMembersApi.md#getTopCommunityMembers) | **GET** /community-members/top | Get top community members with pagination and sorting.


# **getCommunityMembers**
> Array<ApiCommunityMemberMinimal> getCommunityMembers()


### Example


```typescript
import { createConfiguration, CommunityMembersApi } from '';
import type { CommunityMembersApiGetCommunityMembersRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CommunityMembersApi(configuration);

const request: CommunityMembersApiGetCommunityMembersRequest = {
    // Return only profile owners? (optional)
  onlyProfileOwners: true,
    // Search param (optional)
  param: "param_example",
};

const data = await apiInstance.getCommunityMembers(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **onlyProfileOwners** | [**boolean**] | Return only profile owners? | (optional) defaults to undefined
 **param** | [**string**] | Search param | (optional) defaults to undefined


### Return type

**Array<ApiCommunityMemberMinimal>**

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

# **getTopCommunityMembers**
> ApiCommunityMembersPage getTopCommunityMembers()


### Example


```typescript
import { createConfiguration, CommunityMembersApi } from '';
import type { CommunityMembersApiGetTopCommunityMembersRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CommunityMembersApi(configuration);

const request: CommunityMembersApiGetTopCommunityMembersRequest = {
    // Default is 50 (optional)
  pageSize: 1,
    // Default is 1 (optional)
  page: 1,
    // Default is DESC (optional)
  sortDirection: "ASC",
    // Default is level (optional)
  sort: "display",
    // Filter by group ID (optional)
  groupId: "group_id_example",
};

const data = await apiInstance.getTopCommunityMembers(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pageSize** | [**number**] | Default is 50 | (optional) defaults to undefined
 **page** | [**number**] | Default is 1 | (optional) defaults to undefined
 **sortDirection** | [**&#39;ASC&#39; | &#39;DESC&#39;**]**Array<&#39;ASC&#39; &#124; &#39;DESC&#39;>** | Default is DESC | (optional) defaults to undefined
 **sort** | **ApiCommunityMembersSortOption** | Default is level | (optional) defaults to undefined
 **groupId** | [**string**] | Filter by group ID | (optional) defaults to undefined


### Return type

**ApiCommunityMembersPage**

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


