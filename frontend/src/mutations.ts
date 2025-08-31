/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../../src/API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createUser = /* GraphQL */ `mutation CreateUser(
  $input: CreateUserInput!
  $condition: ModelUserConditionInput
) {
  createUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $input: UpdateUserInput!
  $condition: ModelUserConditionInput
) {
  updateUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
export const deleteUser = /* GraphQL */ `mutation DeleteUser(
  $input: DeleteUserInput!
  $condition: ModelUserConditionInput
) {
  deleteUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
export const createAttendance = /* GraphQL */ `mutation CreateAttendance(
  $input: CreateAttendanceInput!
  $condition: ModelAttendanceConditionInput
) {
  createAttendance(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateAttendanceMutationVariables,
  APITypes.CreateAttendanceMutation
>;
export const updateAttendance = /* GraphQL */ `mutation UpdateAttendance(
  $input: UpdateAttendanceInput!
  $condition: ModelAttendanceConditionInput
) {
  updateAttendance(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateAttendanceMutationVariables,
  APITypes.UpdateAttendanceMutation
>;
export const deleteAttendance = /* GraphQL */ `mutation DeleteAttendance(
  $input: DeleteAttendanceInput!
  $condition: ModelAttendanceConditionInput
) {
  deleteAttendance(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteAttendanceMutationVariables,
  APITypes.DeleteAttendanceMutation
>;
export const createProject = /* GraphQL */ `mutation CreateProject(
  $input: CreateProjectInput!
  $condition: ModelProjectConditionInput
) {
  createProject(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateProjectMutationVariables,
  APITypes.CreateProjectMutation
>;
export const updateProject = /* GraphQL */ `mutation UpdateProject(
  $input: UpdateProjectInput!
  $condition: ModelProjectConditionInput
) {
  updateProject(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateProjectMutationVariables,
  APITypes.UpdateProjectMutation
>;
export const deleteProject = /* GraphQL */ `mutation DeleteProject(
  $input: DeleteProjectInput!
  $condition: ModelProjectConditionInput
) {
  deleteProject(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteProjectMutationVariables,
  APITypes.DeleteProjectMutation
>;
export const createTask = /* GraphQL */ `mutation CreateTask(
  $input: CreateTaskInput!
  $condition: ModelTaskConditionInput
) {
  createTask(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateTaskMutationVariables,
  APITypes.CreateTaskMutation
>;
export const updateTask = /* GraphQL */ `mutation UpdateTask(
  $input: UpdateTaskInput!
  $condition: ModelTaskConditionInput
) {
  updateTask(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateTaskMutationVariables,
  APITypes.UpdateTaskMutation
>;
export const deleteTask = /* GraphQL */ `mutation DeleteTask(
  $input: DeleteTaskInput!
  $condition: ModelTaskConditionInput
) {
  deleteTask(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteTaskMutationVariables,
  APITypes.DeleteTaskMutation
>;
