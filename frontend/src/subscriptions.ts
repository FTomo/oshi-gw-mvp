/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../../src/API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateUser = /* GraphQL */ `subscription OnCreateUser(
  $filter: ModelSubscriptionUserFilterInput
  $id: String
) {
  onCreateUser(filter: $filter, id: $id) {
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
` as GeneratedSubscription<
  APITypes.OnCreateUserSubscriptionVariables,
  APITypes.OnCreateUserSubscription
>;
export const onUpdateUser = /* GraphQL */ `subscription OnUpdateUser(
  $filter: ModelSubscriptionUserFilterInput
  $id: String
) {
  onUpdateUser(filter: $filter, id: $id) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateUserSubscriptionVariables,
  APITypes.OnUpdateUserSubscription
>;
export const onDeleteUser = /* GraphQL */ `subscription OnDeleteUser(
  $filter: ModelSubscriptionUserFilterInput
  $id: String
) {
  onDeleteUser(filter: $filter, id: $id) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteUserSubscriptionVariables,
  APITypes.OnDeleteUserSubscription
>;
export const onCreateAttendance = /* GraphQL */ `subscription OnCreateAttendance(
  $filter: ModelSubscriptionAttendanceFilterInput
  $userId: String
) {
  onCreateAttendance(filter: $filter, userId: $userId) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAttendanceSubscriptionVariables,
  APITypes.OnCreateAttendanceSubscription
>;
export const onUpdateAttendance = /* GraphQL */ `subscription OnUpdateAttendance(
  $filter: ModelSubscriptionAttendanceFilterInput
  $userId: String
) {
  onUpdateAttendance(filter: $filter, userId: $userId) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAttendanceSubscriptionVariables,
  APITypes.OnUpdateAttendanceSubscription
>;
export const onDeleteAttendance = /* GraphQL */ `subscription OnDeleteAttendance(
  $filter: ModelSubscriptionAttendanceFilterInput
  $userId: String
) {
  onDeleteAttendance(filter: $filter, userId: $userId) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAttendanceSubscriptionVariables,
  APITypes.OnDeleteAttendanceSubscription
>;
export const onCreateProject = /* GraphQL */ `subscription OnCreateProject(
  $filter: ModelSubscriptionProjectFilterInput
  $managerUserId: String
) {
  onCreateProject(filter: $filter, managerUserId: $managerUserId) {
    id
    name
    managerUserId
    startDate
    endDate
    description
    tasks {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateProjectSubscriptionVariables,
  APITypes.OnCreateProjectSubscription
>;
export const onUpdateProject = /* GraphQL */ `subscription OnUpdateProject(
  $filter: ModelSubscriptionProjectFilterInput
  $managerUserId: String
) {
  onUpdateProject(filter: $filter, managerUserId: $managerUserId) {
    id
    name
    managerUserId
    startDate
    endDate
    description
    tasks {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateProjectSubscriptionVariables,
  APITypes.OnUpdateProjectSubscription
>;
export const onDeleteProject = /* GraphQL */ `subscription OnDeleteProject(
  $filter: ModelSubscriptionProjectFilterInput
  $managerUserId: String
) {
  onDeleteProject(filter: $filter, managerUserId: $managerUserId) {
    id
    name
    managerUserId
    startDate
    endDate
    description
    tasks {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteProjectSubscriptionVariables,
  APITypes.OnDeleteProjectSubscription
>;
export const onCreateTask = /* GraphQL */ `subscription OnCreateTask(
  $filter: ModelSubscriptionTaskFilterInput
  $assigneeUserId: String
  $projectManagerUserId: String
) {
  onCreateTask(
    filter: $filter
    assigneeUserId: $assigneeUserId
    projectManagerUserId: $projectManagerUserId
  ) {
    id
    projectId
    assigneeUserId
    projectManagerUserId
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
` as GeneratedSubscription<
  APITypes.OnCreateTaskSubscriptionVariables,
  APITypes.OnCreateTaskSubscription
>;
export const onUpdateTask = /* GraphQL */ `subscription OnUpdateTask(
  $filter: ModelSubscriptionTaskFilterInput
  $assigneeUserId: String
  $projectManagerUserId: String
) {
  onUpdateTask(
    filter: $filter
    assigneeUserId: $assigneeUserId
    projectManagerUserId: $projectManagerUserId
  ) {
    id
    projectId
    assigneeUserId
    projectManagerUserId
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
` as GeneratedSubscription<
  APITypes.OnUpdateTaskSubscriptionVariables,
  APITypes.OnUpdateTaskSubscription
>;
export const onDeleteTask = /* GraphQL */ `subscription OnDeleteTask(
  $filter: ModelSubscriptionTaskFilterInput
  $assigneeUserId: String
  $projectManagerUserId: String
) {
  onDeleteTask(
    filter: $filter
    assigneeUserId: $assigneeUserId
    projectManagerUserId: $projectManagerUserId
  ) {
    id
    projectId
    assigneeUserId
    projectManagerUserId
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
` as GeneratedSubscription<
  APITypes.OnDeleteTaskSubscriptionVariables,
  APITypes.OnDeleteTaskSubscription
>;
