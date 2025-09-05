/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getUser = /* GraphQL */ `query GetUser($id: ID!) {
  getUser(id: $id) {
    id
    email
    name
    role
    avatarUrl
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetUserQueryVariables, APITypes.GetUserQuery>;
export const listUsers = /* GraphQL */ `query ListUsers(
  $filter: ModelUserFilterInput
  $limit: Int
  $nextToken: String
) {
  listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      email
      name
      role
      avatarUrl
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListUsersQueryVariables, APITypes.ListUsersQuery>;
export const getAttendance = /* GraphQL */ `query GetAttendance($id: ID!) {
  getAttendance(id: $id) {
    id
    userId
    date
    clockIn
    clockOut
    plannedOff
    note
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAttendanceQueryVariables,
  APITypes.GetAttendanceQuery
>;
export const listAttendances = /* GraphQL */ `query ListAttendances(
  $filter: ModelAttendanceFilterInput
  $limit: Int
  $nextToken: String
) {
  listAttendances(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userId
      date
      clockIn
      clockOut
      plannedOff
      note
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAttendancesQueryVariables,
  APITypes.ListAttendancesQuery
>;
export const getProject = /* GraphQL */ `query GetProject($id: ID!) {
  getProject(id: $id) {
    id
    name
    managerUserId
    startDate
    endDate
    description
    participantsJson
    editableUserIdsJson
    readableUserIdsJson
    tasks {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetProjectQueryVariables,
  APITypes.GetProjectQuery
>;
export const listProjects = /* GraphQL */ `query ListProjects(
  $filter: ModelProjectFilterInput
  $limit: Int
  $nextToken: String
) {
  listProjects(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      managerUserId
      startDate
      endDate
      description
      participantsJson
      editableUserIdsJson
      readableUserIdsJson
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListProjectsQueryVariables,
  APITypes.ListProjectsQuery
>;
export const getTask = /* GraphQL */ `query GetTask($id: ID!) {
  getTask(id: $id) {
    id
    projectId
    parentTaskId
    projectManagerUserId
    assigneeUserId
    level
    sequence
    numberPath
    title
    description
    startDate
    endDate
    progress
    status
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetTaskQueryVariables, APITypes.GetTaskQuery>;
export const listTasks = /* GraphQL */ `query ListTasks(
  $filter: ModelTaskFilterInput
  $limit: Int
  $nextToken: String
) {
  listTasks(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      projectId
      parentTaskId
      projectManagerUserId
      assigneeUserId
      level
      sequence
      numberPath
      title
      description
      startDate
      endDate
      progress
      status
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListTasksQueryVariables, APITypes.ListTasksQuery>;
export const tasksByProject = /* GraphQL */ `query TasksByProject(
  $projectId: ID!
  $createdAt: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelTaskFilterInput
  $limit: Int
  $nextToken: String
) {
  tasksByProject(
    projectId: $projectId
    createdAt: $createdAt
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      projectId
      parentTaskId
      projectManagerUserId
      assigneeUserId
      level
      sequence
      numberPath
      title
      description
      startDate
      endDate
      progress
      status
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.TasksByProjectIdQueryVariables,
  APITypes.TasksByProjectIdQuery
>;
// NOTE: schema 改修前のインデックス用クエリ (tasksByProjectNumberPath, tasksByParent) は
// まだ codegen に反映されていないため一旦削除 / 無効化。
// 必要になった段階で amplify push -> codegen 後に再生成された queries.ts を使用してください。
