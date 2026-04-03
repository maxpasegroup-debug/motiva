import {
  addTeacher as addTeacherUser,
  deleteUser,
  listUsersByRole,
} from "@/lib/users-store";

export type TeacherRecord = {
  id: string;
  name: string;
  email: string;
};

export function listTeachers(): TeacherRecord[] {
  return listUsersByRole("teacher").map(({ id, name, email }) => ({
    id,
    name,
    email,
  }));
}

export function addTeacher(name: string, email: string): TeacherRecord {
  const u = addTeacherUser(name, email);
  return { id: u.id, name: u.name, email: u.email };
}

export function deleteTeacher(id: string) {
  deleteUser(id);
}
