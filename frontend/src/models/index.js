// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { User, Attendance, Project, Task } = initSchema(schema);

export {
  User,
  Attendance,
  Project,
  Task
};