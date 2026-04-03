import {
  addStudent as addStudentUser,
  deleteUser,
  listUsersByRole,
} from "@/lib/users-store";
import { removeStudentFromAllClasses } from "@/lib/class-students-store";
import { deleteStudentPaymentStatus } from "@/lib/student-payments-store";

export type StudentRecord = {
  id: string;
  name: string;
  email: string;
};

export function listStudents(): StudentRecord[] {
  return listUsersByRole("student").map(({ id, name, email }) => ({
    id,
    name,
    email,
  }));
}

export function addStudent(name: string, email: string): StudentRecord {
  const u = addStudentUser(name, email);
  return { id: u.id, name: u.name, email: u.email };
}

export function deleteStudent(id: string) {
  removeStudentFromAllClasses(id);
  deleteStudentPaymentStatus(id);
  deleteUser(id);
}
