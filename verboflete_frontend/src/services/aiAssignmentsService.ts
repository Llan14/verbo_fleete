import { apiFetch } from "@/lib/api";
import {
  ExerciseDraftRequest,
  ExerciseDraftResponse,
  PracticeSessionCreateRequest,
  PracticeSessionCreateResponse,
  StudentAssignmentDetail,
  StudentAssignmentListItem,
  SubmitAssignmentRequest,
  SubmitAssignmentResponse,
  TeacherAssignmentCreateRequest,
  TeacherAssignmentCreateResponse,
  TeacherAssignmentDeleteResponse,
  TeacherAssignmentListItem,
  TeacherGradesByGroupItem,
  TeacherAssignmentResultsResponse,
  TutorGroup,
} from "@/types/aiAssignments";

export function createExerciseDraft(payload: ExerciseDraftRequest) {
  return apiFetch<ExerciseDraftResponse>("/ai/exercises/draft", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createTeacherAssignment(payload: TeacherAssignmentCreateRequest) {
  return apiFetch<TeacherAssignmentCreateResponse>("/teacher/assignments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listTeacherAssignments() {
  return apiFetch<TeacherAssignmentListItem[]>("/teacher/assignments");
}

export function deleteTeacherAssignment(assignmentId: number) {
  return apiFetch<TeacherAssignmentDeleteResponse>(`/teacher/assignments/${assignmentId}`, {
    method: "DELETE",
  });
}

export function getTeacherAssignmentResults(assignmentId: number) {
  return apiFetch<TeacherAssignmentResultsResponse>(`/teacher/assignments/${assignmentId}/results`);
}

export function getTeacherGradesByGroup(groupId: number) {
  return apiFetch<TeacherGradesByGroupItem[]>(`/teacher/grades/group/${groupId}`);
}

export function listStudentAssignments() {
  return apiFetch<StudentAssignmentListItem[]>("/student/assignments");
}

export function getStudentAssignmentDetail(assignmentId: number) {
  return apiFetch<StudentAssignmentDetail>(`/student/assignments/${assignmentId}`);
}

export function submitStudentAssignment(assignmentId: number, payload: SubmitAssignmentRequest) {
  return apiFetch<SubmitAssignmentResponse>(`/student/assignments/${assignmentId}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createPracticeSession(payload: PracticeSessionCreateRequest) {
  return apiFetch<PracticeSessionCreateResponse>("/student/practice-sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTutorGroups() {
  return apiFetch<TutorGroup[]>("/grupos/mis-grupos");
}
