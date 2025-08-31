/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateUserInput = {
  id?: string | null,
  email: string,
  name?: string | null,
  role?: string | null,
  avatarUrl?: string | null,
};

export type ModelUserConditionInput = {
  email?: ModelStringInput | null,
  name?: ModelStringInput | null,
  role?: ModelStringInput | null,
  avatarUrl?: ModelStringInput | null,
  and?: Array< ModelUserConditionInput | null > | null,
  or?: Array< ModelUserConditionInput | null > | null,
  not?: ModelUserConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  id?: ModelStringInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type User = {
  __typename: "User",
  id: string,
  email: string,
  name?: string | null,
  role?: string | null,
  avatarUrl?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateUserInput = {
  id: string,
  email?: string | null,
  name?: string | null,
  role?: string | null,
  avatarUrl?: string | null,
};

export type DeleteUserInput = {
  id: string,
};

export type CreateAttendanceInput = {
  id?: string | null,
  userId: string,
  date: string,
  clockIn?: string | null,
  clockOut?: string | null,
  plannedOff?: boolean | null,
  note?: string | null,
};

export type ModelAttendanceConditionInput = {
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  clockIn?: ModelStringInput | null,
  clockOut?: ModelStringInput | null,
  plannedOff?: ModelBooleanInput | null,
  note?: ModelStringInput | null,
  and?: Array< ModelAttendanceConditionInput | null > | null,
  or?: Array< ModelAttendanceConditionInput | null > | null,
  not?: ModelAttendanceConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type ModelBooleanInput = {
  ne?: boolean | null,
  eq?: boolean | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type Attendance = {
  __typename: "Attendance",
  id: string,
  userId: string,
  date: string,
  clockIn?: string | null,
  clockOut?: string | null,
  plannedOff?: boolean | null,
  note?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateAttendanceInput = {
  id: string,
  userId?: string | null,
  date?: string | null,
  clockIn?: string | null,
  clockOut?: string | null,
  plannedOff?: boolean | null,
  note?: string | null,
};

export type DeleteAttendanceInput = {
  id: string,
};

export type CreateProjectInput = {
  id?: string | null,
  name: string,
  managerUserId: string,
  startDate?: string | null,
  endDate?: string | null,
  description?: string | null,
};

export type ModelProjectConditionInput = {
  name?: ModelStringInput | null,
  managerUserId?: ModelIDInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  description?: ModelStringInput | null,
  and?: Array< ModelProjectConditionInput | null > | null,
  or?: Array< ModelProjectConditionInput | null > | null,
  not?: ModelProjectConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type Project = {
  __typename: "Project",
  id: string,
  name: string,
  managerUserId: string,
  startDate?: string | null,
  endDate?: string | null,
  description?: string | null,
  tasks?: ModelTaskConnection | null,
  createdAt: string,
  updatedAt: string,
};

export type ModelTaskConnection = {
  __typename: "ModelTaskConnection",
  items:  Array<Task | null >,
  nextToken?: string | null,
};

export type Task = {
  __typename: "Task",
  id: string,
  projectId: string,
  assigneeUserId?: string | null,
  projectManagerUserId?: string | null,
  title: string,
  description?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  progress?: number | null,
  status?: string | null,
  createdAt: string,
  updatedAt: string,
};

export type UpdateProjectInput = {
  id: string,
  name?: string | null,
  managerUserId?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  description?: string | null,
};

export type DeleteProjectInput = {
  id: string,
};

export type CreateTaskInput = {
  id?: string | null,
  projectId: string,
  assigneeUserId?: string | null,
  projectManagerUserId?: string | null,
  title: string,
  description?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  progress?: number | null,
  status?: string | null,
};

export type ModelTaskConditionInput = {
  projectId?: ModelIDInput | null,
  assigneeUserId?: ModelIDInput | null,
  projectManagerUserId?: ModelIDInput | null,
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  progress?: ModelIntInput | null,
  status?: ModelStringInput | null,
  and?: Array< ModelTaskConditionInput | null > | null,
  or?: Array< ModelTaskConditionInput | null > | null,
  not?: ModelTaskConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type UpdateTaskInput = {
  id: string,
  projectId?: string | null,
  assigneeUserId?: string | null,
  projectManagerUserId?: string | null,
  title?: string | null,
  description?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  progress?: number | null,
  status?: string | null,
};

export type DeleteTaskInput = {
  id: string,
};

export type ModelUserFilterInput = {
  id?: ModelIDInput | null,
  email?: ModelStringInput | null,
  name?: ModelStringInput | null,
  role?: ModelStringInput | null,
  avatarUrl?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelUserFilterInput | null > | null,
  or?: Array< ModelUserFilterInput | null > | null,
  not?: ModelUserFilterInput | null,
};

export type ModelUserConnection = {
  __typename: "ModelUserConnection",
  items:  Array<User | null >,
  nextToken?: string | null,
};

export type ModelAttendanceFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  clockIn?: ModelStringInput | null,
  clockOut?: ModelStringInput | null,
  plannedOff?: ModelBooleanInput | null,
  note?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelAttendanceFilterInput | null > | null,
  or?: Array< ModelAttendanceFilterInput | null > | null,
  not?: ModelAttendanceFilterInput | null,
};

export type ModelAttendanceConnection = {
  __typename: "ModelAttendanceConnection",
  items:  Array<Attendance | null >,
  nextToken?: string | null,
};

export type ModelProjectFilterInput = {
  id?: ModelIDInput | null,
  name?: ModelStringInput | null,
  managerUserId?: ModelIDInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  description?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelProjectFilterInput | null > | null,
  or?: Array< ModelProjectFilterInput | null > | null,
  not?: ModelProjectFilterInput | null,
};

export type ModelProjectConnection = {
  __typename: "ModelProjectConnection",
  items:  Array<Project | null >,
  nextToken?: string | null,
};

export type ModelTaskFilterInput = {
  id?: ModelIDInput | null,
  projectId?: ModelIDInput | null,
  assigneeUserId?: ModelIDInput | null,
  projectManagerUserId?: ModelIDInput | null,
  title?: ModelStringInput | null,
  description?: ModelStringInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  progress?: ModelIntInput | null,
  status?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelTaskFilterInput | null > | null,
  or?: Array< ModelTaskFilterInput | null > | null,
  not?: ModelTaskFilterInput | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelSubscriptionUserFilterInput = {
  email?: ModelSubscriptionStringInput | null,
  name?: ModelSubscriptionStringInput | null,
  role?: ModelSubscriptionStringInput | null,
  avatarUrl?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionUserFilterInput | null > | null,
  or?: Array< ModelSubscriptionUserFilterInput | null > | null,
  id?: ModelStringInput | null,
};

export type ModelSubscriptionStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionAttendanceFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  date?: ModelSubscriptionStringInput | null,
  clockIn?: ModelSubscriptionStringInput | null,
  clockOut?: ModelSubscriptionStringInput | null,
  plannedOff?: ModelSubscriptionBooleanInput | null,
  note?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionAttendanceFilterInput | null > | null,
  or?: Array< ModelSubscriptionAttendanceFilterInput | null > | null,
  userId?: ModelStringInput | null,
};

export type ModelSubscriptionIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionBooleanInput = {
  ne?: boolean | null,
  eq?: boolean | null,
};

export type ModelSubscriptionProjectFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  name?: ModelSubscriptionStringInput | null,
  startDate?: ModelSubscriptionStringInput | null,
  endDate?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionProjectFilterInput | null > | null,
  or?: Array< ModelSubscriptionProjectFilterInput | null > | null,
  managerUserId?: ModelStringInput | null,
};

export type ModelSubscriptionTaskFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  projectId?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  startDate?: ModelSubscriptionStringInput | null,
  endDate?: ModelSubscriptionStringInput | null,
  progress?: ModelSubscriptionIntInput | null,
  status?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionTaskFilterInput | null > | null,
  or?: Array< ModelSubscriptionTaskFilterInput | null > | null,
  assigneeUserId?: ModelStringInput | null,
  projectManagerUserId?: ModelStringInput | null,
};

export type ModelSubscriptionIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type CreateUserMutationVariables = {
  input: CreateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type CreateUserMutation = {
  createUser?:  {
    __typename: "User",
    id: string,
    email: string,
    name?: string | null,
    role?: string | null,
    avatarUrl?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateUserMutationVariables = {
  input: UpdateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type UpdateUserMutation = {
  updateUser?:  {
    __typename: "User",
    id: string,
    email: string,
    name?: string | null,
    role?: string | null,
    avatarUrl?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteUserMutationVariables = {
  input: DeleteUserInput,
  condition?: ModelUserConditionInput | null,
};

export type DeleteUserMutation = {
  deleteUser?:  {
    __typename: "User",
    id: string,
    email: string,
    name?: string | null,
    role?: string | null,
    avatarUrl?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateAttendanceMutationVariables = {
  input: CreateAttendanceInput,
  condition?: ModelAttendanceConditionInput | null,
};

export type CreateAttendanceMutation = {
  createAttendance?:  {
    __typename: "Attendance",
    id: string,
    userId: string,
    date: string,
    clockIn?: string | null,
    clockOut?: string | null,
    plannedOff?: boolean | null,
    note?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateAttendanceMutationVariables = {
  input: UpdateAttendanceInput,
  condition?: ModelAttendanceConditionInput | null,
};

export type UpdateAttendanceMutation = {
  updateAttendance?:  {
    __typename: "Attendance",
    id: string,
    userId: string,
    date: string,
    clockIn?: string | null,
    clockOut?: string | null,
    plannedOff?: boolean | null,
    note?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteAttendanceMutationVariables = {
  input: DeleteAttendanceInput,
  condition?: ModelAttendanceConditionInput | null,
};

export type DeleteAttendanceMutation = {
  deleteAttendance?:  {
    __typename: "Attendance",
    id: string,
    userId: string,
    date: string,
    clockIn?: string | null,
    clockOut?: string | null,
    plannedOff?: boolean | null,
    note?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateProjectMutationVariables = {
  input: CreateProjectInput,
  condition?: ModelProjectConditionInput | null,
};

export type CreateProjectMutation = {
  createProject?:  {
    __typename: "Project",
    id: string,
    name: string,
    managerUserId: string,
    startDate?: string | null,
    endDate?: string | null,
    description?: string | null,
    tasks?:  {
      __typename: "ModelTaskConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateProjectMutationVariables = {
  input: UpdateProjectInput,
  condition?: ModelProjectConditionInput | null,
};

export type UpdateProjectMutation = {
  updateProject?:  {
    __typename: "Project",
    id: string,
    name: string,
    managerUserId: string,
    startDate?: string | null,
    endDate?: string | null,
    description?: string | null,
    tasks?:  {
      __typename: "ModelTaskConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteProjectMutationVariables = {
  input: DeleteProjectInput,
  condition?: ModelProjectConditionInput | null,
};

export type DeleteProjectMutation = {
  deleteProject?:  {
    __typename: "Project",
    id: string,
    name: string,
    managerUserId: string,
    startDate?: string | null,
    endDate?: string | null,
    description?: string | null,
    tasks?:  {
      __typename: "ModelTaskConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateTaskMutationVariables = {
  input: CreateTaskInput,
  condition?: ModelTaskConditionInput | null,
};

export type CreateTaskMutation = {
  createTask?:  {
    __typename: "Task",
    id: string,
    projectId: string,
    assigneeUserId?: string | null,
    projectManagerUserId?: string | null,
    title: string,
    description?: string | null,
    startDate?: string | null,
    endDate?: string | null,
    progress?: number | null,
    status?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateTaskMutationVariables = {
  input: UpdateTaskInput,
  condition?: ModelTaskConditionInput | null,
};

export type UpdateTaskMutation = {
  updateTask?:  {
    __typename: "Task",
    id: string,
    projectId: string,
    assigneeUserId?: string | null,
    projectManagerUserId?: string | null,
    title: string,
    description?: string | null,
    startDate?: string | null,
    endDate?: string | null,
    progress?: number | null,
    status?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteTaskMutationVariables = {
  input: DeleteTaskInput,
  condition?: ModelTaskConditionInput | null,
};

export type DeleteTaskMutation = {
  deleteTask?:  {
    __typename: "Task",
    id: string,
    projectId: string,
    assigneeUserId?: string | null,
    projectManagerUserId?: string | null,
    title: string,
    description?: string | null,
    startDate?: string | null,
    endDate?: string | null,
    progress?: number | null,
    status?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type GetUserQueryVariables = {
  id: string,
};

export type GetUserQuery = {
  getUser?:  {
    __typename: "User",
    id: string,
    email: string,
    name?: string | null,
    role?: string | null,
    avatarUrl?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListUsersQueryVariables = {
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUsersQuery = {
  listUsers?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      email: string,
      name?: string | null,
      role?: string | null,
      avatarUrl?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetAttendanceQueryVariables = {
  id: string,
};

export type GetAttendanceQuery = {
  getAttendance?:  {
    __typename: "Attendance",
    id: string,
    userId: string,
    date: string,
    clockIn?: string | null,
    clockOut?: string | null,
    plannedOff?: boolean | null,
    note?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListAttendancesQueryVariables = {
  filter?: ModelAttendanceFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAttendancesQuery = {
  listAttendances?:  {
    __typename: "ModelAttendanceConnection",
    items:  Array< {
      __typename: "Attendance",
      id: string,
      userId: string,
      date: string,
      clockIn?: string | null,
      clockOut?: string | null,
      plannedOff?: boolean | null,
      note?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetProjectQueryVariables = {
  id: string,
};

export type GetProjectQuery = {
  getProject?:  {
    __typename: "Project",
    id: string,
    name: string,
    managerUserId: string,
    startDate?: string | null,
    endDate?: string | null,
    description?: string | null,
    tasks?:  {
      __typename: "ModelTaskConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListProjectsQueryVariables = {
  filter?: ModelProjectFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListProjectsQuery = {
  listProjects?:  {
    __typename: "ModelProjectConnection",
    items:  Array< {
      __typename: "Project",
      id: string,
      name: string,
      managerUserId: string,
      startDate?: string | null,
      endDate?: string | null,
      description?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetTaskQueryVariables = {
  id: string,
};

export type GetTaskQuery = {
  getTask?:  {
    __typename: "Task",
    id: string,
    projectId: string,
    assigneeUserId?: string | null,
    projectManagerUserId?: string | null,
    title: string,
    description?: string | null,
    startDate?: string | null,
    endDate?: string | null,
    progress?: number | null,
    status?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListTasksQueryVariables = {
  filter?: ModelTaskFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListTasksQuery = {
  listTasks?:  {
    __typename: "ModelTaskConnection",
    items:  Array< {
      __typename: "Task",
      id: string,
      projectId: string,
      assigneeUserId?: string | null,
      projectManagerUserId?: string | null,
      title: string,
      description?: string | null,
      startDate?: string | null,
      endDate?: string | null,
      progress?: number | null,
      status?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type TasksByProjectIdQueryVariables = {
  projectId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelTaskFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type TasksByProjectIdQuery = {
  tasksByProjectId?:  {
    __typename: "ModelTaskConnection",
    items:  Array< {
      __typename: "Task",
      id: string,
      projectId: string,
      assigneeUserId?: string | null,
      projectManagerUserId?: string | null,
      title: string,
      description?: string | null,
      startDate?: string | null,
      endDate?: string | null,
      progress?: number | null,
      status?: string | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type OnCreateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  id?: string | null,
};

export type OnCreateUserSubscription = {
  onCreateUser?:  {
    __typename: "User",
    id: string,
    email: string,
    name?: string | null,
    role?: string | null,
    avatarUrl?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  id?: string | null,
};

export type OnUpdateUserSubscription = {
  onUpdateUser?:  {
    __typename: "User",
    id: string,
    email: string,
    name?: string | null,
    role?: string | null,
    avatarUrl?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  id?: string | null,
};

export type OnDeleteUserSubscription = {
  onDeleteUser?:  {
    __typename: "User",
    id: string,
    email: string,
    name?: string | null,
    role?: string | null,
    avatarUrl?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateAttendanceSubscriptionVariables = {
  filter?: ModelSubscriptionAttendanceFilterInput | null,
  userId?: string | null,
};

export type OnCreateAttendanceSubscription = {
  onCreateAttendance?:  {
    __typename: "Attendance",
    id: string,
    userId: string,
    date: string,
    clockIn?: string | null,
    clockOut?: string | null,
    plannedOff?: boolean | null,
    note?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateAttendanceSubscriptionVariables = {
  filter?: ModelSubscriptionAttendanceFilterInput | null,
  userId?: string | null,
};

export type OnUpdateAttendanceSubscription = {
  onUpdateAttendance?:  {
    __typename: "Attendance",
    id: string,
    userId: string,
    date: string,
    clockIn?: string | null,
    clockOut?: string | null,
    plannedOff?: boolean | null,
    note?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteAttendanceSubscriptionVariables = {
  filter?: ModelSubscriptionAttendanceFilterInput | null,
  userId?: string | null,
};

export type OnDeleteAttendanceSubscription = {
  onDeleteAttendance?:  {
    __typename: "Attendance",
    id: string,
    userId: string,
    date: string,
    clockIn?: string | null,
    clockOut?: string | null,
    plannedOff?: boolean | null,
    note?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateProjectSubscriptionVariables = {
  filter?: ModelSubscriptionProjectFilterInput | null,
  managerUserId?: string | null,
};

export type OnCreateProjectSubscription = {
  onCreateProject?:  {
    __typename: "Project",
    id: string,
    name: string,
    managerUserId: string,
    startDate?: string | null,
    endDate?: string | null,
    description?: string | null,
    tasks?:  {
      __typename: "ModelTaskConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateProjectSubscriptionVariables = {
  filter?: ModelSubscriptionProjectFilterInput | null,
  managerUserId?: string | null,
};

export type OnUpdateProjectSubscription = {
  onUpdateProject?:  {
    __typename: "Project",
    id: string,
    name: string,
    managerUserId: string,
    startDate?: string | null,
    endDate?: string | null,
    description?: string | null,
    tasks?:  {
      __typename: "ModelTaskConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteProjectSubscriptionVariables = {
  filter?: ModelSubscriptionProjectFilterInput | null,
  managerUserId?: string | null,
};

export type OnDeleteProjectSubscription = {
  onDeleteProject?:  {
    __typename: "Project",
    id: string,
    name: string,
    managerUserId: string,
    startDate?: string | null,
    endDate?: string | null,
    description?: string | null,
    tasks?:  {
      __typename: "ModelTaskConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateTaskSubscriptionVariables = {
  filter?: ModelSubscriptionTaskFilterInput | null,
  assigneeUserId?: string | null,
  projectManagerUserId?: string | null,
};

export type OnCreateTaskSubscription = {
  onCreateTask?:  {
    __typename: "Task",
    id: string,
    projectId: string,
    assigneeUserId?: string | null,
    projectManagerUserId?: string | null,
    title: string,
    description?: string | null,
    startDate?: string | null,
    endDate?: string | null,
    progress?: number | null,
    status?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateTaskSubscriptionVariables = {
  filter?: ModelSubscriptionTaskFilterInput | null,
  assigneeUserId?: string | null,
  projectManagerUserId?: string | null,
};

export type OnUpdateTaskSubscription = {
  onUpdateTask?:  {
    __typename: "Task",
    id: string,
    projectId: string,
    assigneeUserId?: string | null,
    projectManagerUserId?: string | null,
    title: string,
    description?: string | null,
    startDate?: string | null,
    endDate?: string | null,
    progress?: number | null,
    status?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteTaskSubscriptionVariables = {
  filter?: ModelSubscriptionTaskFilterInput | null,
  assigneeUserId?: string | null,
  projectManagerUserId?: string | null,
};

export type OnDeleteTaskSubscription = {
  onDeleteTask?:  {
    __typename: "Task",
    id: string,
    projectId: string,
    assigneeUserId?: string | null,
    projectManagerUserId?: string | null,
    title: string,
    description?: string | null,
    startDate?: string | null,
    endDate?: string | null,
    progress?: number | null,
    status?: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};
